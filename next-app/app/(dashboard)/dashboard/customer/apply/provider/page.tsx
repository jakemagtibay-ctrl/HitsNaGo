import { ProviderApplicationForm } from "@/components/apply/provider-application-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Become a Rental Provider — HitsNaGo",
  description: "Apply to become a verified rental provider in Butuan City, Agusan del Norte.",
}

export default function BecomeProviderPage() {
  return <ProviderApplicationForm />
}
