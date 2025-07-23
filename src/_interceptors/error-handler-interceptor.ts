import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError } from 'rxjs/operators';

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error) {
        switch (error.status) {
          case 400:
            toastr.error(error.error?.message || 'Bad Request', 'Error 400');
            break;
          case 401:
            toastr.error('Unauthorized', 'Error 401');
            break;
          case 404:
            toastr.error('Resource not found.', 'Error 404');
            router.navigateByUrl('/not-found');
            break;
          case 500:
            toastr.error('Server error', 'Error 500');
            router.navigate(['/server-error'], {
              state: { error: error.error },
            });
            break;
          default:
            toastr.error(
              'An unexpected error occurred.',
              `Error ${error.status}`
            );
        }
      }
      throw error;
    })
  );
};
