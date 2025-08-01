import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Member } from '../_models/member';
import { environment } from '../environments/environment';
import { PaginationParams, PagedResult } from '../_models/pagination';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private baseUrl = environment.apiUrl + 'Users';
  private exploreMembersClicked$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  // Method to notify when Explore Members is clicked
  notifyExploreMembersClicked() {
    this.exploreMembersClicked$.next();
  }

  // Observable to listen for Explore Members clicks
  getExploreMembersClicked() {
    return this.exploreMembersClicked$.asObservable();
  }

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

  updateMember(id: number, member: Member): Observable<Member> {
    return this.http.put<Member>(this.baseUrl + '/UpdateUser/' + id, member);
  }

  uploadPhoto(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(
      this.baseUrl + '/upload-photo',
      formData
    );
  }

  deletePhoto(userId: number, photoId: number) {
    return this.http.delete(this.baseUrl + `/DeletePhoto/${userId}/${photoId}`);
  }

  getMembersPaged(
    paginationParams: PaginationParams
  ): Observable<PagedResult<Member>> {
    const params = new HttpParams()
      .set('pageNumber', paginationParams.pageNumber.toString())
      .set('pageSize', paginationParams.pageSize.toString());

    return this.http.get<PagedResult<Member>>(this.baseUrl + '/GetUsersPaged', {
      params,
    });
  }

  searchMembers(searchTerm: string): Observable<Member[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<Member[]>(this.baseUrl + '/SearchUsers', { params });
  }

  getLastActiveStatus(
    userId: number
  ): Observable<{ lastActiveStatus: string }> {
    return this.http.get<{ lastActiveStatus: string }>(
      this.baseUrl + '/GetLastActiveStatus/' + userId
    );
  }
}
