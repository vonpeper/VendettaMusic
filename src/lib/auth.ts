import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import { compare } from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const rawEmail = (credentials?.email as string || "").trim().toLowerCase()
        const rawPassword = (credentials?.password as string || "")

        if (!rawEmail || !rawPassword) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: rawEmail }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(rawPassword, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ]
})
