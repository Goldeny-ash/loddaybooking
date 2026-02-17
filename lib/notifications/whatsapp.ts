const BASE_URL = "https://whatsapp.smsleopard.com/v1";

const API_KEY = process.env.SMSLEOPARD_API_KEY!;
const API_SECRET = process.env.SMSLEOPARD_API_SECRET!;

const authHeader =
  "Basic " + Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

export async function sendWhatsAppTemplate({
  destination,
  templateId,
  phoneNumberId,
  variables,
}: {
  destination: string;
  templateId: string;
  phoneNumberId: string;
  variables: string[];
}) {
  const response = await fetch(`${BASE_URL}/whatsapp/send`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destination,
      template_id: templateId,
      phone_number_id: phoneNumberId,
      component_list: {
        components: [
          {
            component_type: "BODY",
            fields: variables.map((value, index) => ({
              name: String(index + 1),
              value,
            })),
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("WhatsApp error:", error);
    throw new Error("Failed to send WhatsApp message");
  }

  return response.json();
}
