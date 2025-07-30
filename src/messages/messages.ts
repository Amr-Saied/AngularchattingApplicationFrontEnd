import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from '../_services/message.service';
import { ConversationDto } from '../_models/conversation';
import { MessageDto } from '../_models/message';
import { LikesService } from '../_services/likes.service';
import { Member } from '../_models/member';
import { SignalRService } from '../_services/signalr.service';
import { AccountService } from '../_services/account.service';
import { DefaultPhotoService } from '../_services/default-photo.service';
import { TokenService } from '../_services/token.service';

@Component({
  selector: 'app-messages',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class Messages implements OnInit {
  conversations: ConversationDto[] = [];
  messages: MessageDto[] = [];
  likedUsers: Member[] = [];
  selectedConversation: ConversationDto | null = null;
  newMessageContent: string = '';
  loading = false;
  showChat = false;
  showLikedUsers = false;
  isTyping = false;
  typingTimeout: any;

  constructor(
    private messageService: MessageService,
    private likesService: LikesService,
    private route: ActivatedRoute,
    private router: Router,
    private signalRService: SignalRService,
    private accountService: AccountService,
    private defaultPhotoService: DefaultPhotoService,
    private tokenService: TokenService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initialize SignalR connection
    this.initializeSignalR();

    // Check if we have query parameters for direct chat
    this.route.queryParams.subscribe((params) => {
      const userId = params['userId'];
      const username = params['username'];

      if (userId && username) {
        // Start chat directly with the specified user
        this.selectedConversation = {
          otherUserId: parseInt(userId),
          otherUsername: username,
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadCount: 0,
        };
        this.showChat = true;
        this.loadMessages(parseInt(userId));
        // Clear query parameters
        this.router.navigate([], { queryParams: {} });
      } else {
        // Use requestAnimationFrame to ensure we're outside the current change detection cycle
        requestAnimationFrame(() => {
          this.loadConversations();
        });
      }
    });
  }

  private initializeSignalR() {
    // Get token from centralized service
    const token = this.tokenService.getToken();
    if (token) {
      this.signalRService
        .startConnection(token)
        .then(() => {
          console.log('SignalR connected successfully');

          // Set up SignalR event handlers
          this.setupSignalRHandlers();

          // Join user group
          const currentUserId = this.getCurrentUserId();
          if (currentUserId > 0) {
            this.signalRService.joinUserGroup(currentUserId);
          }
        })
        .catch((error) => {
          console.error('SignalR connection failed:', error);
        });
    }
  }

  private isDuplicateMessage(message: MessageDto): boolean {
    return this.messages.some(
      (existingMessage) =>
        existingMessage.id === message.id ||
        (existingMessage.senderId === message.senderId &&
          existingMessage.content === message.content &&
          Math.abs(
            new Date(existingMessage.messageSent).getTime() -
              new Date(message.messageSent).getTime()
          ) < 1000)
    );
  }

  private setupSignalRHandlers() {
    // Handle receiving new messages
    this.signalRService.onReceiveMessage((message: MessageDto) => {
      console.log('Received real-time message:', message);

      // Add message to current chat if it's from the same conversation and not a duplicate
      if (
        this.selectedConversation &&
        (message.senderId === this.selectedConversation.otherUserId ||
          message.recipientId === this.selectedConversation.otherUserId) &&
        !this.isDuplicateMessage(message)
      ) {
        this.messages.push(message);

        // Update conversation last message
        if (this.selectedConversation) {
          this.selectedConversation.lastMessage = message.content;
          this.selectedConversation.lastMessageTime = message.messageSent;
        }
      }

      // Update conversations list - use a more robust approach
      // Only update if not already loading and not in a chat
      if (!this.loading && !this.showChat) {
        // Use requestAnimationFrame to ensure we're outside the current change detection cycle
        requestAnimationFrame(() => {
          this.loadConversations();
        });
      }
    });

    // Handle message read notifications
    this.signalRService.onMessageRead((messageId: number, userId: number) => {
      console.log('Message read:', messageId, 'by user:', userId);
      // Update message read status in UI
      const message = this.messages.find((m) => m.id === messageId);
      if (message) {
        message.dateRead = new Date();
        this.cdr.detectChanges(); // Force change detection for UI update
      }
    });

    // Handle typing indicators
    this.signalRService.onUserTyping((userId: number) => {
      console.log('User typing:', userId);
      if (
        this.selectedConversation &&
        userId === this.selectedConversation.otherUserId
      ) {
        this.isTyping = true;
        this.cdr.detectChanges(); // Force change detection for UI update
      }
    });

    this.signalRService.onUserStoppedTyping((userId: number) => {
      console.log('User stopped typing:', userId);
      if (
        this.selectedConversation &&
        userId === this.selectedConversation.otherUserId
      ) {
        this.isTyping = false;
        this.cdr.detectChanges(); // Force change detection for UI update
      }
    });
  }

  loadConversations() {
    this.loading = true;
    this.cdr.detectChanges(); // Force change detection before async operation

    this.messageService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection after state change
        if (conversations.length === 0) {
          this.loadLikedUsers();
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection after state change
        this.loadLikedUsers();
      },
    });
  }

  loadLikedUsers() {
    this.likesService.getMyLikes().subscribe({
      next: (users) => {
        this.likedUsers = users;
        this.showLikedUsers = true;
        this.cdr.detectChanges(); // Force change detection after state change
      },
      error: () => {
        this.likedUsers = [];
        this.showLikedUsers = true;
        this.cdr.detectChanges(); // Force change detection after state change
      },
    });
  }

  selectConversation(conversation: ConversationDto) {
    this.selectedConversation = conversation;
    this.showChat = true;
    this.showLikedUsers = false;
    this.loadMessages(conversation.otherUserId);
  }

  loadMessages(otherUserId: number) {
    this.messageService.getMessages(otherUserId).subscribe({
      next: (messages) => {
        this.messages = messages;
        // Mark messages as read - only for unread messages that aren't from current user
        messages.forEach((message) => {
          if (
            !message.dateRead &&
            message.senderId !== this.getCurrentUserId() &&
            message.recipientId === this.getCurrentUserId()
          ) {
            this.messageService.markAsRead(message.id).subscribe({
              next: () => {
                // Successfully marked as read
                message.dateRead = new Date();
              },
              error: (error) => {
                console.warn('Failed to mark message as read:', error);
                // Don't break the UI if marking as read fails
              },
            });
          }
        });
      },
      error: () => {
        this.messages = [];
      },
    });
  }

  sendMessage() {
    if (!this.selectedConversation || !this.newMessageContent.trim()) {
      return;
    }

    const messageContent = this.newMessageContent.trim();
    this.newMessageContent = ''; // Clear input immediately for better UX

    this.messageService
      .sendMessage(this.selectedConversation.otherUserId, messageContent)
      .subscribe({
        next: (message) => {
          // Don't add the message here since it will come through SignalR
          // This prevents duplicates
          console.log('Message sent successfully:', message);

          // Update conversation last message
          if (this.selectedConversation) {
            this.selectedConversation.lastMessage = message.content;
            this.selectedConversation.lastMessageTime = message.messageSent;
            this.selectedConversation.unreadCount = 0;
          }
        },
        error: () => {
          console.error('Failed to send message');
          // Restore the message content if sending failed
          this.newMessageContent = messageContent;
        },
      });
  }

  startChatWithUser(user: Member) {
    this.selectedConversation = {
      otherUserId: user.id,
      otherUsername: user.userName || '',
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0,
    };
    this.showChat = true;
    this.showLikedUsers = false;
    this.messages = [];
  }

  backToConversations() {
    this.showChat = false;
    this.selectedConversation = null;
    this.messages = [];
    this.loadConversations();
  }

  backToLikedUsers() {
    this.showLikedUsers = true;
    this.showChat = false;
    this.selectedConversation = null;
    this.messages = [];
  }

  getCurrentUserId(): number {
    return this.accountService.getCurrentUserId() || 0;
  }

  isMyMessage(message: MessageDto): boolean {
    return message.senderId === this.getCurrentUserId();
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(date: Date): string {
    const today = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return messageDate.toLocaleDateString();
  }

  onMessageInput() {
    if (this.selectedConversation) {
      // Send typing indicator
      this.signalRService.sendTyping(this.selectedConversation.otherUserId);

      // Clear existing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }

      // Set timeout to stop typing indicator after 2 seconds
      this.typingTimeout = setTimeout(() => {
        this.signalRService.sendStopTyping(
          this.selectedConversation!.otherUserId
        );
      }, 2000);
    }
  }

  ngOnDestroy() {
    // Clean up SignalR connection
    this.signalRService.stopConnection();

    // Clear typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  getProfileImageUrl(photoUrl: string | undefined): string {
    return this.defaultPhotoService.getProfileImageUrl(photoUrl);
  }
}
