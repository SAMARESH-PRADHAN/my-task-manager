import axios from "axios";

const DIVINE_BASE_URL = "http://16.170.238.132";
const DIVINE_API_KEY = process.env.DIVINE_API_KEY;

const formatPhone = (phone) => {
  let p = phone.toString().replace(/\D/g, "");
  if (!p.startsWith("91")) p = "91" + p;
  return p;
};

export async function sendWhatsAppMessage(phone, userMessage) {
  try {
    // ✅ WhatsApp Template
    const finalMessage = `Hello 👋,
Hope you're doing well! 😊

${userMessage}

Thank you
— Cybercity`;

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
