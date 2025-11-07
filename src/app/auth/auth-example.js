// ===================================================================
// SISTEMA DE AUTENTICAÇÃO E PERMISSÕES - JAVASCRIPT PURO
// Sistema de Catequese - Exemplo de Implementação Frontend
// ===================================================================

// ===== CLASSE PRINCIPAL PARA GERENCIAR AUTENTICAÇÃO =====
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('catequese_token');
    this.user = JSON.parse(localStorage.getItem('catequese_user') || 'null');
    this.apiBaseUrl = '/api'; // Configurar conforme necessário
    
    // Event listeners para mudanças no storage (múltiplas abas)
    window.addEventListener('storage', (e) => {
      if (e.key === 'catequese_token' || e.key === 'catequese_user') {
        this.token = localStorage.getItem('catequese_token');
        this.user = JSON.parse(localStorage.getItem('catequese_user') || 'null');
        this.notifyAuthChange();
      }
    });
  }

  // ===== MÉTODOS DE AUTENTICAÇÃO =====

  /**
   * Realizar login no sistema
   * @param {string} usuario - Nome de usuário
   * @param {string} senha - Senha do usuário
   * @returns {Promise<Object>} Resultado do login
   */
  async login(usuario, senha) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, senha })
      });

      const result = await response.json();

      if (result.success) {
        this.token = result.data.token;
        this.user = result.data.usuario;
        
        localStorage.setItem('catequese_token', this.token);
        localStorage.setItem('catequese_user', JSON.stringify(this.user));
        
        this.notifyAuthChange();
        
        return { 
          success: true, 
          user: this.user,
          message: 'Login realizado com sucesso!'
        };
      } else {
        return { 
          success: false, 
          message: result.message || 'Credenciais inválidas'
        };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        message: 'Erro de conexão. Verifique sua internet e tente novamente.'
      };
    }
  }

  /**
   * Realizar logout do sistema
   */
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('catequese_token');
    localStorage.removeItem('catequese_user');
    this.notifyAuthChange();
    
    // Opcional: notificar o servidor sobre o logout
    fetch(`${this.apiBaseUrl}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    }).catch(e => console.warn('Erro ao notificar logout:', e));
  }

  /**
   * Verificar se o usuário está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!(this.token && this.user && this.user.id);
  }

  /**
   * Obter usuário atual
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Obter token atual
   * @returns {string|null}
   */
  getToken() {
    return this.token;
  }

  // ===== MÉTODOS DE PERMISSÕES =====

  /**
   * Verificar se o usuário tem uma permissão específica
   * @param {string} permission - Nome da permissão
   * @returns {boolean}
   */
  hasPermission(permission) {
    if (!this.user || !this.user.permissions) return false;
    return this.user.permissions.includes(permission);
  }

  /**
   * Verificar se o usuário tem qualquer uma das permissões
   * @param {string[]} permissions - Array de permissões
   * @returns {boolean}
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Verificar se o usuário tem todas as permissões
   * @param {string[]} permissions - Array de permissões
   * @returns {boolean}
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Verificar se o usuário pertence a um grupo
   * @param {string} group - Nome do grupo
   * @returns {boolean}
   */
  belongsToGroup(group) {
    if (!this.user || !this.user.grupos) return false;
    return this.user.grupos.includes(group);
  }

  /**
   * Verificar se é administrador
   * @returns {boolean}
   */
  isAdmin() {
    return this.hasPermission('sistema.configurar') || 
           this.belongsToGroup('administradores');
  }

  // ===== MÉTODOS DE REQUISIÇÕES HTTP =====

  /**
   * Obter cabeçalhos de autorização
   * @returns {Object}
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Fazer requisição HTTP autenticada
   * @param {string} url - URL da requisição
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Response>}
   */
  async fetchWithAuth(url, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    const response = await fetch(url, config);

    // Token expirado ou inválido
    if (response.status === 401) {
      this.logout();
      window.location.href = '/login.html';
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    return response;
  }

  /**
   * Verificar validade do token no servidor
   * @returns {Promise<boolean>}
   */
  async validateToken() {
    if (!this.token) return false;

    try {
      const response = await this.fetchWithAuth(`${this.apiBaseUrl}/auth/validate`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // ===== MÉTODOS DE NOTIFICAÇÃO =====

  /**
   * Notificar mudança de autenticação
   */
  notifyAuthChange() {
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: {
        isAuthenticated: this.isAuthenticated(),
        user: this.user
      }
    }));
  }
}

// ===== INSTÂNCIA GLOBAL =====
const auth = new AuthManager();

// ===== COMPONENTE DE LOGIN =====
class LoginComponent {
  constructor() {
    this.formElement = document.getElementById('loginForm');
    this.usuarioInput = document.getElementById('usuario');
    this.senhaInput = document.getElementById('senha');
    this.submitButton = document.querySelector('#loginForm button[type="submit"]');
    this.errorContainer = document.getElementById('loginError');
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.formElement) return;

    this.formElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    // Limpar erro ao digitar
    [this.usuarioInput, this.senhaInput].forEach(input => {
      if (input) {
        input.addEventListener('input', () => this.clearError());
      }
    });
  }

  async handleLogin() {
    const usuario = this.usuarioInput.value.trim();
    const senha = this.senhaInput.value;

    if (!usuario || !senha) {
      this.showError('Por favor, preencha usuário e senha.');
      return;
    }

    this.setLoading(true);
    this.clearError();

    try {
      const result = await auth.login(usuario, senha);

      if (result.success) {
        this.showSuccess('Login realizado com sucesso!');
        setTimeout(() => {
          this.redirectBasedOnPermissions();
        }, 1000);
      } else {
        this.showError(result.message);
      }
    } catch (error) {
      this.showError('Erro inesperado. Tente novamente.');
    } finally {
      this.setLoading(false);
    }
  }

  redirectBasedOnPermissions() {
    // Redirecionar baseado nas permissões do usuário
    if (auth.hasPermission('sistema.configurar')) {
      window.location.href = '/admin.html';
    } else if (auth.hasPermission('usuarios.listar')) {
      window.location.href = '/usuarios.html';
    } else if (auth.hasPermission('inscricoes.criar')) {
      window.location.href = '/inscricao.html';
    } else if (auth.hasPermission('inscricoes.consultar')) {
      window.location.href = '/consulta.html';
    } else {
      window.location.href = '/dashboard.html';
    }
  }

  setLoading(loading) {
    if (this.submitButton) {
      this.submitButton.disabled = loading;
      this.submitButton.textContent = loading ? 'Entrando...' : 'Entrar';
    }
  }

  showError(message) {
    if (this.errorContainer) {
      this.errorContainer.textContent = message;
      this.errorContainer.style.display = 'block';
      this.errorContainer.className = 'alert alert-error';
    }
  }

  showSuccess(message) {
    if (this.errorContainer) {
      this.errorContainer.textContent = message;
      this.errorContainer.style.display = 'block';
      this.errorContainer.className = 'alert alert-success';
    }
  }

  clearError() {
    if (this.errorContainer) {
      this.errorContainer.style.display = 'none';
    }
  }
}

// ===== COMPONENTE DE GESTÃO DE USUÁRIOS =====
class UserManagementComponent {
  constructor() {
    this.container = document.getElementById('userManagement');
    this.users = [];
    this.loading = false;
    
    this.init();
  }

  async init() {
    if (!this.container) return;

    // Verificar permissões
    if (!auth.hasPermission('usuarios.listar')) {
      this.container.innerHTML = `
        <div class="alert alert-error">
          <h3>Acesso Negado</h3>
          <p>Você não tem permissão para visualizar usuários.</p>
          <a href="/dashboard.html" class="btn btn-primary">Voltar ao Dashboard</a>
        </div>
      `;
      return;
    }

    this.render();
    await this.loadUsers();
  }

  render() {
    this.container.innerHTML = `
      <div class="user-management">
        <div class="header">
          <h2>Gestão de Usuários</h2>
          ${auth.hasPermission('usuarios.criar') ? 
            '<button id="createUserBtn" class="btn btn-primary">Criar Usuário</button>' : 
            ''}
        </div>
        
        <div id="userError" class="alert alert-error" style="display: none;"></div>
        
        <div id="createUserForm" class="create-form" style="display: none;">
          <h3>Criar Novo Usuário</h3>
          <form id="newUserForm">
            <div class="form-row">
              <div class="form-group">
                <label for="newNome">Nome Completo *</label>
                <input type="text" id="newNome" name="nome" required>
              </div>
              <div class="form-group">
                <label for="newUsuario">Usuário *</label>
                <input type="text" id="newUsuario" name="usuario" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="newSenha">Senha *</label>
                <input type="password" id="newSenha" name="senha" required>
              </div>
              <div class="form-group">
                <label for="newEmail">E-mail</label>
                <input type="email" id="newEmail" name="email">
              </div>
            </div>
            
            <div class="permissions-section">
              <h4>Permissões</h4>
              <div id="permissionsContainer" class="permissions-grid">
                ${this.renderPermissionCheckboxes()}
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" id="cancelCreate" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Criar Usuário</button>
            </div>
          </form>
        </div>
        
        <div id="usersList" class="users-list">
          <div class="loading">Carregando usuários...</div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  renderPermissionCheckboxes() {
    const permissions = [
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

    return permissions.map(permission => `
      <label class="permission-item">
        <input type="checkbox" name="permissions" value="${permission}">
        <span>${permission}</span>
      </label>
    `).join('');
  }

  setupEventListeners() {
    // Botão criar usuário
    const createBtn = document.getElementById('createUserBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateForm());
    }

    // Cancelar criação
    const cancelBtn = document.getElementById('cancelCreate');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideCreateForm());
    }

    // Form de criação
    const form = document.getElementById('newUserForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleCreateUser(e));
    }
  }

  async loadUsers() {
    if (!auth.hasPermission('usuarios.listar')) return;

    this.setLoading(true);

    try {
      const response = await auth.fetchWithAuth(`${auth.apiBaseUrl}/usuarios`);
      const result = await response.json();

      if (result.success) {
        this.users = result.data;
        this.renderUsersList();
      } else {
        this.showError('Erro ao carregar usuários: ' + result.message);
      }
    } catch (error) {
      this.showError('Erro ao carregar usuários: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  renderUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    if (this.users.length === 0) {
      usersList.innerHTML = '<div class="empty-state">Nenhum usuário encontrado.</div>';
      return;
    }

    const usersHTML = `
      <table class="users-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Usuário</th>
            <th>E-mail</th>
            <th>Permissões</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${this.users.map(user => this.renderUserRow(user)).join('')}
        </tbody>
      </table>
    `;

    usersList.innerHTML = usersHTML;
    this.setupUserActions();
  }

  renderUserRow(user) {
    const permissions = user.permissions || [];
    const permissionsDisplay = permissions.length > 0 
      ? permissions.slice(0, 3).map(p => `<span class="permission-badge">${p}</span>`).join('') +
        (permissions.length > 3 ? `<span class="more-permissions">+${permissions.length - 3} mais</span>` : '')
      : '<span class="no-permissions">Nenhuma</span>';

    return `
      <tr>
        <td>${user.nome}</td>
        <td>${user.usuario}</td>
        <td>${user.email || '-'}</td>
        <td class="permissions-cell">${permissionsDisplay}</td>
        <td class="actions">
          ${auth.hasPermission('usuarios.editar') ? 
            `<button class="btn btn-sm btn-secondary edit-user" data-user-id="${user.id}">✏️</button>` : 
            ''}
          ${auth.hasPermission('usuarios.deletar') ? 
            `<button class="btn btn-sm btn-danger delete-user" data-user-id="${user.id}">🗑️</button>` : 
            ''}
        </td>
      </tr>
    `;
  }

  setupUserActions() {
    // Botões de editar
    document.querySelectorAll('.edit-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.getAttribute('data-user-id');
        this.editUser(parseInt(userId));
      });
    });

    // Botões de deletar
    document.querySelectorAll('.delete-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.getAttribute('data-user-id');
        this.deleteUser(parseInt(userId));
      });
    });
  }

  async handleCreateUser(e) {
    e.preventDefault();

    if (!auth.hasPermission('usuarios.criar')) {
      alert('Você não tem permissão para criar usuários');
      return;
    }

    const formData = new FormData(e.target);
    const userData = {
      nome: formData.get('nome'),
      usuario: formData.get('usuario'),
      senha: formData.get('senha'),
      email: formData.get('email'),
      permissions: []
    };

    // Coletar permissões selecionadas
    document.querySelectorAll('input[name="permissions"]:checked').forEach(checkbox => {
      userData.permissions.push(checkbox.value);
    });

    if (!userData.nome || !userData.usuario || !userData.senha) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await auth.fetchWithAuth(`${auth.apiBaseUrl}/usuarios`, {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (result.success) {
        alert('Usuário criado com sucesso!');
        this.hideCreateForm();
        await this.loadUsers();
      } else {
        this.showError('Erro ao criar usuário: ' + result.message);
      }
    } catch (error) {
      this.showError('Erro ao criar usuário: ' + error.message);
    }
  }

  async editUser(userId) {
    if (!auth.hasPermission('usuarios.editar')) {
      alert('Você não tem permissão para editar usuários');
      return;
    }
    
    // Implementar modal de edição ou redirecionamento
    console.log('Editar usuário:', userId);
    alert('Funcionalidade de edição será implementada em breve');
  }

  async deleteUser(userId) {
    if (!auth.hasPermission('usuarios.deletar')) {
      alert('Você não tem permissão para deletar usuários');
      return;
    }

    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Tem certeza que deseja deletar o usuário "${user.nome}"?`)) return;

    try {
      const response = await auth.fetchWithAuth(`${auth.apiBaseUrl}/usuarios/${userId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('Usuário deletado com sucesso!');
        await this.loadUsers();
      } else {
        this.showError('Erro ao deletar usuário: ' + result.message);
      }
    } catch (error) {
      this.showError('Erro ao deletar usuário: ' + error.message);
    }
  }

  showCreateForm() {
    const form = document.getElementById('createUserForm');
    if (form) form.style.display = 'block';
  }

  hideCreateForm() {
    const form = document.getElementById('createUserForm');
    if (form) {
      form.style.display = 'none';
      document.getElementById('newUserForm').reset();
    }
  }

  setLoading(loading) {
    this.loading = loading;
    // Atualizar UI de loading conforme necessário
  }

  showError(message) {
    const errorContainer = document.getElementById('userError');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
    }
  }
}

// ===== FUNÇÕES UTILITÁRIAS =====

/**
 * Proteger elemento da UI baseado em permissão
 * @param {string} elementId - ID do elemento
 * @param {string} permission - Permissão necessária
 */
function protectElement(elementId, permission) {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (!auth.hasPermission(permission)) {
    element.style.display = 'none';
  }
}

/**
 * Proteger múltiplos elementos baseado em permissões
 * @param {Object} elementsConfig - Configuração {elementId: permission}
 */
function protectElements(elementsConfig) {
  Object.entries(elementsConfig).forEach(([elementId, permission]) => {
    protectElement(elementId, permission);
  });
}

/**
 * Aplicar proteções baseadas em atributos data
 */
function applyPermissionBasedProtection() {
  // Proteger elementos com data-permission
  document.querySelectorAll('[data-permission]').forEach(element => {
    const requiredPermission = element.getAttribute('data-permission');
    if (!auth.hasPermission(requiredPermission)) {
      element.style.display = 'none';
    }
  });

  // Proteger elementos com data-group
  document.querySelectorAll('[data-group]').forEach(element => {
    const requiredGroup = element.getAttribute('data-group');
    if (!auth.belongsToGroup(requiredGroup)) {
      element.style.display = 'none';
    }
  });

  // Proteger elementos que precisam estar autenticado
  document.querySelectorAll('[data-auth-required]').forEach(element => {
    if (!auth.isAuthenticated()) {
      element.style.display = 'none';
    }
  });

  // Mostrar elementos apenas para usuários não autenticados
  document.querySelectorAll('[data-guest-only]').forEach(element => {
    if (auth.isAuthenticated()) {
      element.style.display = 'none';
    }
  });
}

/**
 * Verificar autenticação e redirecionar se necessário
 */
function requireAuth() {
  if (!auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

/**
 * Verificar permissão específica e redirecionar se necessário
 * @param {string} permission - Permissão necessária
 * @param {string} redirectUrl - URL de redirecionamento
 */
function requirePermission(permission, redirectUrl = '/unauthorized.html') {
  if (!auth.hasPermission(permission)) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

/**
 * Inicialização automática quando o DOM estiver pronto
 */
document.addEventListener('DOMContentLoaded', () => {
  // Aplicar proteções baseadas em permissões
  applyPermissionBasedProtection();

  // Inicializar componentes baseado na página atual
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('login.html') || currentPage === '/') {
    new LoginComponent();
  }
  
  if (currentPage.includes('usuarios.html')) {
    if (requireAuth() && requirePermission('usuarios.listar')) {
      new UserManagementComponent();
    }
  }

  // Configurar elementos de usuário logado
  const userInfo = document.getElementById('userInfo');
  if (userInfo && auth.isAuthenticated()) {
    const user = auth.getCurrentUser();
    userInfo.innerHTML = `
      <span>Olá, ${user.nome}</span>
      <button id="logoutBtn" class="btn btn-secondary">Sair</button>
    `;
    
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      if (confirm('Deseja realmente sair do sistema?')) {
        auth.logout();
        window.location.href = '/login.html';
      }
    });
  }

  // Proteger elementos específicos
  protectElements({
    'adminPanelBtn': 'sistema.configurar',
    'createUserBtn': 'usuarios.criar',
    'reportsBtn': 'relatorios.gerar',
    'configBtn': 'sistema.configurar'
  });
});

// ===== EVENT LISTENERS GLOBAIS =====

// Escutar mudanças de autenticação
window.addEventListener('authStateChanged', (e) => {
  const { isAuthenticated, user } = e.detail;
  
  if (isAuthenticated) {
    console.log('Usuário autenticado:', user.nome);
  } else {
    console.log('Usuário desconectado');
  }
  
  // Reaplicar proteções após mudança de autenticação
  applyPermissionBasedProtection();
});

// Interceptar links que precisam de autenticação
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-auth-required]');
  if (link && !auth.isAuthenticated()) {
    e.preventDefault();
    window.location.href = '/login.html';
  }
});

// ===== EXPORT PARA USO EM OUTROS ARQUIVOS =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AuthManager,
    LoginComponent,
    UserManagementComponent,
    protectElement,
    protectElements,
    requireAuth,
    requirePermission
  };
}

// Disponibilizar globalmente para uso em outros scripts
window.CatequeseAuth = {
  AuthManager,
  LoginComponent,
  UserManagementComponent,
  protectElement,
  protectElements,
  requireAuth,
  requirePermission,
  auth // Instância global
};