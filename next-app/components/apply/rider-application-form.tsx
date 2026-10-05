"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  UserIcon,
  Car01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Step = "personal" | "vehicle" | "documents" | "review" | "submitted"

interface FormData {
  fullName: string
  contactNumber: string
  address: string
  barangay: string
  licenseNumber: string
  licenseExpiry: string
  licenseRestrictionCode: string
  vehicleType: "motorcycle" | "tricycle" | "electric_bike" | ""
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  plateNumber: string
  orNumber: string
  crNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
}

const BUTUAN_BARANGAYS = [
  "Ambago", "Amparo", "Ampayon", "Anticala", "Antongalon",
  "Aupagan", "Baan Km. 3", "Baan Riverside", "Babag", "Bading",
  "Bancasi", "Banza", "Baobaoan", "Basag", "Bayanihan",
  "Bilay", "Bitan-agan", "Bit-os", "Bobon", "Bonbon",
  "Bugabus", "Bugsukan", "Buhangin", "Cabcabon", "Camayahan",
  "Dagohoy", "Dankias", "De Oro", "Diego Silang", "Don Francisco",
  "Doongan", "Dulag", "Dumalagan", "Holy Redeemer", "Humapon",
  "Imadejas", "Jose Rizal", "Kinamlutan", "Lemon", "Libertad",
  "Maguinda", "Mahay", "Mahogany", "Maibu", "Mandamo",
  "Manila de Bugabus", "Maon", "Masao", "Maug", "New Society",
  "Nong-nong", "Obrero", "Ong Yiu", "Pagatpatan", "Pangabugan",
  "Pianing", "Pigdaulan", "Pinamanculan", "Port Poyohon",
  "Rajah Soliman", "Salvacion", "San Ignacio", "San Mateo",
  "San Vicente", "Sikatuna", "Silongan", "Sumilihon", "Tagabaca",
  "Taligaman", "Tandang Sora", "Tiniwisan", "Tungao", "Urduja",
  "Villa Kananga",
]

const STEPS: { id: Step; label: string; icon: typeof UserIcon }[] = [
  { id: "personal", label: "Personal Info", icon: UserIcon },
  { id: "vehicle", label: "Vehicle & License", icon: Car01Icon },
  { id: "documents", label: "Documents", icon: File01Icon },
  { id: "review", label: "Review & Submit", icon: CheckmarkCircle01Icon },
]

const stepOrder: Step[] = ["personal", "vehicle", "documents", "review"]

export function RiderApplicationForm() {
  const [currentStep, setCurrentStep] = React.useState<Step>("personal")
  const [form, setForm] = React.useState<FormData>({
    fullName: "", contactNumber: "", address: "", barangay: "",
    licenseNumber: "", licenseExpiry: "", licenseRestrictionCode: "1",
    vehicleType: "", vehicleMake: "", vehicleModel: "", vehicleYear: "",
    plateNumber: "", orNumber: "", crNumber: "",
    emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "",
  })

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const currentIndex = stepOrder.indexOf(currentStep)
  const goNext = () => { if (currentIndex < stepOrder.length - 1) setCurrentStep(stepOrder[currentIndex + 1]) }
  const goBack = () => { if (currentIndex > 0) setCurrentStep(stepOrder[currentIndex - 1]) }
  const handleSubmit = () => setCurrentStep("submitted")

  if (currentStep === "submitted") {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16 text-center max-w-lg mx-auto">
        <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} className="text-emerald-500" />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">Application Submitted!</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your Rider application has been received and is now under review by the HitsNaGo team in Butuan City. You will be notified once a decision is made. You can continue using HitsNaGo as a customer in the meantime.
          </p>
          <div className="flex flex-col gap-2 pt-2 text-xs text-muted-foreground">
            <span>📍 Service area: Butuan City, Agusan del Norte</span>
            <span>⏱️ Review typically takes 2–5 business days</span>
          </div>
        </div>
        <Link href="/dashboard/customer" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          Return to Customer Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-16 max-w-3xl mx-auto">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/customer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />Back to Dashboard
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <HugeiconsIcon icon={Motorbike01Icon} size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-bold text-foreground">Apply to Become a Rider</h1>
              <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/30 text-primary">Butuan City</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Join HitsNaGo as a verified habal-habal or tricycle rider. All applications are reviewed before approval.</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
        {STEPS.map((step, i) => {
          const stepIdx = stepOrder.indexOf(step.id)
          const isCompleted = currentIndex > stepIdx
          const isActive = currentStep === step.id
          return (
            <React.Fragment key={step.id}>
              <div className={cn("flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                isActive ? "bg-primary text-primary-foreground"
                  : isCompleted ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground")}>
                <HugeiconsIcon icon={step.icon} size={13} />
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn("h-px flex-1 min-w-[12px] rounded-full", isCompleted ? "bg-emerald-500/50" : "bg-border")} />}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step: Personal */}
      {currentStep === "personal" && (
        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-5 flex flex-col gap-5">
            <h2 className="font-heading text-base font-bold text-foreground border-b border-border/60 pb-3">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Full Name (as in ID)" value={form.fullName} onChange={(v) => update("fullName", v)} placeholder="e.g. Danilo Reyes Jr." />
              <InputField label="Contact Number" value={form.contactNumber} onChange={(v) => update("contactNumber", v)} placeholder="+63 9XX XXX XXXX" />
              <div className="sm:col-span-2">
                <InputField label="Home Address" value={form.address} onChange={(v) => update("address", v)} placeholder="House No., Street, Purok" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Barangay in Butuan City</label>
                <select value={form.barangay} onChange={(e) => update("barangay", e.target.value)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select barangay…</option>
                  {BUTUAN_BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="border-t border-border/60 pt-4 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-foreground">Driver&apos;s License (LTO)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField label="License Number" value={form.licenseNumber} onChange={(v) => update("licenseNumber", v)} placeholder="D02-XX-XXXXXX" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Expiry Date</label>
                  <input type="date" value={form.licenseExpiry} onChange={(e) => update("licenseExpiry", e.target.value)}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Restriction Code</label>
                  <select value={form.licenseRestrictionCode} onChange={(e) => update("licenseRestrictionCode", e.target.value)}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="1">1 — Motorcycle</option>
                    <option value="2">2 — Light Vehicle</option>
                    <option value="3">3 — Medium Vehicle</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="border-t border-border/60 pt-4 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-foreground">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField label="Name" value={form.emergencyContactName} onChange={(v) => update("emergencyContactName", v)} placeholder="Full name" />
                <InputField label="Phone" value={form.emergencyContactPhone} onChange={(v) => update("emergencyContactPhone", v)} placeholder="+63 9XX XXX XXXX" />
                <InputField label="Relation" value={form.emergencyContactRelation} onChange={(v) => update("emergencyContactRelation", v)} placeholder="e.g. Spouse, Parent" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={goNext} className="font-semibold">Continue to Vehicle Info →</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Vehicle */}
      {currentStep === "vehicle" && (
        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-5 flex flex-col gap-5">
            <h2 className="font-heading text-base font-bold text-foreground border-b border-border/60 pb-3">Vehicle & Registration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Vehicle Type</label>
                <select value={form.vehicleType} onChange={(e) => update("vehicleType", e.target.value)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select type…</option>
                  <option value="motorcycle">Motorcycle (Habal-habal)</option>
                  <option value="tricycle">Tricycle</option>
                  <option value="electric_bike">Electric Bike (E-bike)</option>
                </select>
              </div>
              <InputField label="Make / Brand" value={form.vehicleMake} onChange={(v) => update("vehicleMake", v)} placeholder="e.g. Honda, Yamaha" />
              <InputField label="Model" value={form.vehicleModel} onChange={(v) => update("vehicleModel", v)} placeholder="e.g. Click 125i" />
              <InputField label="Year" value={form.vehicleYear} onChange={(v) => update("vehicleYear", v)} placeholder="e.g. 2022" />
              <InputField label="Plate Number (LTO)" value={form.plateNumber} onChange={(v) => update("plateNumber", v)} placeholder="e.g. 7718-HA" />
              <InputField label="Official Receipt (OR) No." value={form.orNumber} onChange={(v) => update("orNumber", v)} placeholder="OR-XXXX-XXXXXX" />
              <InputField label="Certificate of Registration (CR) No." value={form.crNumber} onChange={(v) => update("crNumber", v)} placeholder="CR-XXXX-XXXXXX" />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack} className="font-semibold gap-2"><HugeiconsIcon icon={ArrowLeft01Icon} size={15} /> Back</Button>
              <Button onClick={goNext} className="font-semibold">Continue to Documents →</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Documents */}
      {currentStep === "documents" && (
        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-5 flex flex-col gap-5">
            <h2 className="font-heading text-base font-bold text-foreground border-b border-border/60 pb-3">Document Upload</h2>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
              <HugeiconsIcon icon={InformationCircleIcon} size={15} className="shrink-0 mt-0.5" />
              <span>Document uploads are simulated in this preview phase. In production, documents will be securely stored and verified.</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Driver's License Photo", desc: "Clear photo of your valid LTO license (front & back)" },
                { label: "Vehicle Photo", desc: "Full exterior view of your registered vehicle" },
                { label: "OR/CR Photo", desc: "Official Receipt and Certificate of Registration" },
                { label: "Valid Government ID", desc: "UMID, Passport, PhilSys ID, or Voter's ID" },
                { label: "Profile Photo", desc: "Recent clear headshot on a plain background" },
              ].map((doc) => (
                <div key={doc.label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">{doc.label}</label>
                  <div className="h-24 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 flex flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground cursor-pointer hover:bg-muted/50 hover:border-primary/40 transition-all">
                    <HugeiconsIcon icon={File01Icon} size={20} className="text-muted-foreground/60" />
                    <span>Click to upload</span>
                    <span className="text-[10px]">{doc.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack} className="font-semibold gap-2"><HugeiconsIcon icon={ArrowLeft01Icon} size={15} /> Back</Button>
              <Button onClick={goNext} className="font-semibold">Review Application →</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Review */}
      {currentStep === "review" && (
        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-5 flex flex-col gap-5">
            <h2 className="font-heading text-base font-bold text-foreground border-b border-border/60 pb-3">Review Your Application</h2>
            <ReviewSection title="Personal Information">
              <ReviewItem label="Full Name" value={form.fullName || "—"} />
              <ReviewItem label="Contact Number" value={form.contactNumber || "—"} />
              <ReviewItem label="Address" value={`${form.address}${form.barangay ? `, Brgy. ${form.barangay}` : ""}, Butuan City`} />
              <ReviewItem label="LTO License" value={form.licenseNumber || "—"} />
              <ReviewItem label="License Expiry" value={form.licenseExpiry || "—"} />
              <ReviewItem label="Emergency Contact" value={`${form.emergencyContactName || "—"} (${form.emergencyContactRelation || "—"})`} />
            </ReviewSection>
            <ReviewSection title="Vehicle Information">
              <ReviewItem label="Type" value={form.vehicleType || "—"} />
              <ReviewItem label="Vehicle" value={[form.vehicleMake, form.vehicleModel, form.vehicleYear].filter(Boolean).join(" ") || "—"} />
              <ReviewItem label="Plate Number" value={form.plateNumber || "—"} />
              <ReviewItem label="OR No." value={form.orNumber || "—"} />
              <ReviewItem label="CR No." value={form.crNumber || "—"} />
            </ReviewSection>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground leading-relaxed">
              By submitting this application, I confirm that all information provided is accurate. I understand that falsified information will result in permanent disqualification.
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack} className="font-semibold gap-2"><HugeiconsIcon icon={ArrowLeft01Icon} size={15} /> Back</Button>
              <Button onClick={handleSubmit} className="font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />Submit Application
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60" />
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40">{children}</div>
    </div>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 gap-4">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[11px] font-semibold text-foreground text-right">{value}</span>
    </div>
  )
}
