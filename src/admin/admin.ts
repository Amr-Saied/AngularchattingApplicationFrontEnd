import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountService } from '../_services/account.service';
import { User } from '../_models/user';
import { UsersService } from '../_services/users.service';
import { ThemeService } from '../_services/theme.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class AdminComponent implements OnInit {
  users: User[] = [];
  showUsers = false;
  loading = false;

  constructor(
    private accountService: AccountService,
    private usersService: UsersService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Check if user is admin when component loads
    this.checkAdminRole();
  }

  checkAdminRole(): void {
    const user = this.accountService.getLoggedUserFromStorage();
    if (!user || user.role !== 'Admin') {
      // Redirect to home if not admin
      window.location.href = '/';
    }
  }

  toggleUsers(): void {
    if (!this.showUsers) {
      this.loadUsers();
    }
    this.showUsers = !this.showUsers;
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService.getUsers().subscribe({
      next: (users: any) => {
        this.users = users as User[];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.loading = false;
      },
    });
  }
}
