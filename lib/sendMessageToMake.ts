export async function sendMessageToMake({
  text,
  leadId,
  sender,
  id,
  timestamp,
  gpt_score,
  was_followup,
  visible_to_agent,
  approval_required,
}: {
  text: string;
  leadId: string;
  sender: string;
  id?: string;
  timestamp: string;
  gpt_score: number | null;
  was_followup: boolean;
  visible_to_agent: boolean;
  approval_required: boolean;
}) {
  const webhookUrl =
    process.env.ADVAIC_MAKE_MESSAGES_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_MAKE_MESSAGES_WEBHOOK_URL ||
    "";
  if (!webhookUrl) {
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "INSERT",
        table: "messages",
        record_text: text,
        record_sender: sender,
        record_lead_id: leadId,
        record_gpt_score: gpt_score,
        record_was_followup: was_followup,
        record_visible_to_agent: visible_to_agent,
        record_timestamp: timestamp,
        record_approval_required: approval_required,
        record_id: id ?? "",
      }),
    });

    if (!response.ok) {
      console.error("Make webhook error:", response.status);
    }
  } catch (error) {
    console.error("Error sending to Make:", error);
  }
}
