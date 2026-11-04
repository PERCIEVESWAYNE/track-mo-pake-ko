
import { useEffect, useState } from "react";
import { X, Tags, Check } from "lucide-react";

export type UserCategory = {
  id: string;
  name: string;
};

type CategoryManagerProps = {
  initialCategories: UserCategory[];
  defaultCategories: string[];
  onboarding: boolean;
  saving: boolean;
  onSave: (categories: UserCategory[]) => Promise<void>;
  onClose: () => void;
};

function CategoryManager({
  initialCategories,
  defaultCategories,
  onboarding,
  saving,
  onSave,
  onClose,
}: CategoryManagerProps) {
  const [selectedCategories, setSelectedCategories] =
    useState<UserCategory[]>(initialCategories);

  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedCategories(initialCategories);
  }, [initialCategories]);

  // Show all admin-created categories as selectable options.
  const availableCategories: UserCategory[] = defaultCategories.map(
    (name) => ({
      id: `default-${name}`,
      name,
    })
  );

  function toggleCategory(category: UserCategory) {
    setSelectedCategories((previous) => {
      const alreadySelected = previous.some(
        (item) => item.name.toLowerCase() === category.name.toLowerCase()
      );

      if (alreadySelected) {
        return previous.filter(
          (item) => item.name.toLowerCase() !== category.name.toLowerCase()
        );
      }

      return [...previous, category];
    });

    setError("");
  }

  async function handleSave() {
    if (selectedCategories.length === 0) {
      setError("Please select at least one expense category.");
      return;
    }

    try {
      setError("");
      await onSave(selectedCategories);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your categories."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <Tags size={22} />
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              {onboarding
                ? "Welcome to Track Mo!"
                : "Manage Expense Categories"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {onboarding
                ? "Choose the expense categories you want to use."
                : "Select the categories you want to appear in your expenses."}
            </p>
          </div>

          {!onboarding && (
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="mt-5 space-y-2">
          {availableCategories.map((category) => {
            const checked = selectedCategories.some(
              (item) =>
                item.name.toLowerCase() === category.name.toLowerCase()
            );

            return (
              <label
                key={category.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  checked
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(category)}
                  disabled={saving}
                  className="h-4 w-4 accent-emerald-600"
                />

                <span className="flex-1 text-sm font-medium text-gray-800">
                  {category.name}
                </span>

                {checked && (
                  <Check size={18} className="text-emerald-600" />
                )}
              </label>
            );
          })}

          {availableCategories.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
              No categories are available yet. Please contact the administrator.
            </p>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          {selectedCategories.length} categories selected
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          {!onboarding && (
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || availableCategories.length === 0}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : onboarding
                ? "Save and Continue"
                : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryManager;
