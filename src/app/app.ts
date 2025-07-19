import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { User } from '../_models/user';
import { ChangeDetectorRef } from '@angular/core';
import { Nav } from '../nav/nav';
import { Account } from '../_services/account';
import { Home } from '../home/home';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [CommonModule, Nav, Home, RouterModule],
})
export class App implements OnInit {
  public loggedIn = false;
  // protected title = 'chatting app';
  protected Users: User[] = [];
  protected usersUrlHttp = 'http://localhost:5194/Users/GetUsers';
  protected usersUrlHttps = 'https://localhost:7095/Users/GetUsers';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private account: Account
  ) {}

  ngOnInit() {
    // Check if user is already logged in from local storage
    this.loggedIn = this.account.isLoggedIn();

    const usersUrl =
      window.location.protocol === 'https:'
        ? this.usersUrlHttps
        : this.usersUrlHttp;
    this.http.get(usersUrl).subscribe({
      next: (response) => {
        this.Users = response as User[];
        console.log(this.Users);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching users from the backend', error);
      },
    });
  }

  onLoggedInChange(loggedIn: boolean) {
    this.loggedIn = loggedIn;
  }
}
