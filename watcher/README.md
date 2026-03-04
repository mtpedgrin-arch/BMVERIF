# BM Verificada — Dropshipping Watcher

Script que corre en tu PC 24/7 y maneja el dropshipping automático:
- Detecta órdenes pagas sin entregar
- Si el saldo en npprteam es bajo, fondea automáticamente via Playwright + Cryptomus
- Compra al proveedor y entrega al cliente sin intervención manual

---

## Setup en Windows (una sola vez)

### 1. Instalar Node.js
Bajarlo de https://nodejs.org → versión **LTS** → instalarlo con las opciones por defecto.

Para verificar que quedó instalado, abrí una terminal (Win+R → cmd → Enter) y ejecutá:
```
node --version
```
Tiene que mostrar algo como `v20.x.x`.

### 2. Copiar el proyecto a esta PC
Podés clonarlo con git o simplemente copiar la carpeta `watcher/` desde tu otro equipo.

### 3. Instalar dependencias
En la terminal, navegá a la carpeta `watcher` y ejecutá:
```
cd C:\ruta\a\watcher
npm install
npx playwright install chromium
```
Esto instala Playwright y descarga el browser Chromium (~150MB, solo una vez).

### 4. Configurar el .env
Copiá el archivo de ejemplo:
```
copy .env.example .env
```
Abrí `.env` con el Bloc de notas y completá todos los valores con las mismas
credenciales que tenés en Vercel.

### 5. Probar que funciona
```
node watcher.js
```
Deberías ver:
```
[HH:MM:SS] ╔══════════════════════════════════════════════╗
[HH:MM:SS] ║   BM Verificada — Dropshipping Watcher       ║
[HH:MM:SS] ╚══════════════════════════════════════════════╝
[HH:MM:SS] ✅ Config OK — iniciando watcher...
```
Y va a llegar un mensaje a Telegram confirmando que arrancó.

Para detenerlo: `Ctrl+C`

---

## Correr 24/7 con PM2 (recomendado)

PM2 mantiene el proceso vivo, lo reinicia si se cae, y lo arranca automático
cuando prendés la PC.

### Instalar PM2
```
npm install -g pm2
npm install -g pm2-windows-startup
```

### Arrancar el watcher con PM2
```
cd C:\ruta\a\watcher
pm2 start watcher.js --name bmveri-watcher
pm2 save
pm2-windows-startup install
```

### Comandos útiles de PM2
```
pm2 status                    → ver si está corriendo
pm2 logs bmveri-watcher       → ver los logs en tiempo real
pm2 logs bmveri-watcher --lines 100  → últimas 100 líneas
pm2 restart bmveri-watcher    → reiniciar
pm2 stop bmveri-watcher       → detener
```

---

## Cómo funciona

```
Cada 30 segundos:
  1. Consulta la DB: órdenes con status="paid" y sin deliveryContent (últimas 12hs)
  2. Por cada orden:
     a. Obtiene los items y sus supplierProductId
     b. Chequea saldo en npprteam
     c. Si saldo < costo:
        - Playwright abre npprteam.shop y crea un depósito USDT TRC20
        - Llama a Cryptomus Payout API para enviar el USDT exacto
        - Espera que npprteam acredite el saldo (polling cada 20s, máx 6 min)
     d. Compra al proveedor via npprteam API
     e. Guarda deliveryContent en la DB
     f. Marca la orden como "delivered"
     g. Envía email + notificación in-app + alerta Telegram
```

---

## Troubleshooting

### "deposit-debug.png" apareció en la carpeta
Playwright no pudo encontrar el wallet/monto en la página de depósito de npprteam.
Abrí la imagen para ver qué mostró el browser. Puede ser que npprteam cambió su UI.
Contactá soporte para actualizar los selectores.

### Error de SSL en la DB
Si aparece error de SSL, el `.env` tiene `DATABASE_URL` sin `?sslmode=require`.
No es necesario agregarlo, el script ya lo maneja.

### "Cryptomus payout error"
Verificá que:
- Tenés saldo en tu cuenta de Cryptomus merchant
- Las credenciales `CRYPTOMUS_MERCHANT_UUID` y `CRYPTOMUS_API_KEY` son correctas
- La dirección de wallet que devuelve npprteam es TRC20 válida (empieza con T)

### Orden sigue sin entregarse después de 10 minutos
Revisá los logs con `pm2 logs bmveri-watcher`. Si hay error, el panel admin
de Vercel muestra la orden como "paid" — podés entregar manualmente desde ahí.
