import type { Metadata } from "next"
import { Geist_Mono, Outfit, Raleway } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

// Custom Google fonts used across typography and headings
const ralewayHeading = Raleway({ subsets: ["latin"], variable: "--font-heading" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Page metadata defining the browser tab title and SEO search summary
export const metadata: Metadata = {
  title: "HitsNaGo - Fast Local Services: Ride, Rent & Delivery",
  description:
    "Your trusted local online booking platform. Connect with verified riders and service providers to book rides, rent vehicles or equipment, and send deliveries.",
}

// Top-level root layout providing authentication, theme context, and base HTML structure
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0d9488",
          borderRadius: "0.625rem",
          fontFamily: "var(--font-sans), sans-serif",
        },
      }}
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={cn("antialiased", fontMono.variable, "font-sans", outfit.variable, ralewayHeading.variable)}
      >
        <body>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

