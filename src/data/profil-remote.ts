import { createServerFn } from "@tanstack/react-start";
import { sessionDepuisRequete } from "@/lib/session-serveur.server";
import { getSql } from "@/lib/sql";
import type { Sql } from "@/lib/sql";

export type IdentiteProfil = {
  prenom: string;
  nom: string;
  telephone1: string;
  telephone2: string;
  naissance: string;
};

export type DocumentProfil = {
  id: string;
  titre: string;
  statut: "Vérifié" | "En attente";
  fichier?: { nom: string; mime: string; base64: string };
};

export type ProfilComplet = { identite: IdentiteProfil; documents: DocumentProfil[] };

function initialesDe(prenom: string, nom: string) {
  const a = prenom.trim().charAt(0);
  const b = nom.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "??";
}

async function lireProfil(sql: Sql, userId: string): Promise<ProfilComplet> {
  const lignes = (await sql.query(
    `select prenom, nom, telephone1, telephone2, to_char(naissance, 'YYYY-MM-DD') as naissance
       from public.profils where user_id = $1::uuid`,
    [userId],
  )) as {
    prenom: string;
    nom: string;
    telephone1: string;
    telephone2: string;
    naissance: string | null;
  }[];

  const docs = (await sql.query(
    `select id, titre, statut, fichier_nom, fichier_mime, contenu
       from public.profil_documents where user_id = $1::uuid order by created_at, id`,
    [userId],
  )) as {
    id: string;
    titre: string;
    statut: DocumentProfil["statut"];
    fichier_nom: string | null;
    fichier_mime: string | null;
    contenu: Buffer | null;
  }[];

  const ligne = lignes[0];
  return {
    identite: {
      prenom: ligne?.prenom ?? "",
      nom: ligne?.nom ?? "",
      telephone1: ligne?.telephone1 ?? "",
      telephone2: ligne?.telephone2 ?? "",
      naissance: ligne?.naissance ?? "",
    },
    documents: docs.map((d) => ({
      id: d.id,
      titre: d.titre,
      statut: d.statut,
      ...(d.fichier_nom && d.contenu
        ? {
            fichier: {
              nom: d.fichier_nom,
              mime: d.fichier_mime ?? "application/pdf",
              base64: d.contenu.toString("base64"),
            },
          }
        : {}),
    })),
  };
}

export const chargerProfilDistant = createServerFn({ method: "GET" }).handler(async () => {
  const s = await sessionDepuisRequete();
  if (!s) return { ok: false as const, raison: "non_authentifie" as const };
  const sql = getSql();
  if (!sql) return { ok: false as const, raison: "non_configure" as const };
  return { ok: true as const, profil: await lireProfil(sql, s.userId) };
});

export const sauverIdentiteDistante = createServerFn({ method: "POST" })
  .validator((input: IdentiteProfil) => {
    const prenom = String(input?.prenom ?? "").trim();
    const nom = String(input?.nom ?? "").trim();
    if (!prenom || !nom) throw new Error("Le prénom et le nom sont obligatoires");
    return {
      prenom,
      nom,
      telephone1: String(input.telephone1 ?? "").trim(),
      telephone2: String(input.telephone2 ?? "").trim(),
      naissance: String(input.naissance ?? "").trim(),
    } satisfies IdentiteProfil;
  })
  .handler(async ({ data }) => {
    const s = await sessionDepuisRequete();
    if (!s) return { ok: false as const, raison: "non_authentifie" as const };
    const sql = getSql();
    if (!sql) return { ok: false as const, raison: "non_configure" as const };
    await sql.query(
      `update public.profils
          set prenom = $2, nom = $3, initiales = $4,
              telephone1 = $5, telephone2 = $6, naissance = nullif($7, '')::date
        where user_id = $1::uuid`,
      [
        s.userId,
        data.prenom,
        data.nom,
        initialesDe(data.prenom, data.nom),
        data.telephone1,
        data.telephone2,
        data.naissance,
      ],
    );
    return { ok: true as const };
  });

export const sauverDocumentsProfilDistants = createServerFn({ method: "POST" })
  .validator((input: { documents: DocumentProfil[] }) => {
    if (!Array.isArray(input?.documents)) throw new Error("Liste de documents invalide");
    return { documents: input.documents };
  })
  .handler(async ({ data }) => {
    const s = await sessionDepuisRequete();
    if (!s) return { ok: false as const, raison: "non_authentifie" as const };
    const sql = getSql();
    if (!sql) return { ok: false as const, raison: "non_configure" as const };

    const ids = data.documents.map((d) => String(d.id));
    await sql.query(
      `delete from public.profil_documents where user_id = $1::uuid and id <> all($2::text[])`,
      [s.userId, ids],
    );
    for (const doc of data.documents) {
      await sql.query(
        `insert into public.profil_documents
           (user_id, id, titre, statut, fichier_nom, fichier_mime, contenu)
         values ($1::uuid, $2, $3, $4, $5, $6, $7)
         on conflict (user_id, id) do update
           set titre = excluded.titre, statut = excluded.statut,
               fichier_nom = excluded.fichier_nom, fichier_mime = excluded.fichier_mime,
               contenu = excluded.contenu`,
        [
          s.userId,
          String(doc.id),
          String(doc.titre ?? "Document"),
          doc.statut === "Vérifié" ? "Vérifié" : "En attente",
          doc.fichier?.nom ?? null,
          doc.fichier?.mime ?? null,
          doc.fichier?.base64 ? Buffer.from(doc.fichier.base64, "base64") : null,
        ],
      );
    }
    return { ok: true as const };
  });
