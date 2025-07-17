import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Account {
  baseUrl: string;

  constructor(private http: HttpClient) {
    // Check if HTTPS is available
    const isHttps = window.location.protocol === 'https:';
    this.baseUrl = isHttps
      ? 'https://localhost:7095/api/account/login'
      : 'http://localhost:5194/api/account/login';
  }

  login(model: any) {
    return this.http.post(this.baseUrl, model);
  }
}
