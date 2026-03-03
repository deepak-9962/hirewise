"use client";

import { useState, useRef } from "react";
import type { CandidateProfile } from "@/types/candidate";

interface ProfileCardProps {
  profile: CandidateProfile;
  memberSince: string;
  onUploadAvatar: (file: File) => Promise<{ error?: string }>;
}

export default function ProfileCard({
  profile,
  memberSince,
  onUploadAvatar,
}: ProfileCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Max 5 MB");
      return;
    }

    setUploading(true);
    setError("");
    const res = await onUploadAvatar(file);
    setUploading(false);

    if (res.error) setError(res.error);
    e.target.value = "";
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="text-center mb-6">
        {/* Avatar */}
        <div className="relative inline-block">
          <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="size-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-primary text-4xl">
                person
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="animate-spin material-symbols-outlined text-sm">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-sm">
                photo_camera
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-2">{error}</p>
        )}

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">
          {profile.name || "User"}
        </h3>
        {profile.headline && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {profile.headline}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              profile.visibility === "public"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
            }`}
          >
            <span className="material-symbols-outlined text-xs">
              {profile.visibility === "public" ? "public" : "lock"}
            </span>
            {profile.visibility === "public" ? "Public" : "Private"}
          </span>
        </div>
        {memberSince && (
          <p className="text-xs text-slate-400 mt-2">
            Member since {memberSince}
          </p>
        )}
      </div>

      {/* Quick Info */}
      <div className="space-y-3">
        <InfoRow icon="mail" value={profile.email} />
        <InfoRow icon="phone" value={profile.phone || "Not set"} />
        <InfoRow icon="location_on" value={profile.location || "Not set"} />
        <InfoRow icon="work_history" value={profile.experience || "Not set"} />
      </div>

      {/* Social Links */}
      {(profile.linkedin_url || profile.github_url || profile.portfolio_url) && (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Links
          </p>
          <div className="space-y-2">
            {profile.linkedin_url && (
              <SocialLink
                icon="link"
                label="LinkedIn"
                url={profile.linkedin_url}
              />
            )}
            {profile.github_url && (
              <SocialLink
                icon="code"
                label="GitHub"
                url={profile.github_url}
              />
            )}
            {profile.portfolio_url && (
              <SocialLink
                icon="language"
                label="Portfolio"
                url={profile.portfolio_url}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, value }: { icon: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="material-symbols-outlined text-slate-400 text-lg">
        {icon}
      </span>
      <span className="text-slate-600 dark:text-slate-400 truncate">
        {value}
      </span>
    </div>
  );
}

function SocialLink({
  icon,
  label,
  url,
}: {
  icon: string;
  label: string;
  url: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-primary hover:underline"
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {label}
    </a>
  );
}
