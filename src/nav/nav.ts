// nav.ts
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Account } from '../_services/account';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoggedUser } from '../_models/logged-user';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.html',
  styleUrls: ['./nav.css'],
  imports: [CommonModule, FormsModule],
})
export class Nav implements OnInit {
  model: any = {};
  loggedIn = false;

  @Output() loggedInChange = new EventEmitter<boolean>();

  constructor(private account: Account) {}

  ngOnInit() {
    // Check if user is already logged in from local storage
    this.loggedIn = this.account.isLoggedIn();
    if (this.loggedIn) {
      this.loggedInChange.emit(true);
    }
  }

  login() {
    this.account.login(this.model).subscribe({
      next: (response: any) => {
        console.log(response);
        this.loggedIn = true;

        // Save logged user data to local storage
        if (response.username && response.token) {
          const loggedUser: LoggedUser = {
            username: response.username,
            token: response.token,
          };
          this.account.saveLoggedUserToStorage(loggedUser);
        }

        this.loggedInChange.emit(true); // Notify parent
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  logout() {
    this.loggedIn = false;
    // Clear logged user data from local storage
    this.account.clearLoggedUserFromStorage();
    this.loggedInChange.emit(false); // Notify parent
  }
}
