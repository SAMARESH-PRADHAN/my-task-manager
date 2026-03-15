import { sql } from "../../config/db.js";
import { sendWhatsAppMessage } from "../../services/whatsapp.service.js";

export async function notifyTaskCompleted(taskId) {
  try {
    const result = await sql`
      SELECT 
        t.id,
        t.application_id,
        t.application_password,
        t.service_type,
        t.form_service_type,
        c.name AS customer_name,
        c.phone AS customer_phone,
        u.name AS employee_name,
        t.board_name
      FROM tasks t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.employee_id = u.id
      LEFT JOIN boards b ON t.service_type = b.id::text
      WHERE t.id = ${taskId}
    `;

    if (!result.length) return;

    const task = result[0];

    if (!task.customer_phone) return;

    const message = `
Dear ${task.customer_name},
Greetings and welocome to the Cyber City!

We are happy to inform you that your ${task.board_name || "N/A"}
application registration is submited successfully.

Application Details:
Application ID: ${task.application_id}
Password: ${task.application_password}

Submited By: ${task.employee_name || "Team"}

`;

    await sendWhatsAppMessage(task.customer_phone, message);

    console.log("✅ Completion message sent to", task.customer_phone);
  } catch (err) {
    console.error("TASK COMPLETION NOTIFICATION ERROR:", err);
  }
}
