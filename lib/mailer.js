import nodemailer from "nodemailer";

const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpPort === 465, // true for port 465 (TLS), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const BASE_URL = process.env.NEXTAUTH_URL || "https://bmverif.vercel.app";

const footer = `
  <hr style="border:none;border-top:1px solid #eee;margin:28px 0"/>
  <p style="color:#bbb;font-size:12px;margin:0">BM Verificada · Business Manager Verificados</p>
`;

// ── Email verification (sent on register) ────────────────────────────────────
export async function sendVerificationEmail({ to, name, verifyUrl }) {
  await transporter.sendMail({
    from: `"BM Verificada" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "Verificá tu cuenta · BM Verificada",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#D92B2B;margin-bottom:8px;">¡Hola, ${name}! 👋</h2>
        <p style="color:#444;font-size:15px;">
          Gracias por registrarte en <strong>BM Verificada</strong>.
          Para activar tu cuenta hacé clic en el botón de abajo:
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#D92B2B;color:#fff;padding:13px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:15px;margin:20px 0;">
          ✅ Verificar mi cuenta
        </a>
        <p style="color:#888;font-size:13px;margin-top:4px;">
          El enlace expira en <strong>24 horas</strong>. Si no creaste esta cuenta, ignorá este email.
        </p>
        <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:10px 14px;margin-top:16px;font-size:12px;color:#92400E;">
          📁 Si no ves este email en tu bandeja principal, revisá la carpeta de <strong>spam / no deseados</strong>.
        </div>
        ${footer}
      </div>
    `,
  });
}

// ── Reset password ────────────────────────────────────────────────────────────
export async function sendResetEmail({ to, resetUrl }) {
  await transporter.sendMail({
    from: `"BM Verificada Soporte" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "Recuperá tu contraseña · BM Verificada",
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

// ── Payment confirmed email ───────────────────────────────────────────────────
export async function sendPaymentConfirmedEmail({ to, orderId, amount, network, txHash }) {
  const accountUrl = `${BASE_URL}/?section=account`;
  await transporter.sendMail({
    from: `"BM Verificada" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "💚 Pago confirmado · BM Verificada",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#16a34a;margin-bottom:8px;">💚 ¡Pago recibido!</h2>
        <p style="color:#444;font-size:15px;">
          Tu pago fue confirmado en la blockchain. Tu orden está siendo procesada.
        </p>
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0 0 6px;font-size:13px;color:#666;">Orden</p>
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111;">#${orderId.slice(-8)}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#666;">Monto</p>
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#16a34a;">${amount} USDT · ${network}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#666;">TX Hash</p>
          <p style="margin:0;font-size:12px;color:#444;word-break:break-all;font-family:monospace;">${txHash}</p>
        </div>
        <a href="${accountUrl}"
           style="display:inline-block;background:#16a34a;color:#fff;padding:13px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:20px;">
          Ver mi orden
        </a>
        <p style="color:#888;font-size:13px;">
          El acceso al producto se entregará una vez que el admin confirme y cargue el contenido.
        </p>
        ${footer}
      </div>
    `,
  });
}

// ── Referral reward notification ─────────────────────────────────────────────
export async function sendReferralRewardEmail({ to, name, creditEarned, referredEmail }) {
  const shopUrl = `${BASE_URL}/`;
  const firstName = (name || "").split(" ")[0] || "Usuario";
  const maskedEmail = referredEmail.replace(/(.{2}).*(@.*)/, "$1***$2");

  await transporter.sendMail({
    from: `"BM Verificada" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "🎉 ¡Ganaste saldo por tu referido! · BM Verificada",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#D92B2B;margin-bottom:8px;">🎉 ¡Ganaste saldo, ${firstName}!</h2>
        <p style="color:#444;font-size:15px;">
          Tu referido <strong>${maskedEmail}</strong> realizó su primera compra en BM Verificada.
          ¡Ya tenés saldo acumulado para usar en tu próxima compra!
        </p>

        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center;">
          <div style="font-size:13px;color:#666;margin-bottom:6px;">Saldo acreditado</div>
          <div style="font-size:36px;font-weight:800;color:#16a34a;">+$${creditEarned.toFixed(2)} USDT</div>
          <div style="font-size:12px;color:#888;margin-top:4px;">5% del monto de la compra de tu referido</div>
        </div>

        <p style="color:#444;font-size:14px;">
          Tu saldo se acumula y podés usarlo como descuento en cualquier compra.
          Entrá a <strong>Mi cuenta → Referidos</strong> para ver tu saldo total y aplicarlo al pagar.
        </p>

        <a href="${shopUrl}"
           style="display:inline-block;background:#D92B2B;color:#fff;padding:13px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:15px;margin:16px 0 24px;">
          🛒 Ir a la tienda
        </a>

        <p style="color:#888;font-size:13px;">
          Seguí compartiendo tu link de referidos para ganar más saldo. ¡No tiene límite!
        </p>
        ${footer}
      </div>
    `,
  });
}

// ── Abandoned cart reminder ───────────────────────────────────────────────────
export async function sendAbandonedCartEmail({ to, name, items, total }) {
  const shopUrl = `${BASE_URL}/`;
  const firstName = (name || "").split(" ")[0] || "Cliente";

  const itemsHtml = Array.isArray(items)
    ? items
        .map(
          (i) => `
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid #f0f0f0;color:#333;font-size:14px;">${i.name}</td>
          <td style="padding:9px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#666;font-size:14px;">×${i.qty}</td>
          <td style="padding:9px 0;border-bottom:1px solid #f0f0f0;text-align:right;color:#333;font-weight:600;font-size:14px;">$${(i.price * i.qty).toFixed(2)}</td>
        </tr>`
        )
        .join("")
    : "";

  await transporter.sendMail({
    from: `"BM Verificada" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "🛒 Olvidaste algo en tu carrito · BM Verificada",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#D92B2B;margin-bottom:8px;">🛒 ¡Olvidaste algo, ${firstName}!</h2>
        <p style="color:#444;font-size:15px;margin-bottom:4px;">
          Dejaste productos en tu carrito. ¡Completá tu compra antes de que se agoten!
        </p>
        <p style="color:#888;font-size:13px;margin-top:0;">
          Aceptamos USDT (TRC20 / BEP20). Entrega inmediata tras confirmar el pago.
        </p>

        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr>
              <th style="text-align:left;padding-bottom:8px;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #eee;">Producto</th>
              <th style="text-align:center;padding-bottom:8px;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #eee;">Cant.</th>
              <th style="text-align:right;padding-bottom:8px;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #eee;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding-top:14px;font-weight:700;color:#111;font-size:15px;">Total</td>
              <td style="padding-top:14px;font-weight:700;color:#D92B2B;text-align:right;font-size:20px;">$${Number(total).toFixed(2)} USDT</td>
            </tr>
          </tfoot>
        </table>

        <a href="${shopUrl}"
           style="display:inline-block;background:#D92B2B;color:#fff;padding:14px 32px;border-radius:9px;text-decoration:none;font-weight:700;font-size:16px;margin:16px 0 24px;">
          ✅ Completar mi compra
        </a>

        <div style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:8px;padding:10px 14px;font-size:12px;color:#92400E;">
          ⚡ Stock limitado · Los precios pueden cambiar en cualquier momento.
        </div>
        ${footer}
      </div>
    `,
  });
}

// ── Delivery ready email ──────────────────────────────────────────────────────
export async function sendDeliveryEmail({ to, orderId, productSummary }) {
  const accountUrl = `${BASE_URL}/?section=account`;
  await transporter.sendMail({
    from: `"BM Verificada" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "📦 Tu pedido está listo para descargar · BM Verificada",
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
