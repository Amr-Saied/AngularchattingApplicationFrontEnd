import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Member } from '../../_models/member';
import { DefaultPhotoService } from '../../_services/default-photo.service';
import { MemberService } from '../../_services/member.service';

@Component({
  selector: 'app-member-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './member-card.html',
  styleUrl: './member-card.css',
})
export class MemberCard implements OnInit {
  @Input() member!: Member;
  lastActiveStatus: string = '';

  constructor(
    private defaultPhotoService: DefaultPhotoService,
    private memberService: MemberService
  ) {}

  ngOnInit() {
    this.loadLastActiveStatus();
  }

  getProfileImageUrl(photoUrl: string | undefined): string {
    return this.defaultPhotoService.getProfileImageUrl(photoUrl);
  }

  private loadLastActiveStatus() {
    this.memberService.getLastActiveStatus(this.member.id).subscribe({
      next: (response) => {
        this.lastActiveStatus = response.lastActiveStatus;
      },
      error: (error) => {
        console.error('Error loading last active status:', error);
        this.lastActiveStatus = 'Unknown';
      },
    });
  }
}
