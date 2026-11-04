
import { useState } from "react";
import type { FormEvent } from "react";
import type { NotificationPreferences } from "../../types/notifications";
import { supabase } from "../../lib/supabase";
import NotificationSettings from "./NotificationSettings";

import {
  User,
  Palette,
  X,
  Eye,
  EyeOff,
  Mail,
  Settings2,
  Moon,
  Sun,
  Lock,
} from "lucide-react";

type SettingsProps = {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  notificationPreferences: NotificationPreferences;
  onUpdateNotificationPreferences: (
    updates: Partial<NotificationPreferences>
  ) => Promise<void>;
  notificationPreferencesLoading: boolean;
};

export default function Settings({
  theme,
  onThemeChange,
  notificationPreferences,
  onUpdateNotificationPreferences,
  notificationPreferencesLoading,
}: SettingsProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savedName, setSavedName] = useState("");
  const [savedEmail, setSavedEmail] = useState("");

  const [currency, setCurrency] = useState("PHP");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const isDark = theme === "dark";

  const text = isDark ? "text-gray-100" : "text-gray-800";
  const muted = isDark ? "text-gray-400" : "text-gray-500";

  const panel = isDark
    ? "border-gray-800 bg-gray-900"
    : "border-gray-200 bg-white";

  const divider = isDark ? "border-gray-800" : "border-gray-100";

  const inputStyle = `w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 ${
    isDark
      ? "border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
      : "border-gray-300 bg-white text-gray-800 placeholder:text-gray-400"
  }`;

  async function openProfile() {
    setProfileError("");
    setProfileMessage("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);

    setProfileLoading(true);

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) throw error;

      const user = data.user;

      if (!user) {
        throw new Error("Unable to load your account. Please sign in again.");
      }

      const currentName =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        "";

      setName(currentName);
      setEmail(user.email ?? "");
      setSavedName(currentName);
      setSavedEmail(user.email ?? "");
      setIsProfileOpen(true);
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to load your profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  function closeProfile() {
    if (profileLoading) return;

    setIsProfileOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileError("");
    setProfileMessage("");
    setShowPassword(false);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setProfileError("");
    setProfileMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setProfileError("Please complete your name and email address.");
      return;
    }

    const passwordFieldsFilled =
      currentPassword !== "" ||
      newPassword !== "" ||
      confirmPassword !== "";

    if (passwordFieldsFilled) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setProfileError(
          "Please complete all password fields to change your password."
        );
        return;
      }

      if (newPassword.length < 8) {
        setProfileError(
          "Your new password must contain at least 8 characters."
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        setProfileError("Your new passwords do not match.");
        return;
      }

      if (newPassword === currentPassword) {
        setProfileError(
          "Your new password must be different from your current password."
        );
        return;
      }
    }

    setProfileLoading(true);

    try {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const user = data.user;

      if (!user || !user.email) {
        throw new Error(
          "Unable to identify your account. Please sign in again."
        );
      }

      const emailChanged =
        trimmedEmail.toLowerCase() !== user.email.toLowerCase();

      const nameChanged =
        trimmedName !== (user.user_metadata?.full_name ?? "");

      const updates = {
        ...(emailChanged ? { email: trimmedEmail } : {}),
        ...(passwordFieldsFilled
          ? {
              password: newPassword,
              current_password: currentPassword,
            }
          : {}),
        ...(nameChanged
          ? {
              data: {
                full_name: trimmedName,
              },
            }
          : {}),
      } as Parameters<typeof supabase.auth.updateUser>[0];

      if (Object.keys(updates).length > 0) {
        const { error: updateError } =
          await supabase.auth.updateUser(updates);

        if (updateError) {
          if (
            updateError.message.toLowerCase().includes("current_password")
          ) {
            throw new Error(
              "Your current password is incorrect or could not be verified."
            );
          }

          throw updateError;
        }
      }

      setSavedName(trimmedName);

      // Supabase may require email confirmation before applying the new email.
      setSavedEmail(emailChanged ? user.email : trimmedEmail);

      if (emailChanged) {
        setProfileMessage(
          "Your profile was updated. Please check your new email address for a confirmation link before the email change takes effect."
        );
      } else if (passwordFieldsFilled) {
        setProfileMessage(
          "Your profile and password were updated successfully."
        );
      } else {
        setProfileMessage("Your profile was updated successfully.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Keep the modal open briefly so the user can read the result.
      window.setTimeout(() => {
        setIsProfileOpen(false);
        setProfileMessage("");
      }, 2500);
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile. Please try again."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  function SectionHeading({
    icon: Icon,
    title,
    description,
  }: {
    icon: typeof User;
    title: string;
    description: string;
  }) {
    return (
      <div className="flex items-start gap-3">
        <div
          className={`rounded-lg p-2.5 ${
            isDark
              ? "bg-green-950 text-green-400"
              : "bg-green-50 text-green-700"
          }`}
        >
          <Icon size={20} />
        </div>

        <div>
          <h2 className={`font-semibold ${text}`}>{title}</h2>
          <p className={`mt-1 text-sm ${muted}`}>{description}</p>
        </div>
      </div>
    );
  }

  function Toggle({
    checked,
    onChange,
    label,
    disabled = false,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    disabled?: boolean;
  }) {
    return (
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          checked
            ? "bg-green-600"
            : isDark
              ? "bg-gray-600"
              : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    );
  }

  return (
    <div className={`mx-auto w-full max-w-5xl space-y-6 ${text}`}>
      {/* Page Heading */}
      <div className="flex items-center gap-3">
        <div
          className={`rounded-xl p-3 ${
            isDark
              ? "bg-gray-800 text-green-400"
              : "bg-green-100 text-green-700"
          }`}
        >
          <Settings2 size={23} />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className={`mt-1 text-sm ${muted}`}>
            Manage your account and application preferences.
          </p>
        </div>
      </div>

      {/* Profile Overview */}
      <section className={`rounded-xl border p-5 sm:p-6 ${panel}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            <User size={27} />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${muted}`}
            >
              My Account
            </p>

            <h2 className="mt-1 text-lg font-bold">
              {savedName || "Your Profile"}
            </h2>

            <p className={`mt-1 flex items-center gap-2 text-sm ${muted}`}>
              <Mail size={14} />
              {savedEmail || "Add your email address"}
            </p>
          </div>

          <button
            type="button"
            onClick={openProfile}
            disabled={profileLoading}
            className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {profileLoading ? "Loading..." : "Edit Profile"}
          </button>
        </div>

        {profileError && !isProfileOpen && (
          <p className="mt-3 text-sm text-red-500">{profileError}</p>
        )}
      </section>

      {/* Appearance */}
      <section className={`rounded-xl border p-5 sm:p-6 ${panel}`}>
        <SectionHeading
          icon={Palette}
          title="Appearance"
          description="Choose between light and dark mode for the entire application."
        />

        <div
          className={`mt-5 flex items-center justify-between gap-4 border-t pt-4 ${divider}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2.5 ${
                isDark
                  ? "bg-gray-800 text-blue-400"
                  : "bg-amber-50 text-amber-500"
              }`}
            >
              {isDark ? <Moon size={21} /> : <Sun size={21} />}
            </div>

            <div>
              <p className={`text-sm font-semibold ${text}`}>
                {isDark ? "Dark Mode" : "Light Mode"}
              </p>

              <p className={`mt-1 text-xs ${muted}`}>
                {isDark
                  ? "Dark appearance is currently enabled."
                  : "Light appearance is currently enabled."}
              </p>
            </div>
          </div>

          <Toggle
            checked={isDark}
            onChange={(checked) =>
              onThemeChange(checked ? "dark" : "light")
            }
            label="Enable dark mode"
          />
        </div>
      </section>

      {/* Preferences */}
      <section className={`rounded-xl border p-5 sm:p-6 ${panel}`}>
        <SectionHeading
          icon={Settings2}
          title="Preferences"
          description="Manage your currency and notification preferences."
        />

        <div className="mt-5">
          {/* Currency */}
          <div
            className={`flex flex-col gap-3 border-t py-4 sm:flex-row sm:items-center sm:justify-between ${divider}`}
          >
            <div>
              <p className={`text-sm font-medium ${text}`}>
                Display Currency
              </p>

              <p className={`mt-1 text-xs ${muted}`}>
                Choose the currency used for displaying expenses.
              </p>
            </div>

            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className={`${inputStyle} sm:max-w-xs`}
            >
              <option value="PHP">Philippine Peso (₱)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="JPY">Japanese Yen (¥)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          </div>

          {/* Notification Preferences */}
          <div className="border-t pt-4">
            <div className="mb-3">
              <p className={`text-sm font-semibold ${text}`}>
                Budget Notifications
              </p>

              <p className={`mt-1 text-xs ${muted}`}>
                Choose when and how you want to receive budget alerts.
              </p>
            </div>

            <NotificationSettings
              preferences={notificationPreferences}
              onUpdate={onUpdateNotificationPreferences}
              loading={notificationPreferencesLoading}
              isDark={isDark}
            />

            {notificationPreferencesLoading && (
              <p className={`mt-2 text-xs ${muted}`}>
                Loading your notification preferences...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Edit Profile Modal */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeProfile}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl p-6 shadow-2xl ${
              isDark
                ? "border border-gray-700 bg-gray-900 text-gray-100"
                : "bg-white text-gray-800"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 id="edit-profile-title" className="text-xl font-bold">
                  Edit Profile
                </h2>

                <p className={`mt-1 text-sm ${muted}`}>
                  Update your personal information and password.
                </p>
              </div>

              <button
                type="button"
                onClick={closeProfile}
                disabled={profileLoading}
                className={`rounded-lg p-2 ${muted}`}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveProfile} className="space-y-5">
              {/* Personal Information */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <User size={18} className="text-green-600" />
                  <h3 className="text-sm font-semibold">
                    Personal Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Full Name
                    </label>

                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      placeholder="Enter your full name"
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      placeholder="Enter your email"
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className={`border-t pt-5 ${divider}`}>
                <div className="mb-4 flex items-center gap-2">
                  <Lock size={18} className="text-green-600" />
                  <h3 className="text-sm font-semibold">
                    Change Password
                  </h3>
                </div>

                <p className={`mb-4 text-xs ${muted}`}>
                  Leave these fields blank if you do not want to change your password.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Current Password
                    </label>

                    <input
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      placeholder="Enter current password"
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      New Password
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(event.target.value)
                        }
                        placeholder="At least 8 characters"
                        className={`${inputStyle} pr-12`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted}`}
                        aria-label={
                          showPassword
                            ? "Hide new password"
                            : "Show new password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Confirm New Password
                    </label>

                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm your new password"
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Messages */}
              {profileError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {profileError}
                </p>
              )}

              {profileMessage && (
                <p
                  role="status"
                  className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
                >
                  {profileMessage}
                </p>
              )}

              {/* Actions */}
              <div
                className={`flex justify-end gap-3 border-t pt-5 ${divider}`}
              >
                <button
                  type="button"
                  onClick={closeProfile}
                  disabled={profileLoading}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
                    isDark
                      ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
