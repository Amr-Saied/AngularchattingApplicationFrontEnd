import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggedUser } from '../_models/logged-user';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  baseUrl: string = environment.apiUrl + 'Account';
  private readonly LOGGED_USER_KEY = 'loggedUser';
  private loginStateSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    // Initialize login state
    this.loginStateSubject.next(this.isLoggedIn());
  }

  login(model: any) {
    return this.http.post(this.baseUrl + '/Login', model);
  }

  register(model: any) {
    return this.http.post(this.baseUrl + '/Register', model);
  }

  // Save logged user data to local storage
  saveLoggedUserToStorage(loggedUser: LoggedUser) {
    localStorage.setItem(this.LOGGED_USER_KEY, JSON.stringify(loggedUser));
    this.loginStateSubject.next(true);
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
}
