import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { InscricaoFormComponent } from './inscricao-form/inscricao-form.component';
import { ConsultaInscricoesComponent } from './consulta-inscricoes/consulta-inscricoes.component';
import { SucessoComponent } from './sucesso/sucesso.component';
import { AdminStatusComponent } from './admin-status/admin-status.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'inscricao', component: InscricaoFormComponent },
  { path: 'consulta', component: ConsultaInscricoesComponent },
  { path: 'sucesso', component: SucessoComponent },
  { path: 'admin-status/:id', component: AdminStatusComponent },
  { path: '**', redirectTo: '/home' }
];
