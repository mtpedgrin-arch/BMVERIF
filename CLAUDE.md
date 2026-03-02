# CLAUDE.md — BM Verificada · Guía completa del proyecto

> Este archivo se carga automáticamente al inicio de cada sesión.
> Contiene todo lo que Claude necesita saber para trabajar sin perder contexto.

---

## 🏪 QUÉ ES EL PROYECTO

**BM Verificada** (`bmverificada.store`) es una tienda e-commerce que vende **Business Managers Verificados de Meta/Facebook** con API de WhatsApp habilitada.
- Stack: **Next.js 15 App Router** + **Prisma** + **PostgreSQL (Neon)** + **Vercel**
- Repo GitHub: `mtpedgrin-arch/BMVERIF`
- Archivo principal del frontend: `components/MarketplaceClient.jsx` (~415 KB, componente único gigante)

---

## ⚡ LO QUE CLAUDE PUEDE HACER SOLO (sin pedirle nada al usuario)

- ✅ Editar cualquier archivo del proyecto
- ✅ Crear nuevos archivos (componentes, API routes, libs)
- ✅ Hacer `git add`, `git commit`, `git push` → Vercel despliega automático
- ✅ Leer logs, analizar errores, hacer diagnósticos
- ✅ Escribir scripts de consola para que el usuario los corra en el browser

## 🙋 LO QUE REQUIERE ACCIÓN DEL USUARIO

| Acción | Dónde |
|--------|-------|
| Agregar/cambiar env vars | Vercel Dashboard → Settings → Environment Variables |
| Correr migraciones de DB | Browser logueado como admin → `POST /api/admin/run-migration` o consola JS |
| Correr scripts de carga masiva | Consola del browser (F12) logueado como admin |
| Revocar/crear API keys (OpenAI, etc.) | Plataforma correspondiente |
| Configurar webhook Cryptomus | Dashboard de Cryptomus |
| Configurar cron job | cron-job.org o similar → `GET /api/cron/abandoned-cart?secret=bmverif_cron_2026` |

---

## 🏗️ TODO LO CONSTRUIDO (bullet points completos)

### 🛍️ Tienda & Productos
- Catálogo de productos con precios, tiers de descuento por volumen, stock, badge de descuento
- Carrito con cantidad, subtotal, descuento por cupón, crédito de referido
- Checkout con pago en USDT (TRC20 / BEP20) via Cryptomus
- Monto único con centavos aleatorios por orden (para identificar pagos en blockchain)
- Órdenes con expiración de 1 hora
- Página "Mis Órdenes" con estado y contenido de entrega
- Favoritos por usuario
- Reseñas de productos (rating 1-5 + comentario)

### 💳 Pagos & Cryptomus
- Integración completa con Cryptomus (creación de pago + webhook)
- Webhook verifica firma MD5 antes de procesar
- Al confirmar pago: actualiza orden a "paid", manda email, notifica Telegram, dispara Meta CAPI Purchase
- Solo dispara en status `paid` o `paid_over` (sin falsos positivos)
- Monto exacto con centavos únicos para identificación automática

### 📦 Órdenes & Entrega
- Admin puede subir "deliveryContent" (credenciales/link) a cada orden
- Al marcar como entregado: email al cliente, notificación in-app, contador de ventas del producto actualizado
- Cliente ve sus credenciales en Mi Cuenta → Mis Órdenes

### 🔐 Autenticación
- Registro con verificación de email (token 24hs)
- Login con email/contraseña (NextAuth.js JWT)
- 2FA con TOTP (Google Authenticator / Authy) — QR code + otplib
- Recuperación de contraseña (token 1hs por email)
- Reenvío de email de verificación
- Cuentas no verificadas >24hs se auto-eliminan al registrar nueva

### 👥 Roles de usuario
- `user` — cliente normal
- `support` — ve todas las conversaciones del chat, ve todas las órdenes
- `admin` — acceso total, panel de administración completo
- Permisos granulares en JSON por usuario de soporte

### 🤖 Bot IA (Chat Support)
- GPT-4o-mini auto-responde mensajes de clientes usando BotKnowledge como contexto
- BotKnowledge: entradas CRUD por topic (Entregas, Pagos, Productos, Garantías, Soporte, General, etc.)
- Personalidad: cordial, cálido, empático, en español argentino
- Saludo inicial automático: se presenta como "Bot de BM Verificada"
- Técnicas de cierre de venta: indaga antes de derivar, nunca escala dudas de compra
- Genera cupón BOT5-XXXXX (5% descuento, 1 uso) cuando cliente pide precio especial
- Límite: 1 cupón por usuario cada 7 días (detectado por historial de chat)
- Si no puede responder: pregunta si deriva, solo escala con frase exacta
- Telegram solo avisa cuando necesita intervención humana (no cuando el bot responde solo)
- Indicador 🤖 Bot en la burbuja del mensaje en el chat

### 💬 Chat de Soporte
- Widget de chat en topbar (ícono 🎧), solo para usuarios logueados
- Polling cada 4 segundos para mensajes nuevos
- Admin/soporte ve todas las conversaciones, puede responder como agente humano
- Fix duplicado visual: usa `fetchMsgs()` después de enviar (no append optimista)
- Indicador de mensajes no leídos en admin
- Horario de atención mostrado: Lun–Vie 09:00–20:00

### 📢 Notificaciones
- Sistema de notificaciones in-app (Server-Sent Events para tiempo real)
- Tipos: order_created, order_paid, order_delivered
- Bell icon con badge de no leídas en topbar

### 📣 Telegram
- **Canal soporte** (`TELEGRAM_CHAT_ID`): avisa cuando bot no puede responder / necesita humano
- **Canal órdenes** (`TELEGRAM_ORDERS_CHAT_ID`): nueva compra iniciada + pago confirmado
- Pago confirmado incluye: descuento aplicado, subtotal original, cupón usado, TX hash
- Orden creada dice: "Compra iniciada — esperando pago ⏳"
- Endpoint de prueba: `POST /api/admin/test-telegram` → manda los 3 tipos de alerta

### 🏷️ Cupones de Descuento
- CRUD completo de cupones en panel admin
- Código único, % descuento, maxUsos, usos actuales, activo/inactivo
- Cupones BOT5-XXXXX generados automáticamente por el bot (5% max, 1 uso)
- Validación en checkout, aplicación en orden, incremento de uso post-pago

### 👥 Sistema de Referidos
- Código único de referido por usuario (generado al registrarse)
- 5% de crédito al referidor cuando el referido hace su primera compra
- Crédito acumulable, aplicable en checkout
- Panel "Mis Referidos" con código, lista de referidos, crédito ganado

### 🛒 Carrito Persistente
- Al cerrar sesión: carrito se guarda en servidor (SavedCart)
- Al iniciar sesión: se restaura el carrito si estaba vacío
- `cartRestoredRef` previene doble-restauración
- Carrito abandonado: cron cada 2hs envía email recordatorio (1 sola vez por carrito)

### 📝 Blog
- CRUD completo de posts (admin): título, slug, excerpt, contenido, imagen, published/draft
- URL: `/blog` (listado) y `/blog/[slug]` (post individual)
- Campo `imageUrl` con live preview en editor + thumbnail en lista de posts
- Botón "🖼 Buscar en Unsplash" en el editor que abre Unsplash marketing digital
- SEO: Open Graph, meta tags por post

### ❓ FAQ
- Acordeón FAQ en topbar (botón "FAQ") — 11 preguntas
- Mismo FAQ_ITEMS array reusado al pie de la página
- Preguntas incluyen: garantía, uso seguro CRM, API WhatsApp, entrega, pagos USDT, etc.
- FAQPage JSON-LD en `layout.jsx` para rich snippets de Google

### 📋 Panel Admin
- **Productos**: crear, editar, activar/desactivar, tiers de precio, stock, badge
- **Órdenes**: ver todas, filtrar, actualizar estado, subir deliveryContent
- **Cupones**: CRUD completo con estadísticas de uso
- **Blog**: CRUD con preview de imagen y botón Unsplash
- **Equipo**: crear/editar/eliminar usuarios de soporte con permisos granulares
- **Bot IA**: CRUD de BotKnowledge por topic, toggle activo/inactivo
- **Reseñas**: moderar/eliminar reseñas de productos

### 🔍 SEO & Tracking
- `layout.jsx`: metadataBase, Open Graph, Twitter Card, canonical
- `sitemap.js`: auto-generado con productos y posts del blog
- `robots.js`: configurado para bots de búsqueda
- FAQPage schema.org (JSON-LD) para rich snippets
- WebSite schema.org con SearchAction
- Meta Pixel (client-side fbq)
- Meta Conversions API (CAPI) server-side — evento Purchase con email hasheado SHA-256

### 📧 Emails (Resend/SMTP)
- Verificación de cuenta (token 24hs)
- Reset de contraseña (token 1hs)
- Confirmación de pago (con TX hash)
- Entrega de producto
- Recompensa de referido (crédito ganado)
- Recordatorio de carrito abandonado

### ⚙️ Ajustes & Settings
- Tabla `Settings` (key-value) para configuración dinámica del sitio
- API: GET/POST `/api/settings`

### 🌙 UI/UX
- Modo oscuro / modo claro con toggle en topbar
- Diseño responsive mobile-first
- Animaciones en carrito, notificaciones, chat
- Logo en topbar, branding BM Verificada

---

## 🗄️ ESQUEMA DE BASE DE DATOS (resumen)

| Modelo | Descripción |
|--------|-------------|
| `User` | Clientes, admins, soporte. Con 2FA, referidos, crédito |
| `Product` | Productos con tiers JSON, stock, ventas, rating |
| `Order` | Órdenes con uniqueAmount, expiresAt, deliveryContent |
| `OrderItem` | Items de cada orden |
| `Coupon` | Cupones con maxUses/uses |
| `ChatMessage` | Mensajes de soporte. `isBot` para respuestas GPT |
| `BotKnowledge` | Conocimiento del bot por topic |
| `Notification` | Notificaciones in-app |
| `Referral` | Registro de referidos y estado de recompensa |
| `SavedCart` | Carrito guardado al cerrar sesión |
| `BlogPost` | Posts del blog con slug único |
| `Review` | Reseñas de productos (1-5 estrellas) |
| `Favorite` | Favoritos por usuario |
| `Settings` | Configuración key-value del sitio |

---

## 🔑 VARIABLES DE ENTORNO REQUERIDAS

```env
# Base de datos (Neon PostgreSQL)
DATABASE_URL=
DIRECT_DATABASE_URL=

# NextAuth
NEXTAUTH_URL=https://bmverificada.store
NEXTAUTH_SECRET=

# Email (Resend)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=
SMTP_FROM=

# Cryptomus (pagos crypto)
CRYPTOMUS_MERCHANT_UUID=
CRYPTOMUS_API_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=           # Canal de soporte
TELEGRAM_ORDERS_CHAT_ID=    # Canal de ventas (opcional, fallback al anterior)

# Meta / Facebook
NEXT_PUBLIC_META_PIXEL_ID=
META_CAPI_TOKEN=

# OpenAI (bot IA)
OPENAI_API_KEY=              # ⚠️ NUNCA pegar en el chat, siempre en Vercel

# Cron
CRON_SECRET=bmverif_cron_2026
```

---

## 📁 ARCHIVOS CLAVE

| Archivo | Qué hace |
|---------|----------|
| `components/MarketplaceClient.jsx` | TODO el frontend: tienda, admin, chat, bot, FAQ, blog |
| `app/api/chat/route.js` | Chat + GPT bot + generación de cupones BOT5 |
| `app/api/cryptomus/webhook/route.js` | Confirma pagos, manda emails/Telegram, CAPI |
| `app/api/orders/route.js` | Crea órdenes, genera uniqueAmount, Telegram |
| `app/api/admin/run-migration/route.js` | Migraciones SQL manuales |
| `app/layout.jsx` | SEO global, JSON-LD, Meta Pixel |
| `lib/telegram.js` | `sendTelegramNotification` (soporte) + `sendTelegramOrderNotification` (ventas) |
| `lib/mailer.js` | Envío de emails via Resend SMTP |
| `prisma/schema.prisma` | Schema completo de la DB |

---

## 🚨 SISTEMA DE MIGRACIONES

Cuando se agrega un campo o tabla nueva a `prisma/schema.prisma`:
1. Claude escribe el SQL en `app/api/admin/run-migration/route.js`
2. **El usuario debe ejecutarlo** desde el browser logueado como admin:
   - Ir al panel admin → o llamar `fetch('/api/admin/run-migration', {method:'POST'})`
3. Usar siempre `IF NOT EXISTS` / `IF NOT EXISTS` para que sea idempotente

---

## 🌐 DOMINIO

- Dominio activo: **bmverificada.store** (GoDaddy — ⚠️ cuenta bloqueada, vence pronto)
- Plan: comprar dominio nuevo en **Namecheap** o **Cloudflare Registrar**
- Al cambiar dominio, actualizar en:
  - `app/layout.jsx` → metadataBase, canonical, OG url, JSON-LD urls
  - `app/sitemap.js` → base URL
  - Vercel → dominio custom
  - `NEXTAUTH_URL` en env vars

---

## 💡 CONVENCIONES DEL PROYECTO

- **Español argentino** en toda la UI (vos, podés, hacés, etc.)
- API routes usan `NextResponse.json()`
- Auth siempre con `getServerSession(authOptions)`
- Admin check: `session.user.role === "admin"`
- Support check: `session.user.role === "admin" || session.user.role === "support"`
- Telegram no-blocking: `.catch(() => {})` para no romper el flujo principal
- Cupones bot: prefijo `BOT5-` + 5 chars random. Límite 1 por usuario por semana
- El bot escala a humano SOLO con la frase exacta: `"Voy a derivarte con un agente humano"`
- Dudas de compra NUNCA escalan → siempre se manejan con técnicas de cierre

---

## 📌 PENDIENTES / NOTAS IMPORTANTES

- 🔑 **OpenAI API key**: si el usuario la pegó en el chat → pedirle que la revoque en platform.openai.com/api-keys y genere una nueva
- 🌐 **Dominio**: gestionar cambio a Namecheap antes del vencimiento
- 🧪 **Testear el bot**: enviar mensaje como usuario regular para verificar respuestas GPT
- 📋 **BotKnowledge**: cargar más info si el bot no sabe responder algo específico (panel admin → Bot IA)
