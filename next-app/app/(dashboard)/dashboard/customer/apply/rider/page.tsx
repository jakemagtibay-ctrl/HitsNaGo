import { RiderApplicationForm } from "@/components/apply/rider-application-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Become a Rider — HitsNaGo",
  description: "Apply to become a verified habal-habal or tricycle rider in Butuan City, Agusan del Norte.",
}

export default function BecomeRiderPage() {
  return <RiderApplicationForm />
}
