import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../_services/member.service';
import { Member } from '../../_models/member';
import { MemberCard } from '../member-card/member-card';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, MemberCard],
  templateUrl: './member-list.html',
  styleUrl: './member-list.css',
})
export class MemberList implements OnInit {
  members: Member[] = [];
  loading = true;

  constructor(private memberService: MemberService) {}

  ngOnInit() {
    this.memberService.getMembers().subscribe({
      next: (members) => {
        this.members = members.filter((m) => m.role !== 'Admin');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
