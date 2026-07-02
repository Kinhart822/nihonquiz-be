import { IMailType } from './mail.constant';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

export enum RoleUser {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export enum AccessMethod {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  AUDIO = 'AUDIO',
}

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

export enum ParticipantRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

export enum ParticipantStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  LEFT = 'LEFT',
  KICKED = 'KICKED',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

export enum JoinGroupRequestAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
}

export enum MessageType {
  TEXT = 'TEXT',
  ATTACHMENT = 'ATTACHMENT',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum MessageAttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
}

export enum MessageAttachmentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  DELETED = 'DELETED',
}

export enum AssignmentAttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
}

export enum AssignmentAttachmentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  DELETED = 'DELETED',
}

export const REGISTER_RES = 'OTP for registration has been sent to your email.';
export const FORGOT_PASSWORD_RES =
  'OTP for password reset has been sent to your email.';
export const RESEND_RES = (type: IMailType) => {
  return `Verification code (${type}) has been resent.`;
};
export const RESET_PASSWORD_RES = 'Password has been reset successfully.';
export const LOGOUT_RES = 'User has been logged out successfully.';
export const UPDATE_PROFILE_RES = 'Profile updated successfully.';

export const VERIFY_ACCOUNT_RES = (type: IMailType) => {
  if (type === IMailType.SIGN_UP) {
    return 'Account verified and activated.';
  } else if (type === IMailType.FORGOT_PASSWORD) {
    return 'Verification successful. You can now reset your password.';
  } else {
    return 'Verification successful.';
  }
};

export enum AccountHistoryType {
  REGISTER = 'REGISTER',
  SIGN_IN = 'SIGN_IN',
  BLOCKED = 'BLOCKED',
  UNBLOCKED = 'UNBLOCKED',
  DELETED = 'DELETED',
}
