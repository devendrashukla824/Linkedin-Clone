"use client";

import type { CreateJobApplicationInput, JobListing } from "@linkedin-clone/shared";
import { CheckCircle2, FileText, Send, Upload, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { currentUser } from "@/features/feed/data/mock-feed";
import { useSubmitJobApplication } from "@/features/jobs/hooks/use-jobs";
import { useAuthStore } from "@/stores/auth-store";

const maxResumeSize = 10 * 1024 * 1024;
const resumeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const applicationSchema = z.object({
  applicantName: z.string().min(2, "Full name is required"),
  phoneNumber: z.string().min(7, "Mobile number is required"),
  email: z.string().email("Enter a valid email address"),
  location: z.string().optional(),
  linkedinUrl: z.string().url("Enter a valid LinkedIn URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Enter a valid portfolio URL").optional().or(z.literal("")),
  experience: z.string().optional(),
  coverLetter: z.string().optional()
});

type ApplicationForm = CreateJobApplicationInput & { resume?: File };

export function JobApplicationModal({
  job,
  open,
  onOpenChange
}: {
  job: JobListing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const user = useAuthStore((state) => state.user) ?? currentUser;
  const submitApplication = useSubmitJobApplication();
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ApplicationForm>(() => ({
    applicantName: user.name,
    phoneNumber: user.contact.phone ?? "",
    email: user.email,
    location: user.location ?? user.contact.location ?? "",
    linkedinUrl: user.contact.linkedIn ?? "",
    portfolioUrl: user.contact.website ?? "",
    experience: "",
    coverLetter: ""
  }));

  const resumeLabel = useMemo(() => form.resume?.name ?? "Upload PDF or DOCX resume", [form.resume]);

  if (!open) {
    return null;
  }

  function setField<Key extends keyof ApplicationForm>(key: Key, value: ApplicationForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function validate() {
    const parsed = applicationSchema.safeParse(form);
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        nextErrors[String(issue.path[0])] = issue.message;
      });
    }
    if (!form.resume) {
      nextErrors.resume = "Resume upload is required";
    } else if (!resumeTypes.includes(form.resume.type)) {
      nextErrors.resume = "Resume must be a PDF or DOCX file";
    } else if (form.resume.size > maxResumeSize) {
      nextErrors.resume = "Resume must be 10 MB or smaller";
    }
    setErrors(nextErrors);
    return parsed.success && Object.keys(nextErrors).length === 0 && form.resume;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="my-6 w-full max-w-3xl rounded-lg border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">Apply to {job.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{job.company} - {job.location}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close application form" onClick={() => onOpenChange(false)}>
            <X />
          </Button>
        </div>
        <form
          className="grid gap-4 p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const resume = validate();
            if (!resume) {
              return;
            }
            submitApplication.mutate(
              { job, input: { ...form, resume } },
              {
                onSuccess: () => {
                  setSuccessMessage("Application submitted successfully.");
                },
                onError: (error) => setErrors({ form: error.message })
              }
            );
          }}
        >
          {successMessage ? (
            <div className="md:col-span-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mr-2 inline size-4" />
              {successMessage}
            </div>
          ) : null}
          {errors.form ? <p className="md:col-span-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errors.form}</p> : null}
          <Field label="Full Name" error={errors.applicantName}>
            <Input value={form.applicantName} onChange={(event) => setField("applicantName", event.target.value)} />
          </Field>
          <Field label="Mobile Number" error={errors.phoneNumber}>
            <Input value={form.phoneNumber} onChange={(event) => setField("phoneNumber", event.target.value)} />
          </Field>
          <Field label="Email Address" error={errors.email}>
            <Input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} />
          </Field>
          <Field label="Current Location" error={errors.location}>
            <Input value={form.location ?? ""} onChange={(event) => setField("location", event.target.value)} />
          </Field>
          <Field label="LinkedIn Profile URL" error={errors.linkedinUrl}>
            <Input value={form.linkedinUrl ?? ""} onChange={(event) => setField("linkedinUrl", event.target.value)} />
          </Field>
          <Field label="Portfolio Website URL" error={errors.portfolioUrl}>
            <Input value={form.portfolioUrl ?? ""} onChange={(event) => setField("portfolioUrl", event.target.value)} />
          </Field>
          <Field label="Years of Experience" error={errors.experience}>
            <Input value={form.experience ?? ""} onChange={(event) => setField("experience", event.target.value)} />
          </Field>
          <Field label="Resume" error={errors.resume}>
            <label className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-md border border-input bg-background px-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 truncate text-muted-foreground">
                <FileText className="size-4 shrink-0" />
                <span className="truncate">{resumeLabel}</span>
              </span>
              <Upload className="size-4 shrink-0" />
              <input
                className="hidden"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setField("resume", event.target.files?.[0])}
              />
            </label>
          </Field>
          <Field label="Cover Letter" error={errors.coverLetter} className="md:col-span-2">
            <Textarea className="min-h-32" value={form.coverLetter ?? ""} onChange={(event) => setField("coverLetter", event.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button disabled={submitApplication.isPending || Boolean(successMessage)}>
              <Send /> Submit application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-medium ${className ?? ""}`}>
      {label}
      {children}
      {error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}
    </label>
  );
}
