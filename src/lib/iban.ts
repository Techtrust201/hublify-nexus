/** Validation IBAN (mod 97) — partagée client / serveur. */
export function ibanValide(valeur: string): boolean {
  const compact = valeur.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(compact)) return false;
  const tourne = compact.slice(4) + compact.slice(0, 4);
  const chiffres = tourne
    .split("")
    .map((c) => (c >= "A" && c <= "Z" ? String(c.charCodeAt(0) - 55) : c))
    .join("");
  let reste = 0;
  for (const c of chiffres) {
    reste = (reste * 10 + Number(c)) % 97;
  }
  return reste === 1;
}
