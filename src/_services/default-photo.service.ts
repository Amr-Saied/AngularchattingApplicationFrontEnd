import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DefaultPhotoService {
  // Default profile image - a professional, minimalist user icon
  private readonly DEFAULT_PROFILE_IMAGE =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjNjc3ZWVhIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI2Y1ZjZmYSIvPgo8cGF0aCBkPSJNNDAgMTgwQzQwIDE0MCA4MCAxNDAgMTAwIDE0MEMxMjAgMTQwIDE2MCAxNDAgMTYwIDE4MEg0MFoiIGZpbGw9IiNmNWY2ZmEiLz4KPC9zdmc+';

  getDefaultProfileImage(): string {
    return this.DEFAULT_PROFILE_IMAGE;
  }

  // Check if the given URL is a default image
  isDefaultImage(url: string | undefined): boolean {
    if (!url) return true;
    return (
      url.includes('randomuser.me/api/portraits/lego/') ||
      url === this.DEFAULT_PROFILE_IMAGE ||
      url.includes('data:image/svg+xml')
    );
  }

  // Get profile image URL with fallback to default
  getProfileImageUrl(photoUrl: string | undefined): string {
    if (!photoUrl || this.isDefaultImage(photoUrl)) {
      return this.DEFAULT_PROFILE_IMAGE;
    }
    return photoUrl;
  }
}
