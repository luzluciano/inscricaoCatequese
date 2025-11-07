import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <div class="profile-card">
        <h2>👤 Perfil do Usuário</h2>
        
        <!-- Visualização do Perfil -->
        <div class="profile-info" *ngIf="currentUser && !isEditing">
          <div class="info-row">
            <label>Nome:</label>
            <span>{{ currentUser.nome }}</span>
          </div>
          
          <div class="info-row">
            <label>Usuário:</label>
            <span>{{ currentUser.usuario }}</span>
          </div>
          
          <div class="info-row">
            <label>Email:</label>
            <span>{{ currentUser.email }}</span>
          </div>
          
          <div class="info-row">
            <label>Grupos:</label>
            <span>{{ currentUser.grupos?.join(', ') || 'Nenhum' }}</span>
          </div>
          
          <div class="info-row">
            <label>Permissões:</label>
            <div class="permissions">
              <span 
                *ngFor="let permission of currentUser.permissions" 
                class="permission-badge">
                {{ permission }}
              </span>
            </div>
          </div>
        </div>

        <!-- Formulário de Edição -->
        <form *ngIf="currentUser && isEditing" (ngSubmit)="saveProfile()" class="edit-form">
          <div class="form-group">
            <label for="nome">Nome:</label>
            <input 
              type="text" 
              id="nome" 
              [(ngModel)]="editData.nome"
              name="nome"
              class="form-control"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="usuario">Usuário:</label>
            <input 
              type="text" 
              id="usuario" 
              [(ngModel)]="editData.usuario"
              name="usuario"
              class="form-control"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              [(ngModel)]="editData.email"
              name="email"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="novaSenha">Nova Senha (opcional):</label>
            <input 
              type="password" 
              id="novaSenha" 
              [(ngModel)]="editData.novaSenha"
              name="novaSenha"
              class="form-control"
              placeholder="Deixe vazio para não alterar"
            >
          </div>

          <div class="form-group">
            <label for="confirmarSenha">Confirmar Nova Senha:</label>
            <input 
              type="password" 
              id="confirmarSenha" 
              [(ngModel)]="editData.confirmarSenha"
              name="confirmarSenha"
              class="form-control"
              placeholder="Confirme a nova senha"
              [disabled]="!editData.novaSenha"
            >
          </div>

          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </form>
        
        <div class="actions">
          <button type="button" class="btn btn-secondary" routerLink="/home" *ngIf="!isEditing">
            ← Voltar
          </button>
          
          <!-- Botões no modo visualização -->
          <button type="button" class="btn btn-primary" (click)="editProfile()" *ngIf="!isEditing">
            ✏️ Editar Perfil
          </button>
          
          <!-- Botões no modo edição -->
          <button type="button" class="btn btn-secondary" (click)="cancelEdit()" *ngIf="isEditing">
            Cancelar
          </button>
          <button type="submit" form="profileForm" class="btn btn-primary" (click)="saveProfile()" [disabled]="loading" *ngIf="isEditing">
            {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .profile-card {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    h2 {
      text-align: center;
      color: #667eea;
      margin-bottom: 30px;
      font-size: 2rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    label {
      font-weight: 600;
      color: #333;
      min-width: 120px;
    }

    span {
      color: #666;
      flex: 1;
      text-align: right;
    }

    .permissions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }

    .permission-badge {
      background: #667eea;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      text-align: center !important;
    }

    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
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

    .edit-form {
      margin-top: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #333;
      text-align: left;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-control:disabled {
      background-color: #f7fafc;
      color: #a0aec0;
    }

    .error-message {
      background: #fed7d7;
      color: #c53030;
      padding: 12px;
      border-radius: 8px;
      margin-top: 15px;
      border-left: 4px solid #e53e3e;
      text-align: left;
    }
  `]
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  isEditing = false;
  loading = false;
  errorMessage = '';
  
  editData = {
    nome: '',
    usuario: '',
    email: '',
    novaSenha: '',
    confirmarSenha: ''
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
  }

  editProfile() {
    if (!this.currentUser) return;
    
    // Preencher dados para edição
    this.editData = {
      nome: this.currentUser.nome || '',
      usuario: this.currentUser.usuario || '',
      email: this.currentUser.email || '',
      novaSenha: '',
      confirmarSenha: ''
    };
    
    this.isEditing = true;
    this.errorMessage = '';
  }

  cancelEdit() {
    this.isEditing = false;
    this.errorMessage = '';
    this.editData = {
      nome: '',
      usuario: '',
      email: '',
      novaSenha: '',
      confirmarSenha: ''
    };
  }

  saveProfile() {
    if (!this.currentUser) return;
    
    this.errorMessage = '';
    
    // Validações
    if (!this.editData.nome.trim() || !this.editData.usuario.trim()) {
      this.errorMessage = 'Nome e usuário são obrigatórios.';
      return;
    }
    
    // Validar senha se fornecida
    if (this.editData.novaSenha) {
      if (this.editData.novaSenha.length < 6) {
        this.errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        return;
      }
      
      if (this.editData.novaSenha !== this.editData.confirmarSenha) {
        this.errorMessage = 'As senhas não coincidem.';
        return;
      }
    }
    
    this.loading = true;
    
    // Preparar dados para envio
    const updateData: any = {
      nome: this.editData.nome.trim(),
      usuario: this.editData.usuario.trim(),
      email: this.editData.email.trim()
    };
    
    // Incluir senha apenas se fornecida
    if (this.editData.novaSenha) {
      updateData.senha = this.editData.novaSenha;
    }
    
    // Chamar API de atualização de perfil
    this.authService.fetchWithAuth(`/api/usuarios/${this.currentUser.id}`, {
      method: 'PUT',
      body: updateData
    }).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          // Atualizar dados do usuário local
          if (this.currentUser) {
            this.currentUser.nome = updateData.nome;
            this.currentUser.usuario = updateData.usuario;
            this.currentUser.email = updateData.email;
            
            // Atualizar no AuthService
            this.authService.updateCurrentUser(this.currentUser);
          }
          
          alert('Perfil atualizado com sucesso!');
          this.isEditing = false;
          this.cancelEdit();
        } else {
          this.errorMessage = response.message || 'Erro ao atualizar perfil.';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Erro ao atualizar perfil: ' + error.message;
      }
    });
  }
}