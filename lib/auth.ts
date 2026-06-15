import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import users from "@/data/users.json";

// ---------------------------------------------------------------------------
// PLACEHOLDER: Replace CredentialsProvider below with AzureADProvider when
// switching to Microsoft SSO. Install `next-auth` and configure:
//
//   import AzureADProvider from "next-auth/providers/azure-ad";
//   AzureADProvider({
//     clientId: process.env.AZURE_AD_CLIENT_ID!,
//     clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
//     tenantId: process.env.AZURE_AD_TENANT_ID!,
//   })
//
// Add AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID to .env.local.
// Map the Microsoft profile to your User type in the `profile` callback.
// ---------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = users.find(
          (u) =>
            u.email === credentials.email &&
            u.password === credentials.password,
        );
        if (!user) return null;
        return {
          id: user.email,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as typeof user & { role: string }).role;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { role: string }).role =
          token.role as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
