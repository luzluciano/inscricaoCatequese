import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { Home2Component } from './home2/home2.component';
import { InscricaoFormComponent } from './inscricao-form/inscricao-form.component';
import { ConsultaInscricoesComponent } from './consulta-inscricoes/consulta-inscricoes.component';
import { SucessoComponent } from './sucesso/sucesso.component';
import { AdminStatusComponent } from './admin-status/admin-status.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login.component').then(c => c.LoginComponent) },
  { path: 'cadastro', loadComponent: () => import('./cadastro/cadastro.component').then(c => c.CadastroComponent) },
  { path: 'homeFixa', component: HomeComponent },
  { path: 'home', component: Home2Component },
  { path: 'admin/spots', loadComponent: () => import('./admin-spots/admin-spots.component').then(c => c.AdminSpotsComponent), canActivate: [AuthGuard], data: { permissions: ['admin'] } },
  { path: 'inscricao', component: InscricaoFormComponent },
  { 
    path: 'consulta', 
    component: ConsultaInscricoesComponent,
    canActivate: [AuthGuard]
  },
  { path: 'sucesso', component: SucessoComponent },
  { 
    path: 'admin-status/:id', 
    component: AdminStatusComponent,
    canActivate: [AuthGuard]
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  
  // Novas rotas para dropdown do header
  { 
    path: 'profile', 
    loadComponent: () => import('./profile/profile.component').then(c => c.ProfileComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./admin/admin.component').then(c => c.AdminComponent),
    canActivate: [AuthGuard],
    data: { permissions: ['admin'] }
  },
  { 
    path: 'admin/users', 
    loadComponent: () => import('./user-management/user-management.component').then(c => c.UserManagementComponent),
    canActivate: [AuthGuard],
    data: { permissions: ['admin'] }
  },
  
  { path: '**', redirectTo: '/home' }
];
