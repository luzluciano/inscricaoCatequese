# Sistema de Autenticação e Permissões - Sistema de Catequese

Este documento descreve o sistema de autenticação e permissões implementado para o sistema de catequese, incluindo exemplos de uso tanto em Angular quanto em JavaScript puro.

## 📋 Visão Geral

O sistema implementa:
- **Autenticação baseada em JWT**
- **Sistema de permissões granulares**
- **Grupos de usuários**
- **Proteção de rotas e componentes**
- **Interceptação automática de requisições HTTP**
- **Guards para proteger rotas**
- **Diretivas para proteger elementos da UI**

## 🏗️ Estrutura dos Arquivos

```
src/app/auth/
├── auth.service.ts           # Serviço principal de autenticação (Angular)
├── auth.guard.ts            # Guards para proteger rotas
├── auth.interceptor.ts      # Interceptor HTTP para autenticação
├── permission.directive.ts  # Diretivas para proteger elementos UI
├── auth-example.js         # Implementação JavaScript pura
└── auth-demo.html          # Página de demonstração
```

## 🔐 Permissões Disponíveis

### Administração do Sistema
- `sistema.configurar` - Configuração geral do sistema
- `sistema.backup` - Realização de backups

### Gestão de Usuários
- `usuarios.criar` - Criar novos usuários
- `usuarios.editar` - Editar usuários existentes
- `usuarios.deletar` - Deletar usuários
- `usuarios.listar` - Visualizar lista de usuários

### Gestão de Inscrições
- `inscricoes.criar` - Criar novas inscrições
- `inscricoes.editar` - Editar inscrições existentes
- `inscricoes.deletar` - Deletar inscrições
- `inscricoes.consultar` - Consultar inscrições

### Gestão de Grupos
- `grupos.criar` - Criar novos grupos
- `grupos.editar` - Editar grupos existentes
- `grupos.deletar` - Deletar grupos

### Relatórios
- `relatorios.gerar` - Gerar relatórios do sistema

## 👥 Grupos de Usuários

- **administradores** - Acesso completo ao sistema
- **coordenadores** - Gestão de inscrições e usuários
- **catequistas** - Acesso a inscrições
- **secretarios** - Suporte administrativo
- **consultores** - Consulta apenas

## 🚀 Como Usar - Angular

### 1. Serviço de Autenticação

```typescript
import { AuthService } from './auth/auth.service';

constructor(private authService: AuthService) {}

// Login
async login() {
  const result = await this.authService.login('usuario', 'senha').toPromise();
  if (result.success) {
    // Login bem-sucedido
  }
}

// Verificar permissões
if (this.authService.hasPermission('usuarios.criar')) {
  // Usuário pode criar usuários
}

// Fazer requisição autenticada
this.authService.fetchWithAuth('/api/data').subscribe(response => {
  // Processar resposta
});
```

### 2. Proteção de Rotas

```typescript
// app.routes.ts
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [PermissionGuard],
  data: { permissions: ['sistema.configurar'] }
}
```

### 3. Proteção de Elementos UI

```html
<!-- Mostrar apenas se tiver permissão -->
<button *appHasPermission="'usuarios.criar'">
  Criar Usuário
</button>

<!-- Requer múltiplas permissões -->
<div *appHasPermission="['usuarios.criar', 'usuarios.editar']" 
     [requireAll]="true">
  Conteúdo para usuários com ambas permissões
</div>

<!-- Mostrar apenas para grupo específico -->
<div *appHasGroup="'administradores'">
  Conteúdo apenas para administradores
</div>
```

### 4. Guard de Autenticação

```typescript
// Proteger rota que requer autenticação
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard]
}
```

## 🌐 Como Usar - JavaScript Puro

### 1. Inicialização

```javascript
// O AuthManager é automaticamente instanciado
const auth = new AuthManager();

// Ou use a instância global
const auth = window.CatequeseAuth.auth;
```

### 2. Login e Logout

```javascript
// Login
const result = await auth.login('usuario', 'senha');
if (result.success) {
  console.log('Usuário logado:', result.user);
}

// Logout
auth.logout();
```

### 3. Verificação de Permissões

```javascript
// Verificar permissão única
if (auth.hasPermission('usuarios.criar')) {
  // Mostrar botão de criar usuário
}

// Verificar múltiplas permissões (qualquer uma)
if (auth.hasAnyPermission(['usuarios.criar', 'usuarios.editar'])) {
  // Usuário pode criar OU editar
}

// Verificar múltiplas permissões (todas)
if (auth.hasAllPermissions(['usuarios.criar', 'usuarios.editar'])) {
  // Usuário pode criar E editar
}

// Verificar grupo
if (auth.belongsToGroup('administradores')) {
  // É administrador
}
```

### 4. Proteção de Elementos HTML

```html
<!-- Proteção por permissão -->
<button data-permission="usuarios.criar">Criar Usuário</button>

<!-- Proteção por grupo -->
<div data-group="administradores">Conteúdo para admins</div>

<!-- Apenas para usuários autenticados -->
<div data-auth-required>Área logada</div>

<!-- Apenas para visitantes -->
<div data-guest-only>Área de login</div>
```

### 5. Requisições HTTP Autenticadas

```javascript
// Requisição GET
const response = await auth.fetchWithAuth('/api/usuarios');
const data = await response.json();

// Requisição POST
const response = await auth.fetchWithAuth('/api/usuarios', {
  method: 'POST',
  body: JSON.stringify(userData)
});
```

### 6. Funções Utilitárias

```javascript
// Proteger elemento específico
protectElement('createUserBtn', 'usuarios.criar');

// Proteger múltiplos elementos
protectElements({
  'adminPanelBtn': 'sistema.configurar',
  'createUserBtn': 'usuarios.criar',
  'deleteUserBtn': 'usuarios.deletar'
});

// Verificar autenticação (redireciona se não autenticado)
if (!requireAuth()) {
  return; // Usuário foi redirecionado para login
}

// Verificar permissão (redireciona se não autorizado)
if (!requirePermission('usuarios.criar')) {
  return; // Usuário foi redirecionado para página de erro
}
```

## 🎯 Componentes Prontos

### 1. LoginComponent
- Formulário de login responsivo
- Validação de campos
- Tratamento de erros
- Redirecionamento baseado em permissões

### 2. UserManagementComponent
- Lista de usuários
- Criação de novos usuários
- Edição e exclusão (com permissões)
- Atribuição de permissões e grupos

## 📱 Demonstração

Para testar o sistema, abra o arquivo `auth-demo.html` em um navegador. Use as credenciais:

**Administrador:**
- Usuário: `admin`
- Senha: `admin123`

**Usuário Comum:**
- Usuário: `user` 
- Senha: `user123`

## 🔧 Configuração do Backend

O sistema espera que o backend implemente as seguintes rotas:

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/logout` - Logout do usuário
- `GET /api/auth/validate` - Validar token
- `PUT /api/auth/profile` - Atualizar perfil
- `POST /api/auth/change-password` - Alterar senha

### Usuários
- `GET /api/usuarios` - Listar usuários
- `POST /api/usuarios` - Criar usuário
- `PUT /api/usuarios/:id` - Editar usuário
- `DELETE /api/usuarios/:id` - Deletar usuário

### Formato de Resposta Esperado

```javascript
// Login bem-sucedido
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "usuario": {
      "id": 1,
      "nome": "Nome do Usuário",
      "usuario": "username",
      "email": "email@example.com",
      "permissions": ["permissao1", "permissao2"],
      "grupos": ["grupo1", "grupo2"]
    }
  }
}

// Erro
{
  "success": false,
  "message": "Mensagem de erro"
}
```

## 🛡️ Segurança

### Boas Práticas Implementadas
- Tokens JWT com expiração
- Interceptação automática de requisições
- Logout automático em caso de token expirado
- Validação tanto no frontend quanto no backend
- Princípio do menor privilégio
- Separação de responsabilidades

### Recomendações
- Implemente rate limiting no backend
- Use HTTPS em produção
- Defina tempos de expiração apropriados para tokens
- Monitore tentativas de login falhadas
- Implemente auditoria de ações sensíveis

## 🎨 Personalização

### CSS Classes Disponíveis
- `.alert-error` - Mensagens de erro
- `.alert-success` - Mensagens de sucesso
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger` - Botões
- `.form-control` - Campos de formulário
- `.loading` - Indicadores de carregamento

### Eventos Personalizados
- `authStateChanged` - Disparado quando estado de autenticação muda
- Escute com: `window.addEventListener('authStateChanged', handler)`

## 🐛 Solução de Problemas

### Token Expirado
- O sistema faz logout automático
- Usuário é redirecionado para tela de login

### Permissão Negada
- Elementos protegidos ficam ocultos
- Rotas protegidas redirecionam para página de erro

### Erro de Conexão
- Mensagens de erro são exibidas
- Tentativas podem ser repetidas

## 📚 Próximos Passos

1. Implementar refresh tokens
2. Adicionar autenticação multi-fator
3. Implementar auditoria de ações
4. Adicionar políticas de senha
5. Implementar SSO (Single Sign-On)

---

Este sistema fornece uma base sólida para autenticação e autorização, podendo ser facilmente adaptado para diferentes necessidades do projeto.