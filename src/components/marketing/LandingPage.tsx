import { Link } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  Calculator,
  CreditCard,
  FolderClosed,
  LayoutDashboard,
  Play,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { FaqListe } from "@/components/marketing/FaqListe";
import {
  AU_DELA,
  formaterEuros,
  INCLUS_TOUTES_OFFRES,
  OFFRES,
  prixMoisRemise,
  type PeriodeOffre,
} from "@/design/offres";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function LandingPage() {
  return (
    <>
      <Hero />
      <Cycle />
      <Gestion />
      <Dossier />
      <Profils />
      <Equipe />
      <Comparaison />
      {AFFICHER_TEMOIGNAGES ? <Temoignages /> : <PointsForts />}
      <Tarifs />
      <Faq />
    </>
  );
}

function Sourcil({
  children,
  variante = "marque",
}: {
  children: string;
  variante?: "marque" | "clair";
}) {
  return (
    <p
      className={cn(
        "inline-flex rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.8px]",
        variante === "clair" ? "border-white/45 text-white" : "border-v1-brand text-v1-brand",
      )}
    >
      {children}
    </p>
  );
}

function Hero() {
  return (
    <section id="produit" className="relative overflow-hidden bg-v1-canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-6 size-[28rem] rounded-full bg-[radial-gradient(circle,#d9e4ff_0%,transparent_68%)] lg:size-[710px]"
      />
      <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-14 lg:grid-cols-[minmax(0,535px)_minmax(0,1fr)] lg:px-[72px] lg:py-20">
        <div>
          <Sourcil>Gestionnaire, enfin serein</Sourcil>
          <h1 className="mt-6 font-display text-4xl leading-[1.08] tracking-[-1.5px] text-v1-ink sm:text-5xl">
            Tous vos biens.
            <span className="mt-1 block text-v1-brand">Un seul tableau de bord.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-v1-ink-body">
            Location saisonnière, étudiante, courte durée ou classique : Hublify centralise vos
            calendriers, loyers, quittances, factures, documents, comptabilité et ménages. Chaque
            échéance suivie, chaque locataire informé, chaque bien maîtrisé.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/choix-du-profil"
              className="inline-flex h-12 items-center rounded-lg bg-v1-brand px-5 text-sm text-white"
            >
              Essayer gratuitement
            </Link>
            <a
              href="#fonctionnalites"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-v1-line-strong px-5 text-sm text-v1-ink"
            >
              Voir la démo
              <Play className="size-4" aria-hidden />
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-v1-ink-body">
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-v1-green" aria-hidden />
              Données hébergées en France
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CreditCard className="size-4" aria-hidden />
              Sans carte bancaire
            </li>
          </ul>
        </div>
        <ApercuProduit />
      </div>
      <div className="relative flex justify-center px-5 pb-12">
        <a
          href="#fonctionnalites"
          className="inline-flex h-12 items-center rounded-[14px] bg-v1-brand px-6 text-lg text-white"
        >
          Découvrir les fonctionnalités
        </a>
      </div>
    </section>
  );
}

function ApercuProduit() {
  const lignes = [
    ["Léna Martin", "T2 · Paris 11e", "1 190 €", "Payé"],
    ["Émile Roux", "Studio · Lyon 3e", "720 €", "Payé"],
    ["Sofia Benali", "T3 · Lille Centre", "890 €", "À relancer"],
  ] as const;
  const menu: ReadonlyArray<readonly [string, typeof LayoutDashboard, boolean]> = [
    ["Vue d'ensemble", LayoutDashboard, true],
    ["Biens", Building2, false],
    ["Locataires", Users, false],
    ["Loyers", Receipt, false],
    ["Documents", FolderClosed, false],
    ["Comptabilité", Calculator, false],
  ];

  return (
    <div className="overflow-hidden rounded-[20px] border border-v1-line-strong bg-white shadow-[0_24px_64px_rgba(23,49,38,0.14)]">
      <div className="grid min-h-[420px] md:grid-cols-[154px_minmax(0,1fr)]">
        <aside className="hidden flex-col gap-1.5 border-r border-v1-line bg-[#f7f9f7] p-3.5 md:flex">
          <p className="mb-2 flex items-center gap-2 px-1 text-[13px] text-v1-ink">
            <span className="size-6 rounded-md bg-v1-green" aria-hidden />
            Hublify
          </p>
          {menu.map(([label, Icone, actif]) => (
            <p
              key={label}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg px-2 text-[11px]",
                actif ? "bg-v1-green-soft text-v1-green-ink" : "text-v1-ink-body",
              )}
            >
              <Icone className="size-4" aria-hidden />
              {label}
            </p>
          ))}
          <div className="mt-2 rounded-lg bg-v1-green-deep p-2.5 text-white">
            <p className="text-[9px]">Besoin d'aide ?</p>
            <p className="mt-1 text-[8px] leading-snug text-[#b8c8c2]">
              Notre équipe répond en moins de 5 min.
            </p>
          </div>
        </aside>
        <div className="space-y-4 bg-[#fbfcfb] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base text-v1-ink">Bonjour Camille</p>
              <p className="text-[9px] text-v1-muted">Votre portefeuille au 3 octobre 2026</p>
            </div>
            <span className="inline-flex size-8 items-center justify-center rounded-lg border border-v1-line bg-white">
              <Bell className="size-3.5" aria-hidden />
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["Loyers encaissés", "6 480 €", "100 % à jour", true],
                ["À recevoir", "890 €", "1 échéance", false],
                ["Biens occupés", "8 / 8", "Aucune vacance", true],
              ] as const
            ).map(([label, valeur, statut, ok]) => (
              <article key={label} className="rounded-lg border border-v1-line bg-white p-3">
                <p className="text-[10px] text-v1-muted">{label}</p>
                <p className="mt-1 text-xl tracking-tight text-v1-ink">{valeur}</p>
                <p className={cn("text-[9px]", ok ? "text-v1-success" : "text-v1-warning")}>
                  {statut}
                </p>
              </article>
            ))}
          </div>
          <div className="rounded-lg border border-v1-line bg-white px-3">
            <p className="py-3 text-[11px] text-v1-ink">Suivi des loyers</p>
            <ul>
              {lignes.map(([nom, bien, montant, statut]) => (
                <li
                  key={nom}
                  className="flex items-center gap-3 border-t border-v1-line py-2.5 text-[10px]"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-v1-green-soft text-[9px] text-v1-green-ink">
                    {nom.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-v1-ink">{nom}</span>
                    <span className="block text-v1-muted">{bien}</span>
                  </span>
                  <span>{montant}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-1",
                      statut === "Payé"
                        ? "bg-v1-green-soft text-v1-success"
                        : "bg-v1-warning-soft text-v1-warning",
                    )}
                  >
                    {statut}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="rounded-lg bg-v1-green-soft px-3 py-2.5 text-[9px] text-v1-green-ink">
            3 quittances de septembre envoyées automatiquement.
            <span className="float-right text-v1-muted">Il y a 12 min</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Cycle() {
  const cartes = [
    [
      "Location saisonnière",
      "L'appartement accueille vos voyageurs aux périodes que vous choisissez.",
    ],
    [
      "Relancer la location",
      "À la fin du bail étudiant, reprenez la location saisonnière de manière fluide.",
    ],
    [
      "Préparer la transition",
      "À la fin de la période, recherchez un étudiant ou un bail mobilité.",
    ],
    ["Location étudiante", "L'appartement accueille un étudiant pour sa période de location."],
  ] as const;
  return (
    <section className="bg-white px-5 py-16 lg:px-[72px]">
      <div className="mx-auto max-w-[1440px] text-center">
        <Sourcil>Un cycle de vie</Sourcil>
        <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl tracking-tight text-v1-ink sm:text-4xl">
          Un appartement, un cycle qui se renouvelle.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-v1-ink-body">
          De la location sous bail à la location étudiante, une plateforme pour tout gérer
          simplement.
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 text-left sm:grid-cols-2">
          {cartes.map(([titre, texte]) => (
            <article key={titre} className="rounded-[20px] border border-v1-line bg-v1-canvas p-5">
              <h3 className="font-semibold text-v1-ink">{titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-v1-ink-body">{texte}</p>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-xs rounded-[20px] border border-v1-brand bg-white px-4 py-3 text-sm font-semibold text-v1-brand">
          Le même appartement
          <span className="mt-1 block font-normal text-v1-ink-body">
            Des locataires qui se succèdent.
          </span>
        </p>
        <div className="mx-auto mt-8 flex max-w-4xl items-start gap-4 rounded-2xl bg-v1-brand-soft p-5 text-left">
          <div>
            <p className="font-semibold text-v1-ink">Propriétaire, LMNP et professionnels</p>
            <p className="mt-1 text-sm leading-relaxed text-v1-ink-body">
              Représentez vos biens à tout moment, pas seulement l'été ou en haute saison. Hublify
              gère les deux modes au même endroit, avec un seul calendrier, une seule comptabilité
              et des documents toujours à jour.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Gestion() {
  const blocs = [
    [
      "Suivi des loyers",
      "Léna Martin, Émile Roux, Sofia Benali : payé, payé, à relancer. Booking.com dans le même calendrier.",
    ],
    [
      "CRM et channel manager",
      "Calendriers OTA, messageries, tarifs. Tous synchronisés au même endroit.",
    ],
    [
      "Classer et gérer vos documents",
      "Baux, états des lieux et diagnostics accessibles en quelques clics.",
    ],
    [
      "Suivi des encaissements",
      "Visualisez les paiements locataires et voyageurs, versés et régularisations.",
    ],
    [
      "Documents signés en ligne",
      "Recevez les documents des candidats. Analysez chaque dossier grâce à votre système d'étude. Suivez le parcours en ligne pour signer un bail.",
    ],
  ] as const;
  return (
    <section className="bg-v1-canvas px-5 py-16 lg:px-[72px]">
      <div className="mx-auto max-w-[1440px]">
        <Sourcil>Un seul espace pour un gestionnaire</Sourcil>
        <h2 className="mt-4 max-w-xl font-display text-3xl tracking-tight text-v1-ink">
          La gestion complète, en bon ordre
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-v1-ink-body">
          Chaque fonctionnalité s'imbrique dans un parcours fluide : organiser, encaisser,
          documenter, communiquer et piloter. Hublify permet de gérer toute la vie de vos biens
          intuitivement et permet la transition entre la location saisonnière et classique en
          quelques clics.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blocs.map(([titre, texte]) => (
            <article key={titre} className="rounded-[20px] border border-v1-line bg-white p-5">
              <h3 className="font-semibold text-v1-ink">{titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-v1-ink-body">{texte}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Dossier() {
  const etapes = [
    "Je m'inscris. Je charge mes documents",
    "Je postule aux annonces sur Hublify ou sur les autres plateformes",
    "Je signe mon bail en ligne",
    "Je consulte mes documents depuis mon espace",
  ];
  return (
    <section className="bg-white px-5 py-16 lg:px-[72px]">
      <div className="mx-auto max-w-[1440px]">
        <Sourcil>Locataire, enfin sécurisé</Sourcil>
        <h2 className="mt-4 max-w-3xl font-display text-3xl tracking-tight text-v1-ink">
          Votre dossier de location, chargé une seule fois, partagé en toute sécurité.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-v1-ink-body">
          Centralisez vos pièces dans un espace sécurisé, puis partagez un lien unique avec les
          agences et plateformes de votre choix. Chaque destinataire demande l'accès ; vous validez
          ou retirez la consultation à tout moment, sans renvoyer les mêmes documents.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <article className="rounded-[20px] border border-v1-line p-5">
            <h3 className="font-semibold text-v1-ink">Pièces envoyées une fois</h3>
            <p className="mt-2 text-sm text-v1-ink-body">
              Fini les pièces d'identité et documents personnels envoyés par e-mail sur des
              messageries inconnues. Vous maîtrisez les accès à vos documents enregistrés dans votre
              espace.
            </p>
          </article>
          <article className="rounded-[20px] border border-v1-line p-5">
            <h3 className="font-semibold text-v1-ink">Documents confidentiels</h3>
            <p className="mt-2 text-sm text-v1-ink-body">
              Vos documents sensibles restent protégés : seuls les destinataires que vous autorisez
              peuvent les consulter, et vous pouvez retirer cet accès à tout moment.
            </p>
          </article>
          <article className="rounded-[20px] border border-v1-line bg-v1-brand-soft p-5">
            <h3 className="font-semibold text-v1-ink">Annonces au même endroit</h3>
            <p className="mt-2 text-sm text-v1-ink-body">
              Suivez vos candidatures et les annonces qui vous intéressent au même endroit, sans
              disperser vos pièces entre plusieurs plateformes.
            </p>
          </article>
        </div>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {etapes.map((etape, index) => (
            <li
              key={etape}
              className="rounded-full border border-v1-line px-4 py-3 text-sm text-v1-ink"
            >
              <span className="mr-2 font-semibold text-v1-brand">0{index + 1}</span>
              {etape}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/choix-du-profil"
            className="inline-flex h-12 items-center rounded-lg bg-v1-brand px-5 text-sm text-white"
          >
            Je m'inscris gratuitement
          </Link>
          <p className="text-xs text-v1-ink-muted">Conforme RGPD · TLS 256 bits</p>
        </div>
      </div>
    </section>
  );
}

function Profils() {
  return (
    <section id="fonctionnalites" className="bg-v1-canvas-warm px-5 py-16 lg:px-[72px]">
      <div className="mx-auto max-w-[1440px]">
        <Sourcil>Un travail d'équipe</Sourcil>
        <h2 className="mt-4 max-w-xl font-display text-3xl tracking-tight text-[#111] sm:text-4xl">
          Un travail d'équipe
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[#111]">
          Hublify est un écosystème qui rassemble tout le monde au quotidien.
        </p>
        <p className="mt-6 max-w-xl rounded-2xl border border-v1-line bg-white px-4 py-3 text-sm text-v1-ink-body">
          CRM et channel manager. Calendriers OTA, messageries, tarifs : tous synchronisés au même
          endroit.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <CarteRoles
            titre="Occupants"
            roles={[
              ["Voyageurs", "bg-[#f2a65a]"],
              ["Locataires", "bg-[#7ccba4]"],
            ]}
          />
          <CarteRoles
            titre="Gestionnaire"
            roles={[
              ["Conciergerie", "bg-v1-green-deep text-white"],
              ["Agence immobilière", "bg-v1-green text-white"],
              ["Aide ponctuelle", "bg-v1-canvas text-v1-ink"],
            ]}
          />
          <CarteRoles
            titre="Prestataires"
            roles={[
              ["Équipe de ménage", "bg-v1-canvas"],
              ["Check-in / check-out", "bg-v1-canvas"],
              ["Plombier", "bg-v1-canvas"],
              ["Montage de meubles", "bg-v1-canvas"],
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function CarteRoles({
  titre,
  roles,
}: {
  titre: string;
  roles: readonly (readonly [string, string])[];
}) {
  return (
    <article className="rounded-[20px] border border-v1-line bg-white p-6 shadow-sm">
      <h3 className="text-lg text-v1-ink">{titre}</h3>
      <ul className="mt-4 space-y-2">
        {roles.map(([label, classe]) => (
          <li key={label} className={cn("rounded-[14px] px-3.5 py-2 text-xs", classe)}>
            {label}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Equipe() {
  return (
    <section className="bg-v1-green-deep px-5 py-16 text-white lg:px-[72px]">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <p className="text-sm text-white/80">
          Pensé pour les propriétaires, conciergeries et gestionnaires qui veulent un outil clair au
          quotidien.
        </p>
        <div>
          <Sourcil variante="clair">Gestion pour tous les profils</Sourcil>
          <h2 className="mt-4 font-display text-3xl tracking-tight">
            Hublify est créé par des particuliers devenus professionnels.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
            Notre expérience de location étudiante et conciergerie nous permet de proposer une
            solution à l'épreuve du quotidien pour vous faciliter votre gestion.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              Gestionnaire de biens immobiliers — spécialiste de la location étudiante et meublée
            </li>
            <li>Conciergerie location saisonnière — professionnels de la gestion saisonnière</li>
            <li>
              Propriétaire loueur, professionnel et LMNP — gestionnaire et propriétaire de bien mis
              en location
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

const COMPARAISON = [
  ["Taux d'occupation", "94 %", "35 %", "87 %"],
  ["Taux de vacance", "6 %", "65 %", "10 %"],
  ["Revenu locatif annuel", "7 560 €", "10 886,66 €", "15 305,30 €"],
  ["Rendement brut annuel", "3,98 %", "5,73 %", "8,06 %"],
] as const;

function Comparaison() {
  return (
    <section className="bg-v1-canvas px-5 py-16 lg:px-[72px]">
      <div className="mx-auto max-w-[1440px]">
        <Sourcil>Trois façons de louer</Sourcil>
        <h2 className="mt-4 font-display text-3xl tracking-tight text-v1-ink">
          Un potentiel à comparer.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-v1-ink-body">
          Et si vous adaptiez la location au rythme de votre bien ? Dans cet exemple, la location
          hybride alterne moyenne durée et saisonnière pour conjuguer occupation et revenus.
        </p>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-v1-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="px-4 py-3 text-left text-xs text-v1-ink-muted">
              Exemple illustratif 2026, parc locatif à Cannes (06). La colonne hybride est mise en
              avant pour comparer occupation et revenus.
            </caption>
            <thead>
              <tr className="border-b border-v1-line">
                <th className="px-4 py-3 font-medium">Les repères à regarder</th>
                <th className="px-4 py-3 font-medium">Location classique</th>
                <th className="px-4 py-3 font-medium">Location saisonnière</th>
                <th className="bg-v1-green px-4 py-3 font-medium text-white">Location hybride</th>
              </tr>
            </thead>
            <tbody>
              {COMPARAISON.map((ligne) => (
                <tr key={ligne[0]} className="border-b border-v1-line last:border-0">
                  {ligne.map((cellule, index) => (
                    <td
                      key={cellule}
                      className={cn(
                        "px-4 py-3",
                        index === 3 && "bg-v1-green-soft font-medium text-v1-green-ink",
                      )}
                    >
                      {cellule}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/** Masqué tant qu'aucun témoignage réel n'est disponible — pas de citations inventées en prod. */
const AFFICHER_TEMOIGNAGES = false;

const POINTS_FORTS = [
  {
    titre: "Suivi des loyers sans tableur",
    texte:
      "Échéances, relances et quittances restent rattachées au bon logement et au bon occupant.",
  },
  {
    titre: "Équipe et portail au même rythme",
    texte:
      "Gestionnaires, prestataires et locataires partagent le même fil d'événements, sans doublons.",
  },
  {
    titre: "Documents prêts pour le comptable",
    texte:
      "Exports et dossiers restent classés au bon nom, pour une clôture mensuelle plus courte.",
  },
] as const;

function PointsForts() {
  return (
    <section className="bg-white px-5 py-16 lg:px-[72px]">
      <div className="mx-auto max-w-[1440px]">
        <Sourcil>Ce que change Hublify</Sourcil>
        <h2 className="mt-4 font-display text-3xl tracking-tight text-v1-ink">
          Une gestion plus claire, sans promesse inventée
        </h2>
        <p className="mt-3 text-sm text-v1-ink-body">
          Des bénéfices concrets pour le quotidien — les retours clients nommés arriveront quand ils
          seront disponibles.
        </p>
        <ul className="mt-8 grid gap-4 lg:grid-cols-3">
          {POINTS_FORTS.map((p) => (
            <li key={p.titre} className="rounded-[20px] border border-v1-line bg-white p-5">
              <p className="text-sm font-semibold text-v1-ink">{p.titre}</p>
              <p className="mt-2 text-sm leading-relaxed text-v1-ink-body">{p.texte}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Temoignages() {
  return null;
}

function Tarifs() {
  const [periode, setPeriode] = useState<PeriodeOffre>("mensuel");
  const solo = OFFRES.find((o) => o.id === "solo");
  const standard = OFFRES.find((o) => o.id === "standard");
  const pro = OFFRES.find((o) => o.id === "professionnel");

  return (
    <section id="tarifs" className="bg-white px-5 py-16 lg:px-[72px]">
      <div className="mx-auto max-w-[1440px]">
        <Sourcil>Un tarif lisible</Sourcil>
        <h2 className="mt-4 font-display text-3xl tracking-tight text-v1-ink sm:text-4xl">
          Payez pour vos biens, pas pour des options
        </h2>
        <p className="mt-3 max-w-3xl text-base text-v1-ink-body">
          Découvrez les fonctionnalités incluses dans les forfaits. Votre tarif évolue simplement
          avec votre portefeuille.
        </p>
        <div
          className="mt-8 inline-flex rounded-full border border-v1-brand p-1"
          role="group"
          aria-label="Période de facturation"
        >
          {(["mensuel", "annuel"] as const).map((valeur) => (
            <button
              key={valeur}
              type="button"
              aria-pressed={periode === valeur}
              onClick={() => setPeriode(valeur)}
              className={cn(
                "rounded-full px-4 py-2 text-[11px]",
                periode === valeur ? "bg-v1-brand text-white" : "text-[#111]",
              )}
            >
              {valeur === "mensuel" ? "Mensuel" : "Annuel –20 %"}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="space-y-6 rounded-[28px] bg-v1-brand-soft p-6">
            <BlocOffre
              titre="Freemium"
              texte="Découverte de la plateforme en version limitée, pour une durée d'essai."
            />
            {solo ? (
              <BlocOffre
                titre={solo.titreLanding}
                points={solo.pointsLanding}
                prix={prixMoisRemise(solo.prixMoisCentimes, periode)}
              />
            ) : null}
            {standard ? (
              <BlocOffre
                titre={standard.titreLanding}
                points={standard.pointsLanding}
                prix={prixMoisRemise(standard.prixMoisCentimes, periode)}
              />
            ) : null}
          </div>
          <div className="rounded-[20px] bg-v1-brand-pill p-6">
            <p className="text-[17px] text-v1-ink">
              Tout ce qu'il vous faut pour gérer sereinement.
            </p>
            <ul className="mt-4 space-y-3">
              {INCLUS_TOUTES_OFFRES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-v1-ink-body">
                  <span className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-v1-brand-soft text-xs text-v1-brand">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6 rounded-[28px] bg-v1-pro p-6">
            {pro ? (
              <BlocOffre
                titre={pro.titreLanding}
                points={pro.pointsLanding}
                prix={prixMoisRemise(pro.prixMoisCentimes, periode)}
              />
            ) : null}
            <BlocOffre titre={AU_DELA.titreLanding} points={AU_DELA.pointsLanding} surDevis />
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            to="/choix-du-profil"
            className="inline-flex h-[53px] items-center rounded-[14px] bg-v1-brand px-10 text-lg font-bold text-white"
          >
            Commencer l'aventure
          </Link>
        </div>
      </div>
    </section>
  );
}

function BlocOffre({
  titre,
  texte,
  points,
  prix,
  surDevis = false,
}: {
  titre: string;
  texte?: string;
  points?: readonly string[];
  prix?: number | null;
  surDevis?: boolean;
}) {
  return (
    <div className="border-t border-black/10 pt-4 first:border-0 first:pt-0">
      <h3 className="text-xl font-medium uppercase tracking-[0.6px] text-v1-brand">{titre}</h3>
      {texte ? <p className="mt-2 text-[15px] leading-relaxed text-[#111]">{texte}</p> : null}
      {points ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-[#111]">
          {points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
      {prix != null ? (
        <p className="mt-3 font-display text-4xl tracking-tight text-v1-brand">
          {formaterEuros(prix)}
          <span className="ml-2 text-[11px] font-normal">/ mois</span>
        </p>
      ) : null}
      {surDevis ? (
        <p className="mt-3 font-display text-4xl text-v1-brand">
          Sur devis
          <Link to="/choix-du-profil" className="mt-1 block text-base font-normal text-v1-ink">
            Nous contacter
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function Faq() {
  return (
    <section id="ressources" className="bg-v1-canvas-warm px-5 py-16 lg:px-[72px] lg:py-24">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[minmax(0,472px)_minmax(0,1fr)] lg:gap-20">
        <div>
          <Sourcil>Questions fréquentes</Sourcil>
          <h2 className="mt-4 font-display text-3xl leading-tight tracking-tight text-v1-ink sm:text-4xl">
            Tout ce que vous voulez savoir avant de vous lancer
          </h2>
          <p className="mt-4 text-base leading-relaxed text-v1-ink-body">
            La réponse courte : Hublify est simple à essayer, simple à quitter et toujours
            disponible pour vous aider.
          </p>
          <div className="mt-7 rounded-[14px] border border-v1-line bg-white p-5">
            <p className="text-sm text-[#111]">Une autre question ?</p>
            <p className="mt-2 text-xs leading-relaxed text-[#111]">
              Échangez avec un spécialiste de la gestion locative, sans discours commercial.
            </p>
            <Link
              to="/faq"
              className="mt-4 inline-flex h-12 items-center rounded-[10px] bg-v1-brand px-5 text-sm text-white"
            >
              Nous écrire
            </Link>
          </div>
        </div>
        <FaqListe />
      </div>
    </section>
  );
}
