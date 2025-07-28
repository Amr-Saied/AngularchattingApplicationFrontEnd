import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../_services/member.service';
import { Member } from '../../_models/member';
import { MemberCard } from '../member-card/member-card';
import { NgxSpinnerModule } from 'ngx-spinner';
import { PaginationParams, PagedResult } from '../../_models/pagination';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, MemberCard, NgxSpinnerModule, FormsModule],
  templateUrl: './member-list.html',
  styleUrl: './member-list.css',
})
export class MemberList implements OnInit {
  members: Member[] = [];
  isLoaded = false;
  paginationParams: PaginationParams = { pageNumber: 1, pageSize: 4 };
  totalPages = 0;
  totalCount = 0;
  searchTerm = '';
  isSearching = false;
  private searchSubject = new Subject<string>();

  constructor(
    private memberService: MemberService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadMembers();
    this.setupSearch();
  }

  setupSearch() {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.performSearch();
      });
  }

  onSearchInput(event: any) {
    const searchTerm = event.target.value;
    this.searchSubject.next(searchTerm);
  }

  performSearch() {
    if (!this.searchTerm.trim()) {
      this.loadMembers();
      return;
    }

    this.isSearching = true;
    this.memberService.searchMembers(this.searchTerm).subscribe({
      next: (members) => {
        this.members = members;
        this.isSearching = false;
        this.isLoaded = true;

        if (members.length === 0) {
          this.toastr.info('No members found matching your search criteria.');
        }
      },
      error: () => {
        this.isSearching = false;
        this.isLoaded = true;
        this.toastr.error('Failed to search members. Please try again.');
      },
    });
  }

  loadMembers() {
    this.memberService.getMembersPaged(this.paginationParams).subscribe({
      next: (response: PagedResult<Member>) => {
        this.members = response.items;
        this.totalPages = response.totalPages;
        this.totalCount = response.totalCount;
        this.isLoaded = true;
      },
      error: () => {
        this.isLoaded = true;
        this.toastr.error('Failed to load members. Please try again.');
      },
    });
  }

  onPageChanged(pageNumber: number) {
    if (this.searchTerm.trim()) {
      return; // Don't paginate when searching
    }
    this.paginationParams.pageNumber = pageNumber;
    this.loadMembers();
  }

  getPageNumbers(): number[] {
    if (this.searchTerm.trim()) {
      return []; // Don't show pagination when searching
    }

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
