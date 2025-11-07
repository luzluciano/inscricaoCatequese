import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../auth/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  errorMessage = '';
  showCreateForm = false;
  showEditForm = false;
  editingUser: any = null;

  newUser = {
    nome: '',
    usuario: '',
    senha: '',
    email: '',
    permissions: [] as string[],
    grupos: [] as string[]
  };

  editingUserData = {
    id: 0,
    nome: '',
    usuario: '',
    senha: '',
    ativo: true,
    grupo: 'Usuario'
  };

  availablePermissions = [
    'sistema.configurar',
    'usuarios.criar',
    'usuarios.editar',
    'usuarios.deletar',
    'usuarios.listar',
    'inscricoes.criar',
    'inscricoes.editar',
    'inscricoes.deletar',
    'inscricoes.consultar',
    'grupos.criar',
    'grupos.editar',
    'grupos.deletar',
    'relatorios.gerar'
  ];

  availableGroups = [
    'administradores',
    'coordenadores',
    'catequistas',
    'secretarios',
    'consultores'
  ];

  // Grupos para a nova API
  availableGrupos = [
    { value: 'Administrador', label: 'Administrador' },
    { value: 'Usuario', label: 'Usuário' }
  ];

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    if (!this.authService.hasPermission('usuarios.listar')) {
      this.errorMessage = 'Você não tem permissão para visualizar usuários.';
      return;
    }

    this.loading = true;
    this.authService.fetchWithAuth<{success: boolean, data: User[]}>('/api/usuarios')
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            console.log('✅ Usuários carregados:', response.data.length);
            console.log('� Primeiro usuário (exemplo):', response.data[0]);
            this.users = response.data;
            
            // Forçar detecção de mudanças
            this.cdr.detectChanges();
          } else {
            this.errorMessage = 'Erro ao carregar usuários';
          }
        },
        error: (error: any) => {
          this.loading = false;
          this.errorMessage = 'Erro ao carregar usuários: ' + error.message;
        }
      });
  }

  // Função auxiliar para obter permissões de forma segura
  getUserPermissions(user: any): string[] {
    // Verifica diferentes possíveis nomes da propriedade após mudança no backend
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions;
    }
    if (user.permission && Array.isArray(user.permission)) {
      return user.permission;
    }
    return [];
  }

  // Função auxiliar para obter grupos de forma segura
  getUserGroups(user: any): string[] {
    if (user.grupos && Array.isArray(user.grupos)) {
      return user.grupos;
    }
    if (user.groups && Array.isArray(user.groups)) {
      return user.groups;
    }
    return [];
  }

  createUser(): void {
    if (!this.authService.hasPermission('usuarios.criar')) {
      alert('Você não tem permissão para criar usuários');
      return;
    }

    if (!this.newUser.nome || !this.newUser.usuario || !this.newUser.senha) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    this.loading = true;
    this.authService.fetchWithAuth('/api/usuarios', {
      method: 'POST',
      body: this.newUser
    }).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          alert('Usuário criado com sucesso!');
          this.showCreateForm = false;
          this.resetNewUser();
          this.loadUsers();
        } else {
          alert('Erro: ' + response.message);
        }
      },
      error: (error) => {
        this.loading = false;
        alert('Erro ao criar usuário: ' + error.message);
      }
    });
  }

  editUser(user: User): void {
    if (!this.authService.hasPermission('usuarios.editar')) {
      alert('Você não tem permissão para editar usuários');
      return;
    }
    
    // Preencher o formulário de edição com os dados do usuário
    this.editingUserData = {
      id: user.id,
      nome: user.nome || '',
      usuario: user.usuario || '',
      senha: '', // Sempre vazia para segurança
      ativo: true, // Assumir ativo por padrão
      grupo: 'Usuario' // Valor padrão
    };
    
    this.editingUser = user;
    this.showEditForm = true;
  }

  updateUser(): void {
    if (!this.authService.hasPermission('usuarios.editar')) {
      alert('Você não tem permissão para editar usuários');
      return;
    }

    if (!this.editingUserData.nome || !this.editingUserData.usuario) {
      alert('Preencha os campos obrigatórios (Nome e Usuário)');
      return;
    }

    this.loading = true;
    
    // Preparar dados para envio (apenas campos que não estão vazios)
    const updateData: any = {};
    
    if (this.editingUserData.nome.trim()) {
      updateData.nome = this.editingUserData.nome.trim();
    }
    
    if (this.editingUserData.usuario.trim()) {
      updateData.usuario = this.editingUserData.usuario.trim();
    }
    
    if (this.editingUserData.senha.trim()) {
      updateData.senha = this.editingUserData.senha.trim();
    }
    
    updateData.ativo = this.editingUserData.ativo;
    updateData.grupo = this.editingUserData.grupo;

    this.authService.fetchWithAuth(`/api/usuarios/${this.editingUserData.id}`, {
      method: 'PUT',
      body: updateData
    }).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          alert('Usuário atualizado com sucesso!');
          this.showEditForm = false;
          this.resetEditUser();
          this.loadUsers();
        } else {
          alert('Erro: ' + response.message);
        }
      },
      error: (error) => {
        this.loading = false;
        alert('Erro ao atualizar usuário: ' + error.message);
      }
    });
  }

  deleteUser(userId: number): void {
    if (!this.authService.hasPermission('usuarios.deletar')) {
      alert('Você não tem permissão para deletar usuários');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    this.authService.fetchWithAuth(`/api/usuarios/${userId}`, {
      method: 'DELETE'
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert('Usuário deletado com sucesso!');
          this.loadUsers();
        } else {
          alert('Erro: ' + response.message);
        }
      },
      error: (error) => {
        alert('Erro ao deletar usuário: ' + error.message);
      }
    });
  }

  togglePermission(permission: string): void {
    const index = this.newUser.permissions.indexOf(permission);
    if (index > -1) {
      this.newUser.permissions.splice(index, 1);
    } else {
      this.newUser.permissions.push(permission);
    }
  }

  toggleGroup(group: string): void {
    const index = this.newUser.grupos.indexOf(group);
    if (index > -1) {
      this.newUser.grupos.splice(index, 1);
    } else {
      this.newUser.grupos.push(group);
    }
  }

  hasPermission(permission: string): boolean {
    return this.newUser.permissions.includes(permission);
  }

  belongsToGroup(group: string): boolean {
    return this.newUser.grupos.includes(group);
  }

  private resetNewUser(): void {
    this.newUser = {
      nome: '',
      usuario: '',
      senha: '',
      email: '',
      permissions: [],
      grupos: []
    };
  }

  private resetEditUser(): void {
    this.editingUserData = {
      id: 0,
      nome: '',
      usuario: '',
      senha: '',
      ativo: true,
      grupo: 'Usuario'
    };
    this.editingUser = null;
  }
}