# Sistema de Spots para Home2

## Visão Geral

O sistema de spots permite gerenciar o conteúdo dinâmico da página `home2`, dividindo o layout em 4 áreas configuráveis que podem ser administradas via banco de dados.

## Estrutura

### 🏗️ Componentes

1. **Home2Component** (`/src/app/home2/`)
   - Página principal com layout dividido em 4 áreas de spots
   - Renderização dinâmica do conteúdo baseado no banco de dados
   - Design responsivo e acessível

2. **AdminSpotsComponent** (`/src/app/admin-spots/`)
   - Interface de administração para gerenciar spots
   - CRUD completo (Criar, Ler, Atualizar, Deletar)
   - Reordenação e controle de status

3. **SpotService** (`/src/app/services/spot.service.ts`)
   - Serviço para comunicação com a API
   - Métodos para todas as operações de spots
   - Fallback para dados mock em desenvolvimento

4. **Spot Model** (`/src/app/model/spot.model.ts`)
   - Interface TypeScript para tipagem dos spots
   - Configurações de visual e comportamento

### 🗄️ Banco de Dados

**Tabela: `spots`**
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- titulo (VARCHAR(255), NOT NULL)
- subtitulo (VARCHAR(255))
- descricao (TEXT, NOT NULL)
- icone (VARCHAR(50)) -- Emoji ou classe CSS
- imagem (VARCHAR(500)) -- URL da imagem
- link_texto (VARCHAR(100))
- link_url (VARCHAR(500))
- ativo (BOOLEAN, DEFAULT TRUE)
- ordem (INT, NOT NULL)
- tipo_spot (ENUM: 'informacao', 'acao', 'destaque', 'promocional')
- configuracoes (JSON) -- Cores, mostrar/ocultar elementos
- data_inicio (DATETIME) -- Opcional: data de início da vigência
- data_fim (DATETIME) -- Opcional: data de fim da vigência
- data_criacao (DATETIME)
- data_atualizacao (DATETIME)
```

### 🛣️ Rotas

- `/home2` - Página inicial com spots (pública)
- `/admin/spots` - Administração de spots (requer permissão de admin)

### 🎨 Tipos de Spot

1. **Informação** (`informacao`) - Cor azul (#2196F3)
   - Para conteúdo informativo
   - Ex: Consultar inscrições, cronogramas

2. **Ação** (`acao`) - Cor verde (#4CAF50)
   - Para ações principais
   - Ex: Nova inscrição, cadastros

3. **Destaque** (`destaque`) - Cor laranja (#FF9800)
   - Para conteúdo em destaque
   - Ex: Eventos importantes, avisos

4. **Promocional** (`promocional`) - Cor roxa (#9C27B0)
   - Para promoções e divulgações
   - Ex: Conhecer comunidade, atividades

## 🚀 Como Usar

### Acessar a Página Home2
```
http://localhost:4200/home2
```

### Administrar Spots
1. Fazer login como administrador
2. Acessar `/admin/spots`
3. Criar, editar, reordenar ou deletar spots
4. Configurar cores, ícones e links
5. Ativar/desativar spots conforme necessário

### Configurações Visuais
Cada spot pode ter:
- **Cor de fundo**: Personalizada via color picker
- **Cor do texto**: Personalizada via color picker
- **Mostrar ícone**: Checkbox para exibir/ocultar
- **Mostrar link**: Checkbox para exibir/ocultar

### Vigência (Opcional)
- **Data início**: Spot só aparece após esta data
- **Data fim**: Spot desaparece após esta data
- Se não definidas, o spot será exibido sempre (se ativo)

## 🔧 Desenvolvimento

### Executar API Backend
```bash
node backend-server.js
```

### Executar Frontend Angular
```bash
npm run dev
```

### Endpoints da API

#### 🌐 Públicos
- `GET /api/spots/ativos` - Buscar spots ativos

#### 🔒 Administrativos (requer autenticação e permissão 'admin')

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/spots/admin` | Lista todos os spots (incluindo inativos) |
| `GET` | `/api/spots/admin/:id` | Busca um spot específico por ID |
| `POST` | `/api/spots/admin` | Cria um novo spot |
| `PUT` | `/api/spots/admin/:id` | Atualiza um spot existente |
| `DELETE` | `/api/spots/admin/:id` | Exclui um spot |
| `PATCH` | `/api/spots/admin/:id/status` | Alterna status ativo/inativo de um spot |
| `POST` | `/api/spots/admin/reordenar` | Reordena múltiplos spots |

### Exemplo de Requisição

**Criar Spot:**
```json
POST /api/spots/admin
{
  "titulo": "Nova Inscrição",
  "subtitulo": "Crisma 2024",
  "descricao": "Cadastre-se agora para o Sacramento da Crisma",
  "icone": "📝",
  "linkTexto": "Inscrever-se",
  "linkUrl": "/inscricao",
  "ativo": true,
  "ordem": 1,
  "tipoSpot": "acao",
  "configuracoes": {
    "corFundo": "#4CAF50",
    "corTexto": "#ffffff",
    "mostrarIcone": true,
    "mostrarLink": true
  }
}
```

**Buscar Spot por ID:**
```json
GET /api/spots/admin/1
Response:
{
  "success": true,
  "data": {
    "id": 1,
    "titulo": "Nova Inscrição",
    "subtitulo": "Crisma 2024",
    ...
  }
}
```

**Reordenar Spots:**
```json
POST /api/spots/admin/reordenar
{
  "spots": [
    {"id": 1, "ordem": 2},
    {"id": 2, "ordem": 1},
    {"id": 3, "ordem": 3},
    {"id": 4, "ordem": 4}
  ]
}
```

## 📱 Layout Responsivo

O sistema é totalmente responsivo:
- **Desktop**: Grid de 2x2 (4 spots)
- **Tablet**: Grid de 2x2 ou coluna única
- **Mobile**: Coluna única

## 🔐 Segurança

- Endpoints administrativos protegidos por autenticação
- Validação de permissões (role 'admin')
- Sanitização de dados de entrada
- Proteção contra XSS nos textos

## 🎯 Funcionalidades Futuras

- [ ] Upload de imagens para spots
- [ ] Templates pré-definidos
- [ ] Estatísticas de cliques
- [ ] Agendamento de publicação
- [ ] Previsualização antes de publicar
- [ ] Histórico de alterações (auditoria)
- [ ] Spots condicionais (baseados no usuário)

## 📊 Monitoramento

O sistema inclui:
- Logs de operações no backend
- Estados de loading/error no frontend
- Fallback para dados mock em desenvolvimento
- Tratamento de erros de conectividade

## 🛠️ Manutenção

### Backup dos Spots
```sql
-- Backup
SELECT * FROM spots ORDER BY ordem;

-- Restaurar ordem após problemas
UPDATE spots SET ordem = (@row_number:=@row_number+1) 
WHERE (@row_number:=0)=0 
ORDER BY id;
```

### Verificar Spots Ativos
```sql
SELECT titulo, ativo, ordem, tipo_spot 
FROM spots 
WHERE ativo = TRUE 
ORDER BY ordem;
```