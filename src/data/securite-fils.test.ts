import { describe, expect, it } from "vitest";
import {
  ecrireCollections,
  insererEntite,
  modifierEntite,
  type DepsEtat,
} from "@/data/etat-distant";
import { DROITS_PAR_ROLE, type DroitId, type RoleId } from "@/auth/permissions";
import type { Sql } from "@/lib/sql";

const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";

const CONVERSATIONS = [
  { id: "c-jean", nom: "Jean Martin", assigne: "", type: "locataire" },
  { id: "c-sophie", nom: "Sophie Martin", assigne: "", type: "voyageur" },
];

function sqlMessagerie() {
  const appels: { texte: string; valeurs: unknown[] }[] = [];
  const query = (texte: string, valeurs: unknown[] = []) => {
    appels.push({ texte, valeurs });
    const repondre = () => {
      if (texte.includes("from public.conversations")) {
        const ids = Array.isArray(valeurs[1]) ? valeurs[1].map(String) : [String(valeurs[1] ?? "")];
        return CONVERSATIONS.filter((conv) => ids.includes(conv.id));
      }
      if (texte.includes("from public.messages_fil")) {
        const ids = Array.isArray(valeurs[1]) ? valeurs[1].map(String) : [String(valeurs[1] ?? "")];
        return ids.includes("m-existant") ? [{ id: "m-existant", conversationId: "c-sophie" }] : [];
      }
      return [];
    };
    return Promise.resolve(repondre());
  };
  const tag = Object.assign(async () => [], { query }) as Sql;
  return { tag, appels };
}

function deps(
  roleId: RoleId,
  email: string,
  prenom: string,
  nom: string,
  droits: readonly DroitId[] = roleId === "gestionnaire"
    ? DROITS_PAR_ROLE.gestionnaire
    : ["messagerie"],
) {
  const espion = sqlMessagerie();
  const d: DepsEtat = {
    sessionOrg: async () => ({
      orgId: ORG_A,
      orgType: "gestionnaire",
      roleId,
      droits: [...droits],
      email,
      prenom,
      nom,
    }),
    sql: () => espion.tag,
  };
  return { d, espion };
}

describe("synchronisation partielle des messages", () => {
  it("n'efface ni les fils absents ni les messages d'un autre compte", async () => {
    const { d, espion } = deps("voyageur", "sophie.martin@hublify.app", "Sophie", "Martin");
    const res = await ecrireCollections(d, {
      messagesFil: [
        {
          id: "m-sophie",
          conversationId: "c-sophie",
          kind: "envoye",
          texte: "Bonjour",
        },
        {
          id: "m-vol",
          conversationId: "c-jean",
          kind: "envoye",
          texte: "Je prends le fil de Jean",
        },
      ],
    });
    expect(res).toEqual({ ok: false, raison: "interdit" });
    expect(espion.appels).toEqual([]);
  });

  it("conserve le remplacement complet pour un gestionnaire", async () => {
    const { d, espion } = deps("gestionnaire", "amelie.dubois@hublify.app", "Amélie", "Dubois");
    expect(
      await ecrireCollections(d, {
        messagesFil: [{ id: "m-garde", conversationId: "c-jean", kind: "envoye", texte: "ok" }],
      }),
    ).toEqual({ ok: true });
    const suppression = espion.appels.find((appel) =>
      appel.texte.includes("delete from public.messages_fil"),
    );
    expect(suppression?.valeurs[0]).toBe(ORG_A);
    expect(suppression?.valeurs[1]).toEqual(["m-garde"]);
    expect(suppression?.texte).not.toContain("conversation_id = any");
  });
});

describe("affectation d'une conversation", () => {
  it("force l'e-mail de session sur une conversation nouvelle et refuse un fil existant", async () => {
    const nouveau = deps("locataire", "sophie.martin@hublify.app", "Sophie", "Martin");
    expect(
      await insererEntite(nouveau.d, "conversations", {
        id: "c-new",
        nom: "Contact",
        assigne: "jean.martin@hublify.app",
        type: "voyageur",
        section: "prospections",
        initiales: "C",
        badge: "Prospect",
        extrait: "lien",
        ilYa: "now",
        nonLu: true,
        archivee: false,
      } as { id: string }),
    ).toEqual({ ok: true });
    const insertions = nouveau.espion.appels.filter((appel) =>
      appel.texte.includes("insert into public.conversations"),
    );
    expect(insertions.some((appel) => appel.valeurs.includes("sophie.martin@hublify.app"))).toBe(
      true,
    );
    expect(insertions.some((appel) => appel.valeurs.includes("jean.martin@hublify.app"))).toBe(
      false,
    );

    const vol = deps("locataire", "sophie.martin@hublify.app", "Sophie", "Martin");
    expect(
      await insererEntite(vol.d, "conversations", {
        id: "c-jean",
        nom: "Jean Martin",
        assigne: "sophie.martin@hublify.app",
        type: "locataire",
        section: "inbox",
        initiales: "JM",
        badge: "Locataire",
        extrait: "vol",
        ilYa: "now",
        nonLu: false,
        archivee: false,
      } as { id: string }),
    ).toEqual({ ok: false, raison: "interdit" });
    expect(
      vol.espion.appels.some((appel) => appel.texte.includes("insert into public.conversations")),
    ).toBe(false);
  });

  it("refuse d'insérer un message ou de modifier l'affectation d'un fil qui n'appartient pas à la session", async () => {
    const lecture = deps("locataire", "sophie.martin@hublify.app", "Sophie", "Martin");
    expect(
      await insererEntite(lecture.d, "messagesFil", {
        id: "m-intrus",
        conversationId: "c-jean",
        kind: "envoye",
        texte: "intrus",
      } as { id: string }),
    ).toEqual({ ok: false, raison: "interdit" });
    expect(
      lecture.espion.appels.some((appel) =>
        appel.texte.includes("insert into public.messages_fil"),
      ),
    ).toBe(false);

    const propre = deps("voyageur", "sophie.martin@hublify.app", "Sophie", "Martin");
    expect(
      await insererEntite(propre.d, "messagesFil", {
        id: "m-ok",
        conversationId: "c-sophie",
        kind: "envoye",
        texte: "bonjour",
      } as { id: string }),
    ).toEqual({ ok: true });

    const vol = deps("locataire", "sophie.martin@hublify.app", "Sophie", "Martin");
    expect(
      await modifierEntite(vol.d, "conversations", "c-jean", {
        assigne: "sophie.martin@hublify.app",
      }),
    ).toEqual({ ok: false, raison: "introuvable" });
    expect(vol.espion.appels.some((appel) => appel.texte.startsWith("update "))).toBe(false);
  });

  it("refuse à un gestionnaire aux droits partiels d'effacer les autres fils", async () => {
    const { d, espion } = deps("gestionnaire", "invite@exemple.test", "Yann", "Invite", [
      "messagerie",
    ]);
    expect(await ecrireCollections(d, { messagesFil: [] })).toEqual({
      ok: false,
      raison: "interdit",
    });
    expect(espion.appels).toHaveLength(0);
  });

  it("refuse au lecteur toute écriture de fil", async () => {
    const { d, espion } = deps("lecteur", "claire.lecture@hublify.app", "Claire", "Lecture");
    expect(await ecrireCollections(d, { messagesFil: [] })).toEqual({
      ok: false,
      raison: "interdit",
    });
    expect(espion.appels).toHaveLength(0);
  });
});
