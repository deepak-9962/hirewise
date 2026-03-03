import { z } from "zod";

// ============================================================
// Shared helpers
// ============================================================

const optionalUrl = z.string().url("Must be a valid URL").or(z.literal("")).default("");
const optionalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").nullable().default(null);

// ============================================================
// Profile
// ============================================================

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  phone: z
    .string()
    .max(20, "Phone must be under 20 characters")
    .default(""),
  location: z
    .string()
    .max(100, "Location must be under 100 characters")
    .default(""),
  experience: z
    .string()
    .max(50, "Experience must be under 50 characters")
    .default(""),
  bio: z
    .string()
    .max(1000, "Bio must be under 1000 characters")
    .default(""),
  headline: z
    .string()
    .max(150, "Headline must be under 150 characters")
    .default(""),
  skills: z
    .array(z.string().min(1).max(50))
    .max(50, "Maximum 50 skills")
    .default([]),
  visibility: z.enum(["public", "private"]).default("public"),
  linkedin_url: optionalUrl,
  github_url: optionalUrl,
  portfolio_url: optionalUrl,
});

export type ProfileInput = z.infer<typeof profileSchema>;

// ============================================================
// Education
// ============================================================

export const educationSchema = z.object({
  institution: z
    .string()
    .min(1, "Institution is required")
    .max(200, "Institution must be under 200 characters"),
  degree: z
    .string()
    .min(1, "Degree is required")
    .max(200, "Degree must be under 200 characters"),
  field_of_study: z
    .string()
    .max(200, "Field must be under 200 characters")
    .default(""),
  start_date: optionalDate,
  end_date: optionalDate,
  grade: z
    .string()
    .max(50, "Grade must be under 50 characters")
    .default(""),
  description: z
    .string()
    .max(1000, "Description must be under 1000 characters")
    .default(""),
});

export type EducationInput = z.infer<typeof educationSchema>;

// ============================================================
// Experience
// ============================================================

export const experienceSchema = z.object({
  company: z
    .string()
    .min(1, "Company is required")
    .max(200, "Company must be under 200 characters"),
  title: z
    .string()
    .min(1, "Job title is required")
    .max(200, "Title must be under 200 characters"),
  location: z
    .string()
    .max(100, "Location must be under 100 characters")
    .default(""),
  start_date: optionalDate,
  end_date: optionalDate,
  is_current: z.boolean().default(false),
  description: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .default(""),
});

export type ExperienceInput = z.infer<typeof experienceSchema>;

// ============================================================
// Project
// ============================================================

export const projectSchema = z.object({
  title: z
    .string()
    .min(1, "Project title is required")
    .max(200, "Title must be under 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .default(""),
  technologies: z
    .array(z.string().min(1).max(50))
    .max(20, "Maximum 20 technologies")
    .default([]),
  live_url: optionalUrl,
  github_url: optionalUrl,
  image_url: optionalUrl,
});

export type ProjectInput = z.infer<typeof projectSchema>;
