// nav.ts
import { Component, OnInit } from '@angular/core';
import { AccountService } from '../_services/account.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LoggedUser } from '../_models/logged-user';
import { ToastrService } from 'ngx-toastr';
import { DefaultPhotoService } from '../_services/default-photo.service';
import { MemberService } from '../_services/member.service';
import { Member } from '../_models/member';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.html',
  styleUrls: ['./nav.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ThemeToggle],
})
export class Nav implements OnInit {
  loginForm: FormGroup;
  loggedIn = false;
  currentUser: Member | null = null;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private defaultPhotoService: DefaultPhotoService,
    private memberService: MemberService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.accountService.getLoginState().subscribe((isLoggedIn) => {
      this.loggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.loadCurrentUser();
      } else {
        this.currentUser = null;
      }
    });
  }

  loadCurrentUser() {
    const loggedUser = this.accountService.getLoggedUserFromStorage();
    if (loggedUser && loggedUser.username) {
      this.memberService.getMemberByUsername(loggedUser.username).subscribe({
        next: (member) => {
          this.currentUser = member;
        },
        error: (error) => {
          console.error('Error loading current user:', error);
        },
      });
    }
  }

  login() {
    if (this.loginForm.valid) {
      const model = {
        Username: this.loginForm.get('username')?.value,
        Password: this.loginForm.get('password')?.value,
      };

      this.accountService.login(model).subscribe({
        next: (response: any) => {
          this.loggedIn = true;

          // Save logged user data to local storage
          if (response.username && response.token) {
            const loggedUser: LoggedUser = {
              id: response.id,
              username: response.username,
              token: response.token,
              role: response.role,
            };
            this.accountService.saveLoggedUserToStorage(loggedUser);
          }

          // Show success message
          this.toastr.success(`Welcome back, ${response.username}!`);

          // Redirect based on user role
          if (response.role === 'Admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          console.log(error);
          this.toastr.error('Login failed. Please check your credentials.');
        },
      });
    }
  }

  logout() {
    this.accountService.clearLoggedUserFromStorage();
    this.loggedIn = false;
    this.currentUser = null;
    this.router.navigate(['/home']);
    this.toastr.success('Logged out successfully!');
  }

  getLoggedUsername(): string {
    const loggedUser = this.accountService.getLoggedUserFromStorage();
    return loggedUser?.username || 'User';
  }

  getProfileImageUrl(): string {
    if (!this.currentUser) {
      return this.defaultPhotoService.getDefaultProfileImage();
    }
    return this.defaultPhotoService.getProfileImageUrl(
      this.currentUser.photoUrl
    );
  }

  onExploreMembersClick() {
    // Notify service that Explore Members was clicked
    this.memberService.notifyExploreMembersClicked();
    // Navigate to members page
    this.router.navigate(['/members']);
  }
}
