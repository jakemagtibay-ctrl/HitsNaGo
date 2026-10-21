"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Clock01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  ShieldCheckIcon,
  Upload01Icon,
  Image01Icon,
  Delete02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { applyToBecomeRider, type UserRoleApplicationSummary } from "@/lib/actions/bookings"
import { GOVERNMENT_ID_OPTIONS, type GovernmentIdType } from "@/types/verification"
import { cn } from "@/lib/utils"

interface RiderApplicationFormProps {
  initialStatus?: {
    isPending: boolean
    isVerified: boolean
  }
  initialData?: UserRoleApplicationSummary | null
}

export function RiderApplicationForm({ initialStatus, initialData }: RiderApplicationFormProps) {
  const currentStatus = initialData?.status || (initialStatus?.isVerified ? "verified" : initialStatus?.isPending ? "pending" : "unverified")

  const [status, setStatus] = React.useState(currentStatus)
  const [name, setName] = React.useState(initialData?.name || "")
  const [phone, setPhone] = React.useState(initialData?.phone || "")
  const [vehicleModel, setVehicleModel] = React.useState(initialData?.vehicleModel || "")
  const [plateNumber, setPlateNumber] = React.useState(initialData?.plateNumber || "")
  const [idType, setIdType] = React.useState<GovernmentIdType>(
    (initialData?.idType as GovernmentIdType) || "philippine_national_id"
  )
  const [customIdType, setCustomIdType] = React.useState(initialData?.idTypeCustom || "")
  const [frontImage, setFrontImage] = React.useState<File | null>(null)
  const [frontPreview, setFrontPreview] = React.useState<string | null>(null)
  const [backImage, setBackImage] = React.useState<File | null>(null)
  const [backPreview, setBackPreview] = React.useState<string | null>(null)
  const [certified, setCertified] = React.useState(false)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")
  const [successMessage, setSuccessMessage] = React.useState("")
  const [showFormAnyway, setShowFormAnyway] = React.useState(false)

  const selectedIdOption = GOVERNMENT_ID_OPTIONS.find((opt) => opt.id === idType) || GOVERNMENT_ID_OPTIONS[0]

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview)
      if (backPreview) URL.revokeObjectURL(backPreview)
    }
  }, [frontPreview, backPreview])

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Front image exceeds 5MB limit. Please choose a smaller image.")
      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Unsupported file format. Please upload JPG, PNG, or WebP.")
      return
    }

    setErrorMessage("")
    setFrontImage(file)
    if (frontPreview) URL.revokeObjectURL(frontPreview)
    setFrontPreview(URL.createObjectURL(file))
  }

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Back image exceeds 5MB limit. Please choose a smaller image.")
      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Unsupported file format. Please upload JPG, PNG, or WebP.")
      return
    }

    setErrorMessage("")
    setBackImage(file)
    if (backPreview) URL.revokeObjectURL(backPreview)
    setBackPreview(URL.createObjectURL(file))
  }

  const handleRemoveFront = () => {
    if (frontPreview) URL.revokeObjectURL(frontPreview)
    setFrontImage(null)
    setFrontPreview(null)
  }

  const handleRemoveBack = () => {
    if (backPreview) URL.revokeObjectURL(backPreview)
    setBackImage(null)
    setBackPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!name.trim() || !phone.trim() || !vehicleModel.trim() || !plateNumber.trim()) {
      setErrorMessage("Please fill in all personal and vehicle fields.")
      return
    }

    if (idType === "other" && !customIdType.trim()) {
      setErrorMessage("Please specify the type of government ID.")
      return
    }

    if (!frontImage) {
      setErrorMessage("Please upload a clear front image of your government-issued ID.")
      return
    }

    if (selectedIdOption.requiresBack && !backImage) {
      setErrorMessage(`A clear back image is required for ${selectedIdOption.label}.`)
      return
    }

    if (!certified) {
      setErrorMessage("Please confirm the accuracy certification before submitting.")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("phone", phone.trim())
    formData.append("vehicleModel", vehicleModel.trim())
    formData.append("plateNumber", plateNumber.trim())
    formData.append("idType", idType)
    if (idType === "other") {
      formData.append("customIdType", customIdType.trim())
    }
    formData.append("certification", "true")
    formData.append("frontImage", frontImage)
    if (backImage) {
      formData.append("backImage", backImage)
    }

    const res = await applyToBecomeRider(formData)

    if (res.error) {
      setErrorMessage(res.error)
      setIsSubmitting(false)
      return
    }

    setStatus("pending")
    setShowFormAnyway(false)
    setIsSubmitting(false)
    setSuccessMessage("Your ID documents have been uploaded securely. Your application is now queued for administrator review.")
  }

  // 1. Approved state
  if (status === "verified") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} />
        </div>
        <Badge className="bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs">
          <HugeiconsIcon icon={ShieldCheckIcon} size={13} />
          <span>Verified Rider Account</span>
        </Badge>
        <h1 className="font-heading text-2xl font-bold text-foreground">You are an Approved Rider</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your government-issued ID has been verified by the administrator. You now have full access to accept passenger rides, motorcycle dispatches, and deliveries in Butuan City.
        </p>
        <Link
          href="/dashboard/rider"
          className={cn(buttonVariants({ size: "default" }), "text-xs font-semibold mt-2 gap-1.5")}
        >
          <HugeiconsIcon icon={Motorbike01Icon} size={15} />
          <span>Open Rider Console</span>
        </Link>
      </div>
    )
  }

  // 2. Pending state (and user not choosing to update documents)
  if (status === "pending" && !showFormAnyway) {
    return (
      <div className="max-w-md mx-auto py-8 flex flex-col gap-5">
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-xs overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <HugeiconsIcon icon={Clock01Icon} size={28} />
            </div>
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs self-center">
                Review in Progress
              </Badge>
              <h2 className="font-heading text-lg font-bold text-foreground mt-2">
                Rider Verification Pending
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your government-issued ID documents have been submitted and are in the administrator review queue. Once verified, you will receive a notification and your Rider Console will be unlocked.
              </p>
            </div>

            {initialData?.submittedAt && (
              <div className="w-full rounded-xl bg-card border border-border/80 p-3 text-left text-xs text-muted-foreground flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Document Type:</span>
                  <span className="font-semibold text-foreground">
                    {GOVERNMENT_ID_OPTIONS.find((o) => o.id === initialData.idType)?.label || initialData.idType || "Government ID"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Submitted Date:</span>
                  <span className="font-semibold text-foreground">
                    {new Date(initialData.submittedAt).toLocaleDateString("en-PH", {
                      dateStyle: "medium",
                      timeZone: "Asia/Manila",
                    })}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 w-full pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFormAnyway(true)}
                className="flex-1 text-xs gap-1.5"
              >
                <HugeiconsIcon icon={Upload01Icon} size={14} />
                <span>Replace Documents</span>
              </Button>
              <Link
                href="/dashboard/customer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "flex-1 text-xs")}
              >
                Back to Portal
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 3. Application form (Unverified, Resubmission Required, or Replace)
  return (
    <div className="max-w-xl mx-auto py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={Motorbike01Icon} size={20} />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">Become a Verified Rider</h1>
            <p className="text-xs text-muted-foreground">
              Butuan City transport fleet • Government ID verification required
            </p>
          </div>
        </div>
      </div>

      {/* Resubmission alert */}
      {status === "resubmission_required" && (
        <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 text-xs flex flex-col gap-2 text-orange-950 dark:text-orange-200">
          <div className="flex items-center gap-2 font-bold text-orange-800 dark:text-orange-300">
            <HugeiconsIcon icon={AlertCircleIcon} size={16} />
            <span>Action Required: Administrator Requested Resubmission</span>
          </div>
          <p className="leading-relaxed">
            {initialData?.rejectionReason ? (
              <>
                <strong>Reason:</strong> {initialData.rejectionReason}
              </>
            ) : (
              "Please provide clearer photos of your government ID to complete verification."
            )}
          </p>
          <span className="text-[11px] opacity-80">
            Update your information and upload fresh, clear images below.
          </span>
        </div>
      )}

      {/* Rejection alert */}
      {status === "rejected" && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs flex flex-col gap-2 text-destructive">
          <div className="flex items-center gap-2 font-bold">
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
            <span>Application Declined</span>
          </div>
          <p className="leading-relaxed">
            {initialData?.rejectionReason ? (
              <>
                <strong>Admin Feedback:</strong> {initialData.rejectionReason}
              </>
            ) : (
              "Your previous submission could not be verified. You may correct your details and re-apply."
            )}
          </p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between gap-2">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <Card className="border-border/80 bg-card shadow-xs">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Step 1: Personal and Vehicle details */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                1. Personal & Vehicle Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-foreground">
                    Full Legal Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Danilo R. Reyes"
                    className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-foreground">
                    Mobile Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +63 920 555 7890"
                    className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="vehicleModel" className="text-xs font-semibold text-foreground">
                    Motorcycle Make & Model *
                  </label>
                  <input
                    id="vehicleModel"
                    type="text"
                    required
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. Yamaha NMAX 155"
                    className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="plateNumber" className="text-xs font-semibold text-foreground">
                    Plate / MV File Number *
                  </label>
                  <input
                    id="plateNumber"
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="e.g. 7718-HA or BXU-4491"
                    className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Government ID Selection */}
            <div className="flex flex-col gap-3 pt-2 border-t border-border/60">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  2. Government-Issued ID Document
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Select your government identification document. Clear front and back photos are required for vetting.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="idType" className="text-xs font-semibold text-foreground">
                  Select ID Type *
                </label>
                <select
                  id="idType"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as GovernmentIdType)}
                  className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {GOVERNMENT_ID_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground">{selectedIdOption.description}</span>
              </div>

              {idType === "other" && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="customIdType" className="text-xs font-semibold text-foreground">
                    Specify Government ID Type *
                  </label>
                  <input
                    id="customIdType"
                    type="text"
                    required
                    value={customIdType}
                    onChange={(e) => setCustomIdType(e.target.value)}
                    placeholder="e.g. Postal ID, PRC License, Voter's Certification"
                    className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>

            {/* Step 3: Photo Uploads */}
            <div className="flex flex-col gap-3 pt-2 border-t border-border/60">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                3. ID Photo Uploads
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Front Image Dropzone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Front Photo of ID *</span>
                    <span className="text-[10px] text-muted-foreground">Max 5MB (JPG, PNG, WebP)</span>
                  </label>

                  {frontPreview ? (
                    <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-2 flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={frontPreview}
                        alt="Front ID Preview"
                        className="h-32 w-full object-cover rounded-lg border border-border/60"
                      />
                      <div className="flex items-center justify-between w-full px-1">
                        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                          {frontImage?.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFront}
                          className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={12} className="mr-1" />
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="frontImage"
                      className="flex flex-col items-center justify-center h-32 px-4 rounded-xl border-2 border-dashed border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer text-center gap-1.5"
                    >
                      <HugeiconsIcon icon={Image01Icon} size={22} className="text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">Click to upload Front photo</span>
                      <span className="text-[10px] text-muted-foreground">Ensure text and photo are readable</span>
                      <input
                        id="frontImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFrontFileChange}
                      />
                    </label>
                  )}
                </div>

                {/* Back Image Dropzone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>
                      Back Photo of ID {selectedIdOption.requiresBack ? "*" : "(Optional)"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Max 5MB (JPG, PNG, WebP)</span>
                  </label>

                  {backPreview ? (
                    <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-2 flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={backPreview}
                        alt="Back ID Preview"
                        className="h-32 w-full object-cover rounded-lg border border-border/60"
                      />
                      <div className="flex items-center justify-between w-full px-1">
                        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                          {backImage?.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveBack}
                          className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={12} className="mr-1" />
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : selectedIdOption.requiresBack ? (
                    <label
                      htmlFor="backImage"
                      className="flex flex-col items-center justify-center h-32 px-4 rounded-xl border-2 border-dashed border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer text-center gap-1.5"
                    >
                      <HugeiconsIcon icon={Image01Icon} size={22} className="text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">Click to upload Back photo</span>
                      <span className="text-[10px] text-muted-foreground">Ensure barcode / QR is clear</span>
                      <input
                        id="backImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleBackFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 px-4 rounded-xl border border-border/50 bg-muted/10 text-center gap-1">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground font-medium">
                        Not required for Philippine Passport
                      </span>
                      <span className="text-[10px] text-muted-foreground/80">
                        Passport data page is sufficient
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Certification Checkbox */}
            <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
              <input
                id="certification"
                type="checkbox"
                required
                checked={certified}
                onChange={(e) => setCertified(e.target.checked)}
                className="size-4 mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="certification" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                <strong className="text-foreground">Certification & Accuracy Declaration:</strong> I certify under penalty of perjury that the submitted government-issued ID belongs to me, that all details provided are true and accurate, and that the uploaded photos are clear and unaltered.
              </label>
            </div>

            {/* Privacy Notice Box */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
              <HugeiconsIcon icon={ShieldCheckIcon} size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block mb-0.5">
                  Privacy Notice (Data Privacy Act of 2012 / RA 10173):
                </strong>
                Your government-issued ID is collected exclusively for identity verification and platform safety. Document files are stored in an encrypted private vault, accessed strictly by authorized compliance administrators, and retained in accordance with our data retention schedule.
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-xs font-semibold h-10 gap-1.5 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading Encrypted Documents & Submitting...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Upload01Icon} size={15} />
                  <span>
                    {status === "resubmission_required"
                      ? "Resubmit Verification Documents"
                      : "Submit Rider Verification Application"}
                  </span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
