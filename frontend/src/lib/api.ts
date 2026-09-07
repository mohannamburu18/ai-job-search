// API client connecting frontend to the FastAPI backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  register: (data: any) =>
    request<{ access_token: string; token_type: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: any) =>
    request<{ access_token: string; token_type: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCurrentUser: () => request<any>("/auth/me"),

  // Profile
  getProfile: () => request<any>("/profile"),
  updateProfile: (data: any) =>
    request<any>("/profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Resume Parsing & Optimization
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<any>("/resume/parse", {
      method: "POST",
      body: formData,
    });
  },

  tailorResume: (data: { job_id?: string; job_description: string; company_name?: string; job_title?: string }) =>
    request<any>("/resume/tailor", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Jobs
  searchJobs: (query: string, market = "global", remoteOnly = false, limit = 20) =>
    request<any[]>(
      `/jobs/search?q=${encodeURIComponent(query)}&market=${encodeURIComponent(market)}&remote_only=${remoteOnly}&limit=${limit}`
    ),

  getJob: (jobId: string) => request<any>(`/jobs/${jobId}`),

  evaluateJob: (jobId: string, jobPayload?: any) =>
    request<any>(`/jobs/${jobId}/evaluate`, {
      method: "POST",
      body: jobPayload ? JSON.stringify(jobPayload) : undefined,
    }),

  // Cover Letter
  generateCoverLetter: (data: { job_id?: string; job_title: string; company_name: string; job_description: string; tone?: string; custom_notes?: string }) =>
    request<any>("/cover-letter/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ATS Verification
  verifyAts: (file: File, expectedKeywords: string[] = []) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expected_keywords", expectedKeywords.join(","));
    return request<any>("/ats/verify", {
      method: "POST",
      body: formData,
    });
  },

  // Applications Tracker
  getApplications: () => request<any[]>("/applications"),

  createApplication: (data: any) =>
    request<any>("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateApplicationStatus: (id: number, status: string, notes?: string) =>
    request<any>(`/applications/${id}/status?status=${encodeURIComponent(status)}${notes ? `&notes=${encodeURIComponent(notes)}` : ""}`, {
      method: "PATCH",
    }),

  // Interview Prep
  generateInterviewPrep: (data: { job_id?: string; job_title: string; company_name: string; job_description: string; stage?: string }) =>
    request<any>("/interview/prep", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  interviewChat: (data: { job_id: string; job_title: string; company_name: string; message: string; history?: any[] }) =>
    request<any>("/interview/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Application Automation
  prepareAutomation: (data: { job_id: string; job_url: string; portal_type?: string }) =>
    request<any>("/automation/prepare", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  submitAutomation: (data: { packet_id: string; confirmed: boolean; user_signature: string; field_values: Record<string, string> }) =>
    request<any>("/automation/submit", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Health check
  health: () => request<{ status: string; service: string }>("/health"),
};

