"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Bookmark, Building2, CheckCircle2, Eye, MapPin, Send, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { JobApplicationModal } from "@/features/jobs/components/job-application-modal";
import { JobApplicationsPanel } from "@/features/jobs/components/job-applications-panel";
import { useJob, useToggleSaveJob } from "@/features/jobs/hooks/use-jobs";

export function JobDetailsView({ jobId }: { jobId: string }) {
  const { data: job, isLoading, error } = useJob(jobId);
  const save = useToggleSaveJob();
  const [showApplication, setShowApplication] = useState(false);
  const postedAt = useMemo(
    () =>
      job
        ? new Intl.DateTimeFormat("en", {
            month: "long",
            day: "numeric",
            year: "numeric"
          }).format(new Date(job.createdAt))
        : "",
    [job]
  );

  if (isLoading) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading job...</CardContent></Card>;
  }

  if (error || !job) {
    return (
      <Card>
        <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-semibold">Job not found</p>
          <Button asChild variant="outline">
            <Link href="/jobs">Back to jobs</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-w-0 flex-col gap-4">
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/jobs">
            <ArrowLeft /> Jobs
          </Link>
        </Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="grid size-14 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Building2 />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold tracking-normal">{job.title}</h1>
                <p className="mt-1 text-base font-medium">{job.company}</p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" /> {job.location} · {job.workplaceType} · {job.jobType}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">{job.experienceLevel}</Badge>
                  {job.salaryRange ? <Badge variant="secondary">{job.salaryRange}</Badge> : null}
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Separator className="my-5" />
            <div className="flex flex-wrap gap-2">
              <Button disabled={job.hasApplied} onClick={() => setShowApplication(true)}>
                {job.hasApplied ? <CheckCircle2 /> : <Send />}
                {job.hasApplied ? "Applied" : "Apply now"}
              </Button>
              <Button variant={job.isSaved ? "secondary" : "outline"} onClick={() => save.mutate(job)}>
                <Bookmark className={job.isSaved ? "fill-current" : undefined} />
                {job.isSaved ? "Saved" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About the job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-6">
            <p>{job.description}</p>
            <ListSection title="Responsibilities" items={job.responsibilities} />
            <ListSection title="Requirements" items={job.requirements} />
          </CardContent>
        </Card>
        <JobApplicationsPanel jobId={job.id} enabled={job.canManage} />
      </section>

      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Job activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <UsersRound className="size-4" /> {job.applicantsCount} applicants
            </p>
            <p className="flex items-center gap-2">
              <Eye className="size-4" /> {job.viewsCount} views
            </p>
            <p>Posted {postedAt}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Posted by</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-semibold">{job.postedBy.name}</p>
            <p className="text-muted-foreground">{job.postedBy.headline}</p>
          </CardContent>
        </Card>
      </aside>
      <JobApplicationModal job={job} open={showApplication} onOpenChange={setShowApplication} />
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-2 font-semibold">{title}</h2>
      <ul className="list-inside list-disc space-y-1 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
