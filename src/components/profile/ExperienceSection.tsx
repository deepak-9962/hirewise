"use client";

import { useState } from "react";
import type { Experience, ExperienceFormData } from "@/types/candidate";
import { experienceSchema } from "@/lib/validations/candidate";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import TextAreaField from "@/components/ui/TextAreaField";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";

interface ExperienceSectionProps {
  items: Experience[];
  onAdd: (data: ExperienceFormData) => Promise<{ error?: string }>;
  onUpdate: (id: string, data: ExperienceFormData) => Promise<{ error?: string }>;
  onDelete: (id: string) => Promise<{ error?: string }>;
}

const defaultForm: ExperienceFormData = {
  company: "",
  title: "",
  location: "",
  start_date: null,
  end_date: null,
  is_current: false,
  description: "",
};

export default function ExperienceSection({
  items,
  onAdd,
  onUpdate,
  onDelete,
}: ExperienceSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExperienceFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: Experience) => {
    setForm({
      company: item.company,
      title: item.title,
      location: item.location,
      start_date: item.start_date,
      end_date: item.end_date,
      is_current: item.is_current,
      description: item.description,
    });
    setEditingId(item.id);
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const parsed = experienceSchema.safeParse(form);
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

  const setField = (key: keyof ExperienceFormData, value: string | boolean | null) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Card
        title="Work Experience"
        icon="work"
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
            icon="work"
            title="No experience added"
            description="Add your work history"
            action={
              <button
                onClick={openNew}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Add Experience
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
              >
                <div className="size-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-green-500 text-xl">
                    work
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.company}
                    {item.location && ` · ${item.location}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDate(item.start_date)} —{" "}
                    {item.is_current ? (
                      <span className="text-green-500 font-medium">Present</span>
                    ) : (
                      formatDate(item.end_date)
                    )}
                  </p>
                  {item.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-slate-400 text-lg">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <span
                      className={`material-symbols-outlined text-lg ${
                        deletingId === item.id
                          ? "animate-spin text-slate-400"
                          : "text-red-400"
                      }`}
                    >
                      {deletingId === item.id ? "progress_activity" : "delete"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Experience Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Experience" : "Add Experience"}
      >
        <div className="space-y-4">
          {errors._form && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {errors._form}
            </p>
          )}
          <FormField
            label="Job Title"
            required
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            error={errors.title}
            placeholder="e.g. Software Engineer"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Company"
              required
              value={form.company}
              onChange={(e) => setField("company", e.target.value)}
              error={errors.company}
              placeholder="e.g. Google"
            />
            <FormField
              label="Location"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              error={errors.location}
              placeholder="e.g. San Francisco, CA"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Start Date"
              type="date"
              value={form.start_date || ""}
              onChange={(e) => setField("start_date", e.target.value || null)}
              error={errors.start_date}
            />
            <FormField
              label="End Date"
              type="date"
              value={form.end_date || ""}
              onChange={(e) => setField("end_date", e.target.value || null)}
              error={errors.end_date}
              disabled={form.is_current}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={(e) => {
                setField("is_current", e.target.checked);
                if (e.target.checked) setField("end_date", null);
              }}
              className="rounded border-slate-300 text-primary focus:ring-primary/50"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              I currently work here
            </span>
          </label>
          <TextAreaField
            label="Description"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            error={errors.description}
            placeholder="Describe your responsibilities and achievements…"
            rows={4}
          />
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
              {editingId ? "Save Changes" : "Add Experience"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
