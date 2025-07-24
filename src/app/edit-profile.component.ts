import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../_services/member.service';
import { AccountService } from '../_services/account.service';
import { Member } from '../_models/member';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page-container container-fluid">
      <div
        class="profile-card main-card p-4 mx-auto"
        style="max-width: 900px; width: 100%;"
      >
        <h2
          class="text-center mb-4"
          style="color: #764ba2; letter-spacing: 1px;"
        >
          <i class="fas fa-user-edit me-2"></i>Edit Profile
        </h2>
        <form
          *ngIf="member"
          (ngSubmit)="onSubmit()"
          #editForm="ngForm"
          autocomplete="off"
        >
          <div class="row g-4">
            <div
              class="col-12 col-md-4 d-flex flex-column align-items-center justify-content-start"
            >
              <img
                [src]="
                  member.photoUrl ||
                  'https://randomuser.me/api/portraits/lego/1.jpg'
                "
                class="profile-photo mb-3 shadow"
                alt="Profile Photo"
                style="width: 140px; height: 140px; object-fit: cover; border-radius: 50%; border: 6px solid #fff; box-shadow: 0 4px 24px rgba(102, 126, 234, 0.12);"
              />
              <div class="w-100">
                <label class="form-label fw-bold">Profile Photo</label>
                <input
                  type="file"
                  class="form-control mb-2"
                  (change)="onFileSelected($event)"
                  accept="image/*"
                />
                <label class="form-label fw-bold">Or Photo URL</label>
                <input
                  class="form-control"
                  [(ngModel)]="member.photoUrl"
                  name="photoUrl"
                  placeholder="Paste image URL..."
                />
              </div>
            </div>
            <div class="col-12 col-md-8">
              <div class="mb-3">
                <label class="form-label fw-bold"
                  ><i class="fas fa-user me-1"></i>Known As</label
                >
                <input
                  class="form-control"
                  [(ngModel)]="member.knownAs"
                  name="knownAs"
                  required
                  placeholder="Display name"
                />
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold"
                  ><i class="fas fa-info-circle me-1"></i>About</label
                >
                <textarea
                  class="form-control"
                  [(ngModel)]="member.introduction"
                  name="introduction"
                  rows="3"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>
              <div class="row">
                <div class="col-12 col-md-6 mb-3">
                  <label class="form-label fw-bold"
                    ><i class="fas fa-heart me-1"></i>Interests</label
                  >
                  <input
                    class="form-control"
                    [(ngModel)]="member.interests"
                    name="interests"
                    placeholder="Your interests"
                  />
                </div>
                <div class="col-12 col-md-6 mb-3">
                  <label class="form-label fw-bold"
                    ><i class="fas fa-search me-1"></i>Looking For</label
                  >
                  <input
                    class="form-control"
                    [(ngModel)]="member.lookingFor"
                    name="lookingFor"
                    placeholder="What are you looking for?"
                  />
                </div>
              </div>
              <div class="row">
                <div class="col-12 col-md-6 mb-3">
                  <label class="form-label fw-bold"
                    ><i class="fas fa-map-marker-alt me-1"></i>City</label
                  >
                  <input
                    class="form-control"
                    [(ngModel)]="member.city"
                    name="city"
                    placeholder="City"
                  />
                </div>
                <div class="col-12 col-md-6 mb-3">
                  <label class="form-label fw-bold"
                    ><i class="fas fa-flag me-1"></i>Country</label
                  >
                  <input
                    class="form-control"
                    [(ngModel)]="member.country"
                    name="country"
                    placeholder="Country"
                  />
                </div>
              </div>
              <div class="d-flex justify-content-end mt-4">
                <button
                  class="btn btn-main px-4 py-2 w-100 w-md-auto"
                  type="submit"
                  style="font-weight: 600; font-size: 1.1rem;"
                >
                  <i class="fas fa-save me-2"></i>Save Changes
                </button>
              </div>
            </div>
          </div>
        </form>
        <div *ngIf="!member" class="text-center py-5">Loading...</div>
        <div *ngIf="successMsg" class="alert alert-success mt-3 text-center">
          {{ successMsg }}
        </div>
        <div *ngIf="errorMsg" class="alert alert-danger mt-3 text-center">
          {{ errorMsg }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../Members/member-detail/member-detail.css'],
})
export class EditProfileComponent implements OnInit {
  member: Member | null = null;
  successMsg = '';
  errorMsg = '';

  constructor(
    private memberService: MemberService,
    private accountService: AccountService,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  originalMember: Member | null = null;

  ngOnInit() {
    const loggedUser = this.accountService.getLoggedUserFromStorage();
    if (loggedUser && loggedUser.username) {
      this.memberService.getMemberByUsername(loggedUser.username).subscribe({
        next: (member) => {
          this.member = { ...member };
          this.originalMember = { ...member };
        },
        error: () => (this.errorMsg = 'Failed to load profile.'),
      });
    } else {
      this.errorMsg = 'User not found.';
    }
  }

  hasChanges(): boolean {
    if (!this.member || !this.originalMember) return false;
    return JSON.stringify(this.member) !== JSON.stringify(this.originalMember);
  }

  onSubmit() {
    if (!this.member) return;
    if (!this.hasChanges()) {
      this.toastr.info("You didn't change anything to update.");
      return;
    }
    this.successMsg = '';
    this.errorMsg = '';
    this.memberService.updateMember(this.member.id, this.member).subscribe({
      next: (updated) => {
        this.successMsg = 'Profile updated successfully!';
        this.member = updated;
        this.originalMember = { ...updated };
      },
      error: () => (this.errorMsg = 'Failed to update profile.'),
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.memberService.uploadPhoto(file).subscribe({
        next: (res: { url: string }) => {
          if (this.member) {
            this.member.photoUrl = res.url;
          }
        },
        error: () => {
          console.log('Error uploading photo');
        },
      });
    }
  }
}
