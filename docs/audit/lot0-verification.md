# Lot 0 — vérification visuelle (bloquante)

Date : 18 août 2026. Comparaison tokens vs hex MO1.

## Méthode

1. Mapping 1:1 hex → CSS custom properties (`--ink: #1e2939`, `--line: #e5e7eb`, etc.).
2. Mesure `getComputedStyle` après remplacement, viewports 375 et 1440.
3. Captures dashboard 1440 : `docs/audit/avant-dashboard-1440.png` / `after-dashboard-1440.png` (non versionnées, voir `capture-after.mjs`).

## Couleurs mesurées (doivent être identiques)

| Rôle | Hex maquette | Computed après | 375 | 1440 |
|---|---|---|---|---|
| Fond page | `#f9fafb` | `#f9fafb` | OK | OK |
| Navy / CTA | `#1e2939` | `#1e2939` | OK | OK |
| Texte muted | `#99a1af` | `#99a1af` | OK | OK |
| Bordure | `#e5e7eb` | `#e5e7eb` | OK | OK |
| Surface carte | `#ffffff` | `#ffffff` | OK | OK |

Aucune couleur n’a bougé. Les écarts de **données** (KPI « 2 en attente » vs « 3 ») viennent du store session déjà présent hors Lot 0, pas des tokens.

## Hors mapping volontaire

- Hex métier dans `reservations-mo1.ts` (couleurs de réservation).
- `src/components/ui/chart.tsx` (kit shadcn).
- `src/lib/error-page.ts` (page d’erreur hors chrome).
- Libellé `ID #12345` (pas une couleur).
- Bloc `.dark` : intact, non activé.

## Décision

Lot 0 validé en interne → passage au Lot 1.
