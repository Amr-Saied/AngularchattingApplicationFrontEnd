import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../_services/member.service';
import { Member } from '../../_models/member';
import { MemberCard } from '../member-card/member-card';
import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, MemberCard, NgxSpinnerModule],
  templateUrl: './member-list.html',
  styleUrl: './member-list.css',
})
export class MemberList implements OnInit {
  members: Member[] = [];
  isLoaded = false;

  constructor(private memberService: MemberService) {}

  ngOnInit() {
    this.memberService.getMembers().subscribe({
      next: (members) => {
        this.members = members.filter((m) => m.role !== 'Admin');
        this.isLoaded = true;
      },
      error: () => {
        this.isLoaded = true;
      },
    });
  }
}
