import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../_services/member.service';
import { Member } from '../../_models/member';
import {
  GalleryModule,
  GalleryItem,
  ImageItem,
  GalleryComponent,
} from 'ng-gallery';
import { NgxSpinnerModule } from 'ngx-spinner';
import { DefaultPhotoService } from '../../_services/default-photo.service';

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

  constructor(
    private route: ActivatedRoute,
    private memberService: MemberService,
    private defaultPhotoService: DefaultPhotoService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.memberService.getMemberById(id).subscribe({
        next: (member) => {
          this.member = member;
          this.loading = false;
          this.initGallery();
        },
        error: () => {
          this.loading = false;
        },
      });
    }
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
}
