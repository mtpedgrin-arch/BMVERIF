import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";
import { authenticator } from "otplib";
import QRCode from "qrcode";

// POST /api/user/2fa/setup — generate a new TOTP secret + QR code
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const secret = authenticator.generateSecret();
  const keyUri = authenticator.keyuri(session.user.email, "BMVERIF", secret);
  const qrImage = await QRCode.toDataURL(keyUri);

  return NextResponse.json({ secret, qrImage });
}
