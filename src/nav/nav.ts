// nav.ts
import { Component, OnInit } from '@angular/core';
import { Account } from '../_services/account';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LoggedUser } from '../_models/logged-user';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.html',
  styleUrls: ['./nav.css'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class Nav implements OnInit {
  model: any = {};
  loggedIn = false;

  constructor(
    private account: Account,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Check if user is already logged in from local storage
    this.loggedIn = this.account.isLoggedIn();
  }

  login() {
    this.account.login(this.model).subscribe({
      next: (response: any) => {
        this.loggedIn = true;

        // Save logged user data to local storage
        if (response.username && response.token) {
          const loggedUser: LoggedUser = {
            username: response.username,
            token: response.token,
            role: response.role,
          };
          this.account.saveLoggedUserToStorage(loggedUser);
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

  logout() {
    this.loggedIn = false;
    // Clear logged user data from local storage
    this.account.clearLoggedUserFromStorage();
    // Show logout message
    this.toastr.info('You have been logged out successfully');
    // Redirect to home after logout
    this.router.navigate(['/home']);
  }
}
