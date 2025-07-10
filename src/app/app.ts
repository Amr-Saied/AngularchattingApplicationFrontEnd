import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected title = 'chatting app';
  protected Users: any;
  protected usersUrlHttp = 'http://localhost:5194/Users/GetUsers';
  protected usersUrlHttps = 'https://localhost:7095/Users/GetUsers';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const usersUrl =
      window.location.protocol === 'https:'
        ? this.usersUrlHttps
        : this.usersUrlHttp;
    this.http.get(usersUrl).subscribe({
      next: (response) => {
        this.Users = response;
        console.log(this.Users);
      },
      error: (error) => {
        console.error('Error fetching users from the backend', error);
      },
    });
  }
}
