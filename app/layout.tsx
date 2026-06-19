import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SDM5 Assessment Platform",
  description: "Industry 5.0 Sustainable Digitalization Index Assessment Platform",
  generator: 'v0.app',
  keywords: ['assessment', 'sustainability', 'digitalization', 'industry5.0', 'sdm5'],
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-background">
      <body className={inter.className}>
        <Providers attribute="class" defaultTheme="system" enableSystem>
          {children}
        </Providers>
      </body>
    </html>
  )
}

