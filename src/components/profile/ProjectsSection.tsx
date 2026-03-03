"use client";

import { useState } from "react";
import type { Project, ProjectFormData } from "@/types/candidate";
import { projectSchema } from "@/lib/validations/candidate";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import TextAreaField from "@/components/ui/TextAreaField";
import TagInput from "@/components/ui/TagInput";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";

interface ProjectsSectionProps {
  items: Project[];
  onAdd: (data: ProjectFormData) => Promise<{ error?: string }>;
  onUpdate: (id: string, data: ProjectFormData) => Promise<{ error?: string }>;
  onDelete: (id: string) => Promise<{ error?: string }>;
}

const defaultForm: ProjectFormData = {
  title: "",
  description: "",
  technologies: [],
  live_url: "",
  github_url: "",
  image_url: "",
};

export default function ProjectsSection({
  items,
  onAdd,
  onUpdate,
  onDelete,
}: ProjectsSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: Project) => {
    setForm({
      title: item.title,
      description: item.description,
      technologies: item.technologies,
      live_url: item.live_url,
      github_url: item.github_url,
      image_url: item.image_url,
    });
    setEditingId(item.id);
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const parsed = projectSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        fieldErrors[key] = msgs?.[0] || "Invalid";
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    const res = editingId
      ? await onUpdate(editingId, parsed.data)
      : await onAdd(parsed.data);
    setSaving(false);

    if (res.error) {
      setErrors({ _form: res.error });
      return;
    }

    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const setField = (key: keyof ProjectFormData, value: string | string[]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  };

  return (
    <>
      <Card
        title="Projects"
        icon="code"
        action={
          <button
            onClick={openNew}
            className="text-sm font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add
          </button>
        }
      >
        {items.length === 0 ? (
          <EmptyState
            icon="code"
            title="No projects added"
            description="Showcase your best work"
            action={
              <button
                onClick={openNew}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Add Project
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {item.title}
                  </h4>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-slate-400 text-base">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <span
                        className={`material-symbols-outlined text-base ${
                          deletingId === item.id
                            ? "animate-spin text-slate-400"
                            : "text-red-400"
                        }`}
                      >
                        {deletingId === item.id
                          ? "progress_activity"
                          : "delete"}
                      </span>
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  {item.live_url && (
                    <a
                      href={item.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">
                        open_in_new
                      </span>
                      Live Demo
                    </a>
                  )}
                  {item.github_url && (
                    <a
                      href={item.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-600 dark:text-slate-400 font-medium hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">
                        code
                      </span>
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Project Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Project" : "Add Project"}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {errors._form && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {errors._form}
            </p>
          )}
          <FormField
            label="Project Title"
            required
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            error={errors.title}
            placeholder="e.g. E-commerce Platform"
          />
          <TextAreaField
            label="Description"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            error={errors.description}
            placeholder="Describe the project, your role, and key outcomes…"
            rows={3}
          />
          <TagInput
            label="Technologies"
            tags={form.technologies}
            onChange={(tags) => setField("technologies", tags)}
            placeholder="Add technology…"
            maxTags={20}
            error={errors.technologies}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Live URL"
              type="url"
              value={form.live_url}
              onChange={(e) => setField("live_url", e.target.value)}
              error={errors.live_url}
              placeholder="https://myproject.com"
            />
            <FormField
              label="GitHub URL"
              type="url"
              value={form.github_url}
              onChange={(e) => setField("github_url", e.target.value)}
              error={errors.github_url}
              placeholder="https://github.com/user/repo"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setModalOpen(false)}
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <span className="animate-spin material-symbols-outlined text-sm">
                  progress_activity
                </span>
              )}
              {editingId ? "Save Changes" : "Add Project"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
