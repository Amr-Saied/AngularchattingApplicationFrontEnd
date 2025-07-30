import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { ConversationDto } from '../_models/conversation';
import { MessageDto } from '../_models/message';
import { CreateMessageDto } from '../_models/create-message';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private baseUrl = environment.apiUrl + 'Message';

  constructor(private http: HttpClient) {}

  // Get all conversations for current user
  getConversations(): Observable<ConversationDto[]> {
    return this.http
      .get<ConversationDto[]>(`${this.baseUrl}/conversations`)
      .pipe(
        map((conversations) =>
          conversations.map((conv) => ({
            ...conv,
            lastMessageTime: new Date(conv.lastMessageTime),
          }))
        ),
        catchError(() => of([]))
      );
  }

  // Get messages between current user and specific user
  getMessages(otherUserId: number): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.baseUrl}/${otherUserId}`).pipe(
      map((messages) =>
        messages.map((msg) => ({
          ...msg,
          messageSent: new Date(msg.messageSent),
          dateRead: msg.dateRead ? new Date(msg.dateRead) : undefined,
        }))
      ),
      catchError(() => of([]))
    );
  }

  // Send a message
  sendMessage(recipientId: number, content: string): Observable<MessageDto> {
    const messageDto: CreateMessageDto = {
      recipientId,
      content,
    };

    return this.http.post<MessageDto>(`${this.baseUrl}`, messageDto).pipe(
      map((message) => ({
        ...message,
        messageSent: new Date(message.messageSent),
        dateRead: message.dateRead ? new Date(message.dateRead) : undefined,
      })),
      catchError(() => {
        throw new Error('Failed to send message');
      })
    );
  }

  // Mark message as read
  markAsRead(messageId: number): Observable<boolean> {
    return this.http
      .put<{ success: boolean }>(`${this.baseUrl}/${messageId}/read`, {})
      .pipe(
        map((response) => response.success),
        catchError(() => of(false))
      );
  }

  // Delete message
  deleteMessage(messageId: number): Observable<boolean> {
    return this.http
      .delete<{ success: boolean }>(`${this.baseUrl}/${messageId}`)
      .pipe(
        map((response) => response.success),
        catchError(() => of(false))
      );
  }

  // Get unread message count
  getUnreadCount(): Observable<number> {
    return this.http
      .get<{ unreadCount: number }>(`${this.baseUrl}/unread-count`)
      .pipe(
        map((response) => response.unreadCount),
        catchError(() => of(0))
      );
  }
}
