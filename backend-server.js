const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Dados mock de usuários
const mockUsers = [
  {
    id: 1,
    nome: 'Administrador',
    usuario: 'admin',
    email: 'admin@example.com',
    senha: 'password',
    permissions: [
      'read', 'write', 'admin', 'delete', 
      'sistema.configurar', 
      'inscricoes.criar', 'inscricoes.consultar', 'inscricoes.editar', 'inscricoes.deletar',
      'usuarios.criar', 'usuarios.listar', 'usuarios.editar', 'usuarios.deletar'
    ],
    grupos: ['admin', 'catequista'],
    grupo: 'Administrador',
    created_at: new Date('2024-01-01T09:00:00.000Z'),
    updated_at: new Date('2024-01-01T09:00:00.000Z'),
    ativo: true
  },
  {
    id: 2,
    nome: 'Catequista',
    usuario: 'catequista',
    email: 'catequista@example.com',
    senha: 'password',
    permissions: ['read', 'write', 'inscricoes.criar', 'inscricoes.consultar', 'usuarios.listar'],
    grupos: ['catequista'],
    grupo: 'Usuario',
    created_at: new Date('2024-01-01T10:00:00.000Z'),
    updated_at: new Date('2024-01-01T10:00:00.000Z'),
    ativo: true
  },
  {
    id: 3,
    nome: 'Usuário',
    usuario: 'user',
    email: 'user@example.com',
    senha: 'password',
    permissions: ['read', 'inscricoes.consultar'],
    grupos: ['user'],
    grupo: 'Usuario',
    created_at: new Date('2024-01-01T11:00:00.000Z'),
    updated_at: new Date('2024-01-01T11:00:00.000Z'),
    ativo: true
  }
];

// Tokens ativos (em produção usar Redis ou banco de dados)
const activeTokens = new Set();

// ====== ENDPOINTS DE AUTENTICAÇÃO ======

// Login
app.post('/api/login', (req, res) => {
  console.log('📥 Login request:', req.body);
  
  const { usuario, senha } = req.body;
  
  // Buscar usuário
  const foundUser = mockUsers.find(u => 
    (u.usuario === usuario || u.email === usuario) && u.senha === senha
  );
  
  if (foundUser) {
    // Gerar token (em produção usar JWT)
    const token = 'token-' + Date.now() + '-' + foundUser.id;
    activeTokens.add(token);
    
    // Remover senha da resposta
    const { senha: _, ...userResponse } = foundUser;
    
    const response = {
      success: true,
      data: {
        token: token,
        usuario: userResponse
      },
      message: 'Login realizado com sucesso'
    };
    
    console.log('✅ Login bem-sucedido:', response);
    
    // Definir cookie com o token (opcional - já que o frontend vai salvar)
    res.cookie('auth_token', token, {
      httpOnly: false, // Permitir acesso via JavaScript para o frontend
      secure: false, // Mudar para true em produção com HTTPS
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });
    
    res.json(response);
  } else {
    const response = {
      success: false,
      message: 'Usuário ou senha incorretos'
    };
    
    console.log('❌ Login falhou:', response);
    res.status(401).json(response);
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('📤 Logout request, Authorization header:', authHeader);
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeTokens.delete(token);
    console.log('🗑️ Token removido da lista ativa');
  }
  
  // Limpar cookie
  res.clearCookie('auth_token');
  
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});

// Verificar token
app.get('/api/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('🔍 Verificar token, Authorization header:', authHeader);
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    if (activeTokens.has(token)) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false, message: 'Token inválido' });
    }
  } else {
    res.status(401).json({ valid: false, message: 'Token não fornecido' });
  }
});

// Listar usuários
app.get('/api/users', (req, res) => {
  // Verificar autorização
  const authHeader = req.headers.authorization;
  console.log('👥 Listar usuários, Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
  
  // Remover senhas da resposta
  const usersResponse = mockUsers.map(({ senha: _, ...user }) => user);
  
  res.json({
    success: true,
    data: usersResponse
  });
});

// Atualizar perfil
app.put('/api/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('✏️ Atualizar perfil, Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
  
  // Encontrar usuário pelo token
  const currentUser = getUserFromToken(token);
  if (!currentUser) {
    return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
  }
  
  const { nome, usuario, email, senha } = req.body;
  
  // Verificar se novo nome de usuário já existe (se for diferente do atual)
  if (usuario && usuario !== currentUser.usuario) {
    if (mockUsers.find(u => u.usuario === usuario)) {
      return res.status(400).json({ success: false, message: 'Nome de usuário já existe' });
    }
  }
  
  // Encontrar índice do usuário no array
  const userIndex = mockUsers.findIndex(u => u.id === currentUser.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
  }
  
  // Atualizar campos fornecidos
  if (nome) mockUsers[userIndex].nome = nome;
  if (usuario) mockUsers[userIndex].usuario = usuario;
  if (email !== undefined) mockUsers[userIndex].email = email;
  if (senha) mockUsers[userIndex].senha = senha;
  
  mockUsers[userIndex].updated_at = new Date();
  
  // Retornar usuário atualizado sem senha
  const { senha: _, ...userResponse } = mockUsers[userIndex];
  
  res.json({
    success: true,
    data: userResponse,
    message: 'Perfil atualizado com sucesso'
  });
});

// Alterar senha
app.post('/api/change-password', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('🔐 Alterar senha, Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
  
  res.json({
    success: true,
    message: 'Senha alterada com sucesso'
  });
});

// ====== ENDPOINTS DE USUÁRIOS (CRUD) ======

// Função auxiliar para verificar permissões
function hasPermission(userPermissions, requiredPermission) {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('admin');
}

// Função auxiliar para obter usuário pelo token
function getUserFromToken(token) {
  // Em produção, decodificar JWT para obter dados do usuário
  // Aqui simulamos retornando o admin
  return mockUsers.find(u => u.usuario === 'admin');
}

// Criar Usuário (endpoint que aceita tanto cadastro público quanto administrativo)
app.post('/api/usuarios', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('👤 Criar usuário, Authorization header:', authHeader);
  
  const { usuario, senha, nome, email, permissions = [], grupos = [] } = req.body;
  
  if (!usuario || !senha || !nome) {
    return res.status(400).json({ success: false, message: 'Campos obrigatórios: usuario, senha, nome' });
  }
  
  // Verificar se usuário já existe
  if (mockUsers.find(u => u.usuario === usuario)) {
    return res.status(400).json({ success: false, message: 'Usuário já existe' });
  }
  
  // Se não há header de autorização, é um cadastro público
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('📝 Cadastro público detectado');
    
    const newUser = {
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      nome,
      usuario,
      email: email || '',
      senha,
      permissions: ['read', 'inscricoes.consultar'], // Permissões básicas para usuário público
      grupos: ['user'],
      created_at: new Date(),
      updated_at: new Date(),
      ativo: true
    };
    
    mockUsers.push(newUser);
    
    // Retornar usuário sem senha
    const { senha: _, ...userResponse } = newUser;
    
    return res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso',
      data: userResponse
    });
  }
  
  // Se há header de autorização, é criação administrativa
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'usuarios.criar')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para criar usuários' });
  }
  
  console.log('👨‍💼 Criação administrativa de usuário');
  
  if (!usuario || !senha || !nome) {
    return res.status(400).json({ success: false, message: 'Campos obrigatórios: usuario, senha, nome' });
  }
  
  // Verificar se usuário já existe
  if (mockUsers.find(u => u.usuario === usuario)) {
    return res.status(400).json({ success: false, message: 'Usuário já existe' });
  }
  
  const newUser = {
    id: Math.max(...mockUsers.map(u => u.id)) + 1,
    nome,
    usuario,
    email: email || '',
    senha,
    permissions,
    grupos,
    created_at: new Date(),
    updated_at: new Date(),
    ativo: true
  };
  
  mockUsers.push(newUser);
  
  // Retornar usuário sem senha
  const { senha: _, ...userResponse } = newUser;
  
  res.status(201).json({
    success: true,
    message: 'Usuário criado com sucesso',
    data: userResponse
  });
});

// Listar Usuários
app.get('/api/usuarios', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('👥 Listar usuários, Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'usuarios.listar')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para listar usuários' });
  }
  
  // Retornar usuários sem senhas
  const users = mockUsers.map(({ senha, ...user }) => user);
  
  res.json({
    success: true,
    data: users
  });
});

// Obter Usuário por ID
app.get('/api/usuarios/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = parseInt(req.params.id);
  console.log(`👤 Buscar usuário ${userId}, Authorization header:`, authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'usuarios.listar')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para visualizar usuários' });
  }
  
  const user = mockUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
  }
  
  // Retornar usuário sem senha
  const { senha, ...userResponse } = user;
  
  res.json({
    success: true,
    data: userResponse
  });
});

// Atualizar Usuário
app.put('/api/usuarios/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = parseInt(req.params.id);
  console.log(`✏️ Atualizar usuário ${userId}, Authorization header:`, authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser) {
    return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
  }

  // Permitir edição se for o próprio usuário OU se tiver permissão de admin
  const isOwnProfile = currentUser.id === userId;
  const hasAdminPermission = hasPermission(currentUser.permissions, 'usuarios.editar');
  
  if (!isOwnProfile && !hasAdminPermission) {
    return res.status(403).json({ success: false, message: 'Sem permissão para editar este usuário' });
  }
  
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
  }
  
  const { usuario, senha, nome, email, permissions, grupos, ativo, grupo } = req.body;
  
  // Verificar se novo nome de usuário já existe (se for diferente do atual)
  if (usuario && usuario !== mockUsers[userIndex].usuario) {
    if (mockUsers.find(u => u.usuario === usuario)) {
      return res.status(400).json({ success: false, message: 'Nome de usuário já existe' });
    }
  }
  
  // Atualizar campos fornecidos
  if (usuario) mockUsers[userIndex].usuario = usuario;
  if (senha) mockUsers[userIndex].senha = senha;
  if (nome) mockUsers[userIndex].nome = nome;
  if (email !== undefined) mockUsers[userIndex].email = email;
  if (permissions) mockUsers[userIndex].permissions = permissions;
  if (grupos) mockUsers[userIndex].grupos = grupos;
  if (grupo) mockUsers[userIndex].grupo = grupo;
  if (ativo !== undefined) mockUsers[userIndex].ativo = ativo;
  
  mockUsers[userIndex].updated_at = new Date();
  
  // Retornar usuário atualizado sem senha
  const { senha: _, ...userResponse } = mockUsers[userIndex];
  
  res.json({
    success: true,
    message: 'Usuário atualizado com sucesso',
    data: userResponse
  });
});

// Deletar Usuário
app.delete('/api/usuarios/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = parseInt(req.params.id);
  console.log(`🗑️ Deletar usuário ${userId}, Authorization header:`, authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'usuarios.deletar')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para deletar usuários' });
  }
  
  // Não permitir deletar a si próprio
  if (currentUser.id === userId) {
    return res.status(400).json({ success: false, message: 'Não é possível deletar o próprio usuário' });
  }
  
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
  }
  
  const deletedUser = mockUsers.splice(userIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'Usuário deletado com sucesso',
    data: {
      id: deletedUser.id,
      usuario: deletedUser.usuario,
      nome: deletedUser.nome
    }
  });
});

// ====== ENDPOINTS DE INSCRIÇÕES ======

// Mock data de inscrições
const mockInscricoes = [
  {
    id: 1,
    email: 'joao@example.com',
    nomeCompleto: 'João Silva',
    dataNascimento: '1990-01-15',
    naturalidade: 'São Paulo',
    sexo: 'Masculino',
    endereco: 'Rua das Flores, 123',
    batizado: true,
    paroquiaBatismo: 'Paróquia São José',
    dioceseBatismo: 'Arquidiocese de São Paulo',
    comunhao: true,
    telefoneWhatsApp: '11999999999',
    emailContato: 'joao@example.com',
    nomePai: 'José Silva',
    nomeMae: 'Maria Silva',
    nomePadrinhoMadrinha: 'Carlos Santos',
    padrinhoCrismado: true,
    dataInicioCurso: '2024-03-01',
    comunidadeCurso: 'São José',
    nomeCatequista: 'Padre João',
    horarioCurso: '14:00-16:00',
    createdAt: '2024-01-01T10:00:00Z'
  }
];

// Criar inscrição
app.post('/api/inscricoes', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('📝 Criar inscrição, Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
  
  const novaInscricao = {
    id: mockInscricoes.length + 1,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  mockInscricoes.push(novaInscricao);
  
  res.json({
    success: true,
    data: novaInscricao,
    message: 'Inscrição criada com sucesso'
  });
});

// Criar inscrição com arquivos
app.post('/api/inscricoes-com-arquivos', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('📎 Criar inscrição com arquivos, Authorization header:', authHeader);
  
  // Para inscrições com arquivos, pode não exigir token (formulário público)
  // if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //   return res.status(401).json({ success: false, message: 'Token não fornecido' });
  // }
  
  const novaInscricao = {
    id: mockInscricoes.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    arquivos: {
      documentoIdentidade: req.files?.documentoIdentidade?.filename || null,
      certidaoBatismo: req.files?.certidaoBatismo?.filename || null
    }
  };
  
  mockInscricoes.push(novaInscricao);
  
  res.json({
    success: true,
    data: novaInscricao,
    message: 'Inscrição com arquivos criada com sucesso'
  });
});

// Consultar inscrições
app.get('/api/inscricoes', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('🔍 Consultar inscrições, Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
  
  // Aplicar filtros se fornecidos
  let inscricoesFiltradas = [...mockInscricoes];
  
  if (req.query.email) {
    inscricoesFiltradas = inscricoesFiltradas.filter(i => 
      i.email?.toLowerCase().includes(req.query.email.toLowerCase())
    );
  }
  
  if (req.query.nomeCompleto) {
    inscricoesFiltradas = inscricoesFiltradas.filter(i => 
      i.nomeCompleto?.toLowerCase().includes(req.query.nomeCompleto.toLowerCase())
    );
  }
  
  if (req.query.comunidadeCurso) {
    inscricoesFiltradas = inscricoesFiltradas.filter(i => 
      i.comunidadeCurso?.toLowerCase().includes(req.query.comunidadeCurso.toLowerCase())
    );
  }
  
  if (req.query.sexo) {
    inscricoesFiltradas = inscricoesFiltradas.filter(i => i.sexo === req.query.sexo);
  }
  
  if (req.query.batizado !== undefined) {
    const isBatizado = req.query.batizado === 'true';
    inscricoesFiltradas = inscricoesFiltradas.filter(i => i.batizado === isBatizado);
  }
  
  res.json(inscricoesFiltradas);
});

// Buscar inscrição por ID
app.get('/api/inscricoes/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log(`🔍 Buscar inscrição ${req.params.id}, Authorization header:`, authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
  
  const inscricao = mockInscricoes.find(i => i.id === parseInt(req.params.id));
  
  if (inscricao) {
    res.json(inscricao);
  } else {
    res.status(404).json({ success: false, message: 'Inscrição não encontrada' });
  }
});

// Atualizar inscrição
app.put('/api/inscricoes/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log(`✏️ Atualizar inscrição ${req.params.id}, Authorization header:`, authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
  
  const index = mockInscricoes.findIndex(i => i.id === parseInt(req.params.id));
  
  if (index !== -1) {
    mockInscricoes[index] = { ...mockInscricoes[index], ...req.body };
    res.json({
      success: true,
      data: mockInscricoes[index],
      message: 'Inscrição atualizada com sucesso'
    });
  } else {
    res.status(404).json({ success: false, message: 'Inscrição não encontrada' });
  }
});

// Excluir inscrição
app.delete('/api/inscricoes/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log(`🗑️ Excluir inscrição ${req.params.id}, Authorization header:`, authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
  
  const index = mockInscricoes.findIndex(i => i.id === parseInt(req.params.id));
  
  if (index !== -1) {
    const inscricaoRemovida = mockInscricoes.splice(index, 1)[0];
    res.json({
      success: true,
      data: inscricaoRemovida,
      message: 'Inscrição excluída com sucesso'
    });
  } else {
    res.status(404).json({ success: false, message: 'Inscrição não encontrada' });
  }
});

// ====== ENDPOINTS DE SPOTS ======

// Mock data de spots
const mockSpots = [
  {
    id: 1,
    titulo: 'Nova Inscrição',
    subtitulo: 'Crisma 2024',
    descricao: 'Cadastre-se agora para o Sacramento da Crisma. Vagas limitadas para o próximo grupo!',
    icone: '📝',
    imagem: null,
    linkTexto: 'Inscrever-se',
    linkUrl: '/inscricao',
    ativo: true,
    ordem: 1,
    tipoSpot: 'acao',
    configuracoes: {
      corFundo: '#4CAF50',
      corTexto: '#ffffff',
      mostrarIcone: true,
      mostrarImagem: false,
      mostrarLink: true
    },
    dataInicio: null,
    dataFim: null,
    dataCriacao: new Date('2024-01-01T10:00:00Z'),
    dataAtualizacao: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: 2,
    titulo: 'Consultar Inscrições',
    subtitulo: 'Área do Candidato',
    descricao: 'Acompanhe o status da sua inscrição, veja documentos pendentes e receba atualizações importantes.',
    icone: '🔍',
    imagem: null,
    linkTexto: 'Consultar',
    linkUrl: '/consulta',
    ativo: false,
    ordem: 2,
    tipoSpot: 'informacao',
    configuracoes: {
      corFundo: '#2196F3',
      corTexto: '#ffffff',
      mostrarIcone: true,
      mostrarImagem: false,
      mostrarLink: true
    },
    dataInicio: null,
    dataFim: null,
    dataCriacao: new Date('2024-01-01T10:00:00Z'),
    dataAtualizacao: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: 3,
    titulo: 'Cronograma de Preparação',
    subtitulo: 'Próximas Atividades',
    descricao: 'Confira as datas dos retiros, encontros e celebrações preparatórias para a Crisma.',
    icone: '📅',
    imagem: null,
    linkTexto: 'Ver Cronograma',
    linkUrl: '/cronograma',
    ativo: true,
    ordem: 3,
    tipoSpot: 'destaque',
    configuracoes: {
      corFundo: '#FF9800',
      corTexto: '#ffffff',
      mostrarIcone: true,
      mostrarImagem: false,
      mostrarLink: true
    },
    dataInicio: null,
    dataFim: null,
    dataCriacao: new Date('2024-01-01T10:00:00Z'),
    dataAtualizacao: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: 4,
    titulo: 'Nossa Comunidade',
    subtitulo: 'Potuvera',
    descricao: 'Conheça a Comunidade Nossa Senhora Aparecida e participe de nossas atividades pastorais.',
    icone: '⛪',
    imagem: null,
    linkTexto: 'Saiba Mais',
    linkUrl: '/comunidade',
    ativo: true,
    ordem: 4,
    tipoSpot: 'promocional',
    configuracoes: {
      corFundo: '#9C27B0',
      corTexto: '#ffffff',
      mostrarIcone: true,
      mostrarImagem: false,
      mostrarLink: true
    },
    dataInicio: null,
    dataFim: null,
    dataCriacao: new Date('2024-01-01T10:00:00Z'),
    dataAtualizacao: new Date('2024-01-01T10:00:00Z')
  }
];

// Buscar spots ativos (público)
app.get('/api/spots/ativos', (req, res) => {
  console.log('🎯 Buscar spots ativos');
  
  const now = new Date();
  console.log('📅 Data atual:', now);
  
  console.log('📊 Total de spots no mock:', mockSpots.length);
  mockSpots.forEach((spot, index) => {
    console.log(`   ${index + 1}. ID:${spot.id} - "${spot.titulo}" - Ativo:${spot.ativo} - Ordem:${spot.ordem}`);
  });
  
  const spotsAtivos = mockSpots.filter(spot => {
    console.log(`🔍 Analisando spot ID:${spot.id} - "${spot.titulo}":`);
    
    // Filtrar por status ativo
    if (!spot.ativo) {
      console.log('   ❌ Rejeitado: ativo = false');
      return false;
    } else {
      console.log('   ✅ Aprovado: ativo = true');
    }
    
    // Filtrar por data de vigência
    if (spot.dataInicio && new Date(spot.dataInicio) > now) {
      console.log('   ❌ Rejeitado: data de início ainda não chegou');
      return false;
    }
    if (spot.dataFim && new Date(spot.dataFim) < now) {
      console.log('   ❌ Rejeitado: data de fim já passou');
      return false;
    }
    
    console.log('   ✅ Aprovado: passa em todos os filtros');
    return true;
  }).sort((a, b) => a.ordem - b.ordem);
  
  console.log(`📋 Resultado: ${spotsAtivos.length} spots ativos de ${mockSpots.length} total`);
  spotsAtivos.forEach((spot, index) => {
    console.log(`   ${index + 1}. ID:${spot.id} - "${spot.titulo}" - Ordem:${spot.ordem}`);
  });
  
  res.json({
    success: true,
    data: spotsAtivos
  });
});

// Buscar todos os spots (admin)
app.get('/api/spots/admin', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('🎯 Buscar todos os spots, Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'admin')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para gerenciar spots' });
  }
  
  const spotsOrdenados = mockSpots.sort((a, b) => a.ordem - b.ordem);
  
  res.json({
    success: true,
    data: spotsOrdenados
  });
});

// Buscar spot por ID (admin)
app.get('/api/spots/admin/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  const spotId = parseInt(req.params.id);
  console.log(`🎯 Buscar spot ${spotId}, Authorization header:`, authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'admin')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para visualizar spots' });
  }
  
  const spot = mockSpots.find(s => s.id === spotId);
  
  if (!spot) {
    return res.status(404).json({ success: false, message: 'Spot não encontrado' });
  }
  
  res.json({
    success: true,
    data: spot
  });
});

// Criar spot
app.post('/api/spots/admin', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('🎯 Criar spot, Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'admin')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para criar spots' });
  }
  
  const { titulo, subtitulo, descricao, icone, imagem, linkTexto, linkUrl, ativo, ordem, tipoSpot, configuracoes, dataInicio, dataFim } = req.body;
  
  if (!titulo || !descricao || !tipoSpot) {
    return res.status(400).json({ success: false, message: 'Campos obrigatórios: titulo, descricao, tipoSpot' });
  }
  
  const novoSpot = {
    id: Math.max(...mockSpots.map(s => s.id)) + 1,
    titulo,
    subtitulo: subtitulo || null,
    descricao,
    icone: icone || null,
    imagem: imagem || null,
    linkTexto: linkTexto || null,
    linkUrl: linkUrl || null,
    ativo: ativo !== undefined ? ativo : true,
    ordem: ordem || mockSpots.length + 1,
    tipoSpot,
    configuracoes: configuracoes || {},
    dataInicio: dataInicio ? new Date(dataInicio) : null,
    dataFim: dataFim ? new Date(dataFim) : null,
    dataCriacao: new Date(),
    dataAtualizacao: new Date()
  };
  
  mockSpots.push(novoSpot);
  
  res.status(201).json({
    success: true,
    data: novoSpot,
    message: 'Spot criado com sucesso'
  });
});

// Atualizar spot
app.put('/api/spots/admin/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  const spotId = parseInt(req.params.id);
  console.log(`🎯 Atualizar spot ${spotId}, Authorization header:`, authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'admin')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para atualizar spots' });
  }
  
  const spotIndex = mockSpots.findIndex(s => s.id === spotId);
  
  if (spotIndex === -1) {
    return res.status(404).json({ success: false, message: 'Spot não encontrado' });
  }
  
  const { titulo, subtitulo, descricao, icone, imagem, linkTexto, linkUrl, ativo, ordem, tipoSpot, configuracoes, dataInicio, dataFim, link_texto, link_url, tipo_spot } = req.body;
  
  console.log('📦 Dados recebidos no PUT:', req.body);
  console.log('🔗 linkUrl:', linkUrl, '| link_url:', link_url);
  console.log('📝 linkTexto:', linkTexto, '| link_texto:', link_texto);
  console.log('🏷️ tipoSpot:', tipoSpot, '| tipo_spot:', tipo_spot);
  
  // Atualizar campos fornecidos - suportar ambos os formatos (camelCase e snake_case)
  if (titulo) mockSpots[spotIndex].titulo = titulo;
  if (subtitulo !== undefined) mockSpots[spotIndex].subtitulo = subtitulo;
  if (descricao) mockSpots[spotIndex].descricao = descricao;
  if (icone !== undefined) mockSpots[spotIndex].icone = icone;
  if (imagem !== undefined) mockSpots[spotIndex].imagem = imagem;
  if (linkTexto !== undefined || link_texto !== undefined) {
    mockSpots[spotIndex].linkTexto = linkTexto !== undefined ? linkTexto : link_texto;
  }
  if (linkUrl !== undefined || link_url !== undefined) {
    mockSpots[spotIndex].linkUrl = linkUrl !== undefined ? linkUrl : link_url;
  }
  if (ativo !== undefined) mockSpots[spotIndex].ativo = ativo;
  if (ordem !== undefined) mockSpots[spotIndex].ordem = ordem;
  if (tipoSpot || tipo_spot) {
    mockSpots[spotIndex].tipoSpot = tipoSpot || tipo_spot;
  }
  if (configuracoes) mockSpots[spotIndex].configuracoes = configuracoes;
  if (dataInicio !== undefined) mockSpots[spotIndex].dataInicio = dataInicio ? new Date(dataInicio) : null;
  if (dataFim !== undefined) mockSpots[spotIndex].dataFim = dataFim ? new Date(dataFim) : null;
  
  mockSpots[spotIndex].dataAtualizacao = new Date();
  
  res.json({
    success: true,
    data: mockSpots[spotIndex],
    message: 'Spot atualizado com sucesso'
  });
});

// Deletar spot
app.delete('/api/spots/admin/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  const spotId = parseInt(req.params.id);
  console.log(`🎯 Deletar spot ${spotId}, Authorization header:`, authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'admin')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para deletar spots' });
  }
  
  const spotIndex = mockSpots.findIndex(s => s.id === spotId);
  
  if (spotIndex === -1) {
    return res.status(404).json({ success: false, message: 'Spot não encontrado' });
  }
  
  const spotDeletado = mockSpots.splice(spotIndex, 1)[0];
  
  res.json({
    success: true,
    data: {
      id: spotDeletado.id,
      titulo: spotDeletado.titulo
    },
    message: 'Spot deletado com sucesso'
  });
});

// Ativar/Desativar spot
app.patch('/api/spots/admin/:id/status', (req, res) => {
  const authHeader = req.headers.authorization;
  const spotId = parseInt(req.params.id);
  console.log(`🎯 Toggle status spot ${spotId}, Authorization header:`, authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'admin')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para alterar status de spots' });
  }
  
  const spotIndex = mockSpots.findIndex(s => s.id === spotId);
  
  if (spotIndex === -1) {
    return res.status(404).json({ success: false, message: 'Spot não encontrado' });
  }
  
  const { ativo } = req.body;
  
  if (ativo === undefined) {
    return res.status(400).json({ success: false, message: 'Campo ativo é obrigatório' });
  }
  
  mockSpots[spotIndex].ativo = ativo;
  mockSpots[spotIndex].dataAtualizacao = new Date();
  
  res.json({
    success: true,
    data: mockSpots[spotIndex],
    message: `Spot ${ativo ? 'ativado' : 'desativado'} com sucesso`
  });
});

// Reordenar spots
app.post('/api/spots/admin/reordenar', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('🎯 Reordenar spots, Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const currentUser = getUserFromToken(token);
  if (!currentUser || !hasPermission(currentUser.permissions, 'admin')) {
    return res.status(403).json({ success: false, message: 'Sem permissão para reordenar spots' });
  }
  
  const { spots } = req.body;
  
  if (!Array.isArray(spots)) {
    return res.status(400).json({ success: false, message: 'Campo spots deve ser um array' });
  }
  
  // Atualizar ordem dos spots
  spots.forEach(({ id, ordem }) => {
    const spotIndex = mockSpots.findIndex(s => s.id === id);
    if (spotIndex !== -1) {
      mockSpots[spotIndex].ordem = ordem;
      mockSpots[spotIndex].dataAtualizacao = new Date();
    }
  });
  
  const spotsOrdenados = mockSpots.sort((a, b) => a.ordem - b.ordem);
  
  res.json({
    success: true,
    data: spotsOrdenados,
    message: 'Spots reordenados com sucesso'
  });
});

// ====== OUTROS ENDPOINTS ======

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!', timestamp: new Date().toISOString() });
});

// Catch all para APIs não encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Endpoint não encontrado: ${req.originalUrl}` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server rodando em http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log('');
  console.log('👥 Usuários de teste:');
  console.log('   admin/password - Administrador');
  console.log('   catequista/password - Catequista');
  console.log('   user/password - Usuário');
});

module.exports = app;