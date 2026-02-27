const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Pools variadas y realistas ──────────────────────────────────────────────

// null = sin comentario (solo estrellas)
const COMMENTS_5 = [
  null,
  null,
  null,
  null,
  "",
  "excelente",
  "Exelente!",
  "muy bueno",
  "re buena la compra",
  "100% recomendado",
  "recomiendo",
  "top",
  "ok todo bien",
  "buenisimo",
  "funciona perfecto",
  "Excelente producto, funcionó perfecto desde el primer momento",
  "mui buena cuenta sin ningun inconveniente",
  "entrega inmediata como prometido!! muy recomendado",
  "todo perfecto ya compre varias veces siempre igual de bien",
  "muy profesional el servicio, recomiendo 100%",
  "la cuenta llego rapido y sin problemas, volveria a comprar",
  "Exelente calidad, justo lo ke necesitaba para mis campañas",
  "muy satisfecho entrega en minutos gracias!!",
  "funciona perfecto sin restricciones muy bueno",
  "ya van 3 compras y siempre impecable",
  "todo como se describe, entrega rapidisima",
  "Muy buen producto lo recomiendo a todos",
  "llego todo ok, sin problemas",
  "conforme con la compra",
  "funciono al instante gracias",
  "tal cual dice la descripcion, excelente",
  "5 estrellas merece mas",
  "super rapido todo",
  "Muy buen vendedor, respondio rapido mis dudas",
  "compre 2 y los 2 perfectos",
  "sin problemas, la cuenta activa al toque",
  "de 10",
  "re copado todo",
  "tremendo producto, funciono de una",
  "listo y funcionando, gracias",
  "primera compra y no defraudo",
];

const COMMENTS_4 = [
  null,
  null,
  "",
  "bien",
  "conforme",
  "esta bien",
  "ok",
  "buen producto",
  "buena cuenta, pequeño problema al inicio pero se resolvio rapido",
  "buen producto, entrega un poco mas lenta de lo esperado pero llego bien",
  "buena calidad en general, recomendado",
  "funciona bien, dentro de lo esperado",
  "buen servicio sin mayores inconvenientes",
  "producto como se describe, satisfecho",
  "todo bien, un poco de demora pero llego",
  "funciona aunque tarde un toque mas de lo esperado",
  "recomendable",
  "bien en general, nada que quejarme",
  "cumplio con lo prometido",
  "le falta un poco pero funciona bien",
];

const COMMENTS_3 = [
  null,
  "",
  "mas o menos",
  "esperaba mas",
  "cumple pero nada del otro mundo",
  "funciona pero tardo un poco",
  "esta bien, esperaba un poco mas la verdad",
  "producto correcto, nada extraordinario",
  "ok pero tardo bastante",
];

// ── Asignación sin repetir hasta agotar el pool ─────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Genera una secuencia de `count` elementos del pool sin repetir consecutivos
// Cicla el pool shuffleado de nuevo cuando se agota
function noRepeatSequence(pool, count) {
  const result = [];
  let deck = shuffle(pool);
  let di = 0;
  let last = undefined;

  for (let i = 0; i < count; i++) {
    // Si agotamos el mazo, barajamos de nuevo (evitando que el primero = último anterior)
    if (di >= deck.length) {
      deck = shuffle(pool);
      di = 0;
      // Si el primero del nuevo mazo es igual al último asignado, intercambiar con el segundo
      if (deck.length > 1 && deck[0] === last) {
        [deck[0], deck[1]] = [deck[1], deck[0]];
      }
    }
    result.push(deck[di]);
    last = deck[di];
    di++;
  }
  return result;
}

async function run() {
  console.log('\n── Randomizando comentarios sin repeticiones ──');

  const reviews = await prisma.$queryRawUnsafe(
    `SELECT id, rating FROM "Review" ORDER BY "createdAt" ASC`
  );

  console.log(`  Total reviews: ${reviews.length}`);

  // Agrupar por bucket de rating
  const buckets = { 5: [], 4: [], 3: [] };
  for (const r of reviews) {
    const b = r.rating >= 5 ? 5 : r.rating >= 4 ? 4 : 3;
    buckets[b].push(r);
  }

  // Asignar comentarios únicos por bucket
  const assignments = new Map();
  for (const [bucket, pool] of [[5, COMMENTS_5], [4, COMMENTS_4], [3, COMMENTS_3]]) {
    const revs = buckets[bucket];
    if (!revs.length) continue;
    const seq = noRepeatSequence(pool, revs.length);
    revs.forEach((r, i) => assignments.set(r.id, seq[i]));
    console.log(`  Rating ${bucket}★: ${revs.length} reviews, pool de ${pool.length} opciones`);
  }

  // Actualizar en DB
  let noComment = 0;
  for (const [id, comment] of assignments) {
    const val = (comment === null || comment === "") ? null : comment;
    if (val === null) noComment++;
    await prisma.$executeRawUnsafe(
      `UPDATE "Review" SET comment = $1 WHERE id = $2`,
      val, id
    );
  }

  console.log(`\n  ✓ Actualizados: ${assignments.size} comentarios`);
  console.log(`  ✓ Sin texto (solo estrellas): ${noComment}`);
  console.log('\n✅ Done!');
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
