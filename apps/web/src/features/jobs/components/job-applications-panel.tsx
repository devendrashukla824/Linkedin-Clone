"use client";

import type { JobApplicationStatus } from "@linkedin-clone/shared";
import { Download, Mail, Phone, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useJobApplications, useUpdateApplicationStatus } from "@/features/jobs/hooks/use-jobs";

const statuses: JobApplicationStatus[] = ["Applied", "Reviewing", "Shortlisted", "Rejected", "Hired"];

export function JobApplicationsPanel({ jobId, enabled }: { jobId: string; enabled: boolean }) {
  const { data: applications = [], isLoading, error } = useJobApplications(jobId, enabled);
  const updateStatus = useUpdateApplicationStatus(jobId);

  if (!enabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersRound /> Applications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading applications...</p> : null}
        {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error.message}</p> : null}
        {!isLoading && !applications.length ? (
          <p className="rounded-md border bg-secondary/40 p-3 text-sm text-muted-foreground">No applications yet.</p>
        ) : null}
        {applications.map((application) => (
          <div key={application.id} className="rounded-md border p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{application.applicantName}</p>
                  <Badge variant="secondary">{application.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{application.location || "Location not provided"}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="size-4" /> {application.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="size-4" /> {application.phoneNumber}
                  </span>
                </div>
                {application.coverLetter ? <p className="mt-3 line-clamp-3 text-sm leading-6">{application.coverLetter}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {application.linkedinUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={application.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>
                    </Button>
                  ) : null}
                  {application.portfolioUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={application.portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a>
                    </Button>
                  ) : null}
                  <Button asChild variant="outline" size="sm">
                    <a href={application.resumeUrl} target="_blank" rel="noreferrer" download>
                      <Download /> Resume
                    </a>
                  </Button>
                </div>
              </div>
              <label className="flex min-w-44 flex-col gap-1 text-xs font-medium text-muted-foreground">
                Status
                <select
                  value={application.status}
                  disabled={updateStatus.isPending}
                  onChange={(event) =>
                    updateStatus.mutate({
                      applicationId: application.id,
                      status: event.target.value as JobApplicationStatus
                    })
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
