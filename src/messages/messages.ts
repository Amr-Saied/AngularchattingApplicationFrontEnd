import {
  Component,
  OnInit,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
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
import { EMOJI_LIST } from '../_data/emoji-data';
import { MessagesResolverData } from '../_services/messages.resolver';

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
  selectedEmoji: string = '';
  showEmojiPicker = false;
  emojis = EMOJI_LIST;
  showChat = false;
  showLikedUsers = false;
  isTyping = false;
  typingTimeout: any;
  onlineUsers: number[] = [];

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
    // Get pre-loaded data from resolver
    const resolvedData: MessagesResolverData = this.route.snapshot.data['data'];

    // Set the pre-loaded data
    this.conversations = resolvedData.conversations;
    this.likedUsers = resolvedData.likedUsers;
    this.showLikedUsers = !resolvedData.hasConversations;

    // Wait for SignalR connection and then setup handlers
    this.signalRService.getConnectionStatus().subscribe((isConnected) => {
      if (isConnected) {
        this.setupSignalRHandlers();
      }
    });

    // Subscribe to online users updates
    this.signalRService.getOnlineUsers().subscribe((users) => {
      this.onlineUsers = users;
      this.cdr.detectChanges();
    });

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
      }
    });

    // Force change detection after setting initial data
    this.cdr.detectChanges();
  }

  // SignalR is now handled globally in App component
  // We only setup local handlers for this component

  private isDuplicateMessage(message: any): boolean {
    // Handle both SignalR format (capital properties) and HTTP format (lowercase)
    const messageId = message.id || message.Id;
    const content = message.content || message.Content;
    const senderId = message.senderId || message.SenderId;
    const messageSent = message.messageSent || message.MessageSent;

    return this.messages.some(
      (existingMessage) =>
        (messageId && existingMessage.id === messageId) ||
        (content &&
          senderId &&
          existingMessage.senderId === senderId &&
          existingMessage.content === content &&
          messageSent &&
          Math.abs(
            new Date(existingMessage.messageSent).getTime() -
              new Date(messageSent).getTime()
          ) < 1000)
    );
  }

  private setupSignalRHandlers() {
    console.log('🔧 Setting up LOCAL SignalR handlers for messages component');

    // Listen to local message updates for current conversation display
    this.signalRService.onReceiveMessage((message: any) => {
      if (!message) return; // Skip null initial value

      console.log('📩 Processing message update locally:', message);

      // Handle different message formats - some come from SignalR, some from HTTP responses
      const currentUserId = this.getCurrentUserId();

      // Check if this is a SignalR message (capital letter properties) or HTTP response (lowercase)
      const senderId = message.SenderId || message.senderId;
      const recipientId = message.RecipientId || message.recipientId;
      const content = message.Content || message.content;
      const senderName = message.SenderName || message.senderUsername;
      const messageSent = message.MessageSent || message.messageSent;

      // Skip if essential data is missing
      if (!senderId || !recipientId || !content) {
        console.warn('⚠️ Skipping message with missing data:', message);
        return;
      }

      const isMyMessage = senderId === currentUserId;

      // Add message to current chat if it's from the same conversation and not a duplicate
      if (
        this.selectedConversation &&
        (senderId === this.selectedConversation.otherUserId ||
          recipientId === this.selectedConversation.otherUserId) &&
        !this.isDuplicateMessage(message)
      ) {
        // Convert to standard MessageDto format
        const localMessage: MessageDto = {
          id: message.id || message.Id || Date.now(), // Use timestamp as fallback ID
          senderId: senderId,
          senderUsername: senderName || 'Unknown',
          recipientId: recipientId,
          recipientUsername:
            this.selectedConversation?.otherUsername || 'Unknown',
          content: content,
          messageSent: messageSent ? new Date(messageSent) : new Date(),
          dateRead: undefined,
          emoji: message.Emoji || message.emoji,
        };

        this.messages.push(localMessage);

        // Update conversation last message
        this.selectedConversation.lastMessage = content;
        this.selectedConversation.lastMessageTime = localMessage.messageSent;

        if (isMyMessage) {
          this.selectedConversation.unreadCount = 0;
        }

        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 100);
      }

      // Update conversations list only if it's NOT my message and I'm not viewing chat
      if (!isMyMessage && !this.showChat) {
        requestAnimationFrame(() => {
          this.loadConversations();
        });
      }
    });

    // Typing handlers (keep these local since they're UI-specific)
    this.signalRService.onUserTyping((userId: number) => {
      if (
        this.selectedConversation &&
        userId === this.selectedConversation.otherUserId
      ) {
        this.isTyping = true;
        this.cdr.detectChanges();
      }
    });

    this.signalRService.onUserStoppedTyping((userId: number) => {
      if (
        this.selectedConversation &&
        userId === this.selectedConversation.otherUserId
      ) {
        this.isTyping = false;
        this.cdr.detectChanges();
      }
    });

    // Message read handler (keep local for UI updates)
    this.signalRService.onMessageRead((messageId: number, userId: number) => {
      const message = this.messages.find((m) => m.id === messageId);
      if (message) {
        message.dateRead = new Date();
        this.cdr.detectChanges();
      }
    });

    console.log('✅ Local SignalR handlers setup complete');
  }

  loadConversations() {
    this.messageService.getConversations().subscribe({
      next: (conversations) => {
        console.log('Loaded conversations:', conversations);
        console.log('Current user ID:', this.getCurrentUserId());

        // Keep one debug log for missing photos
        conversations.forEach((conv) => {
          if (!conv.otherUserPhotoUrl) {
            console.log(
              `❌ Missing photo for ${conv.otherUsername} (ID: ${conv.otherUserId})`
            );
          }
        });

        this.conversations = conversations;
        if (conversations.length === 0) {
          this.loadLikedUsers();
        }
      },
      error: () => {
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
    // Set current chat user for notification management
    this.signalRService.setCurrentChatUser(otherUserId);

    this.messageService.getMessages(otherUserId).subscribe({
      next: (messages) => {
        console.log('Current user ID in messages:', this.getCurrentUserId());
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

        // Auto-scroll to bottom when opening chat
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 200);
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
    const emojiToSend = this.selectedEmoji || undefined;
    this.newMessageContent = '';
    this.selectedEmoji = '';

    this.messageService
      .sendMessage(
        this.selectedConversation.otherUserId,
        messageContent,
        emojiToSend
      )
      .subscribe({
        next: (message) => {
          console.log('Message sent successfully:', message);

          // Add the sent message to the chat immediately (don't wait for SignalR)
          // Since SignalR seems to have undefined values, we'll add it directly
          if (!this.isDuplicateMessage(message)) {
            this.messages.push(message);
            this.cdr.detectChanges();
            setTimeout(() => this.scrollToBottom(), 100);
          }

          // Update conversation last message for sent messages
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

  toggleEmojiPicker(event: Event) {
    event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker;
    console.log('Emoji picker toggled:', this.showEmojiPicker);
    this.cdr.detectChanges();
  }

  onEmojiPickerClick(event: Event) {
    event.stopPropagation();
  }

  addEmoji(emoji: string) {
    this.newMessageContent += emoji;
    this.showEmojiPicker = false;
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.emoji-button') &&
      !target.closest('.emoji-picker-container')
    ) {
      this.showEmojiPicker = false;
    }
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

    // Clear current chat user for notification management
    this.signalRService.setCurrentChatUser(null);

    // Only reload conversations if we don't have any cached data
    // This maintains the performance benefit of the resolver
    if (this.conversations.length === 0) {
      this.loadConversations();
    }
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
    // Clear current chat user when leaving
    this.signalRService.setCurrentChatUser(null);

    // Clear typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  getProfileImageUrl(photoUrl: string | undefined): string {
    return this.defaultPhotoService.getProfileImageUrl(photoUrl);
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.includes(userId);
  }

  private scrollToBottom(): void {
    try {
      const chatContainer = document.querySelector('.messages-list');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    } catch (err) {
      console.warn('Could not scroll to bottom:', err);
    }
  }
}
