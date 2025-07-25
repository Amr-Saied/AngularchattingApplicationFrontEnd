import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AccountService } from '../_services/account.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true,
})
export class Register {
  registerForm: FormGroup;
  isLoading: boolean = false;

  @Output() cancelClicked = new EventEmitter<void>();

  constructor(
    private accountService: AccountService,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group(
      {
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(50),
            Validators.pattern(/^[a-zA-Z0-9_]+$/),
          ],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            // Uncomment for stronger password validation
            // Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      return { passwordMismatch: true };
    }
    return null;
  }

  register() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const model = {
        Username: this.registerForm.get('username')?.value,
        Password: this.registerForm.get('password')?.value,
      };

      this.accountService.register(model).subscribe({
        next: () => {
          this.toastr.success('Registration successful!');
          this.cancelRegistration();
        },
        error: (error) => {
          console.log(error);
          this.toastr.error('Registration failed. Please try again.');
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }

  cancelRegistration() {
    this.registerForm.reset();
    this.cancelClicked.emit();
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } is required`;
      }
      if (field.errors?.['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } must be at least ${requiredLength} characters`;
      }
      if (field.errors?.['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } must not exceed ${maxLength} characters`;
      }
      if (field.errors?.['pattern']) {
        if (fieldName === 'username') {
          return 'Username can only contain letters, numbers, and underscores';
        }
        if (fieldName === 'password') {
          return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
        }
      }
    }
    return '';
  }

  getPasswordMatchError(): string {
    if (
      this.registerForm.errors?.['passwordMismatch'] &&
      this.registerForm.get('confirmPassword')?.touched
    ) {
      return 'Passwords do not match';
    }
    return '';
  }

  togglePasswordVisibility(fieldName: string) {
    const input = document.getElementById(fieldName) as HTMLInputElement;
    const toggle = document.getElementById(fieldName + 'Toggle') as HTMLElement;

    if (input && toggle) {
      if (input.type === 'password') {
        input.type = 'text';
        toggle.className = 'fas fa-eye-slash';
      } else {
        input.type = 'password';
        toggle.className = 'fas fa-eye';
      }
    }
  }
}
