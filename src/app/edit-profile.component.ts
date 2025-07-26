import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MemberService } from '../_services/member.service';
import { Member } from '../_models/member';
import { AccountService } from '../_services/account.service';
import { ToastrService } from 'ngx-toastr';
import { TextInput } from '../_forms/text-input/text-input';
import { DefaultPhotoService } from '../_services/default-photo.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInput],
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
          [formGroup]="editForm"
          (ngSubmit)="onSubmit()"
          autocomplete="off"
        >
          <div class="row g-4">
            <div
              class="col-12 col-md-4 d-flex flex-column align-items-center justify-content-start"
            >
              <img
                [src]="getProfileImageUrl(member.photoUrl)"
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
              </div>
            </div>
            <div class="col-12 col-md-8">
              <!-- Known As Field -->
              <app-text-input
                label="Known As"
                fieldName="knownAs"
                placeholder="Display name"
                icon="fas fa-user"
                [isRequired]="true"
                formControlName="knownAs"
              >
              </app-text-input>

              <!-- Introduction Field -->
              <div class="mb-3">
                <label class="form-label fw-bold">
                  <i class="fas fa-info-circle me-1"></i>About
                </label>
                <textarea
                  class="form-control"
                  formControlName="introduction"
                  rows="3"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>

              <div class="row">
                <!-- Interests Field -->
                <div class="col-12 col-md-6">
                  <app-text-input
                    label="Interests"
                    fieldName="interests"
                    placeholder="Your interests"
                    icon="fas fa-heart"
                    formControlName="interests"
                  >
                  </app-text-input>
                </div>

                <!-- Looking For Field -->
                <div class="col-12 col-md-6">
                  <app-text-input
                    label="Looking For"
                    fieldName="lookingFor"
                    placeholder="What are you looking for?"
                    icon="fas fa-search"
                    formControlName="lookingFor"
                  >
                  </app-text-input>
                </div>
              </div>

              <div class="row">
                <!-- City Field -->
                <div class="col-12 col-md-6">
                  <app-text-input
                    label="City"
                    fieldName="city"
                    placeholder="City"
                    icon="fas fa-map-marker-alt"
                    formControlName="city"
                  >
                  </app-text-input>
                </div>

                <!-- Country Field -->
                <div class="col-12 col-md-6">
                  <app-text-input
                    label="Country"
                    fieldName="country"
                    placeholder="Country"
                    icon="fas fa-flag"
                    formControlName="country"
                  >
                  </app-text-input>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button
                  class="btn btn-main px-4 py-2 w-100 w-md-auto"
                  type="submit"
                  [disabled]="editForm.invalid || !hasFormChanges()"
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
  editForm: FormGroup;
  successMsg: string = '';
  errorMsg: string = '';

  constructor(
    private memberService: MemberService,
    private accountService: AccountService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private defaultPhotoService: DefaultPhotoService
  ) {
    this.editForm = this.fb.group({
      knownAs: ['', [Validators.required]],
      introduction: [''],
      interests: [''],
      lookingFor: [''],
      city: [''],
      country: [''],
    });
  }

  originalMember: Member | null = null;

  ngOnInit() {
    const loggedUser = this.accountService.getLoggedUserFromStorage();
    if (loggedUser && loggedUser.username) {
      this.memberService.getMemberByUsername(loggedUser.username).subscribe({
        next: (member) => {
          this.member = { ...member };
          this.originalMember = { ...member };
          this.updateFormValues();
        },
        error: () => this.toastr.error('Failed to load profile.'),
      });
    } else {
      this.toastr.error('User not found.');
      console.log('User not found.');
    }
  }

  updateFormValues() {
    if (this.member) {
      this.editForm.patchValue({
        knownAs: this.member.knownAs || '',
        introduction: this.member.introduction || '',
        interests: this.member.interests || '',
        lookingFor: this.member.lookingFor || '',
        city: this.member.city || '',
        country: this.member.country || '',
      });
    }
  }

  hasFormChanges(): boolean {
    if (!this.originalMember) return false;

    const formValue = this.editForm.value;
    return (
      formValue.knownAs !== this.originalMember.knownAs ||
      formValue.introduction !== this.originalMember.introduction ||
      formValue.interests !== this.originalMember.interests ||
      formValue.lookingFor !== this.originalMember.lookingFor ||
      formValue.city !== this.originalMember.city ||
      formValue.country !== this.originalMember.country
    );
  }

  onSubmit() {
    if (this.editForm.valid && this.member) {
      const formValue = this.editForm.value;
      const updatedMember: Member = {
        ...this.member,
        knownAs: formValue.knownAs,
        introduction: formValue.introduction,
        interests: formValue.interests,
        lookingFor: formValue.lookingFor,
        city: formValue.city,
        country: formValue.country,
      };

      this.memberService.updateMember(this.member.id, updatedMember).subscribe({
        next: () => {
          this.successMsg = 'Profile updated successfully!';
          this.errorMsg = '';
          this.originalMember = { ...updatedMember };
          this.toastr.success('Profile updated successfully!');
        },
        error: () => {
          this.errorMsg = 'Failed to update profile.';
          this.successMsg = '';
          this.toastr.error('Failed to update profile.');
        },
      });
    }
  }

  getProfileImageUrl(photoUrl: string | undefined): string {
    return this.defaultPhotoService.getProfileImageUrl(photoUrl);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.memberService.uploadPhoto(file).subscribe({
        next: (res: { url: string }) => {
          if (this.member) {
            this.member.photoUrl = res.url;
            // Save the new photo URL to the backend
            this.memberService
              .updateMember(this.member.id, this.member)
              .subscribe();
          }
        },
        error: () => {
          this.toastr.error('Error uploading photo');
          console.log('Error uploading photo');
        },
      });
    }
  }
}
