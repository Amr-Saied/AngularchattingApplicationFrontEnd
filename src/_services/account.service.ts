import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LoggedUser } from '../_models/logged-user';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BanStatusResponse } from '../_models/ban-status-response';
import { SignalRService } from './signalr.service';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService implements OnDestroy {
  baseUrl: string = environment.apiUrl + 'Account';
  private readonly LOGGED_USER_KEY = 'loggedUser';
  private loginStateSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    private signalRService: SignalRService,
    private encryptionService: EncryptionService
  ) {
    // Initialize login state
    this.loginStateSubject.next(this.isLoggedIn());
  }

  login(model: any) {
    return this.http.post(this.baseUrl + '/Login', model).pipe(
      finalize(() => {
        // Setup SignalR ban listeners after login attempt completes
        if (this.isLoggedIn()) {
          this.setupBanListeners();
        }
      })
    );
  }

  // Google Login
  googleLogin(googleLoginDto: any) {
    return this.http.post(this.baseUrl + '/GoogleLogin', googleLoginDto).pipe(
      finalize(() => {
        // Setup SignalR ban listeners after login attempt completes
        if (this.isLoggedIn()) {
          this.setupBanListeners();
        }
      })
    );
  }

  // Forgot Password
  forgotPassword(email: string) {
    return this.http.post(this.baseUrl + '/ForgotPassword', { email });
  }

  // Reset Password
  resetPassword(resetPasswordDto: any) {
    return this.http.post(this.baseUrl + '/ResetPassword', resetPasswordDto);
  }

  // Forgot Username
  forgotUsername(email: string) {
    return this.http.post(this.baseUrl + '/ForgotUsername', { email });
  }

  // Resend Confirmation Email
  resendConfirmationEmail(email: string) {
    return this.http.post(this.baseUrl + '/ResendConfirmation', {
      email: email,
    });
  }

  register(model: any) {
    return this.http.post(this.baseUrl + '/Register', model);
  }

  // Save logged user data to secure storage
  async saveLoggedUserToStorage(loggedUser: LoggedUser) {
    // Ensure we have the required fields
    const userToStore: LoggedUser = {
      id: loggedUser.id,
      username: loggedUser.username,
      token: loggedUser.token,
      refreshToken: loggedUser.refreshToken,
      role: loggedUser.role,
      tokenExpires: loggedUser.tokenExpires,
      refreshTokenExpires: loggedUser.refreshTokenExpires,
    };

    await this.encryptionService.setSecureItem(
      this.LOGGED_USER_KEY,
      userToStore
    );
    this.loginStateSubject.next(true);

    // Setup SignalR ban listeners for real-time notifications
    this.setupBanListeners();
  }

  // Get logged user from secure storage
  async getLoggedUserFromStorage(): Promise<LoggedUser | null> {
    return await this.encryptionService.getSecureItem(this.LOGGED_USER_KEY);
  }

  // Synchronous version for backward compatibility
  getLoggedUserFromStorageSync(): LoggedUser | null {
    return this.encryptionService.getSecureItemSync(this.LOGGED_USER_KEY);
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    const loggedUser = this.getLoggedUserFromStorageSync();
    const isLoggedIn = loggedUser !== null;

    // Add additional validation to prevent race conditions
    if (isLoggedIn && loggedUser) {
      // Check if token exists and is not empty
      if (!loggedUser.token || loggedUser.token.trim() === '') {
        this.clearLoggedUserFromStorage();
        return false;
      }

      // Basic JWT validation (check if it has 3 parts)
      const tokenParts = loggedUser.token.split('.');
      if (tokenParts.length !== 3) {
        this.clearLoggedUserFromStorage();
        return false;
      }
    }

    return isLoggedIn;
  }

  // Clear logged user data from secure storage
  clearLoggedUserFromStorage() {
    this.encryptionService.removeSecureItem(this.LOGGED_USER_KEY);
    this.loginStateSubject.next(false);
    // No need to stop SignalR listeners as they're connection-based
  }

  // Get login state as observable
  getLoginState(): Observable<boolean> {
    return this.loginStateSubject.asObservable();
  }

  // Get current user ID
  getCurrentUserId(): number | null {
    // Get from stored user data
    const loggedUser = this.getLoggedUserFromStorageSync();
    return loggedUser?.id || null;
  }

  // Check if current user is viewing their own profile
  isCurrentUser(userId: number): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId === userId;
  }

  // Check current user's ban status
  checkCurrentUserBanStatus(): Observable<BanStatusResponse> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return of({
        userId: 0,
        isBanned: false,
        banReason: undefined,
        isPermanentBan: false,
        banExpiryDate: undefined,
      });
    }

    return this.http
      .get<BanStatusResponse>(`${this.baseUrl}/CheckBanStatus/${userId}`)
      .pipe(
        catchError((error) => {
          console.error('Error checking ban status:', error);
          return of({
            userId: userId,
            isBanned: false,
            banReason: undefined,
            isPermanentBan: false,
            banExpiryDate: undefined,
          });
        })
      );
  }

  // Public method to check and handle ban status (for components that need to check)
  checkAndHandleBanStatus(): void {
    this.checkCurrentUserBanStatus().subscribe({
      next: (result) => {
        this.handleHttpBanCheck(result);
      },
      error: (error) => {
        console.error('Error checking ban status:', error);
      },
    });
  }

  // Handle ban response from backend (for login failures)
  handleBackendBanResponse(banResponse: any): void {
    this.handleBanNotification({
      message: banResponse.message,
      isPermanentBan: banResponse.isPermanentBan,
    });
  }

  // Handle ban from HTTP check
  handleHttpBanCheck(banData: BanStatusResponse): void {
    if (banData.isBanned) {
      this.handleBanNotification({
        message:
          banData.message ||
          'Your account has been banned. Please contact an administrator for more information.',
        isPermanentBan: banData.isPermanentBan,
      });
    }
  }

  // Handle ban from SignalR
  handleSignalRBan(
    userId: number,
    message: string,
    isPermanent: boolean
  ): void {
    this.handleBanNotification({
      message: message,
      isPermanentBan: isPermanent,
    });
  }

  // Unified ban notification handler - used by all ban scenarios
  handleBanNotification(banData: {
    message: string;
    isPermanentBan?: boolean;
  }): void {
    // Clear user data and logout
    this.clearLoggedUserFromStorage();

    // Show ban notification using backend-built message
    const title = banData.isPermanentBan
      ? 'Account Permanently Banned'
      : 'Account Temporarily Banned';

    this.toastr.error(banData.message, title, {
      timeOut: 8000,
      closeButton: true,
      progressBar: true,
      disableTimeOut: false,
      enableHtml: true,
      extendedTimeOut: 8000,
    });

    // Navigate to home page
    this.router.navigate(['/']);
  }

  // Setup SignalR ban listeners (only once)
  private setupBanListeners(): void {
    // Clear any existing listeners to prevent duplicates
    this.signalRService.clearBanListeners();

    this.signalRService.onUserBanned((userId, message, isPermanent) => {
      this.handleSignalRBan(userId, message, isPermanent);
    });

    this.signalRService.onUserUnbanned(() => {
      this.handleUserUnbanned();
    });
  }

  // Handle user unbanned notification
  private handleUserUnbanned(): void {
    this.toastr.success('Your account has been unbanned!', 'Account Unbanned', {
      timeOut: 5000,
      closeButton: true,
      progressBar: true,
    });
  }

  // Clean up on service destroy
  ngOnDestroy(): void {
    // No need to stop SignalR listeners as they're connection-based
  }
}
