import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const BASE_URL = process.env.NEXTAUTH_URL || "https://bmverif.vercel.app";

const footer = `
  <hr style="border:none;border-top:1px solid #eee;margin:28px 0"/>
  <p style="color:#bbb;font-size:12px;margin:0">BMVERIF · Business Manager Verificados</p>
`;

// ── Reset password ────────────────────────────────────────────────────────────
export async function sendResetEmail({ to, resetUrl }) {
  await transporter.sendMail({
    from: `"BMVERIF Soporte" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "Recuperá tu contraseña · BMVERIF",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#D92B2B;margin-bottom:8px;">Recuperar contraseña</h2>
        <p style="color:#444;font-size:15px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p style="color:#444;font-size:15px;">Hacé clic en el botón de abajo para crear una nueva contraseña:</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#D92B2B;color:#fff;padding:13px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:15px;margin:20px 0;">
          Restablecer contraseña
        </a>
        <p style="color:#888;font-size:13px;margin-top:20px;">
          El enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, podés ignorar este email.
        </p>
        ${footer}
      </div>
    `,
  });
}

// ── Welcome email on register ─────────────────────────────────────────────────
export async function sendWelcomeEmail({ to, name }) {
  await transporter.sendMail({
    from: `"BMVERIF" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "¡Bienvenido/a a BMVERIF! 🎉",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#D92B2B;margin-bottom:8px;">¡Hola, ${name}! 👋</h2>
        <p style="color:#444;font-size:15px;">
          Tu cuenta en <strong>BMVERIF</strong> fue creada exitosamente.
          Ya podés acceder a nuestra tienda de Business Managers verificados.
        </p>
        <a href="${BASE_URL}"
           style="display:inline-block;background:#D92B2B;color:#fff;padding:13px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:15px;margin:20px 0;">
          Ir a la tienda →
        </a>
        <p style="color:#888;font-size:13px;margin-top:20px;">
          Si tenés alguna consulta, podés contactarnos por el chat de soporte dentro de la plataforma.
        </p>
        ${footer}
      </div>
    `,
  });
}

// ── Delivery ready email ──────────────────────────────────────────────────────
export async function sendDeliveryEmail({ to, orderId, productSummary }) {
  const accountUrl = `${BASE_URL}/?section=account`;
  await transporter.sendMail({
    from: `"BMVERIF" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "📦 Tu pedido está listo para descargar · BMVERIF",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#D92B2B;margin-bottom:8px;">📦 ¡Tu pedido está listo!</h2>
        <p style="color:#444;font-size:15px;">
          Tu pedido <strong>#${orderId.slice(-8)}</strong> ya está disponible para descargar.
        </p>
        <p style="color:#666;font-size:14px;margin-bottom:20px;">
          <strong>Producto(s):</strong> ${productSummary}
        </p>
        <a href="${accountUrl}"
           style="display:inline-block;background:#D92B2B;color:#fff;padding:13px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:20px;">
          ⬇️ Descargar pedido en Mi cuenta
        </a>
        <p style="color:#888;font-size:13px;">
          Ingresá a <strong>Mi cuenta → Mis órdenes</strong> y hacé clic en "Descargar pedido" junto a la orden correspondiente.
        </p>
        ${footer}
      </div>
    `,
  });
}
