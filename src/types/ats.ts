// ============================================================
// ATS (Applicant Tracking System) — TypeScript Types
// ============================================================

export type PipelineStage =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "test_enabled"
  | "test_completed"
  | "interview_scheduled"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn";

export const PIPELINE_STAGES: PipelineStage[] = [
  "applied",
  "under_review",
  "shortlisted",
  "test_enabled",
  "test_completed",
  "interview_scheduled",
  "offered",
  "hired",
];

// Stages that are terminal (cannot move forward)
export const TERMINAL_STAGES: PipelineStage[] = ["hired", "rejected", "withdrawn"];

export const STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; color: string; bgColor: string; icon: string; description: string }
> = {
  applied: {
    label: "Applied",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "inbox",
    description: "New applications received",
  },
  under_review: {
    label: "Under Review",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    icon: "visibility",
    description: "Resume & profile being reviewed",
  },
  shortlisted: {
    label: "Shortlisted",
    color: "text-cyan-700 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800",
    icon: "star",
    description: "Candidate meets requirements",
  },
  test_enabled: {
    label: "Test Assigned",
    color: "text-indigo-700 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800",
    icon: "quiz",
    description: "Technical test sent to candidate",
  },
  test_completed: {
    label: "Test Done",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    icon: "task_alt",
    description: "Test completed & evaluated",
  },
  interview_scheduled: {
    label: "Interview",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    icon: "event",
    description: "Interview scheduled",
  },
  offered: {
    label: "Offered",
    color: "text-teal-700 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800",
    icon: "local_offer",
    description: "Offer extended to candidate",
  },
  hired: {
    label: "Hired",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    icon: "handshake",
    description: "Candidate accepted & hired",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    icon: "cancel",
    description: "Application rejected",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-slate-500 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    icon: "undo",
    description: "Candidate withdrew application",
  },
};

export interface PipelineApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  status: PipelineStage;
  cover_note: string;
  resume_url: string;
  applied_at: string;
  // Enriched fields
  profiles?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    skills?: string[];
    experience?: string;
    location?: string;
    resume_url?: string;
    avatar_url?: string;
  } | null;
  jobs?: {
    id: string;
    title: string;
    department: string;
    type: string;
    status: string;
    target_skills?: string[];
  } | null;
  interviews?: {
    id: string;
    status: string;
    score: number | null;
    completed_at: string | null;
  } | null;
  reports?: {
    id: string;
    overall_score: number | null;
    ai_summary: string;
  } | null;
  resume_score?: ResumeScoreData | null;
  notes?: PipelineNote[];
}

export interface PipelineNote {
  id: string;
  application_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export interface PipelineStats {
  total: number;
  byStage: Record<PipelineStage, number>;
  byJob: { job_id: string; title: string; count: number }[];
  avgTimeToHire: number; // days
  conversionRate: number; // applied → hired %
}

export interface ResumeScoreData {
  id: string;
  application_id: string;
  job_id: string;
  candidate_id: string;
  overall_score: number;
  skill_match_score: number;
  experience_score: number;
  education_score: number;
  keyword_matches: string[];
  missing_skills: string[];
  recommendation: string;
  ai_summary: string;
  scored_at: string;
}

export type ATSViewMode = "kanban" | "list";
export type ATSSortBy = "applied_at" | "name" | "score" | "status" | "ats_score";
export type ATSSortOrder = "asc" | "desc";

export interface ATSFilters {
  jobId: string; // "all" or specific UUID
  search: string;
  stages: PipelineStage[];
  sortBy: ATSSortBy;
  sortOrder: ATSSortOrder;
}
