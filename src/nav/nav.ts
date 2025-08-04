// nav.ts
import { Component, OnInit } from '@angular/core';
import { AccountService } from '../_services/account.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LoggedUser } from '../_models/logged-user';
import { ToastrService } from 'ngx-toastr';
import { DefaultPhotoService } from '../_services/default-photo.service';
import { MemberService } from '../_services/member.service';
import { Member } from '../_models/member';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { LoginFormsComponent } from './login-forms.component';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.html',
  styleUrls: ['./nav.css'],
  imports: [CommonModule, RouterModule, ThemeToggle, LoginFormsComponent],
})
export class Nav implements OnInit {
  loggedIn = false;
  currentUser: Member | null = null;
  showLoginModal = false;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private toastr: ToastrService,
    private defaultPhotoService: DefaultPhotoService,
    private memberService: MemberService
  ) {}

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

  // Show login modal
  showLogin() {
    this.showLoginModal = true;
  }

  // Handle login success
  onLoginSuccess(response: any) {
    this.loggedIn = true;
    this.showLoginModal = false;

    // Redirect based on user role
    if (response.role === 'Admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  // Close login modal
  closeLoginModal() {
    this.showLoginModal = false;
  }

  logout() {
    this.accountService.clearLoggedUserFromStorage();
    this.loggedIn = false;
    this.currentUser = null;
    this.router.navigate(['/home']);
    this.toastr.success('Logged out successfully!', 'Logout Successful', {
      timeOut: 5000,
      closeButton: true,
      progressBar: true,
    });
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
