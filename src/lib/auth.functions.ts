import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import {
  ACCES_RESTREINT,
  aLeDroit,
  bornesDroits,
  droitsEffectifs,
  estDroitId,
  labelDuRole,
  roleParLabel,
  type RoleId,
} from "@/auth/permissions";
import { decisionRetrait, roleInvitable } from "@/data/portee-role";
import { auth, avecInscriptionInterne } from "@/lib/auth";
import { autoriserCadence, cleAdresse } from "@/lib/cadence-memoire";
import { envoyerMail } from "@/lib/mail";
import { genererMotDePasseInvitation } from "@/lib/mot-de-passe-invitation";
import { rattacherUtilisateur } from "@/lib/rattacher";
import { sessionDepuisRequete } from "@/lib/session-serveur.server";
import { getSql } from "@/lib/sql";

function cadencePublique(action: string, max: number) {
  try {
    return autoriserCadence(cleAdresse(action, getRequest().headers), max, 60 * 60 * 1000);
  } catch {
    return autoriserCadence(`${action}:hors-requete`, max, 60 * 60 * 1000);
  }
}

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  return sessionDepuisRequete();
});

export const ensureSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await sessionDepuisRequete();
  if (!session) throw new Error("Non authentifié");
  return session;
});

export const listerEquipe = createServerFn({ method: "GET" }).handler(async () => {
  const moi = await sessionDepuisRequete();
  if (!moi || !aLeDroit(moi.droits, "gerer-equipe")) {
    throw new Error("Droits insuffisants");
  }
  const sql = getSql();
  if (!sql) return [];
  const rows = (await sql`
    select p.user_id, p.prenom, p.nom, p.initiales, p.affectation, p.statut as profil_statut,
           m.role_id, m.droits, m.statut, u.email
    from public.org_membres m
    join public.profils p on p.user_id = m.user_id
    join "user" u on u.id = m.user_id
    where m.org_id = ${moi.orgId}::uuid
    order by p.prenom, p.nom
  `) as Array<{
    user_id: string;
    prenom: string;
    nom: string;
    initiales: string;
    affectation: string;
    role_id: RoleId;
    droits: string[] | null;
    statut: string;
    email: string;
  }>;
  return rows.map((r) => ({
    id: r.user_id,
    prenom: r.prenom,
    nom: r.nom,
    initiales: r.initiales,
    role: labelDuRole(r.role_id),
    roleId: r.role_id,
    affectation: r.affectation,
    statut: r.statut as "actif" | "attente" | "externe",
    droits: droitsEffectifs(r.role_id, r.droits),
    email: r.email,
    protege: r.role_id === "super-admin",
  }));
});

export const enregistrerDroitsMembre = createServerFn({ method: "POST" })
  .validator((input: { userId: string; droits: string[] }) => ({
    userId: input.userId,
    droits: input.droits.filter((id) => estDroitId(id) || id === ACCES_RESTREINT),
  }))
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "gerer-equipe")) {
      throw new Error("Droits insuffisants");
    }
    const sql = getSql();
    if (!sql) throw new Error("Base indisponible");
    const cible = (await sql`
      select role_id from public.org_membres
      where org_id = ${moi.orgId}::uuid and user_id = ${data.userId}::uuid
      limit 1
    `) as { role_id: RoleId }[];
    if (!cible[0]) throw new Error("Membre introuvable");
    if (cible[0].role_id === "super-admin") {
      throw new Error("Les droits d'un super-administrateur ne peuvent pas être modifiés");
    }
    const stockes = bornesDroits(cible[0].role_id, data.droits);
    await sql`
      update public.org_membres
      set droits = ${`{${stockes.join(",")}}`}::text[]
      where org_id = ${moi.orgId}::uuid and user_id = ${data.userId}::uuid
    `;
    return { ok: true as const };
  });

export const inviterMembre = createServerFn({ method: "POST" })
  .validator(
    (input: {
      prenom: string;
      nom: string;
      email: string;
      role: string;
      affectation: string;
      droits: string[];
    }) => {
      const email = input.email.trim().toLowerCase();
      if (!email.includes("@")) throw new Error("Adresse e-mail invalide.");
      const prenom = input.prenom.trim();
      if (!prenom) throw new Error("Prénom requis");
      const roleId = roleParLabel(input.role);
      if (!roleInvitable(roleId)) {
        throw new Error("Ce rôle ne peut pas être attribué depuis l'équipe");
      }
      return {
        prenom,
        nom: input.nom.trim(),
        email,
        roleId,
        affectation: input.affectation.trim() || "Non précisée",
        droits: bornesDroits(roleId, input.droits),
      };
    },
  )
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "gerer-equipe")) {
      throw new Error("Droits insuffisants");
    }
    const motDePasse = genererMotDePasseInvitation();
    const sql = getSql();
    if (!sql) throw new Error("Base indisponible");
    // Pas de signUpEmail ici : il poserait le cookie de session du nouveau
    // compte sur la réponse en cours et déconnecterait l'administrateur.
    const userId = randomUUID();
    const nomComplet = `${data.prenom} ${data.nom}`.trim();
    const hash = await hashPassword(motDePasse);
    try {
      await sql.query(
        `insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
         values ($1::uuid, $2, $3, true, now(), now())`,
        [userId, nomComplet, data.email],
      );
      await sql.query(
        `insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         values ($1::uuid, $2, 'credential', $1::uuid, $3, now(), now())`,
        [userId, userId, hash],
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (/duplicate|unique/i.test(message)) throw new Error("Cet e-mail a déjà un compte");
      throw e;
    }
    await rattacherUtilisateur({
      sql,
      userId,
      prenom: data.prenom,
      nom: data.nom,
      roleId: data.roleId,
      affectation: data.affectation,
      statut: "attente",
      orgId: moi.orgId,
      droits: data.droits,
    });
    const base = process.env["BETTER_AUTH_URL"] ?? "http://localhost:8080";
    const mailEnvoye = await envoyerMail({
      a: data.email,
      sujet: `Invitation Hublify — ${moi.orgNom}`,
      html: `<p>Vous êtes invité(e) à rejoindre <strong>${moi.orgNom}</strong> sur Hublify.</p>
<p>Connexion : <a href="${base}/connexion">${base}/connexion</a></p>
<p>E-mail : ${data.email}</p>
<p>Mot de passe temporaire : <code>${motDePasse}</code></p>
<p>Changez-le après votre première connexion.</p>`,
      sensible: true,
    });
    return { ok: true as const, email: data.email, mailEnvoye };
  });

export const retirerMembre = createServerFn({ method: "POST" })
  .validator((input: { userId: string }) => input)
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "gerer-equipe")) {
      throw new Error("Droits insuffisants");
    }
    const sql = getSql();
    if (!sql) throw new Error("Base indisponible");
    const cible = (await sql`
      select role_id from public.org_membres
      where org_id = ${moi.orgId}::uuid and user_id = ${data.userId}::uuid
      limit 1
    `) as { role_id: RoleId }[];
    const decision = decisionRetrait({
      acteurId: moi.userId,
      cibleId: data.userId,
      roleCible: cible[0]?.role_id ?? null,
    });
    if (!decision.ok) throw new Error(decision.erreur);
    await sql`
      delete from public.org_membres
      where org_id = ${moi.orgId}::uuid and user_id = ${data.userId}::uuid
    `;
    await sql`delete from public.profils where user_id = ${data.userId}::uuid`;
    await sql`delete from "user" where id = ${data.userId}::uuid`;
    return { ok: true as const };
  });

export const inscrireAdherent = createServerFn({ method: "POST" })
  .validator(
    (input: { prenom: string; nom: string; email: string; password: string; nomOrg: string }) => {
      const email = input.email.trim().toLowerCase();
      const prenom = input.prenom.trim();
      const nomOrg = input.nomOrg.trim();
      if (!prenom) throw new Error("Prénom requis");
      if (!email.includes("@")) throw new Error("Adresse e-mail invalide.");
      if (nomOrg.length < 2) throw new Error("Nom de l'organisation requis");
      if (input.password.length < 10) throw new Error("Mot de passe trop court");
      return {
        prenom,
        nom: input.nom.trim(),
        email,
        password: input.password,
        nomOrg,
      };
    },
  )
  .handler(async ({ data }) => {
    if (!cadencePublique("inscription", 5)) {
      throw new Error("Trop de tentatives. Réessayez plus tard.");
    }
    const sql = getSql();
    if (!sql) throw new Error("Base indisponible");
    const cree = await avecInscriptionInterne(() =>
      auth.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: `${data.prenom} ${data.nom}`.trim(),
        },
      }),
    );
    const userId = cree.user.id;
    const orgs = (await sql`
      insert into public.orgs (nom, type)
      values (${data.nomOrg}, 'gestionnaire')
      returning id
    `) as { id: string }[];
    const orgId = orgs[0]?.id;
    if (!orgId) throw new Error("Organisation non créée");
    await rattacherUtilisateur({
      sql,
      userId,
      prenom: data.prenom,
      nom: data.nom,
      roleId: "administrateur",
      affectation: "Titulaire",
      statut: "actif",
      orgId,
    });
    const base = process.env["BETTER_AUTH_URL"] ?? "http://localhost:8080";
    await envoyerMail({
      a: data.email,
      sujet: "Bienvenue sur Hublify",
      html: `<p>Votre espace <strong>${data.nomOrg}</strong> est prêt.</p>
<p>Connectez-vous : <a href="${base}/connexion">${base}/connexion</a></p>
<p>Confirmez votre e-mail en répondant à ce message si une vérification vous est demandée.</p>`,
    });
    try {
      await auth.api.sendVerificationEmail({
        body: { email: data.email, callbackURL: "/" },
      });
    } catch {
      /* hook mail Better Auth : déjà capturé ou non configuré */
    }
    return { ok: true as const };
  });
