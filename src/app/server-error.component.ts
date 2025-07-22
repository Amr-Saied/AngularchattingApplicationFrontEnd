import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Account } from '../_services/account';

@Component({
  selector: 'app-server-error',
  standalone: true,
  template: `
    <div class="error-page">
      <h1>500</h1>
      <h2>Server Error</h2>
      <p>Oops! Something went wrong on our end.<br />Please try again later.</p>
      <button (click)="goBack()" class="btn btn-main mt-3">
        {{ isAdmin ? 'Go to Admin Panel' : 'Go to Home' }}
      </button>
    </div>
  `,
  styles: [
    `
      .error-page {
        text-align: center;
        margin-top: 80px;
        color: #764ba2;
      }
      .error-page h1 {
        font-size: 7rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: #ff6b6b;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .error-page h2 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }
      .error-page p {
        font-size: 1.2rem;
        margin-bottom: 2rem;
      }
      .btn-main {
        background: var(--main-gradient);
        color: #fff;
        border-radius: 8px;
        padding: 12px 30px;
        font-weight: 600;
        text-decoration: none;
        transition: background 0.3s;
      }
      .btn-main:hover {
        background: var(--main-gradient-hover);
        color: #fff;
      }
    `,
  ],
})
export class ServerErrorComponent {
  isAdmin = false;
  constructor(private router: Router, private account: Account) {
    const user = this.account.getLoggedUserFromStorage();
    this.isAdmin = !!user && user.role === 'Admin';
  }
  goBack() {
    if (this.isAdmin) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
