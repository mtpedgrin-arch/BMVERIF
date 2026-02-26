# Marketplace Digital (Next.js + Vercel + Postgres/Prisma + Auth)

## 1) Instalar
```bash
npm i
```

## 2) Variables de entorno
Copiá `.env.example` a `.env.local` y completá.

## 3) Prisma
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 4) Correr
```bash
npm run dev
```

## 5) Deploy a Vercel
- Importá el repo en Vercel
- Seteá env vars (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`)
- Usá una DB Postgres (ej: Neon / Supabase / Vercel Postgres)
- En "Build Command" dejá default (`next build`)
- Agregá un **Postinstall** opcional: `prisma generate` (Vercel suele correrlo si detecta Prisma)
