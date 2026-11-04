export type NotificationPreferences = {
  email_alerts_enabled: boolean;
  in_app_notifications_enabled: boolean;
  email_threshold_50_enabled: boolean;
  email_threshold_80_enabled: boolean;
  email_threshold_100_enabled: boolean;
  in_app_threshold_50_enabled: boolean;
  in_app_threshold_80_enabled: boolean;
  in_app_threshold_100_enabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email_alerts_enabled: true,
  in_app_notifications_enabled: true,
  email_threshold_50_enabled: true,
  email_threshold_80_enabled: true,
  email_threshold_100_enabled: true,
  in_app_threshold_50_enabled: true,
  in_app_threshold_80_enabled: true,
  in_app_threshold_100_enabled: true,
};