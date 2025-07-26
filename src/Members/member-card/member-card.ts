import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Member } from '../../_models/member';
import { RouterModule } from '@angular/router';
import { DefaultPhotoService } from '../../_services/default-photo.service';

@Component({
  selector: 'app-member-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './member-card.html',
  styleUrl: './member-card.css',
})
export class MemberCard {
  @Input() member!: Member;

  constructor(private defaultPhotoService: DefaultPhotoService) {}

  getProfileImageUrl(photoUrl: string | undefined): string {
    return this.defaultPhotoService.getProfileImageUrl(photoUrl);
  }
}
