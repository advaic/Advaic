export const uiActionCopy = {
  starterActivate: "Starter aktivieren",
  safeStartActivate: "Safe-Start aktivieren",
  safeStartActivating: "Safe-Start wird aktiviert…",
  approvalsReview: "Freigaben prüfen",
  approvalReview: "Freigabe prüfen",
  messagesReview: "Nachrichten prüfen",
  conversationOpen: "Konversation öffnen",
  conversationsOpen: "Konversationen öffnen",
  replyWrite: "Antwort schreiben",
  autosendActivate: "Auto-Senden aktivieren",
  autosendActivating: "Auto-Senden wird aktiviert…",
  sendApprove: "Freigeben & senden",
  resend: "Erneut senden",
  saveAndSend: "Änderungen speichern & senden",
  discardChanges: "Änderungen verwerfen",
  editProposal: "Vorschlag bearbeiten",
  bulkApprove: "Auswahl freigeben",
  actions: "Aktionen",
} as const;

export type UiActionCopyKey = keyof typeof uiActionCopy;
