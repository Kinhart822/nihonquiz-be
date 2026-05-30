import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

// 400
export function httpBadRequest(message?: string, code?: string) {
  throw new BadRequestException({
    statusCode: 400,
    errorCode: code ?? null,
    message,
  });
}

// 401
export function httpUnAuthorized(message?: string, code?: string) {
  throw new UnauthorizedException({
    statusCode: 401,
    errorCode: code ?? null,
    message,
  });
}

// 403
export function httpForbidden(message?: string, code?: string) {
  throw new ForbiddenException({
    statusCode: 403,
    errorCode: code ?? null,
    message,
  });
}

// 404
export function httpNotFound(message?: string, code?: string) {
  throw new NotFoundException({
    statusCode: 404,
    errorCode: code ?? null,
    message,
  });
}

// 500
export function httpInternalServerErrorException(
  message?: string,
  code?: string,
) {
  throw new InternalServerErrorException({
    statusCode: 500,
    errorCode: code ?? null,
    message,
  });
}

// 503
export function httpServiceUnavailable(message?: string, code?: string) {
  throw new ServiceUnavailableException({
    statusCode: 503,
    errorCode: code ?? null,
    message,
  });
}

export const httpErrors = {
  // Bad request
  BAD_REQUEST: {
    message: 'Bad request.',
    code: 'BAD_REQUEST',
  },

  // user error
  INVALID_USER_ID: {
    message: 'Invalid user ID.',
    code: 'INVALID_USER_ID',
  },
  ACCOUNT_NOT_FOUND: {
    message: 'Account not found.',
    code: 'ACCOUNT_NOT_FOUND',
  },
  ACCOUNT_EXISTED: {
    message: 'Account already existed.',
    code: 'ACCOUNT_EXISTED',
  },
  USERNAME_EXISTED: {
    message: 'Username already existed.',
    code: 'USERNAME_EXISTED',
  },
  ACCOUNT_HASH_NOT_MATCH: {
    message: 'Account adress and hash message are not matched.',
    code: 'ACCOUNT_HASH_NOT_MATCH',
  },
  UNAUTHORIZED: {
    message: 'Unauthorized user.',
    code: 'UNAUTHORIZED',
  },
  BLOCKED_USER: {
    message: 'User has been blocked.',
    code: 'BLOCKED_USER',
  },
  ACCOUNT_DELETED: {
    message: 'Account has been deleted.',
    code: 'ACCOUNT_DELETED',
  },
  USER_ALREADY_BLOCKED: {
    message: 'User is already blocked.',
    code: 'USER_ALREADY_BLOCKED',
  },
  USER_NOT_BLOCKED: {
    message: 'User is not blocked.',
    code: 'USER_NOT_BLOCKED',
  },
  USER_ALREADY_DELETED: {
    message: 'User is already deleted.',
    code: 'USER_ALREADY_DELETED',
  },
  REFRESH_TOKEN_EXPIRED: {
    message: 'Refresh tokens is expired.',
    code: 'REFRESH_TOKEN_EXPIRED',
  },
  ACCESS_TOKEN_EXPIRED: {
    message: 'Refresh tokens is expired.',
    code: 'ACCESS_TOKEN_EXPIRED',
  },
  FORBIDDEN: {
    message: 'You are not authorized to access this resource.',
    code: 'FORBIDDEN',
  },
  EMAIL_EXISTED: {
    message: 'Email has been associted with an other account.',
    code: 'EMAIL_EXISTED',
  },
  ALREADY_LOGOUT: {
    message: 'User has already logout.',
    code: 'ALREADY_LOGOUT',
  },
  INVALID_CREDENTIALS: {
    message: 'Invalid email or password.',
    code: 'INVALID_CREDENTIALS',
  },
  ALREADY_VERIFIED: {
    message: 'User is already verified.',
    code: 'ALREADY_VERIFIED',
  },
  PENDING_VERIFICATION: {
    message: 'User is pending verification. Please verify your email.',
    code: 'PENDING_VERIFICATION',
  },
  INVALID_OTP: {
    message: 'Invalid or expired verification code',
    code: 'INVALID_OTP',
  },
  INVALID_REGISTER_OTP: {
    message:
      'Registration data not found or has expired. Please register again.',
    code: 'INVALID_REGISTER_OTP',
  },
  TOO_MANY_RESENDS: {
    message: 'Too many OTP resends. Please wait until the current OTP expires.',
    code: 'TOO_MANY_RESENDS',
  },
  OTP_ALREADY_SENT: {
    message:
      'An OTP has already been sent to this email. Please use the resend function if you did not receive it.',
    code: 'OTP_ALREADY_SENT',
  },

  // conversation error
  CONVERSATION_NOT_FOUND: {
    message: 'Conversation not found.',
    code: 'CONVERSATION_NOT_FOUND',
  },
  CONVERSATION_EXISTED: {
    message: 'Conversation already existed.',
    code: 'CONVERSATION_EXISTED',
  },
  CANNOT_CREATE_SELF_CONVERSATION: {
    message: 'Cannot create conversation with yourself.',
    code: 'CANNOT_CREATE_SELF_CONVERSATION',
  },
  INVALID_CONVERSATION: {
    message: 'Invalid conversation.',
    code: 'INVALID_CONVERSATION',
  },
  INVALID_PARTICIPANTS: {
    message: 'Invalid participants.',
    code: 'INVALID_PARTICIPANTS',
  },
  CANNOT_ADD_BLOCKED_OR_DELETED_MEMBER: {
    message: 'Cannot add blocked or deleted member to conversation.',
    code: 'CANNOT_ADD_BLOCKED_OR_DELETED_MEMBER',
  },
  CANNOT_CHANGE_OWNER_DIRECT_CONVERSATION: {
    message: 'Cannot change owner of direct conversation.',
    code: 'CANNOT_CHANGE_OWNER_DIRECT_CONVERSATION',
  },
  NOT_OWNER_OF_CONVERSATION: {
    message: 'You are not owner of this conversation.',
    code: 'NOT_OWNER_OF_CONVERSATION',
  },
  NOT_PARTICIPANT_OF_CONVERSATION: {
    message: 'You are not participant of this conversation.',
    code: 'NOT_PARTICIPANT_OF_CONVERSATION',
  },
  ALREADY_PARTICIPANT_OF_CONVERSATION: {
    message: 'Already participant of this conversation.',
    code: 'ALREADY_PARTICIPANT_OF_CONVERSATION',
  },
  CANNOT_LEAVE_GROUP_AS_OWNER: {
    message: 'You are owner of this group. Cannot leave group.',
    code: 'CANNOT_LEAVE_GROUP_AS_OWNER',
  },
  CANNOT_BLOCK_GROUP: {
    message: 'Cannot block group.',
    code: 'CANNOT_BLOCK_GROUP',
  },
  CANNOT_KICK_OWNER: {
    message: 'Cannot kick owner of group.',
    code: 'CANNOT_KICK_OWNER',
  },
  JOIN_REQUEST_NOT_FOUND: {
    message: 'Join group request not found.',
    code: 'JOIN_REQUEST_NOT_FOUND',
  },
  JOIN_REQUEST_ALREADY_PENDING: {
    message: 'You already have a pending join request for this group.',
    code: 'JOIN_REQUEST_ALREADY_PENDING',
  },
  JOIN_REQUEST_ALREADY_PROCESSED: {
    message: 'This join request has already been processed.',
    code: 'JOIN_REQUEST_ALREADY_PROCESSED',
  },
  CANNOT_JOIN_DIRECT_CONVERSATION: {
    message: 'Cannot send join request to a direct conversation.',
    code: 'CANNOT_JOIN_DIRECT_CONVERSATION',
  },
  FILE_UPLOAD_FAILED: {
    message: 'File upload failed.',
    code: 'FILE_UPLOAD_FAILED',
  },
  CONVERSATION_NOT_ARCHIVED: {
    message: 'Conversation is not archived.',
    code: 'CONVERSATION_NOT_ARCHIVED',
  },
  CONVERSATION_ALREADY_ARCHIVED: {
    message: 'Conversation is already archived.',
    code: 'CONVERSATION_ALREADY_ARCHIVED',
  },
  CONVERSATION_ALREADY_PINNED: {
    message: 'Conversation is already pinned.',
    code: 'CONVERSATION_ALREADY_PINNED',
  },
  CONVERSATION_NOT_PINNED: {
    message: 'Conversation is not pinned.',
    code: 'CONVERSATION_NOT_PINNED',
  },
  CONVERSATION_ALREADY_BLOCKED: {
    message: 'Conversation is already blocked.',
    code: 'CONVERSATION_ALREADY_BLOCKED',
  },
  CONVERSATION_NOT_BLOCKED: {
    message: 'Conversation is not blocked.',
    code: 'CONVERSATION_NOT_BLOCKED',
  },
  CONVERSATION_ALREADY_DELETED: {
    message: 'Conversation is already deleted.',
    code: 'CONVERSATION_ALREADY_DELETED',
  },
  AUDIT_LOG_NOT_FOUND: {
    message: 'Audit log not found.',
    code: 'AUDIT_LOG_NOT_FOUND',
  },
  MEMBER_ALREADY_KICKED: {
    message: 'Member is already kicked.',
    code: 'MEMBER_ALREADY_KICKED',
  },
  CANNOT_REJOIN_BLOCKED_OR_DELETED_PARTICIPANT: {
    message: 'Cannot rejoin blocked or deleted participant.',
    code: 'CANNOT_REJOIN_BLOCKED_OR_DELETED_PARTICIPANT',
  },

  // message error
  MESSAGE_NOT_FOUND: {
    message: 'Message not found.',
    code: 'MESSAGE_NOT_FOUND',
  },
  MESSAGE_CONTENT_REQUIRED: {
    message: 'Message content is required.',
    code: 'MESSAGE_CONTENT_REQUIRED',
  },
  MESSAGE_CONTENT_TOO_LONG: {
    message: 'Message content is too long (max 4000 characters).',
    code: 'MESSAGE_CONTENT_TOO_LONG',
  },
  FILE_TOO_LARGE: (fileName: string) => {
    return {
      message: `File ${fileName} is too large.`,
      code: 'FILE_TOO_LARGE',
    };
  },
  MESSAGE_NOT_IN_CONVERSATION: {
    message: 'Message is not in conversation.',
    code: 'MESSAGE_NOT_IN_CONVERSATION',
  },
  NOT_SENDER_OF_MESSAGE: {
    message: 'You are not sender of this message.',
    code: 'NOT_SENDER_OF_MESSAGE',
  },
  MESSAGE_IS_PINNED: {
    message: 'This message is pinned.',
    code: 'MESSAGE_IS_PINNED',
  },
  MESSAGE_IS_DELETED: {
    message: 'This message is deleted.',
    code: 'MESSAGE_IS_DELETED',
  },
  MESSAGE_EDIT_LIMIT_EXCEEDED: {
    message: 'This message has been edited 5 times.',
    code: 'MESSAGE_EDIT_LIMIT_EXCEEDED',
  },
  MESSAGE_EDIT_TIME_LIMIT_EXCEEDED: {
    message: 'This message can only be edited within 5 minutes.',
    code: 'MESSAGE_EDIT_TIME_LIMIT_EXCEEDED',
  },
  MESSAGE_PIN_NOT_FOUND: {
    message: 'Pinned message not found.',
    code: 'MESSAGE_PIN_NOT_FOUND',
  },
  CANNOT_UNPIN_OTHERS_MESSAGE: {
    message: 'You cannot unpin a message pinned by another user.',
    code: 'CANNOT_UNPIN_OTHERS_MESSAGE',
  },

  // friendship error
  FRIENDSHIP_NOT_FOUND: {
    message: 'Friendship request not found.',
    code: 'FRIENDSHIP_NOT_FOUND',
  },
  FRIENDSHIP_ALREADY_EXISTED: {
    message: 'Friendship already existed.',
    code: 'FRIENDSHIP_ALREADY_EXISTED',
  },
  CANNOT_SEND_FRIEND_REQUEST_TO_SELF: {
    message: 'Cannot send friend request to self.',
    code: 'CANNOT_SEND_FRIEND_REQUEST_TO_SELF',
  },
  INVALID_FRIEND_REQUEST_TARGET: {
    message: 'Cannot send friend request to this user.',
    code: 'INVALID_FRIEND_REQUEST_TARGET',
  },
  FRIEND_REQUEST_NOT_FOUND: {
    message: 'Friend request not found.',
    code: 'FRIEND_REQUEST_NOT_FOUND',
  },
  FRIEND_REQUEST_ALREADY_PENDING: {
    message: 'Friend request is already pending.',
    code: 'FRIEND_REQUEST_ALREADY_PENDING',
  },
  FRIEND_REQUEST_NOT_PENDING: {
    message: 'Friend request is not pending.',
    code: 'FRIEND_REQUEST_NOT_PENDING',
  },
  CANNOT_SELF_PROCESS_FRIEND_REQUEST: {
    message: 'Cannot self process your own friend request.',
    code: 'CANNOT_SELF_PROCESS_FRIEND_REQUEST',
  },
  CANNOT_BLOCK_SELF: {
    message: 'Cannot block yourself.',
    code: 'CANNOT_BLOCK_SELF',
  },
  CANNOT_UNBLOCK_USER: {
    message: "You cannot unblock this user because you didn't block them.",
    code: 'CANNOT_UNBLOCK_USER',
  },
  FRIENDSHIP_NOT_BLOCKED: {
    message: 'Friendship is not blocked.',
    code: 'FRIENDSHIP_NOT_BLOCKED',
  },
  FRIENDSHIP_ALREADY_BLOCKED: {
    message: 'Friendship already blocked.',
    code: 'FRIENDSHIP_ALREADY_BLOCKED',
  },

  // system config error
  SYSTEM_CONFIG_NOT_FOUND: {
    message: 'System config not found.',
    code: 'SYSTEM_CONFIG_NOT_FOUND',
  },
  SYSTEM_CONFIG_ALREADY_EXISTED: {
    message: 'System config already existed.',
    code: 'SYSTEM_CONFIG_ALREADY_EXISTED',
  },
  FRIENDSHIP_LIMIT_EXCEEDED: {
    message: 'You have reached the message limit for non-friends.',
    code: 'FRIENDSHIP_LIMIT_EXCEEDED',
  },
  MAX_FRIEND_REQUESTS_PER_DAY_EXCEEDED: {
    message: 'You have reached the maximum number of friend requests per day.',
    code: 'MAX_FRIEND_REQUESTS_PER_DAY_EXCEEDED',
  },

  // account history error
  ACCOUNT_HISTORY_NOT_FOUND: {
    message: 'Account history not found.',
    code: 'ACCOUNT_HISTORY_NOT_FOUND',
  },
};
