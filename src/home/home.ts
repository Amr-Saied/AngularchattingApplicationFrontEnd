import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Register } from '../register/register';
import { Account } from '../_services/account';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, RouterModule, Register],
  templateUrl: './home.html',
  styleUrl: './home.css',
  standalone: true,
})
export class Home implements OnInit {
  registerMode = false;
  loggedIn = false;

  constructor(private accountService: Account) {}

  ngOnInit() {
    this.loggedIn = this.accountService.isLoggedIn();
  }

  registerToggle() {
    this.registerMode = !this.registerMode;
  }

  goBackToWelcome() {
    this.registerMode = false;
  }
}
