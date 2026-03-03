// ============================================================
// Candidate Profile — TypeScript Types
// ============================================================

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  bio: string;
  headline: string;
  role: "candidate" | "recruiter" | "admin";
  status: string;
  skills: string[];
  resume_url: string;
  avatar_url: string;
  visibility: "public" | "private";
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  created_at: string;
}

export interface Education {
  id: string;
  candidate_id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string | null;
  end_date: string | null;
  grade: string;
  description: string;
  created_at: string;
}

export interface Experience {
  id: string;
  candidate_id: string;
  company: string;
  title: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string;
  created_at: string;
}

export interface Project {
  id: string;
  candidate_id: string;
  title: string;
  description: string;
  technologies: string[];
  live_url: string;
  github_url: string;
  image_url: string;
  created_at: string;
}

// Form input types (without id/candidate_id/created_at)
export type ProfileFormData = Pick<
  CandidateProfile,
  | "name"
  | "phone"
  | "location"
  | "experience"
  | "bio"
  | "headline"
  | "skills"
  | "visibility"
  | "linkedin_url"
  | "github_url"
  | "portfolio_url"
>;

export type EducationFormData = Omit<Education, "id" | "candidate_id" | "created_at">;
export type ExperienceFormData = Omit<Experience, "id" | "candidate_id" | "created_at">;
export type ProjectFormData = Omit<Project, "id" | "candidate_id" | "created_at">;

// API response wrapper
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}
