import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoggedUser } from '../_models/logged-user';

@Injectable({
  providedIn: 'root',
})
export class Account {
  baseUrl: string;
  private readonly LOGGED_USER_KEY = 'loggedUser';

  constructor(private http: HttpClient) {
    // Check if HTTPS is available
    const isHttps = window.location.protocol === 'https:';
    this.baseUrl = isHttps
      ? 'https://localhost:7095/api/account'
      : 'http://localhost:5194/api/account';
  }

  login(model: any) {
    return this.http.post(this.baseUrl + '/login', model);
  }

  register(model: any) {
    return this.http.post(this.baseUrl + '/register', model);
  }

  // Save logged user data to local storage
  saveLoggedUserToStorage(loggedUser: LoggedUser) {
    localStorage.setItem(this.LOGGED_USER_KEY, JSON.stringify(loggedUser));
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
  }
}
