import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-buggy-componenet',
  standalone: true,
  templateUrl: './buggy-componenet.html',
  styleUrl: './buggy-componenet.css',
  imports: [],
})
export class BuggyComponenet {
  baseUrls = ['http://localhost:5194/Buggy/', 'https://localhost:7095/Buggy/'];

  constructor(private http: HttpClient, private router: Router) {}

  get400Error() {
    this.callBoth('bad-request');
  }
  get401Error() {
    this.callBoth('auth');
  }
  get404Error() {
    this.callBoth('not-found');
  }
  get500Error() {
    this.callBoth('server-error');
  }

  private callBoth(method: string) {
    for (const url of this.baseUrls) {
      this.http.get(url + method).subscribe({
        next: () => {},
        error: () => {},
      });
    }
  }

  goAdmin() {
    this.router.navigate(['/admin']);
  }
}
