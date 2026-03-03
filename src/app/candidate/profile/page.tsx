"use client";

import { useState } from "react";

const skills = ["React", "TypeScript", "Node.js", "Python", "System Design", "SQL", "Docker", "AWS"];

export default function CandidateProfilePage() {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your personal information and preferences</p>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
            editMode ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white" : "bg-primary text-white hover:bg-blue-700"
          }`}
        >
          {editMode ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-center mb-6">
            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-4xl">person</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">John Doe</h3>
            <p className="text-sm text-slate-500">Full Stack Developer</p>
            <p className="text-xs text-slate-400 mt-1">Member since Jan 2026</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-slate-400">mail</span>
              <span className="text-slate-600 dark:text-slate-400">john.doe@email.com</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-slate-400">phone</span>
              <span className="text-slate-600 dark:text-slate-400">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-slate-400">location_on</span>
              <span className="text-slate-600 dark:text-slate-400">San Francisco, CA</span>
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
                { label: "First Name", value: "John" },
                { label: "Last Name", value: "Doe" },
                { label: "Email", value: "john.doe@email.com" },
                { label: "Phone", value: "+1 (555) 123-4567" },
                { label: "Location", value: "San Francisco, CA" },
                { label: "Experience", value: "5 years" },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                  {editMode ? (
                    <input
                      type="text"
                      defaultValue={field.value}
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
                <button className="bg-primary text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-all">Save Changes</button>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                  {skill}
                  {editMode && (
                    <button className="ml-1 text-primary/50 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </span>
              ))}
              {editMode && (
                <button className="border border-dashed border-primary/40 text-primary text-sm font-medium px-3 py-1.5 rounded-full hover:bg-primary/5 transition-all flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">add</span> Add Skill
                </button>
              )}
            </div>
          </div>

          {/* Resume */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Resume</h3>
            <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">upload_file</span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">resume_john_doe.pdf</p>
              <p className="text-xs text-slate-400 mb-4">Uploaded on Feb 1, 2026</p>
              <div className="flex justify-center gap-3">
                <button className="text-sm text-primary font-medium hover:underline">Download</button>
                <button className="text-sm text-primary font-medium hover:underline">Replace</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
