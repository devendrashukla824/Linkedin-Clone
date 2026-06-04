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
import { apiClient } from "@/lib/api-client";

export function fetchJobs(filters: JobFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "All") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return apiClient<PaginatedResponse<JobListing>>(`/jobs${query ? `?${query}` : ""}`);
}

export function fetchJob(jobId: string) {
  return apiClient<JobListing>(`/jobs/${jobId}`);
}

export function createJob(input: CreateJobInput) {
  return apiClient<JobListing>("/jobs", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateJob(jobId: string, input: UpdateJobInput) {
  return apiClient<JobListing>(`/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteJob(jobId: string) {
  return apiClient<{ deleted: boolean }>(`/jobs/${jobId}`, {
    method: "DELETE"
  });
}

export function applyJob(jobId: string) {
  return apiClient<JobListing>(`/jobs/${jobId}/apply`, {
    method: "POST"
  });
}

export function submitJobApplication(jobId: string, input: CreateJobApplicationInput & { resume: File }) {
  const formData = new FormData();
  formData.append("applicantName", input.applicantName);
  formData.append("phoneNumber", input.phoneNumber);
  formData.append("email", input.email);
  formData.append("location", input.location ?? "");
  formData.append("linkedinUrl", input.linkedinUrl ?? "");
  formData.append("portfolioUrl", input.portfolioUrl ?? "");
  formData.append("experience", input.experience ?? "");
  formData.append("coverLetter", input.coverLetter ?? "");
  formData.append("resume", input.resume);

  return apiClient<JobApplication>(`/jobs/${jobId}/applications`, {
    method: "POST",
    body: formData
  });
}

export function fetchJobApplications(jobId: string) {
  return apiClient<JobApplication[]>(`/jobs/${jobId}/applications`);
}

export function updateJobApplicationStatus(applicationId: string, status: JobApplicationStatus) {
  return apiClient<JobApplication>(`/jobs/applications/${applicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function toggleSaveJob(jobId: string) {
  return apiClient<JobListing>(`/jobs/${jobId}/save`, {
    method: "POST"
  });
}
