import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Account } from '../_services/account';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private account: Account,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(): boolean {
    if (this.account.isLoggedIn()) {
      return true;
    } else {
      this.toastr.error('Please login to access this page');
      this.router.navigate(['/home']);
      return false;
    }
  }
}
