import type { DroitId, RoleId } from "@/auth/permissions";
import {
  COLLECTIONS_METIER,
  TABLE_COLLECTION,
  etatVide,
  type CollectionMetier,
  type EtatSession,
} from "@/data/etat-session";
import { fusionnerParametrage, type ParametrageSession } from "@/data/parametrage-mo1";
import type { Sql } from "@/lib/sql";
import type { OrgType } from "@/lib/orgs";

export type OrgSession = {
  orgId: string;
  orgType: OrgType;
  roleId: RoleId;
  droits: readonly DroitId[];
};

/**
 * Correspondance colonne SQL ↔ clé du domaine. Elle sert dans les deux sens :
 * les `select` aliasent la colonne vers la clé (la ligne est alors déjà l'objet
 * métier) et les écritures traduisent la clé vers la colonne.
 */
type Champs = readonly (readonly [colonne: string, cle: string])[];

const CHAMPS: Record<CollectionMetier, Champs> = {
  biens: [
    ["id", "id"],
    ["nom", "nom"],
    ["adresse", "adresse"],
    ["base_nuit", "baseNuit"],
    ["typologie", "typologie"],
    ["immeuble_id", "immeubleId"],
    ["surface", "surface"],
    ["meuble", "meuble"],
    ["proprietaire", "proprietaire"],
    ["initiales", "initiales"],
    ["note", "note"],
    ["statut", "statut"],
  ],
  immeubles: [
    ["id", "id"],
    ["nom", "nom"],
    ["proprietaire", "proprietaire"],
    ["initiales", "initiales"],
    ["adresse", "adresse"],
    ["statut", "statut"],
  ],
  prestataires: [
    ["id", "id"],
    ["nom", "nom"],
    ["categorie", "categorie"],
    ["telephone", "telephone"],
    ["email", "email"],
    ["ville", "ville"],
    ["actif", "actif"],
    ["note", "note"],
  ],
  occupants: [
    ["id", "id"],
    ["nom", "nom"],
    ["initiales", "initiales"],
    ["type_occupant", "type"],
    ["logement", "logement"],
    ["telephone", "telephone"],
    ["email", "email"],
    ["arrivee", "arrivee"],
    ["depart", "depart"],
    ["statut", "statut"],
  ],
  loyers: [
    ["id", "id"],
    ["locataire", "locataire"],
    ["initiales", "initiales"],
    ["bien_nom", "bienNom"],
    ["echeance", "echeance"],
    ["montant", "montant"],
    ["valide", "valide"],
    ["quittance", "quittance"],
  ],
  evenements: [
    ["id", "id"],
    ["titre", "titre"],
    ["lieu", "lieu"],
    ["dates", "dates"],
    ["impact", "impact"],
    ["description", "description"],
  ],
  messagesDash: [
    ["id", "id"],
    ["canal", "canal"],
    ["auteur", "auteur"],
    ["initiales", "initiales"],
    ["bien_nom", "bienNom"],
    ["texte", "texte"],
    ["il_y_a", "ilYa"],
  ],
  missions: [
    ["id", "id"],
    ["bien_id", "bienId"],
    ["jour", "date"],
    ["titre", "titre"],
    ["type_mission", "type"],
    ["emoji", "emoji"],
    ["heure", "heure"],
    ["assigne", "assigne"],
    ["statut", "statut"],
    ["description", "description"],
    ["pastille_accentuee", "pastilleAccentuee"],
  ],
  reservationsCalendrier: [
    ["id", "id"],
    ["bien_id", "bienId"],
    ["voyageur", "voyageur"],
    ["arrivee", "arrivee"],
    ["depart", "depart"],
  ],
  reservationsDossier: [
    ["id", "id"],
    ["bien_id", "bienId"],
    ["occupant", "occupant"],
    ["initiales", "initiales"],
    ["email", "email"],
    ["telephone", "telephone"],
    ["arrivee", "arrivee"],
    ["depart", "depart"],
    ["heure_arrivee", "heureArrivee"],
    ["heure_depart", "heureDepart"],
    ["plateforme", "plateforme"],
    ["voyageurs", "voyageurs"],
    ["adultes", "adultes"],
    ["enfants", "enfants"],
    ["montant", "montant"],
    ["paye", "paye"],
    ["statut", "statut"],
    ["couleur", "couleur"],
    ["type_sejour", "type"],
    ["upsell_ids", "upsellIds"],
    ["services", "services"],
  ],
  datesBloquees: [
    ["id", "id"],
    ["bien_id", "bienId"],
    ["jour", "date"],
    ["motif", "motif"],
  ],
  datesBloqueesAnnuelles: [["jour", "jour"]],
  ensembles: [
    ["id", "id"],
    ["nom", "nom"],
    ["description", "description"],
    ["actif", "actif"],
  ],
  regles: [
    ["id", "id"],
    ["ensemble_id", "ensembleId"],
    ["nom", "nom"],
    ["type_regle", "type"],
    ["debut", "debut"],
    ["fin", "fin"],
    ["nuits", "nuits"],
    ["biens", "biens"],
    ["variation", "variation"],
    ["note", "note"],
  ],
  conversations: [
    ["id", "id"],
    ["section", "section"],
    ["nom", "nom"],
    ["initiales", "initiales"],
    ["type_interlocuteur", "type"],
    ["badge", "badge"],
    ["bien_nom", "bienNom"],
    ["extrait", "extrait"],
    ["il_y_a", "ilYa"],
    ["non_lu", "nonLu"],
    ["archivee", "archivee"],
    ["assigne", "assigne"],
  ],
  messagesFil: [
    ["id", "id"],
    ["conversation_id", "conversationId"],
    ["kind", "kind"],
    ["texte", "texte"],
    ["heure", "heure"],
    ["icone_systeme", "iconeSysteme"],
  ],
  actions: [
    ["id", "id"],
    ["titre", "titre"],
    ["quand", "quand"],
    ["detail", "detail"],
  ],
  notifications: [
    ["id", "id"],
    ["titre", "titre"],
    ["detail", "detail"],
    ["href", "href"],
    ["lu", "lu"],
  ],
  documents: [
    ["id", "id"],
    ["titre", "titre"],
    ["type_doc", "type"],
    ["filtre", "filtre"],
    ["logement", "logement"],
    ["date_doc", "date"],
    ["taille", "taille"],
    ["modifie_par", "modifiePar"],
    ["photos", "photos"],
    ["vue", "vue"],
    ["occupant", "occupant"],
  ],
  modeles: [
    ["id", "id"],
    ["designation", "designation"],
    ["type_doc", "type"],
    ["categorie", "categorie"],
    ["derniere", "derniere"],
    ["utilisations", "utilisations"],
    ["reference", "reference"],
    ["favori", "favori"],
  ],
  inventaire: [
    ["id", "id"],
    ["code", "code"],
    ["designation", "designation"],
    ["etat", "etat"],
    ["qte", "qte"],
    ["emoji", "emoji"],
    ["emplacement", "emplacement"],
    ["serie", "serie"],
    ["onglet", "onglet"],
  ],
  edl: [
    ["id", "id"],
    ["logement", "logement"],
    ["type_edl", "type"],
    ["occupant", "occupant"],
    ["date_edl", "date"],
  ],
  droitsPersonnalises: [
    ["id", "id"],
    ["nom", "nom"],
    ["description", "description"],
  ],
};

type Ligne = Record<string, unknown>;

function table(collection: CollectionMetier) {
  return TABLE_COLLECTION[collection];
}

function selection(collection: CollectionMetier) {
  return CHAMPS[collection].map(([col, cle]) => `"${col}" as "${cle}"`).join(", ");
}

function colonneDe(collection: CollectionMetier, cle: string) {
  return CHAMPS[collection].find(([, c]) => c === cle)?.[0];
}

function versBase64(valeur: unknown) {
  if (valeur == null) return undefined;
  return Buffer.isBuffer(valeur) ? valeur.toString("base64") : String(valeur);
}

function depuisBase64(valeur: unknown) {
  return typeof valeur === "string" && valeur ? Buffer.from(valeur, "base64") : null;
}

/**
 * Un champ absent de l'objet métier n'est pas un champ vide : on laisse la base
 * appliquer sa valeur par défaut (`DEFAULT`) au lieu d'écrire NULL, ce qui
 * violerait les colonnes obligatoires comme `missions.pastille_accentuee`.
 */
function valeursEtPlaceholders(champs: Champs, item: Ligne, decalage: number) {
  const colonnes: string[] = [];
  const place: string[] = [];
  const params: unknown[] = [];
  for (const [col, cle] of champs) {
    colonnes.push(col);
    if (item[cle] === undefined) {
      place.push("default");
    } else {
      params.push(item[cle]);
      place.push(`$${decalage + params.length}`);
    }
  }
  return { colonnes, place, params };
}

function nettoyer<T extends Ligne>(ligne: T): T {
  for (const cle of Object.keys(ligne)) {
    if (ligne[cle] === null) delete ligne[cle];
  }
  return ligne;
}

// --------------------------------------------------------------- lectures

async function lireImbriques(
  sql: Sql,
  orgId: string,
  lignes: Ligne[],
  collection: CollectionMetier,
) {
  if (lignes.length === 0) return;

  if (collection === "conversations") {
    const docs = (await sql.query(
      `select conversation_id, nom, date, mime, contenu from public.conversation_documents
       where org_id = $1::uuid order by conversation_id, position`,
      [orgId],
    )) as Ligne[];
    const parConv = new Map<string, Ligne[]>();
    for (const d of docs) {
      const liste = parConv.get(String(d["conversation_id"])) ?? [];
      liste.push(
        nettoyer({
          nom: d["nom"],
          date: d["date"],
          mime: d["mime"],
          base64: versBase64(d["contenu"]) ?? null,
        }),
      );
      parConv.set(String(d["conversation_id"]), liste);
    }
    for (const l of lignes) {
      const liste = parConv.get(String(l["id"]));
      if (liste) l["documents"] = liste;
    }
    return;
  }

  if (collection === "messagesFil") {
    const pieces = (await sql.query(
      `select message_id, nom, taille, mime, contenu from public.message_pieces
       where org_id = $1::uuid order by message_id, position`,
      [orgId],
    )) as Ligne[];
    const parMessage = new Map<string, Ligne[]>();
    for (const p of pieces) {
      const liste = parMessage.get(String(p["message_id"])) ?? [];
      liste.push(
        nettoyer({
          nom: p["nom"],
          taille: p["taille"],
          mime: p["mime"],
          base64: versBase64(p["contenu"]) ?? null,
        }),
      );
      parMessage.set(String(p["message_id"]), liste);
    }
    for (const l of lignes) {
      const liste = parMessage.get(String(l["id"]));
      if (liste) l["pieces"] = liste;
    }
    return;
  }

  if (collection === "documents") {
    const fichiers = (await sql.query(
      `select document_id, nom, mime, contenu from public.documents_fichiers where org_id = $1::uuid`,
      [orgId],
    )) as Ligne[];
    const parDoc = new Map(
      fichiers.map((f) => [
        String(f["document_id"]),
        { nom: f["nom"], mime: f["mime"], base64: versBase64(f["contenu"]) ?? "" },
      ]),
    );
    for (const l of lignes) {
      const fichier = parDoc.get(String(l["id"]));
      if (fichier) l["fichier"] = fichier;
    }
    return;
  }

  if (collection === "edl") {
    const pieces = (await sql.query(
      `select dossier_id, id, nom, etat, commentaire from public.edl_pieces
       where org_id = $1::uuid order by dossier_id, position`,
      [orgId],
    )) as Ligne[];
    const points = (await sql.query(
      `select dossier_id, piece_id, id, libelle, etat from public.edl_points
       where org_id = $1::uuid order by dossier_id, piece_id, position`,
      [orgId],
    )) as Ligne[];
    const photos = (await sql.query(
      `select dossier_id, piece_id, id, legend, mime, contenu from public.edl_photos
       where org_id = $1::uuid order by dossier_id, piece_id, position`,
      [orgId],
    )) as Ligne[];

    const cle = (d: unknown, p: unknown) => `${String(d)}\u0000${String(p)}`;
    const parPiecePoints = new Map<string, Ligne[]>();
    for (const p of points) {
      const k = cle(p["dossier_id"], p["piece_id"]);
      const liste = parPiecePoints.get(k) ?? [];
      liste.push({ id: p["id"], libelle: p["libelle"], etat: p["etat"] });
      parPiecePoints.set(k, liste);
    }
    const parPiecePhotos = new Map<string, Ligne[]>();
    for (const p of photos) {
      const k = cle(p["dossier_id"], p["piece_id"]);
      const liste = parPiecePhotos.get(k) ?? [];
      liste.push(
        nettoyer({
          id: p["id"],
          legend: p["legend"],
          mime: p["mime"],
          base64: versBase64(p["contenu"]) ?? null,
        }),
      );
      parPiecePhotos.set(k, liste);
    }
    const parDossier = new Map<string, Ligne[]>();
    for (const piece of pieces) {
      const k = cle(piece["dossier_id"], piece["id"]);
      const liste = parDossier.get(String(piece["dossier_id"])) ?? [];
      liste.push({
        id: piece["id"],
        nom: piece["nom"],
        etat: piece["etat"],
        commentaire: piece["commentaire"],
        points: parPiecePoints.get(k) ?? [],
        photos: parPiecePhotos.get(k) ?? [],
      });
      parDossier.set(String(piece["dossier_id"]), liste);
    }
    for (const l of lignes) l["pieces"] = parDossier.get(String(l["id"])) ?? [];
    return;
  }

  if (collection === "droitsPersonnalises") {
    const membres = (await sql.query(
      `select droit_id, membre_id from public.droits_personnalises_membres
       where org_id = $1::uuid order by droit_id, membre_id`,
      [orgId],
    )) as Ligne[];
    const parDroit = new Map<string, string[]>();
    for (const m of membres) {
      const liste = parDroit.get(String(m["droit_id"])) ?? [];
      liste.push(String(m["membre_id"]));
      parDroit.set(String(m["droit_id"]), liste);
    }
    for (const l of lignes) l["membresIds"] = parDroit.get(String(l["id"])) ?? [];
  }
}

export async function listerCollection(
  sql: Sql,
  collection: CollectionMetier,
  orgId: string,
): Promise<unknown[]> {
  if (collection === "datesBloqueesAnnuelles") {
    const lignes = (await sql.query(
      `select jour from public.dates_bloquees_annuelles where org_id = $1::uuid order by jour`,
      [orgId],
    )) as { jour: string }[];
    return lignes.map((l) => l.jour);
  }

  if (collection === "immeubles") {
    const lignes = (await sql.query(
      `select i.id, i.nom, i.proprietaire, i.initiales, i.adresse, i.statut,
              (select count(*) from public.biens b
                where b.org_id = i.org_id and b.immeuble_id = i.id) as logements
         from public.immeubles i where i.org_id = $1::uuid order by i.id`,
      [orgId],
    )) as Ligne[];
    return lignes;
  }

  const lignes = (await sql.query(
    `select ${selection(collection)} from public.${table(collection)}
      where org_id = $1::uuid order by id`,
    [orgId],
  )) as Ligne[];
  await lireImbriques(sql, orgId, lignes, collection);
  return lignes.map((l) => nettoyer(l));
}

export async function lireParametrage(sql: Sql, orgId: string): Promise<ParametrageSession> {
  const lignes = (await sql.query(
    `select notif_alertes as "notifAlertes", notif_aide as "notifAide", notif_maj as "notifMaj",
            notifs_email as "notifsEmail", notifs_push as "notifsPush", notifs_sms as "notifsSms",
            rappel_paiement as "rappelPaiement", rappel_paiement_heures as "rappelPaiementHeures",
            notif_loyer as "notifLoyer", notif_message as "notifMessage", notif_mission as "notifMission",
            email_pre_checkin as "emailPreCheckin", message_pre_checkin as "messagePreCheckin",
            lien_app_voyageur as "lienAppVoyageur", delai_envoi_actif as "delaiEnvoiActif",
            delai_envoi_jours as "delaiEnvoiJours", message_lien_perso as "messageLienPerso",
            exiger_identifiant as "exigerIdentifiant",
            identifiant_tous_voyageurs as "identifiantTousVoyageurs",
            accepter_toute_piece as "accepterToutePiece", infos_contact_supp as "infosContactSupp",
            signature_voyageur as "signatureVoyageur", passerelle_paiement as "passerellePaiement",
            portail_voyageurs as "portailVoyageurs", code_porte_si_paye as "codePorteSiPaye",
            rappel_checkout as "rappelCheckout", rappel_checkout_jours as "rappelCheckoutJours",
            afficher_fiches_acces as "afficherFichesAcces", afficher_edl as "afficherEdl",
            heure_check_in as "heureCheckIn", heure_check_out as "heureCheckOut",
            delai_menage_min as "delaiMenageMin", consignes_arrivee as "consignesArrivee",
            consignes_depart as "consignesDepart"
       from public.parametrage where org_id = $1::uuid`,
    [orgId],
  )) as Partial<ParametrageSession>[];

  const upsells = (await sql.query(
    `select id, nom, prix, actif from public.parametrage_upsells
      where org_id = $1::uuid order by position, id`,
    [orgId],
  )) as ParametrageSession["upsells"];

  const base = lignes[0];
  if (!base) return fusionnerParametrage(null);
  return fusionnerParametrage(upsells.length > 0 ? { ...base, upsells } : base);
}

export async function assemblerEtat(sql: Sql, org: OrgSession): Promise<EtatSession> {
  const etat: EtatSession = etatVide();

  // Un prestataire ne voit que ses missions, ses notifications et ses actions.
  if (org.orgType === "prestataire") {
    const missions = (await sql.query(
      `select ${selection("missions")} from public.missions
        where org_prestataire_id = $1::uuid order by id`,
      [org.orgId],
    )) as Ligne[];
    etat.missions = missions.map((m) => nettoyer(m)) as EtatSession["missions"];
    etat.notifications = (await listerCollection(
      sql,
      "notifications",
      org.orgId,
    )) as EtatSession["notifications"];
    etat.actions = (await listerCollection(sql, "actions", org.orgId)) as EtatSession["actions"];
    etat.parametrage = await lireParametrage(sql, org.orgId);
    return etat;
  }

  for (const cle of COLLECTIONS_METIER) {
    (etat[cle] as unknown[]) = await listerCollection(sql, cle, org.orgId);
  }
  etat.parametrage = await lireParametrage(sql, org.orgId);
  return etat;
}

// --------------------------------------------------------------- écritures

async function ecrireImbriques(sql: Sql, orgId: string, collection: CollectionMetier, item: Ligne) {
  const id = String(item["id"]);

  if (collection === "conversations") {
    await sql.query(
      `delete from public.conversation_documents where org_id = $1::uuid and conversation_id = $2`,
      [orgId, id],
    );
    const docs = Array.isArray(item["documents"]) ? (item["documents"] as Ligne[]) : [];
    for (let i = 0; i < docs.length; i += 1) {
      const d = docs[i] as Ligne;
      await sql.query(
        `insert into public.conversation_documents
           (org_id, conversation_id, position, nom, date, mime, contenu)
         values ($1::uuid, $2, $3, $4, $5, $6, $7)`,
        [
          orgId,
          id,
          i,
          d["nom"] ?? "Document",
          d["date"] ?? "",
          d["mime"] ?? null,
          depuisBase64(d["base64"]),
        ],
      );
    }
    return;
  }

  if (collection === "messagesFil") {
    await sql.query(
      `delete from public.message_pieces where org_id = $1::uuid and message_id = $2`,
      [orgId, id],
    );
    const pieces = Array.isArray(item["pieces"]) ? (item["pieces"] as Ligne[]) : [];
    for (let i = 0; i < pieces.length; i += 1) {
      const p = pieces[i] as Ligne;
      await sql.query(
        `insert into public.message_pieces (org_id, message_id, position, nom, taille, mime, contenu)
         values ($1::uuid, $2, $3, $4, $5, $6, $7)`,
        [
          orgId,
          id,
          i,
          p["nom"] ?? "Pièce jointe",
          p["taille"] ?? "",
          p["mime"] ?? null,
          depuisBase64(p["base64"]),
        ],
      );
    }
    return;
  }

  if (collection === "documents") {
    const fichier = item["fichier"] as Ligne | undefined;
    if (!fichier) {
      await sql.query(
        `delete from public.documents_fichiers where org_id = $1::uuid and document_id = $2`,
        [orgId, id],
      );
      return;
    }
    await sql.query(
      `insert into public.documents_fichiers (org_id, document_id, nom, mime, contenu)
       values ($1::uuid, $2, $3, $4, $5)
       on conflict (org_id, document_id) do update
         set nom = excluded.nom, mime = excluded.mime, contenu = excluded.contenu`,
      [
        orgId,
        id,
        fichier["nom"] ?? "document",
        fichier["mime"] ?? "application/pdf",
        depuisBase64(fichier["base64"]) ?? Buffer.alloc(0),
      ],
    );
    return;
  }

  if (collection === "edl") {
    // Les points et photos disparaissent en cascade avec leurs pièces.
    await sql.query(`delete from public.edl_pieces where org_id = $1::uuid and dossier_id = $2`, [
      orgId,
      id,
    ]);
    const pieces = Array.isArray(item["pieces"]) ? (item["pieces"] as Ligne[]) : [];
    for (let i = 0; i < pieces.length; i += 1) {
      const piece = pieces[i] as Ligne;
      const pieceId = String(piece["id"]);
      await sql.query(
        `insert into public.edl_pieces (org_id, dossier_id, id, nom, etat, commentaire, position)
         values ($1::uuid, $2, $3, $4, $5, $6, $7)`,
        [
          orgId,
          id,
          pieceId,
          piece["nom"] ?? "",
          piece["etat"] ?? "ok",
          piece["commentaire"] ?? "",
          i,
        ],
      );
      const points = Array.isArray(piece["points"]) ? (piece["points"] as Ligne[]) : [];
      for (let j = 0; j < points.length; j += 1) {
        const point = points[j] as Ligne;
        await sql.query(
          `insert into public.edl_points (org_id, dossier_id, piece_id, id, libelle, etat, position)
           values ($1::uuid, $2, $3, $4, $5, $6, $7)`,
          [
            orgId,
            id,
            pieceId,
            String(point["id"]),
            point["libelle"] ?? "",
            point["etat"] ?? "ok",
            j,
          ],
        );
      }
      const photos = Array.isArray(piece["photos"]) ? (piece["photos"] as Ligne[]) : [];
      for (let j = 0; j < photos.length; j += 1) {
        const photo = photos[j] as Ligne;
        await sql.query(
          `insert into public.edl_photos
             (org_id, dossier_id, piece_id, id, legend, mime, contenu, position)
           values ($1::uuid, $2, $3, $4, $5, $6, $7, $8)`,
          [
            orgId,
            id,
            pieceId,
            String(photo["id"]),
            photo["legend"] ?? "",
            photo["mime"] ?? null,
            depuisBase64(photo["base64"]),
            j,
          ],
        );
      }
    }
    return;
  }

  if (collection === "droitsPersonnalises") {
    await sql.query(
      `delete from public.droits_personnalises_membres where org_id = $1::uuid and droit_id = $2`,
      [orgId, id],
    );
    const membres = Array.isArray(item["membresIds"]) ? (item["membresIds"] as unknown[]) : [];
    for (const membre of membres) {
      await sql.query(
        `insert into public.droits_personnalises_membres (org_id, droit_id, membre_id)
         values ($1::uuid, $2, $3) on conflict do nothing`,
        [orgId, id, String(membre)],
      );
    }
  }
}

export async function upsertLigne(
  sql: Sql,
  orgId: string,
  collection: CollectionMetier,
  item: { id: string },
  orgPrestataireId?: string | null,
) {
  if (collection === "datesBloqueesAnnuelles") {
    await sql.query(
      `insert into public.dates_bloquees_annuelles (org_id, jour) values ($1::uuid, $2::date)
       on conflict do nothing`,
      [orgId, item.id],
    );
    return;
  }

  const ligne = item as unknown as Ligne;
  const {
    colonnes,
    place: valeursPlace,
    params: valeursParams,
  } = valeursEtPlaceholders(CHAMPS[collection], ligne, 1);
  const cols = ["org_id", ...colonnes];
  const place = ["$1::uuid", ...valeursPlace];
  const params: unknown[] = [orgId, ...valeursParams];

  if (collection === "missions") {
    cols.push("org_prestataire_id");
    params.push(orgPrestataireId ?? null);
    place.push(`$${params.length}::uuid`);
  }

  const maj = colonnes
    .filter((c) => c !== "id")
    .map((c) => `"${c}" = excluded."${c}"`)
    .concat("updated_at = now()");
  if (collection === "missions") {
    maj.push(
      `org_prestataire_id = coalesce(excluded.org_prestataire_id, public.missions.org_prestataire_id)`,
    );
  }

  await sql.query(
    `insert into public.${table(collection)} (${cols.map((c) => `"${c}"`).join(", ")})
     values (${place.join(", ")})
     on conflict (org_id, id) do update set ${maj.join(", ")}`,
    params,
  );

  await ecrireImbriques(sql, orgId, collection, ligne);
}

/**
 * Aligne la collection sur `items` sans jamais vider la table : les lignes
 * absentes sont supprimées une à une, les autres remplacées. Un `delete` global
 * ferait cascader la suppression sur les réservations et les missions du bien.
 */
export async function remplacerCollection(
  sql: Sql,
  orgId: string,
  collection: CollectionMetier,
  items: unknown[],
) {
  if (collection === "datesBloqueesAnnuelles") {
    const jours = items.map((x) =>
      typeof x === "string" ? x : String((x as Ligne)?.["date"] ?? ""),
    );
    await sql.query(
      `delete from public.dates_bloquees_annuelles
        where org_id = $1::uuid and jour <> all($2::date[])`,
      [orgId, jours],
    );
    for (const jour of jours) {
      if (jour) await upsertLigne(sql, orgId, collection, { id: jour });
    }
    return;
  }

  const lignes = items.filter((x): x is Ligne => Boolean(x) && typeof x === "object");
  const ids = lignes.map((l) => String(l["id"]));
  await sql.query(
    `delete from public.${table(collection)} where org_id = $1::uuid and id <> all($2::text[])`,
    [orgId, ids],
  );
  for (const ligne of lignes) {
    await upsertLigne(sql, orgId, collection, ligne as { id: string });
  }
}

export async function majLigneVisible(
  sql: Sql,
  org: OrgSession,
  collection: CollectionMetier,
  id: string,
  patch: Record<string, unknown>,
): Promise<boolean> {
  const affectations: string[] = [];
  const params: unknown[] = [];
  for (const [cle, valeur] of Object.entries(patch)) {
    if (cle === "id" || valeur === undefined) continue;
    const col = colonneDe(collection, cle);
    if (!col) continue;
    params.push(valeur);
    affectations.push(`"${col}" = $${params.length}`);
  }

  // Un prestataire met à jour une mission qui lui est confiée sans posséder la ligne.
  if (collection === "missions") {
    const portee = `id = $${params.length + 1} and (org_id = $${params.length + 2}::uuid or org_prestataire_id = $${params.length + 2}::uuid)`;
    if (affectations.length === 0) {
      const test = (await sql.query(`select 1 from public.missions where ${portee} limit 1`, [
        ...params,
        id,
        org.orgId,
      ])) as unknown[];
      return test.length > 0;
    }
    const res = (await sql.query(
      `update public.missions set ${affectations.join(", ")}, updated_at = now()
        where ${portee} returning id`,
      [...params, id, org.orgId],
    )) as unknown[];
    return res.length > 0;
  }

  if (affectations.length === 0) {
    const test = (await sql.query(
      `select 1 from public.${table(collection)} where org_id = $1::uuid and id = $2 limit 1`,
      [org.orgId, id],
    )) as unknown[];
    return test.length > 0;
  }

  const res = (await sql.query(
    `update public.${table(collection)} set ${affectations.join(", ")}, updated_at = now()
      where org_id = $${params.length + 1}::uuid and id = $${params.length + 2} returning id`,
    [...params, org.orgId, id],
  )) as unknown[];
  return res.length > 0;
}

export async function lireLigne(
  sql: Sql,
  orgId: string,
  collection: CollectionMetier,
  id: string,
): Promise<unknown | null> {
  if (collection === "datesBloqueesAnnuelles") {
    const lignes = (await sql.query(
      `select jour from public.dates_bloquees_annuelles where org_id = $1::uuid and jour = $2::date`,
      [orgId, id],
    )) as { jour: string }[];
    return lignes[0]?.jour ?? null;
  }
  const lignes = (await sql.query(
    `select ${selection(collection)} from public.${table(collection)}
      where org_id = $1::uuid and id = $2 limit 1`,
    [orgId, id],
  )) as Ligne[];
  if (lignes.length === 0) return null;
  await lireImbriques(sql, orgId, lignes, collection);
  return nettoyer(lignes[0] as Ligne);
}

export async function ecrireParametrage(sql: Sql, orgId: string, parametrage: ParametrageSession) {
  const complet = fusionnerParametrage(parametrage);
  const colonnes: [string, unknown][] = [
    ["notif_alertes", complet.notifAlertes],
    ["notif_aide", complet.notifAide],
    ["notif_maj", complet.notifMaj],
    ["notifs_email", complet.notifsEmail],
    ["notifs_push", complet.notifsPush],
    ["notifs_sms", complet.notifsSms],
    ["rappel_paiement", complet.rappelPaiement],
    ["rappel_paiement_heures", complet.rappelPaiementHeures],
    ["notif_loyer", complet.notifLoyer],
    ["notif_message", complet.notifMessage],
    ["notif_mission", complet.notifMission],
    ["email_pre_checkin", complet.emailPreCheckin],
    ["message_pre_checkin", complet.messagePreCheckin],
    ["lien_app_voyageur", complet.lienAppVoyageur],
    ["delai_envoi_actif", complet.delaiEnvoiActif],
    ["delai_envoi_jours", complet.delaiEnvoiJours],
    ["message_lien_perso", complet.messageLienPerso],
    ["exiger_identifiant", complet.exigerIdentifiant],
    ["identifiant_tous_voyageurs", complet.identifiantTousVoyageurs],
    ["accepter_toute_piece", complet.accepterToutePiece],
    ["infos_contact_supp", complet.infosContactSupp],
    ["signature_voyageur", complet.signatureVoyageur],
    ["passerelle_paiement", complet.passerellePaiement],
    ["portail_voyageurs", complet.portailVoyageurs],
    ["code_porte_si_paye", complet.codePorteSiPaye],
    ["rappel_checkout", complet.rappelCheckout],
    ["rappel_checkout_jours", complet.rappelCheckoutJours],
    ["afficher_fiches_acces", complet.afficherFichesAcces],
    ["afficher_edl", complet.afficherEdl],
    ["heure_check_in", complet.heureCheckIn],
    ["heure_check_out", complet.heureCheckOut],
    ["delai_menage_min", complet.delaiMenageMin],
    ["consignes_arrivee", complet.consignesArrivee],
    ["consignes_depart", complet.consignesDepart],
  ];

  const noms = colonnes.map(([c]) => `"${c}"`).join(", ");
  const place = colonnes.map((_, i) => `$${i + 2}`).join(", ");
  const maj = colonnes.map(([c]) => `"${c}" = excluded."${c}"`).join(", ");
  await sql.query(
    `insert into public.parametrage (org_id, ${noms}) values ($1::uuid, ${place})
     on conflict (org_id) do update set ${maj}, updated_at = now()`,
    [orgId, ...colonnes.map(([, v]) => v)],
  );

  const ids = complet.upsells.map((u) => u.id);
  await sql.query(
    `delete from public.parametrage_upsells where org_id = $1::uuid and id <> all($2::text[])`,
    [orgId, ids],
  );
  for (let i = 0; i < complet.upsells.length; i += 1) {
    const u = complet.upsells[i]!;
    await sql.query(
      `insert into public.parametrage_upsells (org_id, id, nom, prix, actif, position)
       values ($1::uuid, $2, $3, $4, $5, $6)
       on conflict (org_id, id) do update
         set nom = excluded.nom, prix = excluded.prix,
             actif = excluded.actif, position = excluded.position`,
      [orgId, u.id, u.nom, u.prix, u.actif, i],
    );
  }
}

// ------------------------------------------------- fiches d'accès chiffrées

export type AccesLieu = {
  bienId: string;
  wifi: string;
  consignes: string;
  codeCles: string;
  wifiMdp: string;
  alarme: string;
};

export async function lireAccesLieux(sql: Sql, orgId: string, cle: string): Promise<AccesLieu[]> {
  const lignes = (await sql.query(
    `select bien_id as "bienId", wifi, consignes,
            coalesce(pgp_sym_decrypt(code_cles_chiffre, $2), '') as "codeCles",
            coalesce(pgp_sym_decrypt(wifi_mdp_chiffre, $2), '') as "wifiMdp",
            coalesce(pgp_sym_decrypt(alarme_chiffre, $2), '') as "alarme"
       from public.lieux_acces where org_id = $1::uuid order by bien_id`,
    [orgId, cle],
  )) as AccesLieu[];
  return lignes;
}

export async function ecrireAccesLieu(sql: Sql, orgId: string, cle: string, acces: AccesLieu) {
  await sql.query(
    `insert into public.lieux_acces
       (org_id, bien_id, wifi, consignes, code_cles_chiffre, wifi_mdp_chiffre, alarme_chiffre)
     values ($1::uuid, $2, $3, $4, pgp_sym_encrypt($5, $8), pgp_sym_encrypt($6, $8), pgp_sym_encrypt($7, $8))
     on conflict (org_id, bien_id) do update
       set wifi = excluded.wifi, consignes = excluded.consignes,
           code_cles_chiffre = excluded.code_cles_chiffre,
           wifi_mdp_chiffre = excluded.wifi_mdp_chiffre,
           alarme_chiffre = excluded.alarme_chiffre,
           updated_at = now()`,
    [
      orgId,
      acces.bienId,
      acces.wifi,
      acces.consignes,
      acces.codeCles,
      acces.wifiMdp,
      acces.alarme,
      cle,
    ],
  );
}

export type { OrgType };
