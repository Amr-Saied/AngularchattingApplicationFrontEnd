// nav.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { Account } from '../_services/account';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.html',
  styleUrls: ['./nav.css'],
  imports: [CommonModule, FormsModule],
})
export class Nav {
  model: any = {};
  loggedIn = false;

  @Output() loggedInChange = new EventEmitter<boolean>();

  constructor(private account: Account) {}

  login() {
    this.account.login(this.model).subscribe({
      next: (response) => {
        console.log(response);
        this.loggedIn = true;
        this.loggedInChange.emit(true); // Notify parent
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  logout() {
    this.loggedIn = false;
    this.loggedInChange.emit(false); // Notify parent
  }
}
