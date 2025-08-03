export interface MessageDto {
  id: number;
  senderId: number;
  senderUsername: string;
  senderPhotoUrl?: string;
  recipientId: number;
  recipientUsername: string;
  recipientPhotoUrl?: string;
  content: string;
  emoji?: string;
  messageSent: Date;
  dateRead?: Date;
}
