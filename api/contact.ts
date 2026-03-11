import nodemailer from "nodemailer"

type ContactBody = {
  name?: string
  email?: string
  project?: string
  message?: string
}

const ALLOWED_ORIGIN = "https://avlav-6xag.vercel.app/"

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" })
  }

  try {
    const { name, email, project, message }: ContactBody = req.body ?? {}

    if (!name || !email || !project || !message) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields"
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid email"
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
      subject: `Nuevo contacto desde AVLAV - ${project}`,
      text: `
Nombre: ${name}
Email: ${email}
Proyecto: ${project}

Mensaje:
${message}
      `.trim(),
      html: `
        <h2>Nuevo contacto desde AVLAV</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Proyecto:</strong> ${escapeHtml(project)}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      `
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("Contact API error:", error)
    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    })
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}