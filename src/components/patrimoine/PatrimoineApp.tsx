import { useDroit } from "@/auth/auth-context";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Copy,
  Download,
  Eye,
  Home,
  Pencil,
  Plus,
  SlidersHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { BtnNavy, BtnOutline } from "@/components/documents/ui";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { type LogementPatrimoine } from "@/data/documents-mo1";
import type { ImmeubleSession } from "@/data/etat-session";
import { chargerAccesLieux, sauverAccesLieu } from "@/data/session-remote";
import { ajouterBien, idNouveau, poserCollection, retirerBien, useSession } from "@/data/session";
import { copierTexte, confirmer, telechargerDemo, toastErreur, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type ConfigLieu = {
  codeCles: string;
  wifi: string;
  wifiMdp: string;
  alarme: string;
  consignes: string;
};
type FiltreStatut = "tous" | "loué" | "libre" | "en travaux";

/**
 * Un lieu sans configuration a des champs vides, jamais des codes inventés :
 * un faux code communiqué à un voyageur laisse tout le monde devant la porte.
 */
function configVide(): ConfigLieu {
  return { codeCles: "", wifi: "", wifiMdp: "", alarme: "", consignes: "" };
}

function initialesDe(nom: string) {
  return nom
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Etoiles({ note }: { note: number }) {
  const pleines = Math.round(note);
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-body">
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("size-2.5", i < pleines ? "fill-ink text-ink" : "text-line-strong")}
          />
        ))}
      </span>
      {note.toFixed(1)}
    </span>
  );
}

function BadgeStatut({ statut }: { statut: string }) {
  if (statut === "loué" || statut === "actif") {
    return <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs text-white">{statut}</span>;
  }
  if (statut === "libre") {
    return (
      <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink">
        {statut}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-xs text-ink-body">
      {statut}
    </span>
  );
}

export function PatrimoineApp({ logementCible }: { logementCible?: string }) {
  const navigate = useNavigate();
  const session = useSession();
  const peutMod = useDroit("mod-biens");
  const [selLog, setSelLog] = useState<string[]>([]);
  const [selImm, setSelImm] = useState<string[]>([]);
  const [onglet, setOnglet] = useState<"lieux" | "immeubles">("lieux");
  const [configId, setConfigId] = useState<string | null>(null);
  const immeubles = session.immeubles;
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [ajouterOuvert, setAjouterOuvert] = useState(false);
  const [ajouterImm, setAjouterImm] = useState(false);
  const [nomNouveau, setNomNouveau] = useState("");
  const [adresseNouvelle, setAdresseNouvelle] = useState("");
  const [typologie, setTypologie] = useState("Appartement");
  const [nomImm, setNomImm] = useState("");
  const [adresseImm, setAdresseImm] = useState("");
  const [configs, setConfigs] = useState<Record<string, ConfigLieu>>({});
  const [formConfig, setFormConfig] = useState<ConfigLieu>(configVide());

  // Le bien porte toute sa fiche : plus de fusion par nom avec un jeu de maquette.
  const logements = useMemo<LogementPatrimoine[]>(() => {
    const nomImmeuble = new Map(session.immeubles.map((i) => [i.id, i.nom]));
    return session.biens.map((b) => ({
      id: b.id,
      nom: b.nom,
      typologie: b.typologie || "Logement",
      surface: b.surface || "—",
      meuble: b.meuble ?? true,
      proprietaire: b.proprietaire || "—",
      initiales: b.initiales || initialesDe(b.nom) || "??",
      immeuble: (b.immeubleId ? nomImmeuble.get(b.immeubleId) : undefined) ?? "—",
      adresse: b.adresse || "—",
      note: b.note ?? 5,
      statut: b.statut ?? "libre",
    }));
  }, [session.biens, session.immeubles]);

  const visibles = logements.filter((l) => filtreStatut === "tous" || l.statut === filtreStatut);
  const logementConfig = logements.find((l) => l.id === configId) ?? null;

  // Les codes d'accès sont chiffrés en base : ils arrivent par le serveur, pas
  // par le rendu initial.
  useEffect(() => {
    let vivant = true;
    void chargerAccesLieux().then((res) => {
      if (!vivant || !res.ok) return;
      const parBien: Record<string, ConfigLieu> = {};
      for (const a of res.acces) {
        parBien[a.bienId] = {
          codeCles: a.codeCles,
          wifi: a.wifi,
          wifiMdp: a.wifiMdp,
          alarme: a.alarme,
          consignes: a.consignes,
        };
      }
      setConfigs(parBien);
    });
    return () => {
      vivant = false;
    };
  }, []);

  useEffect(() => {
    if (!logementCible) return;
    const match = logements.find(
      (l) =>
        l.id === logementCible ||
        session.biens.some(
          (b) => b.id === logementCible && b.nom.toLowerCase() === l.nom.toLowerCase(),
        ),
    );
    if (!match) return;
    setSelLog([match.id]);
    setOnglet("lieux");
    requestAnimationFrame(() => {
      const desktop = window.matchMedia("(min-width: 768px)").matches;
      const el = document.getElementById(
        desktop ? `lieu-table-${match.id}` : `lieu-mobile-${match.id}`,
      );
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [logementCible, logements, session.biens]);

  const ouvrirConfig = (id: string) => {
    setFormConfig(configs[id] ?? configVide());
    setConfigId(id);
  };

  const majImmeubles = (maj: (liste: ImmeubleSession[]) => ImmeubleSession[]) =>
    poserCollection("immeubles", maj);

  const ajouterLieu = () => {
    const nom = nomNouveau.trim();
    if (!nom) {
      toastErreur("Donnez un nom au lieu.");
      return;
    }
    if (logements.some((l) => l.nom.toLowerCase() === nom.toLowerCase())) {
      toastErreur("Un lieu porte déjà ce nom.");
      return;
    }
    const id = idNouveau("bien");
    const adresse = adresseNouvelle.trim();
    ajouterBien({
      id,
      nom,
      baseNuit: 100,
      typologie,
      statut: "libre",
      initiales: initialesDe(nom) || "??",
      ...(adresse ? { adresse } : {}),
    });
    setNomNouveau("");
    setAdresseNouvelle("");
    setAjouterOuvert(false);
    toastOk(`${nom} ajouté au parc.`);
  };

  const supprimerLogements = async (ids: string[]) => {
    if (!peutMod) return;
    // Le bien est référencé en base : la suppression emporte ce qui en dépend.
    const resas = session.reservationsDossier.filter((r) => ids.includes(r.bienId)).length;
    const missions = session.missions.filter((m) => ids.includes(m.bienId)).length;
    const ok = await confirmer({
      titre: ids.length > 1 ? "Retirer ces lieux du parc ?" : "Retirer ce lieu du parc ?",
      description:
        resas + missions > 0
          ? `Cette suppression emporte aussi ${resas} réservation(s) et ${missions} mission(s) rattachées. Elle est définitive.`
          : "Le lieu disparaît du parc et des listes de sélection.",
      libelleConfirmer: "Retirer",
      danger: true,
    });
    if (!ok) return;
    ids.forEach((id) => retirerBien(id));
    setSelLog([]);
    toastOk(ids.length > 1 ? `${ids.length} lieux retirés.` : "Lieu retiré.");
  };

  const supprimerImmeubles = async (ids: string[]) => {
    if (!peutMod || ids.length === 0) return;
    const ok = await confirmer({
      titre: ids.length > 1 ? "Retirer ces immeubles ?" : "Retirer cet immeuble ?",
      description: "Les logements rattachés restent dans le parc, sans immeuble de référence.",
      libelleConfirmer: "Retirer",
      danger: true,
    });
    if (!ok) return;
    majImmeubles((liste) => liste.filter((i) => !ids.includes(i.id)));
    setSelImm((s) => s.filter((id) => !ids.includes(id)));
    toastOk(ids.length > 1 ? `${ids.length} immeubles retirés.` : "Immeuble retiré.");
  };

  const exporterLogements = () => {
    const lignes = [
      "Nom;Typologie;Adresse;Statut;Proprietaire",
      ...visibles.map((l) => `${l.nom};${l.typologie};${l.adresse};${l.statut};${l.proprietaire}`),
    ];
    telechargerDemo("lieux-hublify.csv", lignes.join("\n"));
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="hidden text-2xl text-ink md:block">Lieux</h2>
        <p className="mx-auto mt-2 hidden max-w-lg text-sm text-ink-subtle md:block">
          Logements, immeubles, lieux d'événements
        </p>
        {peutMod && (
          <BtnNavy
            className="h-11 w-full max-w-sm px-5 text-sm md:mt-4 md:h-10 md:w-auto"
            onClick={() => setAjouterOuvert(true)}
          >
            <Plus className="size-3.5" /> Ajouter un lieu ou logement
          </BtnNavy>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setOnglet("lieux")}
          className={cn(
            "h-11 rounded-card px-4 text-sm font-medium md:h-9",
            onglet === "lieux" ? "bg-tab-active text-ink-deep" : "text-ink-subtle",
          )}
        >
          Lieux
        </button>
        <button
          type="button"
          onClick={() => setOnglet("immeubles")}
          className={cn(
            "h-11 rounded-card px-4 text-sm font-medium md:h-9",
            onglet === "immeubles" ? "bg-tab-active text-ink-deep" : "text-ink-subtle",
          )}
        >
          Immeubles
        </button>
      </div>

      {onglet === "lieux" && (
        <section className="mb-4 overflow-hidden rounded-card border border-line bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-5 py-4">
            <p className="flex items-center gap-2 text-sm text-ink">
              <Home className="size-4" />
              Logements
              <span className="rounded bg-surface-soft px-1.5 text-xs text-ink-subtle">
                {visibles.length}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <BtnOutline onClick={() => setFiltresOuverts((v) => !v)}>
                <SlidersHorizontal className="size-3" /> Filtres
              </BtnOutline>
              {peutMod && (
                <BtnOutline
                  disabled={selLog.length === 0}
                  onClick={() => supprimerLogements(selLog)}
                >
                  <Trash2 className="size-3" /> Supprimer
                </BtnOutline>
              )}
              <BtnOutline onClick={exporterLogements}>
                <Download className="size-3" /> Exporter
              </BtnOutline>
              {peutMod && (
                <BtnNavy onClick={() => setAjouterOuvert(true)}>
                  <Plus className="size-3" /> Ajouter
                </BtnNavy>
              )}
            </div>
          </header>
          {filtresOuverts && (
            <div className="border-b border-surface-soft px-5 py-3">
              <label className="text-xs text-ink-muted">
                Statut
                <select
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
                  className="ml-2 h-9 rounded-card border border-line bg-white px-2 text-sm text-ink"
                >
                  <option value="tous">Tous</option>
                  <option value="loué">Loué</option>
                  <option value="libre">Libre</option>
                  <option value="en travaux">En travaux</option>
                </select>
              </label>
            </div>
          )}
          <div className="divide-y divide-surface-soft md:hidden">
            {visibles.map((l) => (
              <article
                key={l.id}
                id={`lieu-mobile-${l.id}`}
                className={cn("px-4 py-4", selLog.includes(l.id) && "bg-surface")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{l.nom}</p>
                    <p className="text-xs text-ink-muted">
                      {l.typologie} · {l.surface}
                    </p>
                    <p className="mt-1 text-xs text-ink-subtle">{l.adresse}</p>
                  </div>
                  <BadgeStatut statut={l.statut} />
                </div>
                <label className="mt-2 flex min-h-11 items-center gap-2 text-xs text-ink-muted">
                  <input
                    type="checkbox"
                    checked={selLog.includes(l.id)}
                    onChange={() =>
                      setSelLog((s) =>
                        s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id],
                      )
                    }
                    aria-label={`Sélectionner ${l.nom}`}
                  />
                  Sélectionner
                </label>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => ouvrirConfig(l.id)}
                    className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                  >
                    Configurer
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void navigate({
                        to: "/documents",
                        search: { vue: "logements", logement: l.nom },
                      })
                    }
                    className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                  >
                    Voir docs
                  </button>
                </div>
              </article>
            ))}
          </div>
          <ScrollHint className="hidden md:block">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-surface-soft text-ink-subtle">
                <tr>
                  <th className="w-12 px-4 py-3" />
                  <th className="px-2 py-3 font-medium">Logement</th>
                  <th className="px-2 py-3 font-medium">Propriétaire</th>
                  <th className="px-2 py-3 font-medium">Immeuble</th>
                  <th className="px-2 py-3 font-medium">Adresse</th>
                  <th className="px-2 py-3 font-medium">Notation</th>
                  <th className="px-2 py-3 font-medium">Statut</th>
                  <th className="px-2 py-3 font-medium">Documents</th>
                  <th className="px-2 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((l) => (
                  <tr
                    key={l.id}
                    id={`lieu-table-${l.id}`}
                    data-lieu={l.id}
                    className={cn(
                      "border-b border-surface-soft last:border-b-0",
                      selLog.includes(l.id) && "bg-surface",
                    )}
                  >
                    <td className="px-4 py-4">
                      <label className="flex min-h-11 items-center md:min-h-0">
                        <input
                          type="checkbox"
                          checked={selLog.includes(l.id)}
                          onChange={() =>
                            setSelLog((s) =>
                              s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id],
                            )
                          }
                          aria-label={`Sélectionner ${l.nom}`}
                        />
                      </label>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 flex size-7 items-center justify-center rounded-[8px] bg-surface-soft">
                          <Home className="size-3 text-ink-body" />
                        </span>
                        <div>
                          <p className="text-sm text-ink">{l.nom}</p>
                          <p className="text-[11px] text-ink-muted">
                            {l.typologie} · {l.surface}
                          </p>
                          <span className="mt-0.5 inline-block rounded border border-line px-1.5 text-[10px] text-ink-subtle">
                            {l.meuble ? "Meublé" : "Non meublé"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-line text-[10px] text-ink-body">
                          {l.initiales}
                        </span>
                        {l.proprietaire}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-ink-body">{l.immeuble}</td>
                    <td className="px-2 py-4 text-ink-body">{l.adresse}</td>
                    <td className="px-2 py-4">
                      <Etoiles note={l.note} />
                    </td>
                    <td className="px-2 py-4">
                      <BadgeStatut statut={l.statut} />
                    </td>
                    <td className="px-2 py-4">
                      <BtnOutline
                        className="h-[30px]"
                        onClick={() =>
                          void navigate({
                            to: "/documents",
                            search: { vue: "logements", logement: l.nom },
                          })
                        }
                      >
                        <Eye className="size-2.5" /> Voir docs
                      </BtnOutline>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex justify-end gap-1 text-ink-body">
                        <button
                          type="button"
                          aria-label={`Configurer ${l.nom}`}
                          onClick={() => ouvrirConfig(l.id)}
                          className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Copier l'adresse de ${l.nom}`}
                          onClick={() => copierTexte(l.adresse, "Adresse copiée.")}
                          className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        {peutMod && (
                          <button
                            type="button"
                            aria-label={`Supprimer ${l.nom}`}
                            onClick={() => supprimerLogements([l.id])}
                            className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollHint>
          {visibles.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-ink-muted">
              {filtreStatut === "tous"
                ? "Aucun lieu dans le parc. Utilisez « Ajouter » pour en créer un."
                : `Aucun lieu au statut « ${filtreStatut} ».`}
            </p>
          )}
          <p className="px-5 py-3 text-xs text-ink-muted">{visibles.length} logements</p>
        </section>
      )}

      {onglet === "immeubles" && (
        <section className="overflow-hidden rounded-card border border-line bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-5 py-4">
            <p className="flex items-center gap-2 text-sm text-ink">
              <Building2 className="size-4" />
              Immeubles
              <span className="rounded bg-surface-soft px-1.5 text-xs text-ink-subtle">
                {immeubles.length}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {peutMod && (
                <BtnOutline
                  disabled={selImm.length === 0}
                  onClick={() => void supprimerImmeubles(selImm)}
                >
                  <Trash2 className="size-3" /> Supprimer
                </BtnOutline>
              )}
              <BtnOutline
                onClick={() => {
                  const lignes = [
                    "Nom;Adresse;Logements;Proprietaire;Statut",
                    ...immeubles.map(
                      (i) => `${i.nom};${i.adresse};${i.logements};${i.proprietaire};${i.statut}`,
                    ),
                  ];
                  telechargerDemo("immeubles-hublify.csv", lignes.join("\n"));
                }}
              >
                <Download className="size-3" /> Exporter
              </BtnOutline>
              {peutMod && (
                <BtnNavy onClick={() => setAjouterImm(true)}>
                  <Plus className="size-3" /> Ajouter
                </BtnNavy>
              )}
            </div>
          </header>
          <div className="divide-y divide-surface-soft md:hidden">
            {immeubles.map((i) => (
              <article key={i.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{i.nom}</p>
                    <p className="text-xs text-ink-muted">
                      {i.logements} logements · {i.proprietaire}
                    </p>
                    <p className="mt-1 text-xs text-ink-subtle">{i.adresse}</p>
                  </div>
                  <BadgeStatut statut={i.statut} />
                </div>
                <label className="mt-2 flex min-h-11 items-center gap-2 text-xs text-ink-muted">
                  <input
                    type="checkbox"
                    checked={selImm.includes(i.id)}
                    onChange={() =>
                      setSelImm((s) =>
                        s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id],
                      )
                    }
                    aria-label={`Sélectionner ${i.nom}`}
                  />
                  Sélectionner
                </label>
                <div className={cn("mt-3 grid gap-2", peutMod ? "grid-cols-2" : "grid-cols-1")}>
                  <button
                    type="button"
                    onClick={() => copierTexte(i.adresse, "Adresse copiée.")}
                    className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                  >
                    Copier l'adresse
                  </button>
                  {peutMod && (
                    <button
                      type="button"
                      onClick={() => void supprimerImmeubles([i.id])}
                      className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <ScrollHint className="hidden md:block">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-surface-soft text-ink-subtle">
                <tr>
                  <th className="w-12 px-4 py-3" />
                  <th className="px-2 py-3 font-medium">Immeuble</th>
                  <th className="px-2 py-3 font-medium">Propriétaire</th>
                  <th className="px-2 py-3 font-medium">Logements</th>
                  <th className="px-2 py-3 font-medium">Adresse</th>
                  <th className="px-2 py-3 font-medium">Statut</th>
                  <th className="px-2 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {immeubles.map((i) => (
                  <tr key={i.id} className="border-b border-surface-soft last:border-b-0">
                    <td className="px-4 py-4">
                      <label className="flex min-h-11 items-center md:min-h-0">
                        <input
                          type="checkbox"
                          checked={selImm.includes(i.id)}
                          onChange={() =>
                            setSelImm((s) =>
                              s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id],
                            )
                          }
                          aria-label={`Sélectionner ${i.nom}`}
                        />
                      </label>
                    </td>
                    <td className="px-2 py-4">
                      <span className="inline-flex items-center gap-2 text-sm text-ink">
                        <span className="flex size-7 items-center justify-center rounded-[8px] bg-surface-soft">
                          <Building2 className="size-3 text-ink-body" />
                        </span>
                        {i.nom}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-line text-[10px]">
                          {i.initiales}
                        </span>
                        {i.proprietaire}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <span className="inline-flex items-center gap-1 text-ink-body">
                        <Home className="size-3" /> {i.logements} logements
                      </span>
                    </td>
                    <td className="px-2 py-4 text-ink-body">{i.adresse}</td>
                    <td className="px-2 py-4">
                      <BadgeStatut statut={i.statut} />
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex justify-end gap-1 text-ink-body">
                        <button
                          type="button"
                          aria-label={`Copier l'adresse de ${i.nom}`}
                          onClick={() => copierTexte(i.adresse, "Adresse copiée.")}
                          className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        {peutMod && (
                          <button
                            type="button"
                            aria-label={`Supprimer ${i.nom}`}
                            onClick={() => void supprimerImmeubles([i.id])}
                            className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollHint>
          {immeubles.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-ink-muted">
              Aucun immeuble. Utilisez « Ajouter » pour en créer un.
            </p>
          )}
          <p className="px-5 py-3 text-xs text-ink-muted">{immeubles.length} immeubles</p>
        </section>
      )}

      <Dialog open={Boolean(logementConfig)} onOpenChange={(o) => !o && setConfigId(null)}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
          <DialogTitle>Configuration — {logementConfig?.nom}</DialogTitle>
          <DialogDescription>Codes d'accès, Wi-Fi et consignes du lieu.</DialogDescription>
          {logementConfig && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-ink-muted">
                Adresse
                <span className="mt-1 block text-sm text-ink">{logementConfig.adresse}</span>
              </p>
              <p className="text-xs text-ink-muted">
                Propriétaire
                <span className="mt-1 block text-sm text-ink">{logementConfig.proprietaire}</span>
              </p>
              <label className="block text-xs text-ink-muted">
                Code boîte à clés
                <input
                  value={formConfig.codeCles}
                  onChange={(e) => setFormConfig((c) => ({ ...c, codeCles: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
                />
              </label>
              <label className="block text-xs text-ink-muted">
                Wi-Fi
                <input
                  value={formConfig.wifi}
                  onChange={(e) => setFormConfig((c) => ({ ...c, wifi: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
                />
              </label>
              <label className="block text-xs text-ink-muted">
                Mot de passe Wi-Fi
                <input
                  value={formConfig.wifiMdp}
                  onChange={(e) => setFormConfig((c) => ({ ...c, wifiMdp: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
                />
              </label>
              <label className="block text-xs text-ink-muted">
                Code alarme
                <input
                  value={formConfig.alarme}
                  onChange={(e) => setFormConfig((c) => ({ ...c, alarme: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
                />
              </label>
              <label className="block text-xs text-ink-muted">
                Consignes d'accès
                <textarea
                  value={formConfig.consignes}
                  onChange={(e) => setFormConfig((c) => ({ ...c, consignes: e.target.value }))}
                  className="mt-1 h-24 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
                />
              </label>
              <BtnNavy
                className="w-full justify-center"
                onClick={() => {
                  const id = logementConfig.id;
                  void sauverAccesLieu({ data: { bienId: id, ...formConfig } }).then((res) => {
                    if (!res.ok) {
                      toastErreur(
                        res.raison === "non_configure"
                          ? "Codes non enregistrés : le chiffrement n'est pas configuré sur ce serveur."
                          : "Codes non enregistrés : la base est injoignable.",
                      );
                      return;
                    }
                    setConfigs((c) => ({ ...c, [id]: formConfig }));
                    toastOk("Configuration enregistrée.");
                    setConfigId(null);
                  });
                }}
              >
                Enregistrer
              </BtnNavy>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={ajouterOuvert} onOpenChange={(o) => !o && setAjouterOuvert(false)}>
        <DialogContent className="max-w-md">
          <DialogTitle>Ajouter un lieu</DialogTitle>
          <DialogDescription>Le logement apparaît ici et dans le planning.</DialogDescription>
          <label className="mt-3 block text-xs text-ink-muted">
            Nom
            <input
              value={nomNouveau}
              onChange={(e) => setNomNouveau(e.target.value)}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            Adresse
            <input
              value={adresseNouvelle}
              onChange={(e) => setAdresseNouvelle(e.target.value)}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            Typologie
            <select
              value={typologie}
              onChange={(e) => setTypologie(e.target.value)}
              className="mt-1 h-9 w-full rounded-card border border-line bg-white px-3 text-sm text-ink"
            >
              <option>Appartement</option>
              <option>Villa</option>
              <option>Studio</option>
              <option>Maison</option>
            </select>
          </label>
          <BtnNavy className="mt-4 w-full justify-center" onClick={ajouterLieu}>
            Enregistrer
          </BtnNavy>
        </DialogContent>
      </Dialog>

      <Dialog open={ajouterImm} onOpenChange={(o) => !o && setAjouterImm(false)}>
        <DialogContent className="max-w-md">
          <DialogTitle>Ajouter un immeuble</DialogTitle>
          <DialogDescription>Regroupe plusieurs logements à la même adresse.</DialogDescription>
          <label className="mt-3 block text-xs text-ink-muted">
            Nom
            <input
              value={nomImm}
              onChange={(e) => setNomImm(e.target.value)}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            Adresse
            <input
              value={adresseImm}
              onChange={(e) => setAdresseImm(e.target.value)}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <BtnNavy
            className="mt-4 w-full justify-center"
            onClick={() => {
              const nom = nomImm.trim();
              if (!nom) {
                toastErreur("Donnez un nom à l'immeuble.");
                return;
              }
              majImmeubles((liste) => [
                {
                  id: idNouveau("imm"),
                  nom,
                  proprietaire: "Vous",
                  initiales: initialesDe(nom) || "??",
                  logements: 0,
                  adresse: adresseImm.trim() || "—",
                  statut: "actif" as const,
                },
                ...liste,
              ]);
              setNomImm("");
              setAdresseImm("");
              setAjouterImm(false);
              toastOk("Immeuble ajouté.");
            }}
          >
            Enregistrer
          </BtnNavy>
        </DialogContent>
      </Dialog>
    </div>
  );
}
