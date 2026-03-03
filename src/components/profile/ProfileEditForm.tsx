"use client";

import { useState, useEffect } from "react";
import type { CandidateProfile } from "@/types/candidate";
import { profileSchema } from "@/lib/validations/candidate";
import FormField from "@/components/ui/FormField";
import TextAreaField from "@/components/ui/TextAreaField";
import TagInput from "@/components/ui/TagInput";
import Toggle from "@/components/ui/Toggle";
import Card from "@/components/ui/Card";

interface ProfileEditFormProps {
  profile: CandidateProfile;
  onSave: (data: Partial<CandidateProfile>) => Promise<{ error?: string }>;
  onCancel: () => void;
}

export default function ProfileEditForm({
  profile,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone,
    location: profile.location,
    experience: profile.experience,
    bio: profile.bio || "",
    headline: profile.headline || "",
    skills: profile.skills || [],
    visibility: profile.visibility || "public" as const,
    linkedin_url: profile.linkedin_url || "",
    github_url: profile.github_url || "",
    portfolio_url: profile.portfolio_url || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Sync if profile changes externally
  useEffect(() => {
    setForm({
      name: profile.name,
      phone: profile.phone,
      location: profile.location,
      experience: profile.experience,
      bio: profile.bio || "",
      headline: profile.headline || "",
      skills: profile.skills || [],
      visibility: profile.visibility || "public",
      linkedin_url: profile.linkedin_url || "",
      github_url: profile.github_url || "",
      portfolio_url: profile.portfolio_url || "",
    });
  }, [profile]);

  const setField = (key: string, value: string | string[]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        fieldErrors[key] = msgs?.[0] || "Invalid";
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await onSave(parsed.data);

      if (res.error) {
        setErrors({ _form: res.error });
        return;
      }

      onCancel(); // Exit edit mode on success
    } catch (e) {
      setErrors({ _form: e instanceof Error ? e.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const nameParts = form.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <div className="space-y-6">
      {errors._form && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{errors._form}</p>
        </div>
      )}

      {/* Personal Info */}
      <Card title="Personal Information" icon="person">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="First Name"
            required
            value={firstName}
            onChange={(e) => setField("name", `${e.target.value} ${lastName}`.trim())}
            error={errors.name}
          />
          <FormField
            label="Last Name"
            value={lastName}
            onChange={(e) => setField("name", `${firstName} ${e.target.value}`.trim())}
          />
          <FormField
            label="Headline"
            value={form.headline}
            onChange={(e) => setField("headline", e.target.value)}
            error={errors.headline}
            placeholder="e.g. Full Stack Developer | React Expert"
          />
          <FormField
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            error={errors.phone}
            placeholder="+1 (555) 123-4567"
          />
          <FormField
            label="Location"
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            error={errors.location}
            placeholder="e.g. San Francisco, CA"
          />
          <FormField
            label="Experience"
            value={form.experience}
            onChange={(e) => setField("experience", e.target.value)}
            error={errors.experience}
            placeholder="e.g. 3+ years"
          />
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Bio"
            value={form.bio}
            onChange={(e) => setField("bio", e.target.value)}
            error={errors.bio}
            placeholder="Tell recruiters about yourself…"
            rows={3}
          />
        </div>
      </Card>

      {/* Skills */}
      <Card title="Skills" icon="psychology">
        <TagInput
          label=""
          tags={form.skills}
          onChange={(tags) => setField("skills", tags)}
          placeholder="Type a skill and press Enter…"
          maxTags={50}
          error={errors.skills}
        />
      </Card>

      {/* Social Links */}
      <Card title="Social Links" icon="link">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="LinkedIn URL"
            type="url"
            value={form.linkedin_url}
            onChange={(e) => setField("linkedin_url", e.target.value)}
            error={errors.linkedin_url}
            placeholder="https://linkedin.com/in/you"
          />
          <FormField
            label="GitHub URL"
            type="url"
            value={form.github_url}
            onChange={(e) => setField("github_url", e.target.value)}
            error={errors.github_url}
            placeholder="https://github.com/you"
          />
          <FormField
            label="Portfolio URL"
            type="url"
            value={form.portfolio_url}
            onChange={(e) => setField("portfolio_url", e.target.value)}
            error={errors.portfolio_url}
            placeholder="https://yoursite.com"
          />
        </div>
      </Card>

      {/* Privacy */}
      <Card title="Privacy" icon="shield">
        <Toggle
          label="Public Profile"
          description="When enabled, recruiters and other users can see your profile"
          checked={form.visibility === "public"}
          onChange={(checked) =>
            setForm((p) => ({
              ...p,
              visibility: checked ? "public" : "private",
            }))
          }
        />
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && (
            <span className="animate-spin material-symbols-outlined text-sm">
              progress_activity
            </span>
          )}
          Save All Changes
        </button>
      </div>
    </div>
  );
}
