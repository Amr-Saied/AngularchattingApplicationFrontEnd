import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthGuard } from '../_guards/auth.guard';
import { MemberService } from '../_services/member.service';
import { Member } from '../_models/member';
import { PhotoDTO } from '../_models/member';
import { AccountService } from '../_services/account.service';
import { GalleryModule, GalleryItem, ImageItem } from 'ng-gallery';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, GalleryModule],
  template: `
    <div
      class="profile-banner"
      style="width: 100vw; height: 260px; background: url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1100&q=80') center/cover; margin-left: calc(-50vw + 50%);"
    ></div>
    <div class="container" style="margin-top: -120px;">
      <div
        class="profile-card main-card p-4 mx-auto"
        style="max-width: 1100px; width: 90vw;"
      >
        <div class="d-flex flex-column align-items-center">
          <img
            [src]="
              user.photoUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'
            "
            class="profile-photo mb-3 shadow"
            alt="Profile Photo"
            style="width: 140px; height: 140px; object-fit: cover; border-radius: 50%; border: 6px solid #fff; margin-top: -90px;"
          />
          <h2 class="mt-3 mb-1 fw-bold" style="color: #764ba2;">
            {{ user.knownAs || user.userName }}
          </h2>
          <div class="profile-meta text-center mb-2">
            <span *ngIf="user.city"
              ><i class="fas fa-map-marker-alt me-1"></i>{{ user.city }}</span
            >
            <span *ngIf="user.age" class="ms-3"
              ><i class="fas fa-birthday-cake me-1"></i>{{ user.age }} yrs</span
            >
            <span *ngIf="user.gender" class="ms-3"
              ><i class="fas fa-venus-mars me-1"></i>{{ user.gender }}</span
            >
          </div>
          <button class="btn btn-main mb-3" (click)="editProfile()">
            <i class="fas fa-edit me-2"></i>Edit Profile
          </button>
        </div>
        <div
          class="d-flex flex-row gap-4 flex-wrap mt-4 justify-content-center"
        >
          <div
            class="profile-card-section flex-fill"
            style="min-width: 300px; background: #f8f9fa; border-radius: 16px; box-shadow: 0 2px 8px rgba(102,126,234,0.08); padding: 1.5rem; margin-bottom: 1.5rem;"
          >
            <h4 class="fw-bold mb-2" style="color: #764ba2;">
              <i class="fas fa-info-circle me-2"></i>About
            </h4>
            <div style="overflow:auto; max-height: 180px;">
              <p class="mb-0">
                {{ user.introduction || 'No introduction provided.' }}
              </p>
            </div>
          </div>
          <div
            class="profile-card-section flex-fill"
            style="min-width: 300px; background: #f8f9fa; border-radius: 16px; box-shadow: 0 2px 8px rgba(102,126,234,0.08); padding: 1.5rem; margin-bottom: 1.5rem;"
          >
            <h5 class="fw-bold mb-2" style="color: #764ba2;">
              <i class="fas fa-images me-2"></i>Photo Gallery
            </h5>
            <div class="gallery-wrapper">
              <gallery
                [items]="galleryImages"
                [thumbPosition]="'bottom'"
                [nav]="true"
              ></gallery>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../Members/member-detail/member-detail.css'],
})
export class ProfileComponent implements OnInit {
  user: Member = {
    id: 1,
    dateOfBirth: new Date(),
    created: new Date(),
    lastActive: new Date(),
    userName: 'User',
    knownAs: 'User',
    photoUrl: '',
    city: 'City',
    age: 25,
    gender: 'M',
    introduction: 'This is my about section.',
    photos: [
      {
        id: 1,
        url: 'https://randomuser.me/api/portraits/men/1.jpg',
        isMain: true,
      },
      {
        id: 2,
        url: 'https://randomuser.me/api/portraits/men/2.jpg',
        isMain: false,
      },
    ],
  };

  galleryImages: GalleryItem[] = [];

  constructor(
    private router: Router,
    private memberService: MemberService,
    private accountService: AccountService
  ) {}

  ngOnInit() {
    const loggedUser = this.accountService.getLoggedUserFromStorage();
    if (loggedUser && loggedUser.username) {
      this.memberService.getMemberByUsername(loggedUser.username).subscribe({
        next: (member) => {
          this.user = member;
          this.initGallery();
        },
        error: (err) => {
          console.log(err);
        },
      });
    }
  }

  initGallery() {
    this.galleryImages = (this.user.photos || []).map(
      (photo) => new ImageItem({ src: photo.url, thumb: photo.url })
    );
  }

  editProfile() {
    this.router.navigate(['/edit-profile']);
  }
}
