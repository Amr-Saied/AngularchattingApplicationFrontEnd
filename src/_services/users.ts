import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Users {
  baseUrl: string;

  constructor(private http: HttpClient) {
    // Check if HTTPS is available
    const isHttps = window.location.protocol === 'https:';
    this.baseUrl = isHttps
      ? 'https://localhost:7095/Users'
      : 'http://localhost:5194/Users';
  }

  private getAuthHeaders(): HttpHeaders {
    const loggedUser = localStorage.getItem('loggedUser');
    if (loggedUser) {
      const user = JSON.parse(loggedUser);
      return new HttpHeaders({
        Authorization: `Bearer ${user.token}`,
      });
    }
    return new HttpHeaders();
  }

  getUsers() {
    return this.http.get(this.baseUrl + '/GetUsers', {
      headers: this.getAuthHeaders(),
    });
  }

  getUserById(id: number) {
    return this.http.get(this.baseUrl + '/GetUserById/' + id, {
      headers: this.getAuthHeaders(),
    });
  }
}
