import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Register } from '../register/register';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, RouterModule, Register],
  templateUrl: './home.html',
  styleUrl: './home.css',
  standalone: true,
})
export class Home implements OnInit {
  registerMode = false;

  ngOnInit() {}

  registerToggle() {
    this.registerMode = !this.registerMode;
  }
}
