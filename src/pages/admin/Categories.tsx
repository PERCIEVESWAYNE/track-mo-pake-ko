
import { useEffect, useState } from "react";
import {
  Tags,
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Category = {
  id: string;
  name: string;
  created_at: string;
};

// Create an audit log without interrupting the category operation
// if audit logging encounters an error.
async function createAuditLog(
  action: string,
  description: string
) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      console.error("Unable to create audit log: No authenticated user.");
      return;
    }

    const { error } = await supabase
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action,
        description,
      });

    if (error) {
      console.error("Unable to create audit log:", error);
    }
  } catch (error) {
    console.error("Audit logging failed:", error);
  }
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, created_at")
        .order("name", { ascending: true });

      if (error) throw error;

      setCategories((data ?? []) as Category[]);
    } catch (err) {
      console.error("Categories loading error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function resetForm() {
    setCategoryName("");
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      setError("Please enter a category name.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === trimmedName.toLowerCase() &&
        category.id !== editingId
    );

    if (duplicate) {
      setError("This category already exists.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        const oldCategory = categories.find(
          (category) => category.id === editingId
        );

        const { error } = await supabase
          .from("categories")
          .update({ name: trimmedName })
          .eq("id", editingId);

        if (error) throw error;

        await createAuditLog(
          "UPDATE",
          `Updated category: ${oldCategory?.name ?? "Unknown"} → ${trimmedName}`
        );

        setSuccess("Category updated successfully.");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({ name: trimmedName });

        if (error) throw error;

        await createAuditLog(
          "CREATE",
          `Added a new category: ${trimmedName}`
        );

        setSuccess("Category added successfully.");
      }

      resetForm();
      await loadCategories();
    } catch (err) {
      console.error("Category save error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(category: Category) {
    setCategoryName(category.name);
    setEditingId(category.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (error) throw error;

      await createAuditLog(
        "DELETE",
        `Deleted category: ${category.name}`
      );

      setSuccess("Category deleted successfully.");
      await loadCategories();
    } catch (err) {
      console.error("Category deletion error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete category."
      );
    }
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tags className="text-emerald-600" size={25} />
            <h1 className="text-2xl font-bold text-gray-900">
              Category Management
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Manage the expense categories available in Track Mo, Pake ko!
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadCategories}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus size={17} />
            Add Category
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} aria-label="Dismiss message">
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <Tags size={25} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Categories</p>
            <h2 className="mt-1 text-3xl font-bold text-gray-900">
              {loading ? "—" : categories.length}
            </h2>
          </div>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {editingId ? "Edit Category" : "Add New Category"}
            </h2>

            <button
              onClick={resetForm}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Close form"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="categoryName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Category Name
              </label>

              <input
                id="categoryName"
                type="text"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Enter category name"
                maxLength={50}
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check size={16} />
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Category"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Category List */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h2 className="font-bold text-gray-900">Expense Categories</h2>
            <p className="mt-1 text-sm text-gray-500">
              View and manage available categories.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-full bg-gray-100 p-3 text-gray-400">
              <Tags size={25} />
            </div>
            <p className="text-sm font-medium text-gray-700">
              {searchTerm.trim()
                ? "No matching categories found."
                : "No categories available yet."}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {searchTerm.trim()
                ? "Try another category name."
                : "Add a category to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Category Name</th>
                  <th className="px-5 py-4 font-semibold">Date Created</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {category.name}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(category.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          title="Edit category"
                          className="rounded-lg border border-gray-200 p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(category)}
                          title="Delete category"
                          className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
