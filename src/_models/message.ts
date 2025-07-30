export interface MessageDto {
  id: number;
  senderId: number;
  senderUsername: string;
  recipientId: number;
  recipientUsername: string;
  content: string;
  messageSent: Date;
  dateRead?: Date;
}
