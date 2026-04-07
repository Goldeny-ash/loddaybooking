"use client";

import { useState } from "react";

import ImageUpload from "@/components/ImageUpload";
import type { BlogCategoryRecord } from "@/lib/blog";

type Props = {
  initialCategories: BlogCategoryRecord[];
};

type FormState = {
  name: string;
  description: string;
  audience: "owners" | "affiliates" | "all";
  heroImage: string;
  featured: boolean;
  sortOrder: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  audience: "all",
  heroImage: "",
  featured: false,
  sortOrder: "0",
};

export default function BlogCategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<string>("");

  function startEdit(category: BlogCategoryRecord) {
    setEditingId(category._id);
    setForm({
      name: category.name,
      description: category.description,
      audience: category.audience,
      heroImage: category.heroImage,
      featured: category.featured,
      sortOrder: String(category.sortOrder || 0),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder || 0),
    };

    const response = await fetch(editingId ? `/api/admin/blog/categories/${editingId}` : "/api/admin/blog/categories", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Unable to save category.");
      return;
    }

    if (editingId) {
      setCategories((current) => current.map((item) => (item._id === editingId ? result.category : item)));
    } else {
      setCategories((current) => [result.category, ...current]);
    }

    setMessage("Category saved.");
    resetForm();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this category? Posts will keep their content but lose the category.")) return;
    const response = await fetch(`/api/admin/blog/categories/${id}`, { method: "DELETE" });
    if (response.ok) {
      setCategories((current) => current.filter((item) => item._id !== id));
      if (editingId === id) resetForm();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Category editor</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{editingId ? "Edit category" : "Add category"}</h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]"
            placeholder="How to Get More Clients in Kenya"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]"
            placeholder="Optional SEO description for the category page."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Audience</span>
            <select
              value={form.audience}
              onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value as FormState["audience"] }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]"
            >
              <option value="all">All audiences</option>
              <option value="owners">Service businesses</option>
              <option value="affiliates">Affiliates</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Sort order</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]"
            />
          </label>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Hero image</span>
          <ImageUpload
            value={form.heroImage ? [form.heroImage] : []}
            onChange={(urls) => setForm((current) => ({ ...current, heroImage: urls[0] || "" }))}
            uploadPreset="business_logos"
            maxFiles={1}
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
          />
          Feature this category on the blog home
        </label>

        {message ? <p className="text-sm text-[#15616D]">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-full bg-[#15616D] px-5 py-3 text-sm font-semibold text-white">
            {editingId ? "Update category" : "Create category"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Existing categories</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Organize content lanes</h2>
        </div>

        <div className="mt-6 space-y-4">
          {categories.map((category) => (
            <article key={category._id} className="rounded-[1.5rem] border border-slate-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <span>{category.audience}</span>
                    {category.featured ? <span>featured</span> : null}
                    <span>{category.postCount || 0} posts</span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">{category.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">/{category.slug}</p>
                  {category.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p> : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => startEdit(category)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(category._id)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
