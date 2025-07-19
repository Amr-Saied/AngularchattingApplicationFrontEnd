import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Account } from '../_services/account';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true,
})
export class Register {
  model: any = {};

  constructor(private account: Account) {}

  register() {
    this.account.register(this.model).subscribe({
      next: (response: any) => {
        console.log(response);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
}
