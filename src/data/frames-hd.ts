export type FamilleFrame =
  | "accueil"
  | "journee"
  | "documents"
  | "calendrier"
  | "taches"
  | "profil"
  | "logement"
  | "compteurs"
  | "edl"
  | "recherche"
  | "acces"
  | "messages"
  | "fil"
  | "candidature"
  | "modale"
  | "recap"
  | "faq"
  | "intro"
  | "onboarding";

export type FrameHd = { id: string; noeud: string; famille: FamilleFrame; titre: string };

export const FRAMES_HD: FrameHd[] = [
  { id: "108-1031", noeud: "108:1031", famille: "documents", titre: "Vos documents" },
  { id: "108-1213", noeud: "108:1213", famille: "logement", titre: "Mon logement" },
  { id: "108-899", noeud: "108:899", famille: "recherche", titre: "Rechercher une activité" },
  { id: "110-1956", noeud: "110:1956", famille: "calendrier", titre: "Calendrier" },
  { id: "126-1297", noeud: "126:1297", famille: "acces", titre: "Fiche d'accès" },
  { id: "127-1433", noeud: "127:1433", famille: "faq", titre: "J'ai un problème" },
  { id: "142-1229", noeud: "142:1229", famille: "faq", titre: "J'ai un problème" },
  { id: "292-12501", noeud: "292:12501", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "318-21360", noeud: "318:21360", famille: "compteurs", titre: "Relevés de compteurs" },
  { id: "329-26096", noeud: "329:26096", famille: "faq", titre: "J'ai un problème" },
  { id: "329-26405", noeud: "329:26405", famille: "calendrier", titre: "Calendrier" },
  { id: "330-26619", noeud: "330:26619", famille: "taches", titre: "Tâches en cours" },
  { id: "358-1248", noeud: "358:1248", famille: "calendrier", titre: "Calendrier" },
  { id: "360-1574", noeud: "360:1574", famille: "recherche", titre: "Rechercher une activité" },
  { id: "360-1820", noeud: "360:1820", famille: "acces", titre: "Fiche d'accès" },
  { id: "360-2025", noeud: "360:2025", famille: "profil", titre: "Mon profil" },
  { id: "360-2139", noeud: "360:2139", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "362-2251", noeud: "362:2251", famille: "faq", titre: "J'ai un problème" },
  { id: "362-2373", noeud: "362:2373", famille: "profil", titre: "Mon profil" },
  { id: "362-2475", noeud: "362:2475", famille: "faq", titre: "J'ai un problème" },
  { id: "362-2605", noeud: "362:2605", famille: "logement", titre: "Mon logement" },
  { id: "362-2716", noeud: "362:2716", famille: "recherche", titre: "Rechercher une activité" },
  { id: "362-2799", noeud: "362:2799", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "362-3064", noeud: "362:3064", famille: "edl", titre: "Vérifier les lieux" },
  { id: "362-3123", noeud: "362:3123", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "363-3679", noeud: "363:3679", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "363-3680", noeud: "363:3680", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "364-3859", noeud: "364:3859", famille: "edl", titre: "Vérifier les lieux" },
  { id: "364-4104", noeud: "364:4104", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "364-4271", noeud: "364:4271", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "364-4381", noeud: "364:4381", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "364-4525", noeud: "364:4525", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "364-4651", noeud: "364:4651", famille: "acces", titre: "Fiche d'accès" },
  { id: "367-1736", noeud: "367:1736", famille: "candidature", titre: "Choisir un destinataire" },
  { id: "367-1879", noeud: "367:1879", famille: "messages", titre: "Messagerie" },
  { id: "367-2593", noeud: "367:2593", famille: "messages", titre: "Messagerie" },
  { id: "367-2886", noeud: "367:2886", famille: "fil", titre: "Conversation" },
  { id: "367-3128", noeud: "367:3128", famille: "modale", titre: "Ajouter" },
  { id: "367-3438", noeud: "367:3438", famille: "modale", titre: "Ajouter" },
  { id: "367-3750", noeud: "367:3750", famille: "intro", titre: "Dossier en deux étapes" },
  { id: "374-1647", noeud: "374:1647", famille: "logement", titre: "Mon logement" },
  { id: "374-1725", noeud: "374:1725", famille: "journee", titre: "Ma journée" },
  { id: "374-1766", noeud: "374:1766", famille: "documents", titre: "Vos documents" },
  { id: "374-1802", noeud: "374:1802", famille: "calendrier", titre: "Calendrier" },
  { id: "374-1907", noeud: "374:1907", famille: "taches", titre: "Toutes les tâches" },
  { id: "374-1972", noeud: "374:1972", famille: "recap", titre: "Récapitulatif du séjour" },
  { id: "374-2028", noeud: "374:2028", famille: "profil", titre: "Mon profil" },
  { id: "374-2060", noeud: "374:2060", famille: "documents", titre: "Vos documents" },
  { id: "374-2095", noeud: "374:2095", famille: "documents", titre: "Vos documents" },
  { id: "374-2130", noeud: "374:2130", famille: "acces", titre: "Fiche d'accès" },
  { id: "374-2197", noeud: "374:2197", famille: "recap", titre: "Récapitulatif du séjour" },
  { id: "374-2236", noeud: "374:2236", famille: "recherche", titre: "Rechercher une activité" },
  { id: "374-2271", noeud: "374:2271", famille: "onboarding", titre: "Let's Start" },
  { id: "374-2297", noeud: "374:2297", famille: "accueil", titre: "Bonjour" },
  { id: "374-2374", noeud: "374:2374", famille: "profil", titre: "Mon profil" },
  { id: "374-2458", noeud: "374:2458", famille: "taches", titre: "Tâches en cours" },
  { id: "374-2473", noeud: "374:2473", famille: "taches", titre: "Tâches en cours" },
  { id: "374-2516", noeud: "374:2516", famille: "logement", titre: "Mon logement" },
  { id: "374-2596", noeud: "374:2596", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "374-2657", noeud: "374:2657", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "374-2727", noeud: "374:2727", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "374-2800", noeud: "374:2800", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "374-2824", noeud: "374:2824", famille: "documents", titre: "Vos documents" },
  { id: "374-2856", noeud: "374:2856", famille: "taches", titre: "Tâches en cours" },
  { id: "374-2933", noeud: "374:2933", famille: "calendrier", titre: "Calendrier" },
  { id: "374-2997", noeud: "374:2997", famille: "recap", titre: "Récapitulatif du séjour" },
  { id: "374-3059", noeud: "374:3059", famille: "calendrier", titre: "Calendrier" },
  { id: "374-3127", noeud: "374:3127", famille: "recherche", titre: "Rechercher une activité" },
  { id: "374-3227", noeud: "374:3227", famille: "acces", titre: "Fiche d'accès" },
  { id: "374-3272", noeud: "374:3272", famille: "acces", titre: "Fiche d'accès" },
  { id: "374-3352", noeud: "374:3352", famille: "recherche", titre: "Rechercher une activité" },
  { id: "374-3415", noeud: "374:3415", famille: "recherche", titre: "Rechercher une activité" },
  { id: "374-3484", noeud: "374:3484", famille: "edl", titre: "Vérifier les lieux" },
  { id: "374-3566", noeud: "374:3566", famille: "edl", titre: "Vérifier les lieux" },
  { id: "374-3648", noeud: "374:3648", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "374-3791", noeud: "374:3791", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "374-3933", noeud: "374:3933", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "374-4042", noeud: "374:4042", famille: "edl", titre: "Pièce de l'état des lieux" },
  { id: "374-4151", noeud: "374:4151", famille: "candidature", titre: "Choisir un destinataire" },
  { id: "374-4260", noeud: "374:4260", famille: "messages", titre: "Messagerie" },
  { id: "374-4423", noeud: "374:4423", famille: "messages", titre: "Messagerie" },
  { id: "374-4550", noeud: "374:4550", famille: "fil", titre: "Conversation" },
  { id: "374-4779", noeud: "374:4779", famille: "modale", titre: "Ajouter" },
  { id: "374-5059", noeud: "374:5059", famille: "modale", titre: "Ajouter" },
  { id: "376-3086", noeud: "376:3086", famille: "recap", titre: "Récapitulatif du séjour" },
  { id: "93-1002", noeud: "93:1002", famille: "taches", titre: "Tâches en cours" },
  { id: "93-1225", noeud: "93:1225", famille: "documents", titre: "Vos documents" },
  { id: "93-768", noeud: "93:768", famille: "onboarding", titre: "Let's Start" },
  { id: "93-799", noeud: "93:799", famille: "faq", titre: "J'ai un problème" },
  { id: "95-1483", noeud: "95:1483", famille: "profil", titre: "Mon profil" },
  { id: "95-1654", noeud: "95:1654", famille: "taches", titre: "Tâches en cours" },
  { id: "99-697", noeud: "99:697", famille: "taches", titre: "Missions" },
];

export function frameParId(id: string) {
  return FRAMES_HD.find((f) => f.id === id);
}
