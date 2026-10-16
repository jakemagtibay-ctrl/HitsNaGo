export const clerkAppearance = {
  variables: {
    colorPrimary: "#0d9488",
    colorText: "currentColor",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-sans), sans-serif",
  },
  elements: {
    rootBox: "w-full",
    card: "border border-border/80 bg-card/95 text-card-foreground shadow-xl rounded-2xl p-6 sm:p-8 backdrop-blur-xs",
    headerTitle: "font-heading text-2xl font-bold tracking-tight text-foreground",
    headerSubtitle: "text-muted-foreground text-sm",
    socialButtonsBlockButton:
      "border border-border bg-background hover:bg-muted text-foreground rounded-xl transition-colors font-medium h-10 shadow-xs",
    socialButtonsBlockButtonText: "text-foreground font-medium text-sm",
    socialButtonsBlockButtonArrow: "text-muted-foreground",
    dividerLine: "bg-border",
    dividerText: "text-xs uppercase text-muted-foreground tracking-wider font-semibold",
    formFieldLabel: "text-xs font-semibold text-foreground tracking-wide mb-1.5",
    formFieldInput:
      "rounded-xl border border-input bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring text-sm h-10 px-3 transition-colors",
    formButtonPrimary:
      "bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-xl h-10 shadow-sm transition-all text-sm cursor-pointer",
    footerActionText: "text-xs text-muted-foreground",
    footerActionLink:
      "text-xs text-primary font-semibold hover:text-primary/80 transition-colors underline-offset-4 hover:underline",
    identityPreviewText: "text-sm font-medium text-foreground",
    identityPreviewEditButtonIcon: "text-primary",
    formFieldSuccessText: "text-xs text-emerald-600 dark:text-emerald-400",
    formFieldErrorText: "text-xs text-destructive font-medium mt-1",
    alert: "border border-destructive/20 bg-destructive/10 text-destructive rounded-xl p-3 text-xs",
    alertText: "text-xs text-destructive font-medium",
  },
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
}
