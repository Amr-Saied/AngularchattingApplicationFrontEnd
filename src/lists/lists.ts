import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MemberCard } from '../Members/member-card/member-card';
import { Member } from '../_models/member';
import { LikesService } from '../_services/likes.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';
import { PaginationParams } from '../_models/pagination';
import { PagedResult } from '../_models/pagination';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lists',
  imports: [
    CommonModule,
    RouterModule,
    MemberCard,
    NgxSpinnerModule,
    FormsModule,
  ],
  templateUrl: './lists.html',
  styleUrl: './lists.css',
})
export class Lists implements OnInit {
  likedMembers: Member[] = [];
  isLoaded = false;
  paginationParams: PaginationParams = { pageNumber: 1, pageSize: 6 };
  totalPages = 0;
  totalCount = 0;

  constructor(
    private likesService: LikesService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadLikedMembers();
  }

  loadLikedMembers() {
    this.isLoaded = false;
    this.likesService
      .getMyLikesPaged(
        this.paginationParams.pageNumber,
        this.paginationParams.pageSize
      )
      .subscribe({
        next: (response: PagedResult<Member>) => {
          this.likedMembers = response.items;
          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;
          this.isLoaded = true;

          if (response.totalCount === 0) {
            this.toastr.info("You haven't liked any members yet.");
          }
        },
        error: () => {
          this.isLoaded = true;
          this.toastr.error(
            'Failed to load your liked members. Please try again.'
          );
        },
      });
  }

  onPageChanged(pageNumber: number) {
    this.paginationParams.pageNumber = pageNumber;
    this.loadLikedMembers();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.paginationParams.pageNumber - 2);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
