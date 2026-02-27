import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { verifySync } from "otplib";
import { prisma } from "./prisma";

export const authOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
        totp:     { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        const email    = credentials?.email?.toLowerCase();
        const password = credentials?.password;
        const totp     = credentials?.totp;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        if (!user.emailVerified) return null;

        // Validate 2FA if enabled
        if (user.twoFactorEnabled) {
          if (!totp) return null;
          const valid = verifySync({ token: totp, secret: user.twoFactorSecret })?.valid;
          if (!valid) return null;
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      if (token?.role) session.user.role = token.role;
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
