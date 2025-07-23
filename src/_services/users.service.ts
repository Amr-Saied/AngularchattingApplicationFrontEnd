import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  baseUrl: string = environment.apiUrl + 'Users';

  constructor(private http: HttpClient) {
    // Remove protocol logic, use environment.usersUrl
  }

  getUsers() {
    return this.http.get(this.baseUrl + '/GetUsers');
  }

  getUserById(id: number) {
    return this.http.get(this.baseUrl + '/GetUserById/' + id);
  }
}
