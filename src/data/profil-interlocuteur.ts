import type { Conversation, DocumentLie, MessageFil } from "@/data/messagerie-mo1";
import { BIENS_MO1 } from "@/data/reservations-mo1";

export type ProfilInterlocuteur = {
  id: string;
  nom: string;
  initiales: string;
  badge: string;
  type: Conversation["type"];
  bienNom?: string;
  adresse?: string;
  email?: string;
  telephone?: string;
  assigne?: string;
  extrait: string;
  periode?: string;
  loyer?: string;
  documents: DocumentLie[];
  evenements: string[];
  peutProposerBail: boolean;
};

function ligneFiche(messages: MessageFil[], prefixe: string) {
  for (const message of messages) {
    const ligne = message.fiche?.find((l) => l.startsWith(prefixe));
    if (ligne) return ligne.slice(prefixe.length).trim();
  }
  return undefined;
}

export function profilDepuisConversation(
  conversation: Conversation,
  messages: MessageFil[],
  documents: DocumentLie[],
  annuaire?: { email?: string; telephone?: string },
): ProfilInterlocuteur {
  const bien = conversation.bienNom
    ? BIENS_MO1.find((b) => b.nom === conversation.bienNom)
    : undefined;
  const fil = messages.filter((m) => m.conversationId === conversation.id);
  const periode = ligneFiche(fil, "Période souhaitée :");
  const loyer = ligneFiche(fil, "Loyer mensuel :");
  return {
    id: conversation.id,
    nom: conversation.nom,
    initiales: conversation.initiales,
    badge: conversation.badge,
    type: conversation.type,
    ...(conversation.bienNom ? { bienNom: conversation.bienNom } : {}),
    ...(bien ? { adresse: bien.adresse } : {}),
    ...(annuaire?.email ? { email: annuaire.email } : {}),
    ...(annuaire?.telephone ? { telephone: annuaire.telephone } : {}),
    ...(conversation.assigne ? { assigne: conversation.assigne } : {}),
    extrait: conversation.extrait,
    ...(periode ? { periode } : {}),
    ...(loyer ? { loyer } : {}),
    documents,
    evenements: fil.filter((m) => m.kind === "systeme").map((m) => m.texte),
    peutProposerBail: conversation.type === "voyageur" || conversation.type === "locataire",
  };
}
