import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Footer from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Deal Finder - Find Undervalued Deals",
  description: "Get alerts for undervalued marketplace deals in your area",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <main className="flex-1 container mx-auto px-4 pb-20">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
