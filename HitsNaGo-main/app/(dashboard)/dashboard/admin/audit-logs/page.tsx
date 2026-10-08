"use client"

import * as React from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Card } from "@/components/ui/card"

export interface AdminAuditLogRecord {
  id: string
  timestamp: string
  adminName: string
  action: string
  target: string
  ipAddress: string
  result: "success" | "warning"
  details: string
}

export default function AdminAuditLogsPage() {
  const [logs] = React.useState<AdminAuditLogRecord[]>([])
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [resultFilter, setResultFilter] = React.useState<string>("all")

  const filteredLogs = React.useMemo(() => {
    return logs.filter((l) => {
      const matchesSearch =
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.adminName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesResult = resultFilter === "all" || l.result === resultFilter

      return matchesSearch && matchesResult
    })
  }, [logs, searchQuery, resultFilter])

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Administrative Audit Logs"
        badgeText="Compliance & Security"
        description="Administrative activity history, authorization trails, and operational changes in Butuan City."
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search admin actions, targets, or details..."
        statusFilter={resultFilter}
        onStatusChange={setResultFilter}
        statusOptions={[
          { id: "all", label: "All Results" },
          { id: "success", label: "Success" },
          { id: "warning", label: "Warning / Flagged" },
        ]}
        totalResults={filteredLogs.length}
        onResetFilters={() => {
          setSearchQuery("")
          setResultFilter("all")
        }}
      />

      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin Officer</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">IP / Location</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <p className="font-semibold text-foreground">No audit logs recorded</p>
                    <p className="text-[11px]">System administrative actions will be logged here.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {log.adminName}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-primary">
                      {log.action}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {log.target}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                      {log.ipAddress}
                    </td>

                    <td className="py-3.5 px-4">
                      <AdminStatusBadge status={log.result} />
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground max-w-xs text-[11px] leading-snug">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
