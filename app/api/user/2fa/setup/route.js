import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

// POST /api/user/2fa/setup — generate a new TOTP secret + QR code
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const secret = generateSecret();
  const keyUri = generateURI({ secret, label: session.user.email, issuer: "BMVERIF" });
  const qrImage = await QRCode.toDataURL(keyUri);

  return NextResponse.json({ secret, qrImage });
}
