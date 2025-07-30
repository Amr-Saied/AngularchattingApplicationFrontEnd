import { Injectable } from '@angular/core';
import { LoggedUser } from '../_models/logged-user';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor() {}

  getToken(): string | null {
    const loggedUser = localStorage.getItem('loggedUser');
    if (loggedUser) {
      const user = JSON.parse(loggedUser);
      return user?.token || null;
    }
    return null;
  }

  getLoggedUser(): LoggedUser | null {
    const loggedUser = localStorage.getItem('loggedUser');
    if (loggedUser) {
      return JSON.parse(loggedUser);
    }
    return null;
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    return token !== null && token.length > 0;
  }
}
