import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="admin-panel">
        <h2>⚙️ Painel de Administração</h2>
        
        <div class="admin-sections">
          <div class="admin-card">
            <h3>👥 Gerenciar Usuários</h3>
            <p>Visualizar, criar e editar usuários do sistema</p>
            <a routerLink="/admin/users" class="btn btn-primary">
              Acessar
            </a>
          </div>
          
          <div class="admin-card">
            <h3>📊 Relatórios</h3>
            <p>Gerar relatórios de inscrições e estatísticas</p>
            <button type="button" class="btn btn-primary" (click)="generateReports()">
              Acessar
            </button>
          </div>
          
          <div class="admin-card">
            <h3>🔧 Configurações</h3>
            <p>Configurar parâmetros do sistema</p>
            <button type="button" class="btn btn-primary" (click)="systemConfig()">
              Acessar
            </button>
          </div>
          
          <div class="admin-card">
            <h3>📋 Consultar Inscrições</h3>
            <p>Visualizar todas as inscrições registradas</p>
            <a routerLink="/consulta" class="btn btn-primary">
              Acessar
            </a>
          </div>
          
          <div class="admin-card">
            <h3>📈 Status das Inscrições</h3>
            <p>Gerenciar status e histórico das inscrições</p>
            <button type="button" class="btn btn-primary" (click)="manageStatus()">
              Acessar
            </button>
          </div>
          
          <div class="admin-card">
            <h3>🔍 Logs do Sistema</h3>
            <p>Visualizar logs e auditoria do sistema</p>
            <button type="button" class="btn btn-primary" (click)="viewLogs()">
              Acessar
            </button>
          </div>
        </div>
        
        <div class="actions">
          <button type="button" class="btn btn-secondary" routerLink="/home">
            ← Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .admin-panel {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    h2 {
      text-align: center;
      color: #667eea;
      margin-bottom: 40px;
      font-size: 2.2rem;
    }

    .admin-sections {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
      margin-bottom: 40px;
    }

    .admin-card {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .admin-card:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }

    .admin-card h3 {
      color: #4a5568;
      margin-bottom: 15px;
      font-size: 1.3rem;
    }

    .admin-card p {
      color: #718096;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 25px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
      text-align: center;
      min-width: 120px;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background: #cbd5e0;
      transform: translateY(-1px);
    }

    .actions {
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 30px;
    }

    @media (max-width: 768px) {
      .admin-sections {
        grid-template-columns: 1fr;
      }
      
      .admin-card {
        padding: 20px;
      }
    }
  `]
})
export class AdminComponent implements OnInit {

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Verificar se o usuário tem permissões de admin
    const user = this.authService.getCurrentUser();
    if (!user || !this.authService.hasPermission('admin')) {
      // Redirecionar para página não autorizada
      window.location.href = '/unauthorized';
    }
  }

  manageUsers() {
    alert('Funcionalidade de gerenciar usuários em desenvolvimento!');
  }

  generateReports() {
    alert('Funcionalidade de relatórios em desenvolvimento!');
  }

  systemConfig() {
    alert('Funcionalidade de configurações do sistema em desenvolvimento!');
  }

  manageStatus() {
    alert('Funcionalidade de gerenciar status em desenvolvimento!');
  }

  viewLogs() {
    alert('Funcionalidade de logs do sistema em desenvolvimento!');
  }
}