import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { MessageDto } from '../_models/message';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  private connectionEstablished = new BehaviorSubject<boolean>(false);
  private typingUsers = new BehaviorSubject<number[]>([]);

  constructor() {}

  startConnection(token: string): Promise<void> {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}messagehub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    return this.hubConnection.start().then(() => {
      this.connectionEstablished.next(true);
      console.log('SignalR Connected!');
    });
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
      this.connectionEstablished.next(false);
    }
  }

  // Send message via SignalR
  sendMessage(recipientId: number, content: string): void {
    if (this.hubConnection && this.connectionEstablished.value) {
      this.hubConnection.invoke('SendMessage', recipientId, content);
    }
  }

  // Send typing indicator
  sendTyping(recipientId: number): void {
    if (this.hubConnection && this.connectionEstablished.value) {
      this.hubConnection.invoke('Typing', recipientId);
    }
  }

  // Send stop typing indicator
  sendStopTyping(recipientId: number): void {
    if (this.hubConnection && this.connectionEstablished.value) {
      this.hubConnection.invoke('StopTyping', recipientId);
    }
  }

  // Mark message as read via SignalR
  markAsRead(messageId: number, senderId: number): void {
    if (this.hubConnection && this.connectionEstablished.value) {
      this.hubConnection.invoke('MarkAsRead', messageId, senderId);
    }
  }

  // Join user group
  joinUserGroup(userId: number): void {
    if (this.hubConnection && this.connectionEstablished.value) {
      this.hubConnection.invoke('JoinUserGroup', userId);
    }
  }

  // Leave user group
  leaveUserGroup(userId: number): void {
    if (this.hubConnection && this.connectionEstablished.value) {
      this.hubConnection.invoke('LeaveUserGroup', userId);
    }
  }

  // Get connection status
  getConnectionStatus(): Observable<boolean> {
    return this.connectionEstablished.asObservable();
  }

  // Get typing users
  getTypingUsers(): Observable<number[]> {
    return this.typingUsers.asObservable();
  }

  // Listen for specific events
  onReceiveMessage(callback: (message: MessageDto) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on('ReceiveMessage', callback);
    }
  }

  onMessageRead(callback: (messageId: number, userId: number) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on('MessageRead', callback);
    }
  }

  onUserTyping(callback: (userId: number) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on('UserTyping', callback);
    }
  }

  onUserStoppedTyping(callback: (userId: number) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on('UserStoppedTyping', callback);
    }
  }
}
