import { Routes } from '@angular/router';
import { MemberList } from '../Members/member-list/member-list';
import { MemberDetail } from '../Members/member-detail/member-detail';
import { Messages } from '../messages/messages';
import { Lists } from '../lists/lists';
import { Home } from '../home/home';
import { AdminComponent } from '../admin/admin';
import { AuthGuard } from '../_guards/auth.guard';
import { AdminGuard } from '../_guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: Home,
  },
  {
    path: 'members',
    component: MemberList,
    canActivate: [AuthGuard],
  },
  {
    path: 'member/:id',
    component: MemberDetail,
    canActivate: [AuthGuard],
  },
  {
    path: 'messages',
    component: Messages,
    canActivate: [AuthGuard],
  },
  {
    path: 'lists',
    component: Lists,
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AdminGuard],
  },
];
