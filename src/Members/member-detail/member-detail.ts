import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Member } from '../../_models/member';
import { MemberService } from '../../_services/member.service';
import { DefaultPhotoService } from '../../_services/default-photo.service';
import { LikesService } from '../../_services/likes.service';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../../_services/account.service';
import {
  GalleryComponent,
  GalleryItem,
  ImageItem,
  GalleryModule,
} from 'ng-gallery';
import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, GalleryModule, NgxSpinnerModule],
  templateUrl: './member-detail.html',
  styleUrl: './member-detail.css',
})
export class MemberDetail implements OnInit {
  member?: Member;
  loading = true;
  activeTab: string = 'details';
  galleryImages: GalleryItem[] = [];
  @ViewChild(GalleryComponent) galleryComp?: GalleryComponent;

  // Like-related properties
  isLiked: boolean = false;
  likeCount: number = 0;
  likeLoading: boolean = false;
  isOwnProfile: boolean = false;

  // In-memory cache using Map
  private memberCache = new Map<number, { data: Member; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (longer for detail pages)

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memberService: MemberService,
    private defaultPhotoService: DefaultPhotoService,
    private likesService: LikesService,
    private toastr: ToastrService,
    private accountService: AccountService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadMember(id);
    }
  }

  loadMember(id: number) {
    const cachedMember = this.getCachedMember(id);

    if (cachedMember) {
      console.log(`Using cached member data for ID ${id} - no API call!`);
      this.member = cachedMember;
      this.loading = false;
      this.initGallery();
      this.loadLikeData();
      this.checkIfOwnProfile();
      return;
    }

    console.log(`Making API call for member ID ${id}...`);
    this.memberService.getMemberById(id).subscribe({
      next: (member) => {
        this.member = member;
        this.loading = false;
        this.initGallery();
        this.loadLikeData();
        this.checkIfOwnProfile();

        // Cache the member data
        this.cacheMember(id, member);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'gallery' && this.galleryComp) {
      // Force gallery to update its size/layout
      setTimeout(() => {
        if (this.galleryComp && (this.galleryComp as any).updateLayout) {
          (this.galleryComp as any).updateLayout();
        }
      }, 50);
    }
  }

  initGallery() {
    this.galleryImages = (this.member?.photos || []).map(
      (photo) => new ImageItem({ src: photo.url, thumb: photo.url })
    );
  }

  getProfileImageUrl(photoUrl: string | undefined): string {
    return this.defaultPhotoService.getProfileImageUrl(photoUrl);
  }

  // Like-related methods
  private loadLikeData() {
    if (!this.member) return;

    this.checkLikeStatus();
    this.loadLikeCount();
  }

  private checkIfOwnProfile() {
    if (!this.member) return;
    this.isOwnProfile = this.accountService.isCurrentUser(this.member.id);
  }

  private checkLikeStatus() {
    if (!this.member) return;

    // Don't check like status for own profile
    if (this.isOwnProfile) {
      this.isLiked = false;
      return;
    }

    this.likesService.checkLike(this.member.id).subscribe({
      next: (hasLiked) => {
        this.isLiked = hasLiked;
        this.likesService.setLikeState(this.member!.id, hasLiked);
      },
      error: () => {
        this.isLiked = false;
      },
    });
  }

  private loadLikeCount() {
    if (!this.member) return;

    this.likesService.getUserLikeCounts(this.member.id).subscribe({
      next: (counts) => {
        this.likeCount = counts.likedByCount;
      },
      error: () => {
        this.likeCount = 0;
      },
    });
  }

  toggleLike() {
    if (!this.member || this.likeLoading || this.isOwnProfile) return;

    this.likeLoading = true;

    // Optimistic update
    const newLikeState = !this.isLiked;
    this.isLiked = newLikeState;
    this.likesService.setLikeState(this.member.id, newLikeState);

    if (newLikeState) {
      this.likesService.addLike(this.member.id).subscribe({
        next: (success) => {
          this.likeLoading = false;
          if (success) {
            // Refresh like count after successful like
            this.loadLikeCount();
          } else {
            // Revert optimistic update on failure
            this.isLiked = !newLikeState;
            this.likesService.setLikeState(this.member!.id, !newLikeState);
          }
        },
        error: (error) => {
          this.likeLoading = false;
          // Revert optimistic update on error
          this.isLiked = !newLikeState;
          this.likesService.setLikeState(this.member!.id, !newLikeState);

          // Handle self-like error
          if (error.type === 'self-like') {
            this.toastr.warning('You cannot like yourself');
          } else {
            this.toastr.error(
              'Failed to like user. Please try again.',
              'Error'
            );
          }
        },
      });
    } else {
      this.likesService.removeLike(this.member.id).subscribe({
        next: (success) => {
          this.likeLoading = false;
          if (success) {
            // Refresh like count after successful unlike
            this.loadLikeCount();
          } else {
            // Revert optimistic update on failure
            this.isLiked = !newLikeState;
            this.likesService.setLikeState(this.member!.id, !newLikeState);
          }
        },
        error: () => {
          this.likeLoading = false;
          // Revert optimistic update on error
          this.isLiked = !newLikeState;
          this.likesService.setLikeState(this.member!.id, !newLikeState);
          this.toastr.error(
            'Failed to unlike user. Please try again.',
            'Error'
          );
        },
      });
    }
  }

  // Cache management methods
  private getCachedMember(id: number): Member | null {
    const cached = this.memberCache.get(id);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Remove stale cache
    this.memberCache.delete(id);
    return null;
  }

  private cacheMember(id: number, member: Member): void {
    this.memberCache.set(id, {
      data: member,
      timestamp: Date.now(),
    });
    console.log(`Cached member data for ID: ${id}`);
  }

  // Method to clear cache (useful for testing)
  clearCache(): void {
    this.memberCache.clear();
    console.log('Member detail cache cleared');
  }

  // Method to get cache info (useful for debugging)
  getCacheInfo(): { size: number; keys: number[] } {
    return {
      size: this.memberCache.size,
      keys: Array.from(this.memberCache.keys()),
    };
  }

  // Navigate to messages with this user
  sendMessage() {
    if (!this.member || this.isOwnProfile) return;

    this.router.navigate(['/messages'], {
      queryParams: {
        userId: this.member.id,
        username: this.member.knownAs || this.member.userName,
      },
    });
  }
}
