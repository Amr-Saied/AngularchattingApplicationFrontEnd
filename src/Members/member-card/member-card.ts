import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Member } from '../../_models/member';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-member-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './member-card.html',
  styleUrl: './member-card.css',
})
export class MemberCard {
  @Input() member!: Member;
}
