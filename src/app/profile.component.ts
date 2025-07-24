import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthGuard } from '../_guards/auth.guard'; // Assuming AuthGuard is still needed
import { MemberService } from '../_services/member.service';
import { Member, PhotoDTO } from '../_models/member';
import { AccountService } from '../_services/account.service';
import { GalleryModule, GalleryItem, ImageItem } from 'ng-gallery';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, GalleryModule],
  template: `
    <div class="profile-container">
      <div class="profile-banner">
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
          alt="Profile Banner"
          class="img-fluid profile-banner-img"
        />
      </div>

      <div class="profile-content-wrapper">
        <div class="profile-card main-card shadow-sm mx-auto">
          <div class="profile-header">
            <div class="profile-photo-wrapper">
              <img
                [src]="
                  user.photoUrl ||
                  'https://randomuser.me/api/portraits/lego/1.jpg'
                "
                alt="Profile Photo"
                class="profile-photo shadow"
              />
            </div>

            <div class="profile-info text-center text-md-start">
              <h2 class="display-6 fw-bold mb-1 profile-name">
                {{ user.knownAs || user.userName }}
              </h2>
              <div class="profile-meta mb-3">
                <span
                  *ngIf="user.city"
                  class="d-block d-md-inline-block me-md-3"
                >
                  <i class="fas fa-map-marker-alt me-1"></i>{{ user.city }}
                </span>
                <span
                  *ngIf="user.age"
                  class="d-block d-md-inline-block me-md-3"
                >
                  <i class="fas fa-birthday-cake me-1"></i>{{ user.age }} yrs
                </span>
                <span *ngIf="user.gender" class="d-block d-md-inline-block">
                  <i class="fas fa-venus-mars me-1"></i>{{ user.gender }}
                </span>
              </div>
              <div
                class="d-flex flex-wrap justify-content-center justify-content-md-start gap-2 mb-3"
              >
                <button class="btn btn-main btn-sm" (click)="editProfile()">
                  <i class="fas fa-edit me-1"></i>Edit Profile
                </button>
                <label class="btn btn-main btn-sm mb-0">
                  <i class="fas fa-plus me-1"></i>Post Photo
                  <input
                    type="file"
                    accept="image/*"
                    (change)="onGalleryPhotoSelected($event)"
                    hidden
                  />
                </label>
              </div>
            </div>
          </div>

          <hr class="my-4" />

          <div class="row g-4">
            <div class="col-12 col-lg-6">
              <div class="profile-section-card h-100 p-4">
                <h4 class="fw-bold mb-3 section-title">
                  <i class="fas fa-info-circle me-2"></i>About Me
                </h4>
                <div class="about-content">
                  <p
                    class="mb-0 text-break"
                    [innerHTML]="
                      user.introduction || 'No introduction provided yet.'
                    "
                  ></p>
                </div>
              </div>
            </div>
            <div class="col-12 col-lg-6">
              <div class="profile-section-card h-100 p-4">
                <h4 class="fw-bold mb-3 section-title">
                  <i class="fas fa-images me-2"></i>Photo Gallery
                </h4>
                <div class="gallery-wrapper">
                  <gallery
                    [items]="galleryImages"
                    [thumbPosition]="'bottom'"
                    [nav]="true"
                    [autoplay]="true"
                  ></gallery>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user: Member = {
    id: 1,
    dateOfBirth: new Date(),
    created: new Date(),
    lastActive: new Date(),
    userName: 'GuestUser',
    knownAs: 'Guest',
    photoUrl: '',
    city: 'Cairo',
    age: 25,
    gender: 'Female',
    introduction:
      'This is a **sample introduction** text to demonstrate how the "About Me" section looks with more content. I am a passionate individual currently exploring new horizons in software development. I enjoy learning and building new things, and constantly striving to improve my skills. <br><br>My interests include **backend development with ASP.NET**, database design, and cloud technologies. I am always open to new challenges and collaborations. Feel free to connect!',
    photos: [
      {
        id: 1,
        url: 'https://randomuser.me/api/portraits/women/1.jpg',
        isMain: true,
      },
      {
        id: 2,
        url: 'https://randomuser.me/api/portraits/women/2.jpg',
        isMain: false,
      },
    ],
  };

  galleryImages: GalleryItem[] = [];

  constructor(
    private router: Router,
    private memberService: MemberService,
    private accountService: AccountService,
    private http: HttpClient
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
          console.error('Error fetching member data:', err);
        },
      });
    } else {
      console.warn('No logged-in user found. Displaying default profile data.');
      this.initGallery();
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

  onGalleryPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      this.http
        .post<{ url: string }>(
          environment.apiUrl + 'Users/upload-photo',
          formData
        )
        .subscribe({
          next: (res) => {
            // Persist the photo in the backend gallery
            this.http
              .post(environment.apiUrl + 'Users/AddPhoto/' + this.user.id, {
                url: res.url,
              })
              .subscribe({
                next: () => {
                  // Reload user data to refresh gallery
                  this.memberService
                    .getMemberByUsername(this.user.userName!)
                    .subscribe({
                      next: (member) => {
                        this.user = member;
                        this.initGallery();
                      },
                    });
                },
              });
          },
          error: () => {
            // Optionally show error message
          },
        });
    }
  }
}
