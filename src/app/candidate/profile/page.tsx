"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCandidateProfile } from "@/hooks/useCandidateProfile";
import type { CandidateProfile } from "@/types/candidate";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import SuccessAlert from "@/components/ui/SuccessAlert";
import Card from "@/components/ui/Card";
import FileUpload from "@/components/ui/FileUpload";

import ProfileCard from "@/components/profile/ProfileCard";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import EducationSection from "@/components/profile/EducationSection";
import ExperienceSection from "@/components/profile/ExperienceSection";
import ProjectsSection from "@/components/profile/ProjectsSection";

export default function CandidateProfilePage() {
  const { user, refreshProfile: refreshAuthProfile } = useAuth();
  const {
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
    refresh,
  } = useCandidateProfile();

  const [editMode, setEditMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "";

  const handleProfileSave = async (data: Partial<CandidateProfile>) => {
    const res = await updateProfile(data);
    if (!res.error) {
      await refreshAuthProfile();
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    }
    return res;
  };

  const handleResumeUpload = async (file: File) => {
    setUploadingResume(true);
    const res = await uploadResume(file);
    setUploadingResume(false);
    if (res.error) throw new Error(res.error);
    await refreshAuthProfile();
    setSuccessMsg("Resume uploaded successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleAvatarUpload = async (file: File) => {
    const res = await uploadAvatar(file);
    if (!res.error) {
      await refreshAuthProfile();
      setSuccessMsg("Photo updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    return res;
  };

  // Loading state
  if (loading) {
    return (
      <div className="animate-fade-in">
        <LoadingSpinner size="lg" text="Loading your profile…" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="animate-fade-in p-4">
        <ErrorAlert message={error} onRetry={refresh} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal information, portfolio, and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="mb-6">
          <SuccessAlert
            message={successMsg}
            onDismiss={() => setSuccessMsg("")}
          />
        </div>
      )}

      {editMode ? (
        /* ========== EDIT MODE ========== */
        <ProfileEditForm
          profile={profile}
          onSave={handleProfileSave}
          onCancel={() => setEditMode(false)}
        />
      ) : (
        /* ========== VIEW MODE ========== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — Profile Card */}
          <div className="space-y-6">
            <ProfileCard
              profile={profile}
              memberSince={memberSince}
              onUploadAvatar={handleAvatarUpload}
            />

            {/* Resume */}
            <Card title="Resume" icon="description">
              <FileUpload
                label=""
                accept="application/pdf"
                maxSizeMB={10}
                hint="PDF only, up to 10 MB"
                currentFile={profile.resume_url || undefined}
                onUpload={handleResumeUpload}
                uploading={uploadingResume}
                icon="upload_file"
              />
              {profile.resume_url && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-green-500 text-lg">
                    check_circle
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Resume on file
                  </span>
                </div>
              )}
            </Card>
          </div>

          {/* Right column — Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <Card title="About" icon="info">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </Card>
            )}

            {/* Skills */}
            <Card title="Skills" icon="psychology">
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No skills added yet —{" "}
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-primary font-medium hover:underline"
                  >
                    add some
                  </button>
                </p>
              )}
            </Card>

            {/* Education */}
            <EducationSection
              items={education}
              onAdd={addEducation}
              onUpdate={updateEducation}
              onDelete={deleteEducation}
            />

            {/* Experience */}
            <ExperienceSection
              items={experience}
              onAdd={addExperience}
              onUpdate={updateExperience}
              onDelete={deleteExperience}
            />

            {/* Projects */}
            <ProjectsSection
              items={projects}
              onAdd={addProject}
              onUpdate={updateProject}
              onDelete={deleteProject}
            />
          </div>
        </div>
      )}
    </div>
  );
}
