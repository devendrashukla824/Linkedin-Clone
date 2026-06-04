"use client";

import type { CreateJobInput, ExperienceLevel, JobFilters, JobListing, JobType, WorkplaceType } from "@linkedin-clone/shared";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Search,
  Send,
  Trash2,
  UsersRound,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { JobApplicationModal } from "@/features/jobs/components/job-application-modal";
import {
  useCreateJob,
  useDeleteJob,
  useJobs,
  useToggleSaveJob,
  useUpdateJob
} from "@/features/jobs/hooks/use-jobs";

const workplaceTypes: Array<WorkplaceType | "All"> = ["All", "Remote", "Hybrid", "On-site"];
const jobTypes: Array<JobType | "All"> = ["All", "Full-time", "Part-time", "Contract", "Internship"];
const experienceLevels: Array<ExperienceLevel | "All"> = [
  "All",
  "Internship",
  "Entry level",
  "Associate",
  "Mid-Senior level",
  "Director"
];

const emptyJob: CreateJobInput = {
  title: "",
  company: "",
  location: "",
  workplaceType: "Remote",
  jobType: "Full-time",
  experienceLevel: "Associate",
  salaryRange: "",
  description: "",
  responsibilities: [],
  requirements: [],
  skills: []
};

export function JobsView() {
  const [filters, setFilters] = useState<JobFilters>({ page: 1, limit: 3, sort: "recent", workplaceType: "All", jobType: "All", experienceLevel: "All" });
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | undefined>();
  const { data, isFetching, error } = useJobs(filters);
  const jobs = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 3)));

  function updateFilters(next: Partial<JobFilters>) {
    setFilters((current) => ({ ...current, ...next, page: next.page ?? 1 }));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search /> Advanced search
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input value={filters.query ?? ""} onChange={(event) => updateFilters({ query: event.target.value })} placeholder="Search title, company or skill" />
            <Input value={filters.location ?? ""} onChange={(event) => updateFilters({ location: event.target.value })} placeholder="Location" />
            <SelectField label="Workplace" value={filters.workplaceType ?? "All"} options={workplaceTypes} onChange={(value) => updateFilters({ workplaceType: value as JobFilters["workplaceType"] })} />
            <SelectField label="Job type" value={filters.jobType ?? "All"} options={jobTypes} onChange={(value) => updateFilters({ jobType: value as JobFilters["jobType"] })} />
            <SelectField label="Experience" value={filters.experienceLevel ?? "All"} options={experienceLevels} onChange={(value) => updateFilters({ experienceLevel: value as JobFilters["experienceLevel"] })} />
            <SelectField label="Sort" value={filters.sort ?? "recent"} options={["recent", "relevant", "applicants"]} onChange={(value) => updateFilters({ sort: value as JobFilters["sort"] })} />
            <Button variant="outline" onClick={() => setFilters({ page: 1, limit: 3, sort: "recent", workplaceType: "All", jobType: "All", experienceLevel: "All" })}>
              <X /> Clear filters
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BriefcaseBusiness /> Hiring tools
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Open jobs" value={data?.total ?? 0} />
              <Metric label="Saved" value={jobs.filter((job) => job.isSaved).length} />
            </div>
            <Button
              onClick={() => {
                setEditingJob(undefined);
                setShowForm((current) => !current);
              }}
            >
              <Plus /> Post a job
            </Button>
          </CardContent>
        </Card>
      </aside>

      <section className="flex min-w-0 flex-col gap-4">
        {showForm || editingJob ? (
          <JobForm
            job={editingJob}
            onCancel={() => {
              setEditingJob(undefined);
              setShowForm(false);
            }}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Jobs</h1>
            <p className="text-sm text-muted-foreground">
              {data?.total ?? 0} matching roles {isFetching ? "refreshing..." : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Page {filters.page ?? 1} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={(filters.page ?? 1) <= 1} onClick={() => updateFilters({ page: Math.max(1, (filters.page ?? 1) - 1) })}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!data?.hasMore} onClick={() => updateFilters({ page: (filters.page ?? 1) + 1 })}>
              Next
            </Button>
          </div>
        </div>

        {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error.message}</p> : null}
        {jobs.length ? jobs.map((job) => <JobCard key={job.id} job={job} onEdit={() => setEditingJob(job)} />) : <EmptyJobs />}
      </section>
    </div>
  );
}

function JobCard({ job, onEdit }: { job: JobListing; onEdit: () => void }) {
  const [showApplication, setShowApplication] = useState(false);
  const save = useToggleSaveJob();
  const remove = useDeleteJob();
  const postedAt = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric"
      }).format(new Date(job.createdAt)),
    [job.createdAt]
  );

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="grid size-12 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Building2 />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/jobs/${job.id}`} className="text-lg font-semibold text-primary hover:underline">
                  {job.title}
                </Link>
                <p className="text-sm font-medium">{job.company}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" /> {job.location} · {job.workplaceType} · {job.jobType}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant={job.isSaved ? "secondary" : "outline"} size="icon" aria-label="Save job" onClick={() => save.mutate(job)}>
                  <Bookmark className={job.isSaved ? "fill-current" : undefined} />
                </Button>
                {job.canManage ? (
                  <>
                    <Button variant="outline" size="icon" aria-label="Edit job" onClick={onEdit}>
                      <Edit3 />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete job" onClick={() => remove.mutate(job.id)}>
                      <Trash2 />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{job.experienceLevel}</Badge>
              {job.salaryRange ? <Badge variant="secondary">{job.salaryRange}</Badge> : null}
              {job.skills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UsersRound className="size-4" /> {job.applicantsCount} applicants
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="size-4" /> {job.viewsCount} views
                </span>
                <span>Posted {postedAt}</span>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/jobs/${job.id}`}>Details</Link>
                </Button>
                <Button size="sm" disabled={job.hasApplied} onClick={() => setShowApplication(true)}>
                  {job.hasApplied ? <CheckCircle2 /> : <Send />}
                  {job.hasApplied ? "Applied" : "Apply Now"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <JobApplicationModal job={job} open={showApplication} onOpenChange={setShowApplication} />
    </Card>
  );
}

function JobForm({ job, onCancel }: { job?: JobListing; onCancel: () => void }) {
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const [form, setForm] = useState<CreateJobInput>(() =>
    job
      ? {
          title: job.title,
          company: job.company,
          companyLogoUrl: job.companyLogoUrl,
          location: job.location,
          workplaceType: job.workplaceType,
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          salaryRange: job.salaryRange,
          description: job.description,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          skills: job.skills
        }
      : emptyJob
  );

  const canSubmit = form.title.trim() && form.company.trim() && form.location.trim() && form.description.trim().length >= 20;
  const isPending = createJob.isPending || updateJob.isPending;

  function setField<Key extends keyof CreateJobInput>(key: Key, value: CreateJobInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{job ? "Edit job" : "Post a job"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) {
              return;
            }
            const payload = normalizeForm(form);
            const options = { onSuccess: onCancel };
            if (job) {
              updateJob.mutate({ jobId: job.id, input: payload }, options);
            } else {
              createJob.mutate(payload, options);
            }
          }}
        >
          <Input value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="Job title" />
          <Input value={form.company} onChange={(event) => setField("company", event.target.value)} placeholder="Company" />
          <Input value={form.location} onChange={(event) => setField("location", event.target.value)} placeholder="Location" />
          <Input value={form.salaryRange ?? ""} onChange={(event) => setField("salaryRange", event.target.value)} placeholder="Salary range" />
          <SelectField label="Workplace" value={form.workplaceType} options={workplaceTypes.filter((item) => item !== "All")} onChange={(value) => setField("workplaceType", value as WorkplaceType)} />
          <SelectField label="Job type" value={form.jobType} options={jobTypes.filter((item) => item !== "All")} onChange={(value) => setField("jobType", value as JobType)} />
          <div className="md:col-span-2">
            <SelectField
              label="Experience level"
              value={form.experienceLevel}
              options={experienceLevels.filter((item) => item !== "All")}
              onChange={(value) => setField("experienceLevel", value as ExperienceLevel)}
            />
          </div>
          <Textarea className="min-h-28 md:col-span-2" value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="Job description" />
          <Textarea className="min-h-24" value={form.responsibilities.join("\n")} onChange={(event) => setField("responsibilities", lines(event.target.value))} placeholder="Responsibilities" />
          <Textarea className="min-h-24" value={form.requirements.join("\n")} onChange={(event) => setField("requirements", lines(event.target.value))} placeholder="Requirements" />
          <Input className="md:col-span-2" value={form.skills.join(", ")} onChange={(event) => setField("skills", event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean))} placeholder="Skills, separated by commas" />
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button disabled={!canSubmit || isPending}>
              <Send /> {job ? "Save changes" : "Publish job"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-secondary/50 p-3">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p>{label}</p>
    </div>
  );
}

function EmptyJobs() {
  return (
    <Card>
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <BriefcaseBusiness className="size-10" />
        <p className="font-medium text-foreground">No jobs found</p>
        <p className="max-w-sm text-sm">Try a different search, clear filters, or post a new role for your network.</p>
      </CardContent>
    </Card>
  );
}

function normalizeForm(form: CreateJobInput): CreateJobInput {
  return {
    ...form,
    title: form.title.trim(),
    company: form.company.trim(),
    companyLogoUrl: form.companyLogoUrl?.trim() || undefined,
    location: form.location.trim(),
    salaryRange: form.salaryRange?.trim() || undefined,
    description: form.description.trim(),
    responsibilities: form.responsibilities.map((item) => item.trim()).filter(Boolean),
    requirements: form.requirements.map((item) => item.trim()).filter(Boolean),
    skills: form.skills.map((item) => item.trim()).filter(Boolean)
  };
}

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
