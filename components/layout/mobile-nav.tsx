"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { useAuth, useClerk } from "@clerk/nextjs"
import {
  Menu01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface NavLink {
  label: string
  href: string
}

interface MobileNavProps {
  navLinks: NavLink[]
}

export function MobileNav({ navLinks }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const { isSignedIn, isLoaded } = useAuth()
  const { signOut } = useClerk()

  // Close on escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        className="rounded-full"
      >
        <HugeiconsIcon icon={isOpen ? Cancel01Icon : Menu01Icon} size={22} />
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-x-0 top-16 z-50 flex h-[calc(100svh-4rem)] flex-col justify-between overflow-y-auto bg-background/95 p-6 backdrop-blur-md border-b border-border shadow-xl animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <nav className="flex flex-col gap-2 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                <span>{link.label}</span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  className="text-muted-foreground"
                />
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 pb-8 pt-4 border-t border-border mt-4">
            {isLoaded && isSignedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="w-full">
                  <Button
                    className="w-full justify-center h-11 gap-2 shadow-sm"
                  >
                    <HugeiconsIcon icon={DashboardSquare01Icon} size={18} />
                    <span>Go to Dashboard</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false)
                    signOut({ redirectUrl: "/" })
                  }}
                  className="w-full justify-center h-11 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                  <Button
                    variant="outline"
                    className="w-full justify-center h-11"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setIsOpen(false)} className="w-full">
                  <Button
                    className="w-full justify-center h-11 shadow-sm"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
