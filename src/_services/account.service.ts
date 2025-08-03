import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LoggedUser } from '../_models/logged-user';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BanStatusResponse } from '../_models/ban-status-response';

@Injectable({
  providedIn: 'root',
})
export class AccountService implements OnDestroy {
  baseUrl: string = environment.apiUrl + 'Account';
  private readonly LOGGED_USER_KEY = 'loggedUser';
  private loginStateSubject = new BehaviorSubject<boolean>(false);
  private banCheckInterval: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {
    // Initialize login state
    this.loginStateSubject.next(this.isLoggedIn());

    // Start ban status checking if user is logged in
    if (this.isLoggedIn()) {
      this.startBanStatusCheck();
    }
  }

  login(model: any) {
    // Temporarily stop ban checking during login to prevent interference
    this.stopBanStatusCheck();

    return this.http.post(this.baseUrl + '/Login', model).pipe(
      finalize(() => {
        // Restart ban checking after login attempt completes
        if (this.isLoggedIn()) {
          this.startBanStatusCheck();
        }
      })
    );
  }

  register(model: any) {
    return this.http.post(this.baseUrl + '/Register', model);
  }

  // Save logged user data to local storage
  saveLoggedUserToStorage(loggedUser: LoggedUser) {
    localStorage.setItem(this.LOGGED_USER_KEY, JSON.stringify(loggedUser));
    this.loginStateSubject.next(true);

    // Check ban status immediately when user logs in
    this.checkBanStatusImmediately();

    // Then set up periodic checks
    this.startBanStatusCheck();
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
    this.stopBanStatusCheck();
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

  // Public method to check ban status immediately (for login failures and immediate checks)
  checkBanStatusImmediately(): void {
    const currentUserId = this.getCurrentUserId();
    if (currentUserId) {
      this.checkCurrentUserBanStatus().subscribe({
        next: (result) => {
          if (result.isBanned) {
            let message =
              'Your account has been banned and you have been logged out.';
            if (result.banReason) {
              message += ` Reason: ${result.banReason}`;
            }
            if (!result.isPermanentBan && result.banExpiryDate) {
              message += ` Your ban expires on: ${result.banExpiryDate}`;
            }
            message += ' Please contact an administrator for more information.';

            this.forceLogout(message);
          }
        },
        error: (error) => {
          console.error('Immediate ban status check failed:', error);
        },
      });
    }
  }

  // Start periodic ban status checking
  public startBanStatusCheck(): void {
    if (this.banCheckInterval) {
      clearInterval(this.banCheckInterval);
    }

    // Check ban status every 10 seconds
    this.banCheckInterval = setInterval(() => {
      if (this.isLoggedIn()) {
        this.checkCurrentUserBanStatus().subscribe({
          next: (result) => {
            if (result.isBanned) {
              let message =
                'Your account has been banned and you have been logged out.';
              if (result.banReason) {
                message += ` Reason: ${result.banReason}`;
              }
              if (!result.isPermanentBan && result.banExpiryDate) {
                message += ` Your ban expires on: ${result.banExpiryDate}`;
              }
              message +=
                ' Please contact an administrator for more information.';

              this.forceLogout(message);
            }
          },
          error: (error) => {
            console.error('Ban status check failed:', error);
          },
        });
      } else {
        this.stopBanStatusCheck();
      }
    }, 10000); // Check every 10 seconds
  }

  // Stop ban status checking
  public stopBanStatusCheck(): void {
    if (this.banCheckInterval) {
      clearInterval(this.banCheckInterval);
      this.banCheckInterval = null;
    }
  }

  // Force logout with message
  private forceLogout(message: string): void {
    this.clearLoggedUserFromStorage();

    // Determine if it's a permanent ban based on message content
    const isPermanent =
      message.includes('permanently') || !message.includes('expires on:');
    const title = isPermanent
      ? 'Account Permanently Banned'
      : 'Account Temporarily Banned';

    this.toastr.error(message, title, {
      timeOut: isPermanent ? 20000 : 15000, // Extended timeout
      closeButton: true,
      progressBar: true,
      disableTimeOut: false, // Allow timeout but longer
      enableHtml: true,
      extendedTimeOut: 5000,
    });
    this.router.navigate(['/']);
  }

  // Clean up on service destroy
  ngOnDestroy(): void {
    this.stopBanStatusCheck();
  }
}
