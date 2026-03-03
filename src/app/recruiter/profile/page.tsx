"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

interface RecruiterProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  skills: string[];
  avatar_url: string;
  created_at: string;
  role: string;
}

// ── Input field ──────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, type = "text", icon, disabled = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; icon?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${icon ? "pl-10" : "pl-3"} pr-3 py-2.5 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
            disabled
              ? "border-slate-100 dark:border-slate-700 text-slate-400 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
          }`}
        />
      </div>
    </div>
  );
}

export default function RecruiterProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [form, setForm] = useState<Partial<RecruiterProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "account">("profile");

  // Load profile
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/recruiter/profile?id=${user.id}`);
      if (res.ok) {
        const data: RecruiterProfile = await res.json();
        setProfile(data);
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          location: data.location ?? "",
          experience: data.experience ?? "",
          skills: data.skills ?? [],
          avatar_url: data.avatar_url ?? "",
        });
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  // ── Avatar file pick (just stores local preview & base URL for now) ──
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      // We'll store the data URL as avatar_url if no storage bucket configured
      setForm((f) => ({ ...f, avatar_url: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // ── Skills helpers ──
  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    const current = form.skills ?? [];
    if (!current.includes(s)) {
      setForm((f) => ({ ...f, skills: [...current, s] }));
    }
    setNewSkill("");
  };
  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, skills: (f.skills ?? []).filter((s) => s !== skill) }));
  };

  // ── Save ──
  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/recruiter/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setProfile(data);
    setAvatarPreview(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
    await refreshProfile();
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify({
    name: profile?.name ?? "",
    phone: profile?.phone ?? "",
    location: profile?.location ?? "",
    experience: profile?.experience ?? "",
    skills: profile?.skills ?? [],
    avatar_url: profile?.avatar_url ?? "",
  });

  // ── Avatar display ──
  const avatarSrc = avatarPreview ?? form.avatar_url;
  const initials = (form.name ?? profile?.name ?? "R")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-24">
        <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your recruiter profile and account settings</p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit mb-6">
        {(["profile", "account"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Save banner ── */}
      {saved && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-medium">
          <span className="material-symbols-outlined text-base">check_circle</span>
          Profile saved successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Avatar card ── */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center gap-4">
              {/* Avatar */}
              <div className="relative group">
                <div className="size-24 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center ring-4 ring-slate-100 dark:ring-slate-700">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt={form.name ?? ""} className="size-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 size-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-white text-sm">photo_camera</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
              </div>

              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-white">{form.name || "Your Name"}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{profile?.role ?? "recruiter"}</p>
              </div>

              {/* Or paste a URL */}
              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Avatar URL</label>
                <input
                  type="url"
                  value={form.avatar_url && !form.avatar_url.startsWith("data:") ? form.avatar_url : ""}
                  onChange={(e) => {
                    setAvatarPreview(null);
                    setForm((f) => ({ ...f, avatar_url: e.target.value }));
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Stats */}
              <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-slate-400">calendar_month</span>
                    Member since
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">{memberSince || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-slate-400">badge</span>
                    Role
                  </span>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full capitalize">{profile?.role ?? "recruiter"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Details form ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic info */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">person</span>
                Basic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" value={form.name ?? ""} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Your full name" icon="badge" />
                <Field label="Email" value={profile?.email ?? user?.email ?? ""} disabled icon="mail" />
                <Field label="Phone" value={form.phone ?? ""} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+1 (555) 000-0000" icon="phone" />
                <Field label="Location" value={form.location ?? ""} onChange={(v) => setForm((f) => ({ ...f, location: v }))} placeholder="City, Country" icon="location_on" />
              </div>
            </div>

            {/* Professional info */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">work</span>
                Professional Details
              </h2>
              <Field
                label="Experience / Title"
                value={form.experience ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, experience: v }))}
                placeholder="e.g. Senior Recruiter · 5 years"
                icon="work_history"
              />
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                Areas of Expertise
              </h2>
              {/* Add skill */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">add_circle</span>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="Add a skill or domain..."
                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button
                  onClick={addSkill}
                  disabled={!newSkill.trim()}
                  className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-40"
                >
                  Add
                </button>
              </div>
              {/* Chip list */}
              {(form.skills ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No skills added yet. Add areas like "React", "Talent Acquisition", "Node.js"…</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(form.skills ?? []).map((skill) => (
                    <span key={skill} className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-medium pl-3 pr-2 py-1.5 rounded-full">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-base leading-none">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Save row */}
            <div className="flex items-center justify-end gap-3">
              {isDirty && (
                <button
                  onClick={() => {
                    setAvatarPreview(null);
                    setForm({
                      name: profile?.name ?? "",
                      phone: profile?.phone ?? "",
                      location: profile?.location ?? "",
                      experience: profile?.experience ?? "",
                      skills: profile?.skills ?? [],
                      avatar_url: profile?.avatar_url ?? "",
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Discard Changes
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-primary/20"
              >
                {saving ? (
                  <>
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Account Tab ── */}
      {activeTab === "account" && (
        <div className="max-w-lg space-y-5">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">manage_accounts</span>
              Account Information
            </h2>
            <div className="space-y-4">
              <Field label="Email Address" value={profile?.email ?? user?.email ?? ""} disabled icon="mail" />
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Account ID</label>
                <p className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 break-all select-all">{user?.id}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Account Status</label>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                  <span className="size-1.5 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full capitalize">
                  {profile?.role ?? "recruiter"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-lg">lock</span>
              Change Password
            </h2>
            <p className="text-sm text-slate-500 mb-4">Password changes are handled through the authentication provider. Use the sign-in page to reset your password.</p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined text-base">lock_reset</span>
              Go to Sign In
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
