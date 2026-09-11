/**
 * En développement, Vite compile chaque route au premier accès, et cette
 * première compilation peut dépasser les délais d'attente des tests. L'échec
 * qui en résulte ne décrit aucune régression : la page finit par s'afficher,
 * simplement trop tard.
 *
 * On visite donc les routes du parcours avant que la suite ne commence, pour
 * que chaque test mesure le comportement de l'application et non le temps de
 * compilation du serveur de développement.
 */
const ROUTES = ["/", "/connexion", "/inscription", "/team", "/analyse", "/reservations"];

export default async function prechauffer() {
  const base = "http://127.0.0.1:8080";

  // Selon qu'un serveur tourne déjà ou que Playwright vient de le lancer, il
  // peut ne pas encore répondre. On lui laisse le temps de s'ouvrir, sans faire
  // échouer la suite s'il reste absent : les tests le signaleront eux-mêmes.
  for (let essai = 0; essai < 30; essai++) {
    try {
      await fetch(base + "/connexion", { redirect: "manual" });
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  for (const route of ROUTES) {
    await fetch(base + route, { redirect: "manual" }).catch(() => {});
  }
}
