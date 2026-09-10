import { DOCS_MO1, LOGEMENTS_PATRIMOINE } from "@/data/documents-mo1";
import { DOSSIERS_EDL } from "@/data/edl-mo1";
import { CONVERSATIONS_MO1 } from "@/data/messagerie-mo1";
import { LOYERS_MO1 } from "@/data/planning-mo1";
import { BIENS_MO1, RESERVATIONS_MO1 } from "@/data/reservations-mo1";

export type ContexteDocument = {
  prenom?: string;
  nom?: string;
  naissance?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  identifiant?: string;
  titulaire?: string;
  locataire?: string;
  logement?: string;
  bailleur?: string;
  date?: string;
  periode?: string;
  loyer?: string;
  charges?: string;
  total?: string;
  piece?: string;
  legende?: string;
  extra?: string[];
};

export type KindDocument =
  | "identite"
  | "domicile"
  | "revenus"
  | "rib"
  | "bail"
  | "quittance"
  | "avis"
  | "photo"
  | "edl"
  | "assurance"
  | "modele"
  | "facture"
  | "courrier";

export function normaliser(valeur: string) {
  return valeur
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[_/]+/g, " ")
    .replace(/[—–-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titreLisible(titre: string) {
  return titre
    .replace(/\.pdf$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MOIS_DATE: string[][] = [
  ["janvier", "jan", "january"],
  ["fevrier", "fev", "feb", "february"],
  ["mars", "mar", "march"],
  ["avril", "avr", "apr", "april"],
  ["mai", "may"],
  ["juin", "jun", "june"],
  ["juillet", "juil", "jul", "july"],
  ["aout", "aou", "aug", "august"],
  ["septembre", "sept", "sep", "september"],
  ["octobre", "oct", "october"],
  ["novembre", "nov", "november"],
  ["decembre", "dec", "december"],
];

/** Normalise une date catalogue (`15 Jan 2026`) ou ISO vers `jj/mm/aaaa`. */
export function formaterDateFr(valeur?: string): string | undefined {
  if (!valeur) return undefined;
  const v = valeur.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const n = normaliser(v);
  const jour = n.match(/\b(\d{1,2})\b/);
  const annee = n.match(/\b(20\d{2})\b/);
  if (!jour || !annee) return v;
  const idx = MOIS_DATE.findIndex((noms) =>
    noms.some(
      (m) =>
        m.length >= 3 && (n.includes(` ${m} `) || n.includes(` ${m}`) || n.startsWith(`${m} `)),
    ),
  );
  if (idx < 0) return v;
  const jourNum = jour[1];
  const anneeNum = annee[1];
  if (!jourNum || !anneeNum) return v;
  return `${jourNum.padStart(2, "0")}/${String(idx + 1).padStart(2, "0")}/${anneeNum}`;
}

function extraObjet(extra?: string[]) {
  const objet: Record<string, string> = {};
  for (const ligne of extra ?? []) {
    const coupe = ligne.indexOf(":");
    if (coupe <= 0) continue;
    const cle = normaliser(ligne.slice(0, coupe));
    const valeur = ligne.slice(coupe + 1).trim();
    if (cle && valeur) objet[cle] = valeur;
  }
  if (objet["lieu piece"] && !objet["piece"]) objet["piece"] = objet["lieu piece"];
  return objet;
}

function estGenerique(valeur: string | undefined) {
  if (!valeur) return true;
  const n = normaliser(valeur);
  if (!n) return true;
  return n === "gestionnaire hublify" || n === "hublify" || n === "bien au dossier" || n === "vous";
}

type Personne = {
  nom: string;
  logement?: string;
  email?: string;
  telephone?: string;
};

function personnesConnues(): Personne[] {
  const liste: Personne[] = [];
  const vu = new Set<string>();
  const ajouter = (nom: string, extra: Partial<Personne> = {}) => {
    const propre = nom.replace(/\s+/g, " ").trim();
    if (!propre) return;
    const parts = propre.split(/\s+/);
    const inverse =
      parts.length >= 2 ? `${parts[parts.length - 1]} ${parts.slice(0, -1).join(" ")}` : "";
    const existant = liste.find(
      (p) =>
        normaliser(p.nom) === normaliser(propre) ||
        (inverse && normaliser(p.nom) === normaliser(inverse)),
    );
    if (existant) {
      if (!existant.logement && extra.logement) existant.logement = extra.logement;
      if (!existant.email && extra.email) existant.email = extra.email;
      if (!existant.telephone && extra.telephone) existant.telephone = extra.telephone;
      return;
    }
    const cle = normaliser(propre);
    if (vu.has(cle) || (inverse && vu.has(normaliser(inverse)))) return;
    vu.add(cle);
    liste.push({ nom: propre, ...extra });
  };

  for (const c of CONVERSATIONS_MO1) {
    ajouter(c.nom, c.bienNom ? { logement: c.bienNom } : {});
  }
  for (const r of RESERVATIONS_MO1) {
    const bien = BIENS_MO1.find((b) => b.id === r.bienId);
    ajouter(r.occupant, {
      ...(bien ? { logement: bien.nom } : {}),
      ...(r.email ? { email: r.email } : {}),
      ...(r.telephone ? { telephone: r.telephone } : {}),
    });
  }
  for (const l of LOYERS_MO1) {
    ajouter(l.locataire, { logement: l.bienNom });
  }
  for (const d of DOSSIERS_EDL) {
    ajouter(d.occupant, { logement: d.logement });
  }
  for (const d of DOCS_MO1) {
    const extrait = extraireNomTitreBrut(d.titre);
    if (extrait) ajouter(extrait, { logement: d.logement });
  }
  return liste;
}

function extraireNomTitreBrut(titre: string) {
  const lisible = titreLisible(titre);
  const morceaux = lisible
    .split(/\s*[—–-]\s*/)
    .map((m) => m.trim())
    .filter(Boolean);
  if (morceaux.length < 2) return undefined;
  const mois =
    /^(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre|\d)/i;
  for (const morceau of morceaux.slice(1)) {
    if (mois.test(normaliser(morceau))) continue;
    if (logementParNom(morceau)) continue;
    if (normaliser(morceau).length < 3) continue;
    return morceau.replace(/\s+/g, " ").trim();
  }
  return undefined;
}

function extraireNomTitre(titre: string) {
  const brut = extraireNomTitreBrut(titre);
  return brut ? rangerNom(brut) : undefined;
}

function rangerNom(brut: string) {
  const propre = brut.replace(/\s+/g, " ").trim();
  const connu = personneParTexte(propre);
  return connu?.nom ?? propre;
}

function personneParTexte(texte: string): Personne | undefined {
  const n = normaliser(texte);
  if (!n || estGenerique(texte)) return undefined;
  const gens = personnesConnues();
  const exact = gens.find((p) => normaliser(p.nom) === n);
  if (exact) return exact;
  const inverse = gens.find((p) => {
    const parts = p.nom.split(/\s+/);
    return (
      parts.length >= 2 &&
      normaliser(`${parts[parts.length - 1]} ${parts.slice(0, -1).join(" ")}`) === n
    );
  });
  if (inverse) return inverse;
  const contenu = gens.find((p) => {
    const pn = normaliser(p.nom);
    return pn.length >= 5 && n.includes(pn);
  });
  if (contenu) return contenu;
  const mots = n.split(" ").filter((m) => m.length > 2);
  const parNomFamille = gens.filter((p) => {
    const fam = normaliser(p.nom.split(/\s+/).slice(-1)[0] ?? "");
    return fam.length > 2 && mots.includes(fam);
  });
  if (parNomFamille.length === 1) return parNomFamille[0];
  return undefined;
}

function logementParNom(nom: string | undefined) {
  if (!nom) return undefined;
  const n = normaliser(nom);
  if (!n || estGenerique(nom)) return undefined;
  const bien = BIENS_MO1.find((b) => normaliser(b.nom) === n || n.includes(normaliser(b.nom)));
  const pat = LOGEMENTS_PATRIMOINE.find(
    (l) => normaliser(l.nom) === n || n.includes(normaliser(l.nom)),
  );
  if (!bien && !pat) return undefined;
  return {
    nom: bien?.nom ?? pat!.nom,
    adresse: bien?.adresse || pat?.adresse || "",
    surface: pat?.surface ?? "",
    typologie: pat?.typologie ?? "",
    proprietaire: pat?.proprietaire ?? "Hublify",
    meuble: pat?.meuble ?? true,
  };
}

function logementDansTexte(texte: string) {
  const n = normaliser(texte);
  return (
    BIENS_MO1.find((b) => n.includes(normaliser(b.nom))) ??
    LOGEMENTS_PATRIMOINE.find((l) => n.includes(normaliser(l.nom)))
  );
}

function docParTitre(titre: string) {
  const n = normaliser(titre);
  return DOCS_MO1.find(
    (d) =>
      normaliser(d.titre) === n ||
      n.includes(normaliser(d.titre)) ||
      normaliser(d.titre).includes(n),
  );
}

function extraireMois(titre: string) {
  const n = normaliser(titre);
  const mois = [
    "janvier",
    "fevrier",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "aout",
    "septembre",
    "octobre",
    "novembre",
    "decembre",
  ];
  const libelles = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const idx = mois.findIndex((m) => n.includes(m));
  if (idx < 0) return undefined;
  const annee = n.match(/20\d{2}/)?.[0] ?? "2026";
  return `${libelles[idx]} ${annee}`;
}

function loyerDe(locataire?: string, logement?: string) {
  if (logement) {
    const n = normaliser(logement);
    if (n.includes("colette")) return { loyer: "1280", charges: "80", total: "1360" };
    if (n.includes("suzette")) return { loyer: "850", charges: "50", total: "900" };
    const ligne = LOYERS_MO1.find(
      (l) => normaliser(l.bienNom) === n || n.includes(normaliser(l.bienNom)),
    );
    if (ligne) return { loyer: String(ligne.montant), charges: "0", total: String(ligne.montant) };
  }
  if (locataire) {
    const ligne = LOYERS_MO1.find((l) => normaliser(l.locataire) === normaliser(locataire));
    if (ligne) return { loyer: String(ligne.montant), charges: "0", total: String(ligne.montant) };
  }
  return { loyer: "1280", charges: "80", total: "1360" };
}

export function kindDocument(titre: string, extra: string[] = []): KindDocument {
  const n = normaliser([titre, extra.join(" ")].join(" "));
  if (n.includes("modele")) return "modele";
  if (n.includes("identit") || n.includes("passeport") || n.includes("cni")) return "identite";
  if (n.includes("domicile")) return "domicile";
  if (n.includes("revenu")) return "revenus";
  if (n.includes("rib") || n.includes("iban")) return "rib";
  if (n.includes("avis") || n.includes("echeance")) return "avis";
  if (n.includes("quittance")) return "quittance";
  if (n.includes("facture")) return "facture";
  if (n.includes("etat des lieux") || n.includes("edl")) return "edl";
  if (
    n.includes("photo") ||
    n.includes("preuve") ||
    n.includes("legende") ||
    n.includes("vue generale") ||
    /\b(salon|cuisine|chambre|sdb)\b/.test(n)
  ) {
    return "photo";
  }
  if (n.includes("assurance") || n.includes("attestation")) return "assurance";
  if (n.includes("bail") || /(^|\s)location(\s|$)/.test(n)) return "bail";
  if (n.includes("conversation")) return "courrier";
  return "courrier";
}

export function enrichirContexte(titre: string, ctx: ContexteDocument = {}): ContexteDocument {
  const kind = kindDocument(titre, ctx.extra ?? []);
  const extras = extraObjet(ctx.extra);
  const lisible = titreLisible(titre);
  const doc = docParTitre(lisible);

  if (kind === "identite" || kind === "domicile" || kind === "revenus" || kind === "rib") {
    return {
      ...ctx,
      extra: ctx.extra ?? [],
    };
  }

  if (kind === "modele") {
    return {
      ...ctx,
      extra: ctx.extra ?? [],
    };
  }

  let locataire =
    extras["locataire"] ||
    extras["occupant"] ||
    extras["titulaire"] ||
    ctx.locataire ||
    (!estGenerique(ctx.titulaire) ? ctx.titulaire : undefined) ||
    extraireNomTitre(lisible);

  const personne = locataire ? personneParTexte(locataire) : undefined;
  if (personne) locataire = personne.nom;

  const premierLogement = [extras["logement"], extras["bien"], extras["lieu"], ctx.logement].find(
    (v) => v && !estGenerique(v),
  );
  let logementNom =
    (premierLogement && (logementParNom(premierLogement)?.nom ?? premierLogement)) ||
    (ctx.adresse && logementParNom(ctx.adresse)?.nom) ||
    doc?.logement ||
    (kind === "photo" || kind === "edl" ? undefined : personne?.logement);

  if (!logementNom && locataire) {
    const conv = CONVERSATIONS_MO1.find((c) => normaliser(c.nom) === normaliser(locataire ?? ""));
    logementNom = conv?.bienNom;
  }
  if (!logementNom) logementNom = logementDansTexte(lisible)?.nom;
  if (!logementNom && personne?.logement) logementNom = personne.logement;

  if (!locataire && logementNom) {
    const nLog = normaliser(logementNom);
    const matchLog = (nom: string) => {
      const nl = normaliser(nom);
      return nl === nLog || nLog.includes(nl) || nl.includes(nLog);
    };
    const edl = [
      ...new Set(DOSSIERS_EDL.filter((d) => matchLog(d.logement)).map((d) => d.occupant)),
    ];
    const baux = [
      ...new Set(
        DOCS_MO1.filter((d) => matchLog(d.logement) && /bail/i.test(d.titre))
          .map((d) => extraireNomTitre(d.titre))
          .filter((x): x is string => Boolean(x)),
      ),
    ];
    const loyers = LOYERS_MO1.filter((l) => matchLog(l.bienNom)).map((l) => l.locataire);
    if (kind === "photo" || kind === "edl") locataire = edl.length === 1 ? edl[0] : undefined;
    if (!locataire) locataire = baux.length === 1 ? baux[0] : undefined;
    if (!locataire) locataire = loyers.length === 1 ? loyers[0] : undefined;
    if (!locataire && edl.length === 1) locataire = edl[0];
  }

  const bien = logementParNom(logementNom);
  const logementFinal = bien?.nom ?? logementNom;
  const rue =
    extras["adresse"] ||
    (ctx.adresse && !logementParNom(ctx.adresse) ? ctx.adresse : undefined) ||
    bien?.adresse ||
    logementNom;

  const dateDoc = formaterDateFr(extras["date"] || ctx.date || doc?.date);
  const periode =
    extras["mois"] ||
    extras["periode"] ||
    extras["echeance"] ||
    extraireMois(lisible) ||
    ctx.periode ||
    dateDoc;
  const montants = loyerDe(locataire, logementFinal);
  const loyer =
    extras["loyer"]?.replace(/[^\d.,]/g, "") ||
    extras["loyer nu"]?.replace(/[^\d.,]/g, "") ||
    ctx.loyer?.replace(/[^\d.,]/g, "") ||
    montants.loyer;
  const charges =
    extras["charges"]?.replace(/[^\d.,]/g, "") ||
    ctx.charges?.replace(/[^\d.,]/g, "") ||
    montants.charges;
  const total =
    extras["total"]?.replace(/[^\d.,]/g, "") ||
    ctx.total?.replace(/[^\d.,]/g, "") ||
    String((Number(loyer.replace(",", ".")) || 0) + (Number(charges.replace(",", ".")) || 0));

  const piece = extras["piece"] || ctx.piece;
  const legende = extras["legende"] || ctx.legende || (kind === "photo" ? lisible : undefined);
  const bailleur = extras["bailleur"] || ctx.bailleur || bien?.proprietaire || "Hublify";

  const lignes = [
    locataire ? `Locataire : ${locataire}` : undefined,
    logementFinal ? `Logement : ${logementFinal}` : undefined,
    rue ? `Adresse : ${rue}` : undefined,
    periode ? `Mois : ${periode}` : undefined,
    loyer ? `Loyer : ${loyer} EUR` : undefined,
    charges ? `Charges : ${charges} EUR` : undefined,
    total ? `Total : ${total} EUR` : undefined,
    piece ? `Pièce : ${piece}` : undefined,
    legende ? `Légende : ${legende}` : undefined,
    `Bailleur : ${bailleur}`,
    ...(ctx.extra ?? []),
  ].filter((l): l is string => Boolean(l));

  const uniques: string[] = [];
  const vues = new Set<string>();
  for (const ligne of lignes) {
    const cle = normaliser(ligne.split(":")[0] ?? ligne);
    if (vues.has(cle) && ligne.includes(":")) continue;
    vues.add(cle);
    uniques.push(ligne);
  }

  return {
    ...ctx,
    ...(locataire ? { titulaire: locataire, locataire } : {}),
    ...(logementFinal ? { logement: logementFinal } : {}),
    ...(rue ? { adresse: rue } : {}),
    ...(dateDoc ? { date: dateDoc } : periode ? { date: periode } : {}),
    ...(periode ? { periode } : {}),
    ...(loyer ? { loyer: `${loyer} EUR` } : {}),
    ...(charges ? { charges: `${charges} EUR` } : {}),
    ...(total ? { total: `${total} EUR` } : {}),
    ...(piece ? { piece } : {}),
    ...(legende ? { legende } : {}),
    bailleur,
    extra: uniques,
  };
}
