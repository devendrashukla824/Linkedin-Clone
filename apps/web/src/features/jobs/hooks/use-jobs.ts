"use client";

import type {
  CreateJobApplicationInput,
  CreateJobInput,
  JobApplication,
  JobApplicationStatus,
  JobFilters,
  JobListing,
  PaginatedResponse,
  UpdateJobInput
} from "@linkedin-clone/shared";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { DEMO_ACCESS_TOKEN } from "@/features/auth/data/demo-user";
import { currentUser } from "@/features/feed/data/mock-feed";
import {
  applyJob,
  createJob,
  deleteJob,
  fetchJob,
  fetchJobApplications,
  fetchJobs,
  submitJobApplication,
  toggleSaveJob,
  updateJob,
  updateJobApplicationStatus
} from "@/features/jobs/api/jobs-api";
import { mockJobs } from "@/features/jobs/data/mock-jobs";
import { addNotificationToCache, createDemoNotification } from "@/features/notifications/hooks/use-notifications";
import { useAuthStore } from "@/stores/auth-store";

let demoJobs = [...mockJobs];
let demoApplications: JobApplication[] = [];

export const jobsKeys = {
  all: ["jobs"] as const,
  list: (filters: JobFilters) => [...jobsKeys.all, "list", filters] as const,
  detail: (id: string) => [...jobsKeys.all, "detail", id] as const,
  applications: (jobId: string) => [...jobsKeys.all, "applications", jobId] as const
};

export function useJobs(filters: JobFilters) {
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useQuery({
    queryKey: jobsKeys.list(filters),
    queryFn: () => (isDemo ? Promise.resolve(filterDemoJobs(filters)) : fetchJobs(filters)),
    placeholderData: (previous) => previous,
    retry: false
  });
}

export function useJob(jobId: string) {
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useQuery({
    queryKey: jobsKeys.detail(jobId),
    queryFn: () => {
      if (!isDemo) {
        return fetchJob(jobId);
      }
      const job = demoJobs.find((item) => item.id === jobId);
      if (!job) {
        throw new Error("Job not found");
      }
      return Promise.resolve({ ...job, viewsCount: job.viewsCount + 1 });
    },
    retry: false
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: (input: CreateJobInput) => {
      if (!isDemo) {
        return createJob(input);
      }
      const user = useAuthStore.getState().user ?? currentUser;
      const now = new Date().toISOString();
      const job: JobListing = {
        ...input,
        id: `demo-job-${Date.now()}`,
        postedBy: {
          id: user.id,
          name: user.name,
          headline: user.headline,
          avatarUrl: user.avatarUrl
        },
        applicantsCount: 0,
        viewsCount: 0,
        hasApplied: false,
        isSaved: false,
        canManage: true,
        createdAt: now,
        updatedAt: now
      };
      demoJobs = [job, ...demoJobs];
      return Promise.resolve(job);
    },
    onSuccess: (job) => {
      queryClient.setQueryData(jobsKeys.detail(job.id), job);
      void queryClient.invalidateQueries({ queryKey: jobsKeys.all });
    }
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: ({ jobId, input }: { jobId: string; input: UpdateJobInput }) => {
      if (!isDemo) {
        return updateJob(jobId, input);
      }
      const now = new Date().toISOString();
      demoJobs = demoJobs.map((job) => (job.id === jobId ? { ...job, ...input, updatedAt: now } : job));
      const job = demoJobs.find((item) => item.id === jobId);
      if (!job) {
        throw new Error("Job not found");
      }
      return Promise.resolve(job);
    },
    onSuccess: (job) => {
      queryClient.setQueryData(jobsKeys.detail(job.id), job);
      void queryClient.invalidateQueries({ queryKey: jobsKeys.all });
    }
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: (jobId: string) => {
      if (!isDemo) {
        return deleteJob(jobId);
      }
      demoJobs = demoJobs.filter((job) => job.id !== jobId);
      return Promise.resolve({ deleted: true });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobsKeys.all });
    }
  });
}

export function useApplyJob() {
  return useJobAction(
    (job) => ({
      ...job,
      hasApplied: true,
      applicantsCount: job.hasApplied ? job.applicantsCount : job.applicantsCount + 1
    }),
    applyJob,
    (queryClient, job) => {
      addNotificationToCache(
        queryClient,
        createDemoNotification({
          actor: job.postedBy,
          type: "job_application",
          title: `Application sent to ${job.company}`,
          body: `You applied to ${job.title}.`,
          entityId: job.id,
          entityType: "job",
          href: `/jobs/${job.id}`
        })
      );
    }
  );
}

export function useSubmitJobApplication() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;
  const user = useAuthStore((state) => state.user) ?? currentUser;

  return useMutation({
    mutationFn: async ({ job, input }: { job: JobListing; input: CreateJobApplicationInput & { resume: File } }) => {
      if (!isDemo) {
        return submitJobApplication(job.id, input);
      }
      if (demoApplications.some((application) => application.jobId === job.id && application.applicantUserId === user.id)) {
        throw new Error("You have already applied to this job");
      }
      const now = new Date().toISOString();
      const resumeUrl = URL.createObjectURL(input.resume);
      const application: JobApplication = {
        id: `demo-application-${Date.now()}`,
        applicantName: input.applicantName,
        phoneNumber: input.phoneNumber,
        email: input.email,
        location: input.location,
        linkedinUrl: input.linkedinUrl,
        portfolioUrl: input.portfolioUrl,
        experience: input.experience,
        coverLetter: input.coverLetter,
        resumeUrl,
        resumeFileName: input.resume.name,
        jobId: job.id,
        jobTitle: job.title,
        applicantUserId: user.id,
        status: "Applied",
        appliedAt: now,
        updatedAt: now
      };
      demoApplications = [application, ...demoApplications];
      demoJobs = demoJobs.map((item) =>
        item.id === job.id
          ? { ...item, hasApplied: true, applicantsCount: item.hasApplied ? item.applicantsCount : item.applicantsCount + 1 }
          : item
      );
      return application;
    },
    onSuccess: (application, { job }) => {
      const updatedJob = demoJobs.find((item) => item.id === job.id) ?? {
        ...job,
        hasApplied: true,
        applicantsCount: job.hasApplied ? job.applicantsCount : job.applicantsCount + 1
      };
      queryClient.setQueryData(jobsKeys.detail(job.id), updatedJob);
      queryClient.setQueryData<JobApplication[]>(jobsKeys.applications(job.id), (items = []) => {
        if (items.some((item) => item.id === application.id)) {
          return items;
        }
        return [application, ...items];
      });
      void queryClient.invalidateQueries({ queryKey: jobsKeys.all });
      if (isDemo) {
        addNotificationToCache(
          queryClient,
          createDemoNotification({
            actor: job.postedBy,
            type: "job_application",
            title: `Application sent to ${job.company}`,
            body: `You applied to ${job.title}.`,
            entityId: job.id,
            entityType: "job",
            href: `/jobs/${job.id}`
          })
        );
      }
    }
  });
}

export function useJobApplications(jobId: string, enabled = true) {
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useQuery({
    queryKey: jobsKeys.applications(jobId),
    queryFn: () =>
      isDemo
        ? Promise.resolve(demoApplications.filter((application) => application.jobId === jobId))
        : fetchJobApplications(jobId),
    enabled,
    retry: false
  });
}

export function useUpdateApplicationStatus(jobId: string) {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: JobApplicationStatus }) => {
      if (!isDemo) {
        return updateJobApplicationStatus(applicationId, status);
      }
      demoApplications = demoApplications.map((application) =>
        application.id === applicationId ? { ...application, status, updatedAt: new Date().toISOString() } : application
      );
      const application = demoApplications.find((item) => item.id === applicationId);
      if (!application) {
        throw new Error("Application not found");
      }
      return Promise.resolve(application);
    },
    onMutate: async ({ applicationId, status }) => {
      await queryClient.cancelQueries({ queryKey: jobsKeys.applications(jobId) });
      const previous = queryClient.getQueryData<JobApplication[]>(jobsKeys.applications(jobId));
      queryClient.setQueryData<JobApplication[]>(jobsKeys.applications(jobId), (items = []) =>
        items.map((application) =>
          application.id === applicationId ? { ...application, status, updatedAt: new Date().toISOString() } : application
        )
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(jobsKeys.applications(jobId), context.previous);
      }
    },
    onSuccess: (application) => {
      queryClient.setQueryData<JobApplication[]>(jobsKeys.applications(jobId), (items = []) =>
        items.map((item) => (item.id === application.id ? application : item))
      );
    }
  });
}

export function useToggleSaveJob() {
  return useJobAction((job) => ({ ...job, isSaved: !job.isSaved }), toggleSaveJob);
}

function useJobAction(
  updater: (job: JobListing) => JobListing,
  apiAction: (jobId: string) => Promise<JobListing>,
  afterDemoSuccess?: (queryClient: QueryClient, job: JobListing) => void
) {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: (job: JobListing) => {
      if (!isDemo) {
        return apiAction(job.id);
      }
      const updated = updater(job);
      demoJobs = demoJobs.map((item) => (item.id === job.id ? updated : item));
      return Promise.resolve(updated);
    },
    onMutate: async (job) => {
      await queryClient.cancelQueries({ queryKey: jobsKeys.all });
      const previousDetail = queryClient.getQueryData<JobListing>(jobsKeys.detail(job.id));
      const updated = updater(job);
      queryClient.setQueryData(jobsKeys.detail(job.id), updated);
      return { previousDetail, jobId: job.id };
    },
    onSuccess: (job) => {
      queryClient.setQueryData(jobsKeys.detail(job.id), job);
      void queryClient.invalidateQueries({ queryKey: jobsKeys.all });
      if (isDemo) {
        afterDemoSuccess?.(queryClient, job);
      }
    },
    onError: (_error, _job, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(jobsKeys.detail(context.jobId), context.previousDetail);
      }
    }
  });
}

function filterDemoJobs(filters: JobFilters): PaginatedResponse<JobListing> {
  const page = Math.max(1, Number(filters.page ?? 1));
  const limit = Math.max(1, Number(filters.limit ?? 6));
  const query = filters.query?.trim().toLowerCase();
  const location = filters.location?.trim().toLowerCase();

  const filtered = demoJobs.filter((job) => {
    const searchable = [job.title, job.company, job.description, job.location, ...job.skills].join(" ").toLowerCase();
    return (
      (!query || searchable.includes(query)) &&
      (!location || job.location.toLowerCase().includes(location)) &&
      (!filters.workplaceType || filters.workplaceType === "All" || job.workplaceType === filters.workplaceType) &&
      (!filters.jobType || filters.jobType === "All" || job.jobType === filters.jobType) &&
      (!filters.experienceLevel || filters.experienceLevel === "All" || job.experienceLevel === filters.experienceLevel)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (filters.sort === "applicants") {
      return b.applicantsCount - a.applicantsCount;
    }
    if (filters.sort === "relevant") {
      return b.viewsCount - a.viewsCount;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const start = (page - 1) * limit;

  return {
    items: sorted.slice(start, start + limit),
    page,
    limit,
    total: sorted.length,
    hasMore: start + limit < sorted.length
  };
}
