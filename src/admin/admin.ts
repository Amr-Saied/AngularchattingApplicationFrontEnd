import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Account } from '../_services/account';
import { User } from '../_models/user';
import { Users } from '../_services/users';

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

  constructor(private accountService: Account, private usersService: Users) {}

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
