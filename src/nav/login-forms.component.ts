import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AccountService } from '../_services/account.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { LoggedUser } from '../_models/logged-user';
import { ThemeService } from '../_services/theme.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-login-forms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-forms.component.html',
  styleUrls: ['./login-forms.component.css'],
})
export class LoginFormsComponent implements OnInit, OnDestroy {
  @Output() loginSuccess = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();

  // Form states
  showForgotPassword = false;
  showForgotUsername = false;
  showResendConfirmation = false;
  showResetPassword = false;

  // Forms
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  forgotUsernameForm!: FormGroup;
  resendConfirmationForm!: FormGroup;
  resetPasswordForm!: FormGroup;

  // Loading states
  isLoading = false;
  isGoogleLoading = false;

  // Reset password token
  resetToken: string = '';

  // Google Sign-In
  private googleInitialized = false;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private toastr: ToastrService,
    private router: Router,
    public themeService: ThemeService
  ) {
    this.initializeForms();
    this.checkForResetToken();
  }

  ngOnInit() {
    this.initializeGoogleSignIn();
  }

  ngOnDestroy() {
    // Clean up Google Sign-In if needed
    if (
      typeof (window as any).google !== 'undefined' &&
      (window as any).google.accounts
    ) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
  }

  private initializeGoogleSignIn() {
    // Wait for Google Sign-In script to load
    const checkGoogleLoaded = () => {
      if (
        typeof (window as any).google !== 'undefined' &&
        (window as any).google.accounts
      ) {
        this.googleInitialized = true;
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };
    checkGoogleLoaded();
  }

  private initializeForms() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.forgotUsernameForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resendConfirmationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resetPasswordForm = this.fb.group({
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  private checkForResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      this.resetToken = token;
      this.showResetPassword = true;
      this.resetPasswordForm.patchValue({ token });
    }
  }

  // Login with username/password
  login() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.toastr.clear();

      const model = {
        Username: this.loginForm.get('username')?.value,
        Password: this.loginForm.get('password')?.value,
      };

      this.accountService.login(model).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.handleLoginSuccess(response);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleLoginError(error);
        },
      });
    }
  }

  // Google Login
  googleLogin() {
    this.isGoogleLoading = true;

    if (!this.googleInitialized) {
      this.toastr.error(
        'Google Sign-In is not ready yet. Please try again.',
        'Error'
      );
      this.isGoogleLoading = false;
      return;
    }

    if (
      typeof (window as any).google !== 'undefined' &&
      (window as any).google.accounts
    ) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: this.handleGoogleSignIn.bind(this),
        });

        (window as any).google.accounts.id.prompt();
      } catch (error) {
        console.error('Google Sign-In initialization error:', error);
        this.toastr.error('Failed to initialize Google Sign-In', 'Error');
        this.isGoogleLoading = false;
      }
    } else {
      this.toastr.error('Google Sign-In is not available', 'Error');
      this.isGoogleLoading = false;
    }
  }

  private handleGoogleSignIn(response: any) {
    this.isGoogleLoading = false;

    // Decode the JWT token to get user information
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));

      const googleLoginDto = {
        googleId: response.credential,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };

      this.accountService.googleLogin(googleLoginDto).subscribe({
        next: (response: any) => {
          this.handleLoginSuccess(response);
        },
        error: (error) => {
          this.handleLoginError(error);
        },
      });
    } catch (error) {
      this.toastr.error('Failed to process Google Sign-In response', 'Error');
      console.error('Error processing Google response:', error);
    }
  }

  // Forgot Password
  forgotPassword() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const email = this.forgotPasswordForm.get('email')?.value;

      this.accountService.forgotPassword(email).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.toastr.success(response.message, 'Email Sent');
          this.showForgotPassword = false;
          this.forgotPasswordForm.reset();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to send reset email', 'Error');
        },
      });
    }
  }

  // Forgot Username
  forgotUsername() {
    if (this.forgotUsernameForm.valid) {
      this.isLoading = true;
      const email = this.forgotUsernameForm.get('email')?.value;

      this.accountService.forgotUsername(email).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.toastr.success(response.message, 'Email Sent');
          this.showForgotUsername = false;
          this.forgotUsernameForm.reset();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to send username reminder', 'Error');
        },
      });
    }
  }

  // Resend Confirmation Email
  resendConfirmation() {
    if (this.resendConfirmationForm.valid) {
      this.isLoading = true;
      const email = this.resendConfirmationForm.get('email')?.value;

      this.accountService.resendConfirmationEmail(email).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.toastr.success(response.message, 'Email Sent');
          this.showResendConfirmation = false;
          this.resendConfirmationForm.reset();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to send confirmation email', 'Error');
        },
      });
    }
  }

  // Reset Password
  resetPassword() {
    if (this.resetPasswordForm.valid) {
      const newPassword = this.resetPasswordForm.get('newPassword')?.value;
      const confirmPassword =
        this.resetPasswordForm.get('confirmPassword')?.value;

      if (newPassword !== confirmPassword) {
        this.toastr.error('Passwords do not match', 'Error');
        return;
      }

      this.isLoading = true;
      const resetDto = {
        token: this.resetPasswordForm.get('token')?.value,
        newPassword: newPassword,
      };

      this.accountService.resetPassword(resetDto).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.toastr.success(response.message, 'Password Reset');
          this.showResetPassword = false;
          this.resetPasswordForm.reset();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to reset password', 'Error');
        },
      });
    }
  }

  private handleLoginSuccess(response: any) {
    // Save logged user data to local storage
    if (response.username && response.token) {
      const loggedUser: LoggedUser = {
        id: 0, // Will be decoded from token by account service
        username: response.username,
        token: response.token,
        role: response.role || 'User',
      };
      this.accountService.saveLoggedUserToStorage(loggedUser);
    }

    // Show success message
    this.toastr.success(
      `Welcome back, ${response.username}!`,
      'Login Successful',
      {
        timeOut: 6000,
        closeButton: true,
        progressBar: true,
      }
    );

    // Clear the login form
    this.loginForm.reset();

    // Emit success event
    this.loginSuccess.emit(response);

    // Close modal
    this.closeModal.emit();
  }

  private handleLoginError(error: any) {
    console.log(error);

    // Handle ban response from backend using unified method
    if (error.error?.error === 'USER_BANNED') {
      this.accountService.handleBackendBanResponse(error.error);
    } else if (error.error?.error === 'EMAIL_NOT_CONFIRMED') {
      this.toastr.error(error.error.message, 'Email Not Confirmed', {
        timeOut: 8000,
        closeButton: true,
        progressBar: true,
      });
      this.showResendConfirmation = true;
      this.resendConfirmationForm.patchValue({ email: error.error.email });
    } else {
      this.toastr.error(
        'Login failed. Please check your credentials.',
        'Login Failed',
        {
          timeOut: 8000,
          closeButton: true,
          progressBar: true,
        }
      );
    }

    // Reset the login form
    this.loginForm.reset();
  }

  // Navigation methods
  showForgotPasswordForm() {
    this.showForgotPassword = true;
    this.showForgotUsername = false;
    this.showResendConfirmation = false;
    this.showResetPassword = false;
  }

  showForgotUsernameForm() {
    this.showForgotUsername = true;
    this.showForgotPassword = false;
    this.showResendConfirmation = false;
    this.showResetPassword = false;
  }

  showResendConfirmationForm() {
    this.showResendConfirmation = true;
    this.showForgotPassword = false;
    this.showForgotUsername = false;
    this.showResetPassword = false;
  }

  backToLogin() {
    this.showForgotPassword = false;
    this.showForgotUsername = false;
    this.showResendConfirmation = false;
    this.showResetPassword = false;
    this.loginForm.reset();
  }

  close() {
    this.closeModal.emit();
  }
}
