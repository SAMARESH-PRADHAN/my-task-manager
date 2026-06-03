import axios from "axios";

const DIVINE_BASE_URL = process.env.DIVINE_BASE_URL;

const DIVINE_API_KEY = process.env.DIVINE_API_KEY;

const formatPhone = (phone) => {
  let p = phone.toString().replace(/\D/g, "");
  if (!p.startsWith("91")) p = "91" + p;
  return p;
};

export async function sendWhatsAppMessage(phone, userMessage) {
   // ✅ Add a guard so you catch config issues early
  if (!DIVINE_BASE_URL || !DIVINE_API_KEY) {
    throw new Error("Missing DIVINE_BASE_URL or DIVINE_API_KEY in environment");
  }
  try {
    // ✅ WhatsApp Template
    const finalMessage = `Hello 👋,
Hope you're doing well! 😊

${userMessage}

Thank you
*Cybercity*
9777787447`;

    const response = await axios.get(`${DIVINE_BASE_URL}/send`, {
      params: {
        api_key: DIVINE_API_KEY,
        phone: formatPhone(phone),
        text: finalMessage, // 👈 TEMPLATE MESSAGE
      },
    });

    if (!response.data?.status) {
      throw new Error(response.data?.error || "Divine send failed");
    }

    return response.data;
  } catch (error) {
    console.error("DIVINE SEND ERROR:", error.response?.data || error.message);
    throw error;
  }
}
