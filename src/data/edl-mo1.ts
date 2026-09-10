export type EtatPiece = "ok" | "usure" | "a_reparer";

export type PointEdl = {
  id: string;
  libelle: string;
  etat: EtatPiece;
};

export type PhotoEdl = {
  id: string;
  legend: string;
  mime?: string;
  base64?: string;
};

export type PieceEdl = {
  id: string;
  nom: string;
  etat: EtatPiece;
  commentaire: string;
  points: PointEdl[];
  photos: PhotoEdl[];
};

export type DossierEdl = {
  id: string;
  logement: string;
  type: "Entrée" | "Sortie";
  occupant: string;
  date: string;
  pieces: PieceEdl[];
};

const PIECES_SUZETTE_ENTREE: PieceEdl[] = [
  {
    id: "p-salon",
    nom: "Salon",
    etat: "ok",
    commentaire: "Canapé et table en bon état. Télévision allumée, télécommande présente.",
    points: [
      { id: "s1", libelle: "Murs et plafond", etat: "ok" },
      { id: "s2", libelle: "Sol", etat: "ok" },
      { id: "s3", libelle: "Canapé", etat: "ok" },
      { id: "s4", libelle: "Table basse", etat: "ok" },
      { id: "s5", libelle: "TV et décodeur", etat: "ok" },
    ],
    photos: [
      { id: "ph1", legend: "Vue générale" },
      { id: "ph2", legend: "Canapé" },
      { id: "ph3", legend: "Mur nord" },
      { id: "ph4", legend: "TV" },
    ],
  },
  {
    id: "p-cuisine",
    nom: "Cuisine",
    etat: "usure",
    commentaire: "Rayure sur le plan de travail. Électroménager fonctionnel.",
    points: [
      { id: "c1", libelle: "Évier et robinetterie", etat: "ok" },
      { id: "c2", libelle: "Plaques", etat: "ok" },
      { id: "c3", libelle: "Réfrigérateur", etat: "ok" },
      { id: "c4", libelle: "Plan de travail", etat: "usure" },
    ],
    photos: [
      { id: "ph5", legend: "Plan de travail" },
      { id: "ph6", legend: "Évier" },
      { id: "ph7", legend: "Plaques" },
    ],
  },
  {
    id: "p-chambre",
    nom: "Chambre",
    etat: "ok",
    commentaire: "Linge complet, 2 oreillers. Matelas houssé.",
    points: [
      { id: "h1", libelle: "Lit et matelas", etat: "ok" },
      { id: "h2", libelle: "Armoire", etat: "ok" },
      { id: "h3", libelle: "Fenêtre", etat: "ok" },
    ],
    photos: [
      { id: "ph8", legend: "Lit" },
      { id: "ph9", legend: "Fenêtre" },
    ],
  },
];

const PIECES_SUZETTE_SORTIE: PieceEdl[] = [
  {
    id: "p-salon",
    nom: "Salon",
    etat: "usure",
    commentaire: "Tache sur le canapé côté fenêtre. Télécommande TV manquante.",
    points: [
      { id: "s1", libelle: "Murs et plafond", etat: "ok" },
      { id: "s2", libelle: "Sol", etat: "ok" },
      { id: "s3", libelle: "Canapé", etat: "usure" },
      { id: "s4", libelle: "Table basse", etat: "ok" },
      { id: "s5", libelle: "TV et décodeur", etat: "a_reparer" },
    ],
    photos: [
      { id: "ph1", legend: "Canapé taché" },
      { id: "ph2", legend: "Emplacement télécommande" },
      { id: "ph3", legend: "Vue générale" },
    ],
  },
  {
    id: "p-cuisine",
    nom: "Cuisine",
    etat: "usure",
    commentaire: "Rayure inchangée. Filtre de hotte à remplacer.",
    points: [
      { id: "c1", libelle: "Évier et robinetterie", etat: "ok" },
      { id: "c2", libelle: "Plaques", etat: "ok" },
      { id: "c3", libelle: "Réfrigérateur", etat: "ok" },
      { id: "c4", libelle: "Plan de travail", etat: "usure" },
    ],
    photos: [
      { id: "ph5", legend: "Plan de travail" },
      { id: "ph6", legend: "Hotte" },
    ],
  },
  {
    id: "p-chambre",
    nom: "Chambre",
    etat: "ok",
    commentaire: "Linge rendu. RAS.",
    points: [
      { id: "h1", libelle: "Lit et matelas", etat: "ok" },
      { id: "h2", libelle: "Armoire", etat: "ok" },
      { id: "h3", libelle: "Fenêtre", etat: "ok" },
    ],
    photos: [{ id: "ph8", legend: "Lit" }],
  },
];

const PIECES_LAVANDRIX_ENTREE: PieceEdl[] = [
  {
    id: "p-salon",
    nom: "Salon",
    etat: "ok",
    commentaire: "Grand salon, stores OK.",
    points: [
      { id: "s1", libelle: "Murs et plafond", etat: "ok" },
      { id: "s2", libelle: "Sol", etat: "ok" },
      { id: "s3", libelle: "Canapé", etat: "ok" },
    ],
    photos: [
      { id: "ph1", legend: "Vue mer" },
      { id: "ph2", legend: "Salon" },
    ],
  },
  {
    id: "p-cuisine",
    nom: "Cuisine",
    etat: "ok",
    commentaire: "Équipement complet.",
    points: [
      { id: "c1", libelle: "Évier et robinetterie", etat: "ok" },
      { id: "c2", libelle: "Plaques", etat: "ok" },
      { id: "c3", libelle: "Réfrigérateur", etat: "ok" },
    ],
    photos: [{ id: "ph5", legend: "Cuisine" }],
  },
  {
    id: "p-chambre",
    nom: "Chambre",
    etat: "ok",
    commentaire: "Suite parentale.",
    points: [
      { id: "h1", libelle: "Lit et matelas", etat: "ok" },
      { id: "h2", libelle: "Armoire", etat: "ok" },
    ],
    photos: [{ id: "ph8", legend: "Chambre" }],
  },
];

const PIECES_LAVANDRIX_SORTIE: PieceEdl[] = [
  {
    id: "p-salon",
    nom: "Salon",
    etat: "ok",
    commentaire: "RAS.",
    points: [
      { id: "s1", libelle: "Murs et plafond", etat: "ok" },
      { id: "s2", libelle: "Sol", etat: "ok" },
      { id: "s3", libelle: "Canapé", etat: "ok" },
    ],
    photos: [
      { id: "ph1", legend: "Salon sortie" },
      { id: "ph2", legend: "Stores" },
      { id: "ph3", legend: "Sol" },
    ],
  },
  {
    id: "p-cuisine",
    nom: "Cuisine",
    etat: "a_reparer",
    commentaire: "Robinet cuisine à changer.",
    points: [
      { id: "c1", libelle: "Évier et robinetterie", etat: "a_reparer" },
      { id: "c2", libelle: "Plaques", etat: "ok" },
      { id: "c3", libelle: "Réfrigérateur", etat: "ok" },
    ],
    photos: [
      { id: "ph5", legend: "Robinet" },
      { id: "ph6", legend: "Évier" },
      { id: "ph7", legend: "Plaques" },
      { id: "ph7b", legend: "Frigo" },
      { id: "ph7c", legend: "Plan" },
    ],
  },
  {
    id: "p-chambre",
    nom: "Chambre",
    etat: "usure",
    commentaire: "Tête de lit marquée.",
    points: [
      { id: "h1", libelle: "Lit et matelas", etat: "usure" },
      { id: "h2", libelle: "Armoire", etat: "ok" },
    ],
    photos: [
      { id: "ph8", legend: "Tête de lit" },
      { id: "ph9", legend: "Chambre" },
    ],
  },
];

const PIECES_COLETTE_ENTREE: PieceEdl[] = [
  {
    id: "p-salon",
    nom: "Salon",
    etat: "ok",
    commentaire: "TV et décodeur OK.",
    points: [
      { id: "s1", libelle: "Murs et plafond", etat: "ok" },
      { id: "s2", libelle: "TV et décodeur", etat: "ok" },
    ],
    photos: [
      { id: "ph1", legend: "Salon" },
      { id: "ph2", legend: "TV" },
    ],
  },
  {
    id: "p-cuisine",
    nom: "Cuisine",
    etat: "ok",
    commentaire: "Vaisselle complète.",
    points: [
      { id: "c1", libelle: "Vaisselle", etat: "ok" },
      { id: "c2", libelle: "Électroménager", etat: "ok" },
    ],
    photos: [
      { id: "ph5", legend: "Cuisine" },
      { id: "ph6", legend: "Vaisselle" },
    ],
  },
  {
    id: "p-chambre",
    nom: "Chambre",
    etat: "ok",
    commentaire: "Matelas houssé.",
    points: [{ id: "h1", libelle: "Lit et matelas", etat: "ok" }],
    photos: [{ id: "ph8", legend: "Lit" }],
  },
];

export const DOSSIERS_EDL: DossierEdl[] = [
  {
    id: "edl1",
    logement: "Suzette",
    type: "Entrée",
    occupant: "Sophie Martin",
    date: "2026-03-04",
    pieces: PIECES_SUZETTE_ENTREE,
  },
  {
    id: "edl1s",
    logement: "Suzette",
    type: "Sortie",
    occupant: "Sophie Martin",
    date: "2026-03-10",
    pieces: PIECES_SUZETTE_SORTIE,
  },
  {
    id: "edl2e",
    logement: "Villa Lavandrix",
    type: "Entrée",
    occupant: "Jean Dupont",
    date: "2026-03-04",
    pieces: PIECES_LAVANDRIX_ENTREE,
  },
  {
    id: "edl2",
    logement: "Villa Lavandrix",
    type: "Sortie",
    occupant: "Jean Dupont",
    date: "2026-03-07",
    pieces: PIECES_LAVANDRIX_SORTIE,
  },
  {
    id: "edl3",
    logement: "Appartement Colette",
    type: "Entrée",
    occupant: "Anna Schmidt",
    date: "2026-03-06",
    pieces: PIECES_COLETTE_ENTREE,
  },
];

export function piecesModele(suffix = Date.now().toString(36)): PieceEdl[] {
  return [
    {
      id: `p-salon-${suffix}`,
      nom: "Salon",
      etat: "ok",
      commentaire: "À renseigner lors de la visite.",
      points: [
        { id: `s1-${suffix}`, libelle: "Murs et plafond", etat: "ok" },
        { id: `s2-${suffix}`, libelle: "Sol", etat: "ok" },
        { id: `s3-${suffix}`, libelle: "Mobilier", etat: "ok" },
      ],
      photos: [],
    },
    {
      id: `p-cuisine-${suffix}`,
      nom: "Cuisine",
      etat: "ok",
      commentaire: "À renseigner lors de la visite.",
      points: [
        { id: `c1-${suffix}`, libelle: "Évier et robinetterie", etat: "ok" },
        { id: `c2-${suffix}`, libelle: "Électroménager", etat: "ok" },
        { id: `c3-${suffix}`, libelle: "Plan de travail", etat: "ok" },
      ],
      photos: [],
    },
    {
      id: `p-chambre-${suffix}`,
      nom: "Chambre",
      etat: "ok",
      commentaire: "À renseigner lors de la visite.",
      points: [
        { id: `h1-${suffix}`, libelle: "Lit et matelas", etat: "ok" },
        { id: `h2-${suffix}`, libelle: "Rangements", etat: "ok" },
        { id: `h3-${suffix}`, libelle: "Fenêtre", etat: "ok" },
      ],
      photos: [],
    },
  ];
}

export function pairesComparaison(dossiers: DossierEdl[] = DOSSIERS_EDL) {
  const logements = [...new Set(dossiers.map((d) => d.logement))];
  return logements
    .map((logement) => {
      const entree = dossiers.find((d) => d.logement === logement && d.type === "Entrée");
      const sortie = dossiers.find((d) => d.logement === logement && d.type === "Sortie");
      return entree && sortie ? { logement, entree, sortie } : null;
    })
    .filter((p): p is { logement: string; entree: DossierEdl; sortie: DossierEdl } => Boolean(p));
}
