import { useState } from "react";
import type { DocMo1 } from "@/data/documents-mo1";
import {
  idNouveau,
  poserCollection,
  retirerContactCopro,
  upsertContactCopro,
  useSession,
} from "@/data/session";
import type { ContactCopro } from "@/data/v1-metier";
import { confirmer, telechargerPdf, toastErreur, toastOk } from "@/lib/feedback";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const champ =
  "mt-1 h-10 w-full rounded-card border border-line px-3 text-sm text-ink outline-none";

export function VueSyndic({
  docs,
  onRetour,
  onImporter,
}: {
  docs: DocMo1[];
  onRetour: () => void;
  onImporter: () => void;
}) {
  const session = useSession();
  const [form, setForm] = useState<ContactCopro | null>(null);
  const [relanceId, setRelanceId] = useState<string | null>(null);
  const [noteRelance, setNoteRelance] = useState("");

  const enregistrerContact = () => {
    if (!form) return;
    if (!form.nom.trim() || !form.copropriete.trim()) {
      toastErreur("Indiquez le nom et la copropriété.");
      return;
    }
    upsertContactCopro({
      ...form,
      id: form.id || idNouveau("copro"),
    });
    toastOk("Contact copropriété enregistré.");
    setForm(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink">Syndic / copropriété</p>
          <p className="text-xs text-ink-muted">Documents et contacts, sans ERP syndic.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onImporter}
            className="h-9 rounded-card border border-line px-3 text-xs text-ink-body"
          >
            Importer un document
          </button>
          <button
            type="button"
            onClick={() =>
              setForm({
                id: "",
                nom: "",
                copropriete: "",
                email: "",
                telephone: "",
                relance: "",
              })
            }
            className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
          >
            Ajouter un contact
          </button>
          <button type="button" onClick={onRetour} className="h-9 text-xs text-ink-body">
            Retour
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-card border border-line bg-white">
        <header className="border-b border-surface-soft px-5 py-3 text-sm text-ink">Documents</header>
        {docs.length === 0 ? (
          <p className="px-5 py-4 text-sm text-ink-muted">Aucun document syndic pour le moment.</p>
        ) : (
          <ul>
            {docs.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-soft px-5 py-3 last:border-b-0"
              >
                <span>
                  <span className="block text-sm text-ink">{d.titre}</span>
                  <span className="text-xs text-ink-muted">
                    {d.logement} · {d.date}
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-accent-teal"
                    onClick={() =>
                      void telechargerPdf(d.titre, [d.titre, d.logement, d.date], {
                        extra: [d.titre, d.logement],
                      })
                    }
                  >
                    Télécharger
                  </button>
                  <button
                    type="button"
                    className="text-xs text-ink-muted"
                    onClick={() => {
                      poserCollection("documents", (liste) =>
                        liste.map((x) =>
                          x.id === d.id ? { ...x, filtre: "Archivé" } : x,
                        ),
                      );
                      toastOk("Document archivé.");
                    }}
                  >
                    Archiver
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-white">
        <header className="border-b border-surface-soft px-5 py-3 text-sm text-ink">Contacts copropriété</header>
        {session.contactsCopro.length === 0 ? (
          <p className="px-5 py-4 text-sm text-ink-muted">Aucun contact. Ajoutez le syndic.</p>
        ) : (
          <ul>
            {session.contactsCopro.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-soft px-5 py-3 last:border-b-0"
              >
                <div>
                  <p className="text-sm text-ink">{c.nom}</p>
                  <p className="text-xs text-ink-muted">{c.copropriete}</p>
                  <p className="text-xs text-ink-subtle">
                    {c.email} · {c.telephone}
                  </p>
                  {c.relance && <p className="mt-1 text-xs text-ink-body">{c.relance}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(c)}
                    className="h-8 rounded-card border border-line px-2 text-[11px] text-ink-body"
                  >
                    Voir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRelanceId(c.id);
                      setNoteRelance("");
                    }}
                    className="h-8 rounded-card border border-line px-2 text-[11px] text-ink-body"
                  >
                    Relancer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        const ok = await confirmer({
                          titre: "Retirer ce contact ?",
                          description: c.nom,
                          libelleConfirmer: "Retirer",
                          danger: true,
                        });
                        if (!ok) return;
                        retirerContactCopro(c.id);
                        toastOk("Contact retiré.");
                      })();
                    }}
                    className="h-8 rounded-card border border-line px-2 text-[11px] text-ink-body"
                  >
                    Archiver
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(form)} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>{form?.id ? "Contact copropriété" : "Nouveau contact"}</DialogTitle>
          <DialogDescription>Nom, copropriété et coordonnées pour relancer le syndic.</DialogDescription>
          {form && (
            <div className="mt-3 space-y-2">
              <label className="block text-xs text-ink-muted">
                Nom
                <input
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className={champ}
                />
              </label>
              <label className="block text-xs text-ink-muted">
                Copropriété
                <input
                  value={form.copropriete}
                  onChange={(e) => setForm({ ...form, copropriete: e.target.value })}
                  className={champ}
                />
              </label>
              <label className="block text-xs text-ink-muted">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={champ}
                />
              </label>
              <label className="block text-xs text-ink-muted">
                Téléphone
                <input
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className={champ}
                />
              </label>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setForm(null)}
              className="h-9 rounded-card border border-line px-3 text-xs"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={enregistrerContact}
              className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
            >
              Enregistrer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(relanceId)} onOpenChange={(o) => !o && setRelanceId(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Relancer le syndic</DialogTitle>
          <DialogDescription>La note est enregistrée sur la fiche contact.</DialogDescription>
          <textarea
            value={noteRelance}
            onChange={(e) => setNoteRelance(e.target.value)}
            rows={3}
            placeholder="Objet de la relance"
            className="mt-3 w-full rounded-card border border-line px-3 py-2 text-sm outline-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRelanceId(null)}
              className="h-9 rounded-card border border-line px-3 text-xs"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                const cible = session.contactsCopro.find((c) => c.id === relanceId);
                if (!cible) return;
                if (!noteRelance.trim()) {
                  toastErreur("Indiquez le motif de la relance.");
                  return;
                }
                upsertContactCopro({
                  ...cible,
                  relance: `${new Date().toLocaleDateString("fr-FR")} · ${noteRelance.trim()}`,
                });
                toastOk("Relance enregistrée.");
                setRelanceId(null);
              }}
              className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
            >
              Confirmer
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
