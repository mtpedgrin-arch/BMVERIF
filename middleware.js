import { NextResponse } from "next/server";

// Middleware liviano: bloquea métodos raros y protege rutas admin (ejemplo)
export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Bloquear TRACE (poco común, pero reduce superficie)
  if (req.method === "TRACE") return new NextResponse(null, { status: 405 });

  // Ejemplo: si luego agregás /admin, acá podrías exigir sesión/JWT.
  // if (pathname.startsWith("/admin")) { ... }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
