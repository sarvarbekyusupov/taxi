export enum NotificationRecipientType {
  USER = "user",
  DRIVER = "driver",
  ADMIN = "admin",
}

export enum NotificationType {
  SYSTEM = "system",
  PROMOTION = "promotion",
  ALERT = "alert",
}

export enum NotificationChannel {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
}

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  READ = "read",
}
