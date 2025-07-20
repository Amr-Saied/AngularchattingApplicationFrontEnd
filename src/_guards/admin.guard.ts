import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Account } from '../_services/account';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(
    private account: Account,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(): boolean {
    if (this.account.isLoggedIn()) {
      const user = this.account.getLoggedUserFromStorage();
      if (user?.role === 'Admin') {
        return true;
      } else {
        this.toastr.error('Admin access required');
        this.router.navigate(['/home']);
        return false;
      }
    } else {
      this.toastr.error('Please login to access admin panel');
      this.router.navigate(['/home']);
      return false;
    }
  }
}
