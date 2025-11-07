// ===================================================================
// INTEGRAÇÃO COM BACKEND - SISTEMA DE CATEQUESE
// Extensão do backend existente para suportar autenticação e permissões
// ===================================================================

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// ===== MIDDLEWARE DE AUTENTICAÇÃO =====

/**
 * Middleware para verificar token JWT
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso não fornecido'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware para verificar permissões específicas
 */
function requirePermission(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Permissão insuficiente'
      });
    }

    next();
  };
}

/**
 * Middleware para verificar grupos
 */
function requireGroup(groups) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const userGroups = req.user.grupos || [];
    const belongsToGroup = groups.some(group => 
      userGroups.includes(group)
    );

    if (!belongsToGroup) {
      return res.status(403).json({
        success: false,
        message: 'Acesso restrito ao grupo'
      });
    }

    next();
  };
}

// ===== ROTAS DE AUTENTICAÇÃO =====

/**
 * POST /api/auth/login
 * Realizar login do usuário
 */
async function loginUser(req, res) {
  try {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Usuário e senha são obrigatórios'
      });
    }

    // Buscar usuário no banco de dados
    const query = `
      SELECT u.*, 
             ARRAY_AGG(DISTINCT up.permission) as permissions,
             ARRAY_AGG(DISTINCT ug.grupo) as grupos
      FROM usuarios u
      LEFT JOIN usuario_permissions up ON u.id = up.usuario_id
      LEFT JOIN usuario_grupos ug ON u.id = ug.usuario_id
      WHERE u.usuario = $1 AND u.ativo = true
      GROUP BY u.id
    `;

    const result = await pool.query(query, [usuario]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      // Log tentativa de login falhada
      await logLoginAttempt(usuario, false, req.ip);
      
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    // Gerar token JWT
    const tokenPayload = {
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      email: user.email,
      permissions: user.permissions.filter(p => p !== null),
      grupos: user.grupos.filter(g => g !== null)
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Atualizar último login
    await pool.query(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Log login bem-sucedido
    await logLoginAttempt(usuario, true, req.ip);

    // Remover senha do objeto antes de retornar
    delete user.senha_hash;

    res.json({
      success: true,
      data: {
        token,
        usuario: tokenPayload
      },
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

/**
 * POST /api/auth/logout
 * Realizar logout (opcional - pode ser usado para blacklist de tokens)
 */
async function logoutUser(req, res) {
  try {
    // Opcional: adicionar token a blacklist
    // await addTokenToBlacklist(req.headers.authorization);

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

/**
 * GET /api/auth/validate
 * Validar token atual
 */
function validateToken(req, res) {
  res.json({
    success: true,
    valid: true,
    user: req.user
  });
}

/**
 * PUT /api/auth/profile
 * Atualizar perfil do usuário
 */
async function updateProfile(req, res) {
  try {
    const { nome, email } = req.body;
    const userId = req.user.id;

    const query = `
      UPDATE usuarios 
      SET nome = COALESCE($1, nome), 
          email = COALESCE($2, email),
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, nome, usuario, email
    `;

    const result = await pool.query(query, [nome, email, userId]);
    const updatedUser = result.rows[0];

    res.json({
      success: true,
      data: updatedUser,
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

/**
 * POST /api/auth/change-password
 * Alterar senha do usuário
 */
async function changePassword(req, res) {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const userId = req.user.id;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar senha atual do usuário
    const userResult = await pool.query(
      'SELECT senha_hash FROM usuarios WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Hash da nova senha
    const saltRounds = 10;
    const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

    // Atualizar senha
    await pool.query(
      'UPDATE usuarios SET senha_hash = $1, updated_at = NOW() WHERE id = $2',
      [novaSenhaHash, userId]
    );

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// ===== ROTAS DE GESTÃO DE USUÁRIOS =====

/**
 * GET /api/usuarios
 * Listar usuários (requer permissão usuarios.listar)
 */
async function listUsers(req, res) {
  try {
    const query = `
      SELECT u.id, u.nome, u.usuario, u.email, u.ativo, u.created_at,
             ARRAY_AGG(DISTINCT up.permission) FILTER (WHERE up.permission IS NOT NULL) as permissions,
             ARRAY_AGG(DISTINCT ug.grupo) FILTER (WHERE ug.grupo IS NOT NULL) as grupos
      FROM usuarios u
      LEFT JOIN usuario_permissions up ON u.id = up.usuario_id
      LEFT JOIN usuario_grupos ug ON u.id = ug.usuario_id
      GROUP BY u.id
      ORDER BY u.nome
    `;

    const result = await pool.query(query);
    const users = result.rows.map(user => ({
      ...user,
      permissions: user.permissions || [],
      grupos: user.grupos || []
    }));

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

/**
 * POST /api/usuarios
 * Criar novo usuário (requer permissão usuarios.criar)
 */
async function createUser(req, res) {
  try {
    const { nome, usuario, senha, email, permissions = [], grupos = [] } = req.body;

    if (!nome || !usuario || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Nome, usuário e senha são obrigatórios'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE usuario = $1',
      [usuario]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Nome de usuário já está em uso'
      });
    }

    // Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // Começar transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Criar usuário
      const userResult = await client.query(
        `INSERT INTO usuarios (nome, usuario, email, senha_hash, ativo, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         RETURNING id, nome, usuario, email, ativo`,
        [nome, usuario, email, senhaHash]
      );

      const newUser = userResult.rows[0];

      // Adicionar permissões
      for (const permission of permissions) {
        await client.query(
          'INSERT INTO usuario_permissions (usuario_id, permission) VALUES ($1, $2)',
          [newUser.id, permission]
        );
      }

      // Adicionar grupos
      for (const grupo of grupos) {
        await client.query(
          'INSERT INTO usuario_grupos (usuario_id, grupo) VALUES ($1, $2)',
          [newUser.id, grupo]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: {
          ...newUser,
          permissions,
          grupos
        },
        message: 'Usuário criado com sucesso'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

/**
 * DELETE /api/usuarios/:id
 * Deletar usuário (requer permissão usuarios.deletar)
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Não permitir deletar próprio usuário
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar seu próprio usuário'
      });
    }

    // Começar transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Deletar permissões e grupos do usuário
      await client.query('DELETE FROM usuario_permissions WHERE usuario_id = $1', [id]);
      await client.query('DELETE FROM usuario_grupos WHERE usuario_id = $1', [id]);

      // Deletar usuário
      const result = await client.query('DELETE FROM usuarios WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Usuário deletado com sucesso'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// ===== FUNÇÕES AUXILIARES =====

/**
 * Log de tentativas de login
 */
async function logLoginAttempt(usuario, sucesso, ip) {
  try {
    await pool.query(
      `INSERT INTO login_attempts (usuario, sucesso, ip_address, timestamp)
       VALUES ($1, $2, $3, NOW())`,
      [usuario, sucesso, ip]
    );
  } catch (error) {
    console.error('Erro ao registrar tentativa de login:', error);
  }
}

// ===== EXTENSÃO DO SERVIDOR EXISTENTE =====

/**
 * Função para integrar as rotas de autenticação ao servidor existente
 */
function setupAuthRoutes(app, database) {
  // Configurar pool de conexão
  global.pool = database;

  // Rotas de autenticação (não protegidas)
  app.post('/api/auth/login', loginUser);
  app.post('/api/auth/logout', authenticateToken, logoutUser);
  app.get('/api/auth/validate', authenticateToken, validateToken);
  app.put('/api/auth/profile', authenticateToken, updateProfile);
  app.post('/api/auth/change-password', authenticateToken, changePassword);

  // Rotas de gestão de usuários (protegidas)
  app.get('/api/usuarios', 
    authenticateToken, 
    requirePermission(['usuarios.listar']), 
    listUsers
  );
  
  app.post('/api/usuarios', 
    authenticateToken, 
    requirePermission(['usuarios.criar']), 
    createUser
  );
  
  app.delete('/api/usuarios/:id', 
    authenticateToken, 
    requirePermission(['usuarios.deletar']), 
    deleteUser
  );

  // Proteger rotas existentes de inscrições
  app.use('/api/inscricoes', authenticateToken);
  
  // Adicionar verificação de permissões específicas
  app.post('/api/inscricoes', requirePermission(['inscricoes.criar']));
  app.get('/api/inscricoes', requirePermission(['inscricoes.consultar']));
  app.put('/api/inscricoes/:id', requirePermission(['inscricoes.editar']));
  app.delete('/api/inscricoes/:id', requirePermission(['inscricoes.deletar']));

  console.log('✅ Rotas de autenticação configuradas com sucesso');
}

// ===== SQL PARA CRIAR TABELAS =====
const createAuthTables = `
-- Tabela de usuários (estende ou substitui a existente)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    senha_hash TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de permissões de usuários
CREATE TABLE IF NOT EXISTS usuario_permissions (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    UNIQUE(usuario_id, permission)
);

-- Tabela de grupos de usuários
CREATE TABLE IF NOT EXISTS usuario_grupos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    grupo VARCHAR(100) NOT NULL,
    UNIQUE(usuario_id, grupo)
);

-- Tabela de tentativas de login
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    sucesso BOOLEAN NOT NULL,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuario_permissions_usuario_id ON usuario_permissions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_grupos_usuario_id ON usuario_grupos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_usuario ON login_attempts(usuario);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(timestamp);

-- Usuário administrador padrão (senha: admin123)
INSERT INTO usuarios (nome, usuario, email, senha_hash, ativo) 
VALUES (
    'Administrador',
    'admin',
    'admin@catequese.com',
    '$2b$10$TKh.ZXuQ5Z1YjZWvYzS2l.xdV6nI4nEHdKvI5gJyNnXl1U8vQ5K.',
    true
) ON CONFLICT (usuario) DO NOTHING;

-- Permissões para o administrador
INSERT INTO usuario_permissions (usuario_id, permission) 
SELECT id, unnest(ARRAY[
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
]) as permission
FROM usuarios WHERE usuario = 'admin'
ON CONFLICT DO NOTHING;

-- Grupo para o administrador
INSERT INTO usuario_grupos (usuario_id, grupo)
SELECT id, 'administradores'
FROM usuarios WHERE usuario = 'admin'
ON CONFLICT DO NOTHING;
`;

// Exportar para uso em outros módulos
module.exports = {
  setupAuthRoutes,
  authenticateToken,
  requirePermission,
  requireGroup,
  createAuthTables,
  JWT_SECRET
};

// ===== EXEMPLO DE USO NO BACKEND EXISTENTE =====
/*
// No arquivo backend-server.js ou similar:

const { setupAuthRoutes, createAuthTables } = require('./auth-integration');

// Depois de configurar o banco de dados:
async function initializeServer() {
  // ... código existente ...
  
  // Executar SQL para criar tabelas de autenticação
  await pool.query(createAuthTables);
  
  // Configurar rotas de autenticação
  setupAuthRoutes(app, pool);
  
  // ... resto do código ...
}
*/