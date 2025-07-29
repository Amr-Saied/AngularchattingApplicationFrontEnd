import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { LikeCounts } from '../_models/LikeCounts';

@Injectable({
  providedIn: 'root',
})
export class LikesService {
  private baseUrl = environment.apiUrl + 'Likes';

  // Cache for like states to avoid unnecessary API calls
  private likeCache = new Map<number, boolean>();

  constructor(private http: HttpClient) {}

  // Add a like
  addLike(likedUserId: number): Observable<boolean> {
    return this.http
      .post<{ success: boolean; message: string }>(`${this.baseUrl}/add-like`, {
        likedUserId,
      })
      .pipe(
        map((response) => {
          if (response.success) {
            this.likeCache.set(likedUserId, true);
          }
          return response.success;
        }),
        catchError((error) => {
          // Handle specific error for liking yourself
          if (error.status === 400) {
            // Try different possible error message locations
            let errorMessage = '';

            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.message) {
              errorMessage = error.message;
            } else {
              errorMessage = 'Bad Request';
            }

            if (
              errorMessage.includes('yourself') ||
              errorMessage.includes('cannot like yourself')
            ) {
              // This will be handled by the component to show toastr
              throw { type: 'self-like', message: 'You cannot like yourself' };
            }
          }
          return of(false);
        })
      );
  }

  // Remove a like
  removeLike(likedUserId: number): Observable<boolean> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${this.baseUrl}/remove-like/${likedUserId}`
      )
      .pipe(
        map((response) => {
          if (response.success) {
            this.likeCache.set(likedUserId, false);
          }
          return response.success;
        }),
        catchError(() => of(false))
      );
  }

  // Check if current user has liked a specific user
  checkLike(likedUserId: number): Observable<boolean> {
    // Return cached value if available
    if (this.likeCache.has(likedUserId)) {
      return of(this.likeCache.get(likedUserId)!);
    }

    return this.http
      .get<{ hasLiked: boolean }>(`${this.baseUrl}/check-like/${likedUserId}`)
      .pipe(
        map((response) => {
          this.likeCache.set(likedUserId, response.hasLiked);
          return response.hasLiked;
        }),
        catchError(() => of(false))
      );
  }

  // Get like counts for a specific user
  getUserLikeCounts(userId: number): Observable<LikeCounts> {
    return this.http
      .get<{ likedByCount: number }>(`${this.baseUrl}/user-counts/${userId}`)
      .pipe(
        map((response) => ({
          likesCount: 0,
          likedByCount: response.likedByCount,
        })),
        catchError(() => of({ likesCount: 0, likedByCount: 0 }))
      );
  }

  // Set like state in cache (useful for optimistic updates)
  setLikeState(userId: number, isLiked: boolean): void {
    this.likeCache.set(userId, isLiked);
  }
}
