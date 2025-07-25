import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Nav } from '../nav/nav';
import { RouterModule } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [CommonModule, Nav, RouterModule, NgxSpinnerModule],
})
export class App implements OnInit {
  constructor(private http: HttpClient) {}

  ngOnInit() {}
}
