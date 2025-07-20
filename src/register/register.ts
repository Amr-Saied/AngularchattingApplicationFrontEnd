import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Account } from '../_services/account';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true,
})
export class Register {
  model: any = {};
  isLoading: boolean = false;

  @Output() cancelClicked = new EventEmitter<void>();

  constructor(private account: Account, private toastr: ToastrService) {}

  register() {
    this.isLoading = true;

    this.account.register(this.model).subscribe({
      next: (response: any) => {
        console.log(response);
        this.isLoading = false;
        this.toastr.success('Account created successfully! You can now login.');
        this.model = {}; // Clear form
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;

        // Handle different types of errors
        if (error.error) {
          this.toastr.error(error.error); // "Username is taken"
        } else if (error.message) {
          this.toastr.error(error.message);
        } else {
          this.toastr.error('Registration failed. Please try again.');
        }
      },
    });
  }

  cancelRegistration() {
    // Clear form data
    this.model = {};

    // Reset password field to password type if it was changed
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement;
    const passwordToggle = document.getElementById(
      'passwordToggle'
    ) as HTMLElement;
    if (passwordInput && passwordToggle) {
      passwordInput.type = 'password';
      passwordToggle.className = 'fas fa-eye';
    }

    // Emit event to parent component to go back to welcome page
    this.cancelClicked.emit();
  }

  togglePasswordVisibility() {
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement;
    const passwordToggle = document.getElementById(
      'passwordToggle'
    ) as HTMLElement;

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      passwordToggle.className = 'fas fa-eye-slash';
    } else {
      passwordInput.type = 'password';
      passwordToggle.className = 'fas fa-eye';
    }
  }
}
