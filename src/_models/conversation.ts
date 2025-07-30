export interface ConversationDto {
  otherUserId: number;
  otherUsername: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}
