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
    private signalRService: SignalRService
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
    return this.http.post(this.baseUrl + '/ResendConfirmation', email);
  }

  register(model: any) {
    return this.http.post(this.baseUrl + '/Register', model);
  }

  // Save logged user data to local storage
  saveLoggedUserToStorage(loggedUser: LoggedUser) {
    localStorage.setItem(this.LOGGED_USER_KEY, JSON.stringify(loggedUser));
    this.loginStateSubject.next(true);

    // Setup SignalR ban listeners for real-time notifications
    this.setupBanListeners();
  }

  // Get logged user from local storage
  getLoggedUserFromStorage(): LoggedUser | null {
    const userStr = localStorage.getItem(this.LOGGED_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.getLoggedUserFromStorage() !== null;
  }

  // Clear logged user data from local storage
  clearLoggedUserFromStorage() {
    localStorage.removeItem(this.LOGGED_USER_KEY);
    this.loginStateSubject.next(false);
    // No need to stop SignalR listeners as they're connection-based
  }

  // Get login state as observable
  getLoginState(): Observable<boolean> {
    return this.loginStateSubject.asObservable();
  }

  // Get current user ID
  getCurrentUserId(): number | null {
    // First try to get from stored user data
    const loggedUser = this.getLoggedUserFromStorage();

    if (loggedUser?.id) {
      return loggedUser.id;
    }

    // Fallback: decode user ID from JWT token
    const token = localStorage.getItem('loggedUser');
    if (token) {
      try {
        const user = JSON.parse(token);

        if (user?.token) {
          const payload = this.decodeJwtPayload(user.token);

          if (payload?.nameid) {
            const userId = parseInt(payload.nameid);
            return userId;
          }
        }
      } catch (error) {
        console.warn('Failed to decode user ID from token:', error);
      }
    }

    return null;
  }

  // Helper function to decode JWT payload
  private decodeJwtPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.warn('Failed to decode JWT:', error);
      return null;
    }
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
