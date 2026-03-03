"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase-browser";

export default function CandidateProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Editable form state — initialized from profile
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    experience: "",
  });
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const startEdit = () => {
    setFormData({
      name: profile?.name || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
      experience: profile?.experience || "",
    });
    setEditSkills(profile?.skills || []);
    setEditMode(true);
    setSuccessMsg("");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSuccessMsg("");

    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        experience: formData.experience,
        skills: editSkills,
      })
      .eq("id", user.id);

    setSaving(false);
    if (!error) {
      await refreshProfile();
      setEditMode(false);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !editSkills.includes(trimmed)) {
      setEditSkills([...editSkills, trimmed]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setEditSkills(editSkills.filter((s) => s !== skill));
  };

  const nameParts = (profile?.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  const displaySkills = editMode ? editSkills : (profile?.skills || []);

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your personal information and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {successMsg && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span> {successMsg}
            </span>
          )}
          <button
            onClick={editMode ? () => setEditMode(false) : startEdit}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              editMode ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white" : "bg-primary text-white hover:bg-blue-700"
            }`}
          >
            {editMode ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-center mb-6">
            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-4xl">person</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profile?.name || "User"}</h3>
            <p className="text-sm text-slate-500">{profile?.role === "candidate" ? "Candidate" : profile?.role || ""}</p>
            {memberSince && <p className="text-xs text-slate-400 mt-1">Member since {memberSince}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-slate-400">mail</span>
              <span className="text-slate-600 dark:text-slate-400">{profile?.email || user?.email || "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-slate-400">phone</span>
              <span className="text-slate-600 dark:text-slate-400">{profile?.phone || "Not set"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-slate-400">location_on</span>
              <span className="text-slate-600 dark:text-slate-400">{profile?.location || "Not set"}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "First Name", value: firstName, key: "" },
                { label: "Last Name", value: lastName, key: "" },
                { label: "Email", value: profile?.email || user?.email || "—", key: "" },
                { label: "Phone", value: profile?.phone || "Not set", key: "phone" },
                { label: "Location", value: profile?.location || "Not set", key: "location" },
                { label: "Experience", value: profile?.experience || "Not set", key: "experience" },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                  {editMode && field.key ? (
                    <input
                      type="text"
                      value={formData[field.key as keyof typeof formData] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  ) : editMode && field.label === "First Name" ? (
                    <input
                      type="text"
                      value={formData.name.split(" ")[0] || ""}
                      onChange={(e) => {
                        const last = formData.name.split(" ").slice(1).join(" ");
                        setFormData((prev) => ({ ...prev, name: `${e.target.value} ${last}`.trim() }));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  ) : editMode && field.label === "Last Name" ? (
                    <input
                      type="text"
                      value={formData.name.split(" ").slice(1).join(" ") || ""}
                      onChange={(e) => {
                        const first = formData.name.split(" ")[0] || "";
                        setFormData((prev) => ({ ...prev, name: `${first} ${e.target.value}`.trim() }));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-white">{field.value}</p>
                  )}
                </div>
              ))}
            </div>
            {editMode && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {displaySkills.length > 0 ? displaySkills.map((skill) => (
                <span key={skill} className="bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                  {skill}
                  {editMode && (
                    <button onClick={() => removeSkill(skill)} className="ml-1 text-primary/50 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </span>
              )) : (
                <p className="text-sm text-slate-400">No skills added yet</p>
              )}
              {editMode && (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Add skill..."
                    className="text-sm px-3 py-1.5 rounded-full border border-dashed border-primary/40 bg-transparent text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary/50 w-32"
                  />
                  <button onClick={addSkill} className="text-primary hover:bg-primary/10 rounded-full p-1 transition-colors">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resume */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Resume</h3>
            <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">upload_file</span>
              {profile?.resume_url ? (
                <>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resume uploaded</p>
                  <div className="flex justify-center gap-3 mt-2">
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-medium hover:underline">Download</a>
                    <button className="text-sm text-primary font-medium hover:underline">Replace</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mt-1">No resume uploaded yet</p>
                  <button className="text-xs text-primary font-medium mt-2 hover:underline">Upload Resume</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
