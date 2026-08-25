import { createServerFn } from "@tanstack/react-start";
import {
  aLeDroit,
  droitsEffectifs,
  estDroitId,
  labelDuRole,
  roleParLabel,
  type DroitId,
  type RoleId,
} from "@/auth/permissions";
import { auth, avecInscriptionInterne } from "@/lib/auth";
import { envoyerMail } from "@/lib/mail";
import { rattacherUtilisateur } from "@/lib/rattacher";
import { sessionDepuisRequete } from "@/lib/session-serveur.server";
import { getSql } from "@/lib/sql";

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
    droits: input.droits.filter(estDroitId),
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
    await sql`
      update public.org_membres
      set droits = ${`{${data.droits.join(",")}}`}::text[]
      where org_id = ${moi.orgId}::uuid and user_id = ${data.userId}::uuid
    `;
    return { ok: true as const };
  });

export const inviterMembre = createServerFn({ method: "POST" })
  .validator((input: {
    prenom: string;
    nom: string;
    email: string;
    role: string;
    affectation: string;
    droits: string[];
  }) => {
    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("Email invalide");
    const prenom = input.prenom.trim();
    if (!prenom) throw new Error("Prénom requis");
    const roleId = roleParLabel(input.role);
    if (roleId === "super-admin" || roleId === "prestataire") {
      throw new Error("Ce rôle ne peut pas être attribué depuis l'équipe");
    }
    return {
      prenom,
      nom: input.nom.trim(),
      email,
      roleId,
      affectation: input.affectation.trim() || "Assignment",
      droits: input.droits.filter(estDroitId) as DroitId[],
    };
  })
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "gerer-equipe")) {
      throw new Error("Droits insuffisants");
    }
    const motDePasse = `Hublify-${crypto.randomUUID().slice(0, 8)}!aA1`;
    const cree = await avecInscriptionInterne(() =>
      auth.api.signUpEmail({
        body: {
          email: data.email,
          password: motDePasse,
          name: `${data.prenom} ${data.nom}`.trim(),
        },
      }),
    );
    const userId = cree.user.id;
    const sql = getSql();
    if (!sql) throw new Error("Base indisponible");
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
    await envoyerMail({
      a: data.email,
      sujet: `Invitation Hublify — ${moi.orgNom}`,
      html: `<p>Vous êtes invité(e) à rejoindre <strong>${moi.orgNom}</strong> sur Hublify.</p>
<p>Connexion : <a href="${base}/connexion">${base}/connexion</a></p>
<p>E-mail : ${data.email}</p>
<p>Mot de passe temporaire : <code>${motDePasse}</code></p>
<p>Changez-le après votre première connexion.</p>`,
    });
    return { ok: true as const, email: data.email };
  });

export const retirerMembre = createServerFn({ method: "POST" })
  .validator((input: { userId: string }) => input)
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "gerer-equipe")) {
      throw new Error("Droits insuffisants");
    }
    if (data.userId === moi.userId) throw new Error("Impossible de se retirer soi-même");
    const sql = getSql();
    if (!sql) throw new Error("Base indisponible");
    const cible = (await sql`
      select role_id from public.org_membres
      where org_id = ${moi.orgId}::uuid and user_id = ${data.userId}::uuid
      limit 1
    `) as { role_id: RoleId }[];
    if (cible[0]?.role_id === "super-admin") {
      throw new Error("Un super-administrateur ne peut pas être retiré");
    }
    await sql`
      delete from public.org_membres
      where org_id = ${moi.orgId}::uuid and user_id = ${data.userId}::uuid
    `;
    await sql`delete from public.profils where user_id = ${data.userId}::uuid`;
    await sql`delete from "user" where id = ${data.userId}::uuid`;
    return { ok: true as const };
  });

export const inscrireAdherent = createServerFn({ method: "POST" })
  .validator((input: {
    prenom: string;
    nom: string;
    email: string;
    password: string;
    nomOrg: string;
  }) => {
    const email = input.email.trim().toLowerCase();
    const prenom = input.prenom.trim();
    const nomOrg = input.nomOrg.trim();
    if (!prenom) throw new Error("Prénom requis");
    if (!email.includes("@")) throw new Error("Email invalide");
    if (nomOrg.length < 2) throw new Error("Nom de l'organisation requis");
    if (input.password.length < 10) throw new Error("Mot de passe trop court");
    return {
      prenom,
      nom: input.nom.trim(),
      email,
      password: input.password,
      nomOrg,
    };
  })
  .handler(async ({ data }) => {
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
