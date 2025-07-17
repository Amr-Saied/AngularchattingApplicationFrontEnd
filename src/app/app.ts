import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { User } from './user';
import { ChangeDetectorRef } from '@angular/core';
import { Nav } from '../nav/nav';

@Component({
  selector: 'app-root',
  imports: [CommonModule, Nav],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
})
export class App implements OnInit {
  protected title = 'chatting app';
  protected Users: User[] = [];
  protected usersUrlHttp = 'http://localhost:5194/Users/GetUsers';
  protected usersUrlHttps = 'https://localhost:7095/Users/GetUsers';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const usersUrl =
      window.location.protocol === 'https:'
        ? this.usersUrlHttps
        : this.usersUrlHttp;
    this.http.get(usersUrl).subscribe({
      next: (response) => {
        this.Users = response as User[];
        console.log(this.Users);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching users from the backend', error);
      },
    });
  }
}
