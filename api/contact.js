import nodemailer from "nodemailer"

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    })
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const { name, email, project, message } = body || {}

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields"
      })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_TO,
      replyTo: email,
      subject: `Nuevo contacto desde AVLAV${project ? ` - ${project}` : ""}`,
      text: `
Nombre: ${name}
Email: ${email}
Proyecto: ${project || "No especificado"}

Mensaje:
${message}
      `.trim(),
      html: `
        <h2>Nuevo contacto desde AVLAV</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Proyecto:</strong> ${escapeHtml(project || "No especificado")}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      `
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("CONTACT API ERROR:", error)
    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    })
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}