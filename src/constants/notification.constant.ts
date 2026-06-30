export enum NotificationType {
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED',
  ASSIGNMENT_GRADED = 'ASSIGNMENT_GRADED',
  CLASS_ANNOUNCEMENT = 'CLASS_ANNOUNCEMENT',
  NEW_MESSAGE = 'NEW_MESSAGE',
}

export const NOTIFICATION_MESSAGES = {
  [NotificationType.SYSTEM_ALERT]: {
    title: 'System Alert',
    message: (content: string) => content,
  },
  [NotificationType.ASSIGNMENT_CREATED]: {
    title: 'New Assignment',
    message: (title: string) =>
      `A new assignment "${title}" has been posted in your class.`,
  },
  [NotificationType.ASSIGNMENT_GRADED]: {
    title: 'Assignment Graded',
    message: (score: number) =>
      `Your submission for the assignment has been graded. Score: ${score}`,
  },
  [NotificationType.CLASS_ANNOUNCEMENT]: {
    title: 'New Class Announcement',
    message: (className: string, title: string) =>
      `A new announcement has been posted in ${className}: ${title}`,
  },
  [NotificationType.NEW_MESSAGE]: {
    title: 'New Message',
    message: (senderName: string) =>
      `You received a new message from ${senderName}`,
  },
};
