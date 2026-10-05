"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

function subscribe() {
  return () => {}
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isClient = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  if (!isClient) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle visual theme"
        className="rounded-full text-muted-foreground"
      >
        <span className="size-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="rounded-full text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isDark ? (
        <HugeiconsIcon icon={Sun01Icon} size={18} className="text-amber-400" />
      ) : (
        <HugeiconsIcon icon={Moon01Icon} size={18} className="text-slate-700" />
      )}
    </Button>
  )
}
