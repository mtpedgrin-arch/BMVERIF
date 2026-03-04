# CLAUDE.md — BM Verificada Watcher Setup

> Este archivo le dice a Claude Code exactamente qué hacer en esta PC.
> El usuario solo tiene que abrir Claude Code en esta carpeta y decir "setup".

---

## 🎯 QUÉ ES ESTO

Script de dropshipping automático para BM Verificada (bmverificada.space).
Corre 24/7 en esta PC y se encarga de:
1. Detectar órdenes pagas sin entregar (consulta la DB cada 30s)
2. Si el saldo en npprteam.shop es insuficiente → Playwright abre npprteam, crea un depósito USDT TRC20, Cryptomus manda el USDT exacto
3. Espera que npprteam acredite el saldo (~3-6 min)
4. Compra el producto al proveedor y entrega las credenciales al cliente
5. Manda notificaciones por Telegram + email al cliente

---

## ⚡ SETUP COMPLETO (Claude lo hace solo)

Cuando el usuario diga "setup" o "instalá todo", Claude debe:

### Paso 1 — Verificar Node.js
```bash
node --version
npm --version
```
Si no está instalado, decirle al usuario que vaya a https://nodejs.org y baje la versión LTS.

### Paso 2 — Instalar dependencias
```bash
npm install
npx playwright install chromium
```

### Paso 3 — Configurar el .env
- Copiar `.env.example` a `.env`
- Pedirle al usuario las credenciales una por una:
  - `DATABASE_URL` → la misma que tiene en Vercel (Neon PostgreSQL)
  - `NPPRTEAM_API_KEY` → su API key de npprteam.shop
  - `NPPRTEAM_EMAIL` → email con el que se loguea en npprteam.shop
  - `NPPRTEAM_PASSWORD` → password de npprteam.shop
  - `CRYPTOMUS_MERCHANT_UUID` → el mismo que tiene en Vercel
  - `CRYPTOMUS_API_KEY` → la API key de **PAYOUTS** de Cryptomus (es distinta a la de pagos — se genera en Settings del dashboard de Cryptomus)
  - `TELEGRAM_BOT_TOKEN` → el mismo que tiene en Vercel
  - `TELEGRAM_ORDERS_CHAT_ID` → el mismo que tiene en Vercel
  - `SMTP_PASS` → la Resend API key (la misma que SMTP_PASS en Vercel)

### Paso 4 — Probar el payout de Cryptomus
```bash
node test-payout.js <wallet_TRC20_del_usuario> 1
```
Mandar $1 USDT a la wallet personal del usuario para confirmar que el payout API funciona.
Si da error, diagnosticar y resolver antes de continuar.

### Paso 5 — Probar que conecta a la DB
```bash
node -e "require('dotenv').config(); const {Pool}=require('pg'); const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); p.query('SELECT COUNT(*) FROM \"Order\"').then(r=>console.log('✅ DB OK — órdenes:',r.rows[0].count)).catch(e=>console.log('❌ DB Error:',e.message)).finally(()=>p.end())"
```

### Paso 6 — Test run del watcher (30 segundos)
```bash
node watcher.js
```
Verificar que arranca sin errores y muestra los logs correctamente. Detener con Ctrl+C.

### Paso 7 — Instalar PM2 y dejarlo corriendo 24/7
```bash
npm install -g pm2
npm install -g pm2-windows-startup
pm2 start watcher.js --name bmveri-watcher
pm2 save
pm2-windows-startup install
```

### Paso 8 — Verificar que PM2 lo mantiene vivo
```bash
pm2 status
pm2 logs bmveri-watcher --lines 20
```

---

## 🔧 COMANDOS ÚTILES (para cuando el usuario pregunte)

```bash
pm2 status                          # ver si está corriendo
pm2 logs bmveri-watcher             # ver logs en tiempo real
pm2 logs bmveri-watcher --lines 50  # últimas 50 líneas
pm2 restart bmveri-watcher          # reiniciar
pm2 stop bmveri-watcher             # detener
pm2 start bmveri-watcher            # arrancar
node test-payout.js <wallet> <monto> # test manual de payout
```

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

| Error | Causa | Solución |
|-------|-------|----------|
| `CRYPTOMUS_API_KEY missing` | .env no completado | Completar el .env |
| `SSL error` en DB | Neon requiere SSL | Ya está manejado en el código con `ssl:{rejectUnauthorized:false}` |
| `Cryptomus payout error 422` | KYC no verificado o dominio no confirmado | Verificar en el dashboard de Cryptomus |
| `Cryptomus payout error 401` | API key de payouts incorrecta | Regenerar en Cryptomus Settings |
| `deposit-debug.png` aparece | Playwright no encontró los selectores de npprteam | Ver la imagen, reportarle al desarrollador para actualizar selectores |
| `timeout esperando balance` | npprteam tardó más de 6 min en acreditar | Normal si la red está lenta, el watcher reintenta en el próximo ciclo |
| PM2 no arranca con Windows | pm2-windows-startup no configurado | Correr `pm2-windows-startup install` como administrador |

---

## 📁 ARCHIVOS

| Archivo | Qué hace |
|---------|----------|
| `watcher.js` | Script principal — loop de 30s, fondeo, fulfillment |
| `test-payout.js` | Test rápido del Cryptomus payout API |
| `.env` | Credenciales (NO subir a git) |
| `.env.example` | Template del .env |
| `deposit-debug.png` | Screenshot de debug si Playwright falla (aparece solo si hay error) |

---

## 💡 NOTAS IMPORTANTES

- El watcher NO necesita modificaciones en el código de Vercel — funciona leyendo directamente de la DB
- Si una orden falla, queda como `status="paid"` sin `deliveryContent` — el admin puede entregarla manualmente desde el panel de Vercel
- El `DEPOSIT_BUFFER` (default $10) es el extra que se deposita sobre el costo exacto, para absorber fees de red
- Las órdenes se procesan en orden cronológico (más antigua primero)
- El watcher ignora órdenes con más de 12 horas de antigüedad (evita procesar órdenes viejas que el admin ya manejó)
