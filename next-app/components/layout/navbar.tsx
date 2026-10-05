import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Navigation01Icon } from "@hugeicons/core-free-icons"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { MobileNav } from "@/components/layout/mobile-nav"
import { NavAuth } from "@/components/layout/nav-auth"

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "Services", href: "/#services" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Become a Rider", href: "/#become-rider" },
  { label: "Become a Provider", href: "/#become-provider" },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-1 px-1.5"
          aria-label="HitsNaGo Homepage"
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

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions (Login, Sign Up, Dashboard, Theme Toggle, Mobile Menu) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* Desktop Auth Controls */}
          <NavAuth />

          {/* Mobile Navigation Trigger */}
          <MobileNav navLinks={navLinks} />
        </div>
      </div>
    </header>
  )
}


