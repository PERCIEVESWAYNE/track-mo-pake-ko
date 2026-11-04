
import { useState } from "react";
import type { NotificationPreferences } from "../../types/notifications";
import { Bell, Mail, X } from "lucide-react";

type NotificationSettingsProps = {
  preferences: NotificationPreferences;
  onUpdate: (
    updates: Partial<NotificationPreferences>
  ) => Promise<void>;
  loading: boolean;
  isDark?: boolean;
};

type Channel = "email" | "in_app";

export default function NotificationSettings({
  preferences,
  onUpdate,
  loading,
  isDark = false,
}: NotificationSettingsProps) {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState({
    email_threshold_50_enabled: preferences.email_threshold_50_enabled,
    email_threshold_80_enabled: preferences.email_threshold_80_enabled,
    email_threshold_100_enabled: preferences.email_threshold_100_enabled,
    in_app_threshold_50_enabled: preferences.in_app_threshold_50_enabled,
    in_app_threshold_80_enabled: preferences.in_app_threshold_80_enabled,
    in_app_threshold_100_enabled: preferences.in_app_threshold_100_enabled,
  });

  const panel = isDark
    ? "border-gray-700 bg-gray-900 text-gray-100"
    : "border-gray-200 bg-white text-gray-800";

  const muted = isDark ? "text-gray-400" : "text-gray-500";

  const options: Record<
    Channel,
    {
      key:
        | "email_threshold_50_enabled"
        | "email_threshold_80_enabled"
        | "email_threshold_100_enabled"
        | "in_app_threshold_50_enabled"
        | "in_app_threshold_80_enabled"
        | "in_app_threshold_100_enabled";
      label: string;
    }[]
  > = {
    email: [
      { key: "email_threshold_50_enabled", label: "50% of allowance used" },
      { key: "email_threshold_80_enabled", label: "80% of allowance used" },
      { key: "email_threshold_100_enabled", label: "100% of allowance used" },
    ],
    in_app: [
      { key: "in_app_threshold_50_enabled", label: "50% of allowance used" },
      { key: "in_app_threshold_80_enabled", label: "80% of allowance used" },
      { key: "in_app_threshold_100_enabled", label: "100% of allowance used" },
    ],
  };

  function openChannel(channel: Channel) {
    setError("");

    setSelected({
      email_threshold_50_enabled: preferences.email_threshold_50_enabled,
      email_threshold_80_enabled: preferences.email_threshold_80_enabled,
      email_threshold_100_enabled: preferences.email_threshold_100_enabled,
      in_app_threshold_50_enabled: preferences.in_app_threshold_50_enabled,
      in_app_threshold_80_enabled: preferences.in_app_threshold_80_enabled,
      in_app_threshold_100_enabled: preferences.in_app_threshold_100_enabled,
    });

    setActiveChannel(channel);
  }

  async function toggleChannel(channel: Channel, enabled: boolean) {
    setError("");

    if (enabled) {
      openChannel(channel);
      return;
    }

    try {
      setSaving(true);

      await onUpdate({
        [channel === "email"
          ? "email_alerts_enabled"
          : "in_app_notifications_enabled"]: false,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification preferences."
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences() {
    if (!activeChannel) return;

    setError("");
    setSaving(true);

    try {
      const updates =
        activeChannel === "email"
          ? {
              email_alerts_enabled: true,
              email_threshold_50_enabled:
                selected.email_threshold_50_enabled,
              email_threshold_80_enabled:
                selected.email_threshold_80_enabled,
              email_threshold_100_enabled:
                selected.email_threshold_100_enabled,
            }
          : {
              in_app_notifications_enabled: true,
              in_app_threshold_50_enabled:
                selected.in_app_threshold_50_enabled,
              in_app_threshold_80_enabled:
                selected.in_app_threshold_80_enabled,
              in_app_threshold_100_enabled:
                selected.in_app_threshold_100_enabled,
            };

      await onUpdate(updates);
      setActiveChannel(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save notification preferences."
      );
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    if (saving) return;
    setActiveChannel(null);
    setError("");
  }

  const channels = [
    {
      id: "email" as const,
      title: "Email Budget Alerts",
      description: "Receive budget alerts through your registered email.",
      enabled: preferences.email_alerts_enabled,
      icon: Mail,
    },
    {
      id: "in_app" as const,
      title: "In-App Notifications",
      description: "Receive budget alerts inside the application.",
      enabled: preferences.in_app_notifications_enabled,
      icon: Bell,
    },
  ];

  return (
    <>
      <div className="space-y-4">
        {channels.map((channel) => {
          const Icon = channel.icon;

          return (
            <div
              key={channel.id}
              className={`flex items-center justify-between gap-4 border-t py-4 ${
                isDark ? "border-gray-800" : "border-gray-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon size={19} className={`mt-0.5 ${muted}`} />

                <div>
                  <p className="text-sm font-medium">{channel.title}</p>
                  <p className={`mt-1 text-xs ${muted}`}>
                    {channel.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-label={channel.title}
                aria-checked={channel.enabled}
                disabled={loading || saving}
                onClick={() =>
                  toggleChannel(channel.id, !channel.enabled)
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                  channel.enabled
                    ? "bg-green-600"
                    : isDark
                      ? "bg-gray-600"
                      : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
                    channel.enabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          );
        })}

        {error && !activeChannel && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {activeChannel && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-modal-title"
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${panel}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2
                  id="notification-modal-title"
                  className="text-lg font-bold"
                >
                  {activeChannel === "email"
                    ? "Email Alert Preferences"
                    : "In-App Notification Preferences"}
                </h2>

                <p className={`mt-2 text-sm ${muted}`}>
                  Choose when you want to receive budget notifications.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close notification preferences"
                className={`rounded-lg p-2 ${muted} hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50`}
              >
                <X size={19} />
              </button>
            </div>

            <div
              className={`space-y-4 rounded-xl border p-4 ${
                isDark
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>
                Notify me when
              </p>

              {options[activeChannel].map((option) => (
                <label
                  key={option.key}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={selected[option.key]}
                    onChange={(event) =>
                      setSelected((previous) => ({
                        ...previous,
                        [option.key]: event.target.checked,
                      }))
                    }
                    disabled={saving}
                    className="h-5 w-5 shrink-0 accent-green-600"
                  />

                  <span className="text-sm font-medium">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
                  isDark
                    ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={savePreferences}
                disabled={saving || loading}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
