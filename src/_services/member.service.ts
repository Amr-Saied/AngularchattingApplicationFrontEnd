import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Member } from '../_models/member';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private baseUrl = environment.apiUrl + 'Users';

  constructor(private http: HttpClient) {}

  getMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(this.baseUrl + '/GetUsers');
  }

  getMemberById(id: number): Observable<Member> {
    return this.http.get<Member>(this.baseUrl + '/GetUserById/' + id);
  }

  getMemberByUsername(username: string): Observable<Member> {
    return this.http.get<Member>(
      this.baseUrl + '/GetUserByUsername/' + username
    );
  }
}
