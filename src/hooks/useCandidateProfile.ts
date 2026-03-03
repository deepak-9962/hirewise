"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  CandidateProfile,
  Education,
  Experience,
  Project,
  ApiResponse,
} from "@/types/candidate";

interface UseCandidateProfileReturn {
  profile: CandidateProfile | null;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  loading: boolean;
  error: string;
  // Profile
  updateProfile: (data: Partial<CandidateProfile>) => Promise<ApiResponse>;
  uploadAvatar: (file: File) => Promise<ApiResponse<{ avatar_url: string }>>;
  uploadResume: (file: File) => Promise<ApiResponse<{ resume_url: string; signed_url: string }>>;
  // Education
  addEducation: (data: Omit<Education, "id" | "candidate_id" | "created_at">) => Promise<ApiResponse<Education>>;
  updateEducation: (id: string, data: Omit<Education, "id" | "candidate_id" | "created_at">) => Promise<ApiResponse<Education>>;
  deleteEducation: (id: string) => Promise<ApiResponse>;
  // Experience
  addExperience: (data: Omit<Experience, "id" | "candidate_id" | "created_at">) => Promise<ApiResponse<Experience>>;
  updateExperience: (id: string, data: Omit<Experience, "id" | "candidate_id" | "created_at">) => Promise<ApiResponse<Experience>>;
  deleteExperience: (id: string) => Promise<ApiResponse>;
  // Projects
  addProject: (data: Omit<Project, "id" | "candidate_id" | "created_at">) => Promise<ApiResponse<Project>>;
  updateProject: (id: string, data: Omit<Project, "id" | "candidate_id" | "created_at">) => Promise<ApiResponse<Project>>;
  deleteProject: (id: string) => Promise<ApiResponse>;
  // Refresh
  refresh: () => Promise<void>;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      return { error: json.error || `Request failed (${res.status})` };
    }
    return { data: json.data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error" };
  }
}

async function apiUpload<T>(url: string, file: File): Promise<ApiResponse<T>> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(url, { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) {
      return { error: json.error || `Upload failed (${res.status})` };
    }
    return { data: json.data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload error" };
  }
}

export function useCandidateProfile(): UseCandidateProfileReturn {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, eduRes, expRes, projRes] = await Promise.all([
        apiFetch<CandidateProfile>("/api/candidate/profile"),
        apiFetch<Education[]>("/api/candidate/education"),
        apiFetch<Experience[]>("/api/candidate/experience"),
        apiFetch<Project[]>("/api/candidate/projects"),
      ]);

      if (profileRes.error) throw new Error(profileRes.error);
      if (profileRes.data) setProfile(profileRes.data);
      if (eduRes.data) setEducation(eduRes.data);
      if (expRes.data) setExperience(expRes.data);
      if (projRes.data) setProjects(projRes.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Profile
  const updateProfile = async (data: Partial<CandidateProfile>) => {
    const merged = { ...profile, ...data };
    const res = await apiFetch<CandidateProfile>("/api/candidate/profile", {
      method: "PUT",
      body: JSON.stringify(merged),
    });
    if (res.data) setProfile(res.data);
    return res;
  };

  const uploadAvatar = async (file: File) => {
    const res = await apiUpload<{ avatar_url: string }>(
      "/api/candidate/upload/avatar",
      file
    );
    if (res.data) {
      setProfile((p) => (p ? { ...p, avatar_url: res.data!.avatar_url } : p));
    }
    return res;
  };

  const uploadResume = async (file: File) => {
    const res = await apiUpload<{ resume_url: string; signed_url: string }>(
      "/api/candidate/upload/resume",
      file
    );
    if (res.data) {
      setProfile((p) => (p ? { ...p, resume_url: res.data!.resume_url } : p));
    }
    return res;
  };

  // Education
  const addEducation = async (data: Omit<Education, "id" | "candidate_id" | "created_at">) => {
    const res = await apiFetch<Education>("/api/candidate/education", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data) setEducation((prev) => [res.data!, ...prev]);
    return res;
  };

  const updateEducation = async (id: string, data: Omit<Education, "id" | "candidate_id" | "created_at">) => {
    const res = await apiFetch<Education>(`/api/candidate/education/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (res.data) {
      setEducation((prev) => prev.map((e) => (e.id === id ? res.data! : e)));
    }
    return res;
  };

  const deleteEducation = async (id: string) => {
    const res = await apiFetch(`/api/candidate/education/${id}`, {
      method: "DELETE",
    });
    if (!res.error) {
      setEducation((prev) => prev.filter((e) => e.id !== id));
    }
    return res;
  };

  // Experience
  const addExperience = async (data: Omit<Experience, "id" | "candidate_id" | "created_at">) => {
    const res = await apiFetch<Experience>("/api/candidate/experience", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data) setExperience((prev) => [res.data!, ...prev]);
    return res;
  };

  const updateExperience = async (id: string, data: Omit<Experience, "id" | "candidate_id" | "created_at">) => {
    const res = await apiFetch<Experience>(`/api/candidate/experience/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (res.data) {
      setExperience((prev) => prev.map((e) => (e.id === id ? res.data! : e)));
    }
    return res;
  };

  const deleteExperience = async (id: string) => {
    const res = await apiFetch(`/api/candidate/experience/${id}`, {
      method: "DELETE",
    });
    if (!res.error) {
      setExperience((prev) => prev.filter((e) => e.id !== id));
    }
    return res;
  };

  // Projects
  const addProject = async (data: Omit<Project, "id" | "candidate_id" | "created_at">) => {
    const res = await apiFetch<Project>("/api/candidate/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data) setProjects((prev) => [res.data!, ...prev]);
    return res;
  };

  const updateProject = async (id: string, data: Omit<Project, "id" | "candidate_id" | "created_at">) => {
    const res = await apiFetch<Project>(`/api/candidate/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (res.data) {
      setProjects((prev) => prev.map((p) => (p.id === id ? res.data! : p)));
    }
    return res;
  };

  const deleteProject = async (id: string) => {
    const res = await apiFetch(`/api/candidate/projects/${id}`, {
      method: "DELETE",
    });
    if (!res.error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
    return res;
  };

  return {
    profile,
    education,
    experience,
    projects,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    uploadResume,
    addEducation,
    updateEducation,
    deleteEducation,
    addExperience,
    updateExperience,
    deleteExperience,
    addProject,
    updateProject,
    deleteProject,
    refresh: fetchAll,
  };
}
