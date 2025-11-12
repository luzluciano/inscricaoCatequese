import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-page">
      <h2>Acesso Negado</h2>
      <p>Você não tem permissão para acessar esta página.</p>
      <a routerLink="/home" class="btn btn-primary">Voltar ao Início</a>
    </div>
  `,
  styles: [`
    .error-page {
      text-align: center;
      padding: 60px 20px;
      max-width: 500px;
      margin: 0 auto;
    }

    .error-page h2 {
      color: #dc3545;
      margin-bottom: 16px;
      font-size: 28px;
    }

    .error-page p {
      color: #666;
      margin-bottom: 32px;
      font-size: 16px;
    }

    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #5a6fd8;
    }
  `]
})
export class UnauthorizedComponent {
}