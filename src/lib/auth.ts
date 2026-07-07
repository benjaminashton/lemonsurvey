import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || "lemonsurvey_super_secret_dev_key_12345",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        const identifier = credentials.email as string;
        const isEmail = identifier.includes('@');

        const user = await db.user.findFirst({
          where: isEmail
            ? { email: identifier }
            : { username: identifier }
        });

        if (!user) {
          return null
        }
        
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        
        if (!isValid) {
          return null
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
})

