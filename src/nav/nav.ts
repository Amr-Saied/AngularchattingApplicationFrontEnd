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

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.html',
  styleUrls: ['./nav.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class Nav implements OnInit {
  loginForm: FormGroup;
  loggedIn = false;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    // Check if user is already logged in from local storage
    this.loggedIn = this.accountService.isLoggedIn();
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
    this.loggedIn = false;
    // Clear logged user data from local storage
    this.accountService.clearLoggedUserFromStorage();
    // Show logout message
    this.toastr.info('You have been logged out successfully');
    // Redirect to home after logout
    this.router.navigate(['/home']);
  }

  getLoggedUsername(): string {
    const loggedUser = this.accountService.getLoggedUserFromStorage();
    return loggedUser?.username || 'User';
  }
}
