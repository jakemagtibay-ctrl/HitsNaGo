import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Navigation01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Ambient background decoration */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute bottom-10 right-0 -z-10 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
      </div>

      {/* Top minimal header */}
      <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-lg py-1 px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="HitsNaGo Home"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <HugeiconsIcon icon={Navigation01Icon} size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                HitsNaGo<span className="text-primary">.</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground -mt-1">
                Local Services
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main auth viewport */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="w-full border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} HitsNaGo. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Trust & Safety
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
