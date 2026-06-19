// Redis join request data stored when a user requests to join a group
export interface JoinRequestRedisData {
  requestKey: string;
  userId: number;
  conversationId: number;
  conversationName: string;
  username: string;
  email: string;
  createdAt: string; // ISO date string
}
