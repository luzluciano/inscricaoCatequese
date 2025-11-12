-- Tabela para gerenciar os spots da home2
CREATE TABLE spots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255),
    descricao TEXT NOT NULL,
    icone VARCHAR(50),
    imagem VARCHAR(500),
    link_texto VARCHAR(100),
    link_url VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    ordem INT NOT NULL DEFAULT 0,
    tipo_spot ENUM('informacao', 'acao', 'destaque', 'promocional') NOT NULL DEFAULT 'informacao',
    
    -- Configurações do spot (JSON)
    configuracoes JSON,
    
    -- Datas de vigência
    data_inicio DATETIME,
    data_fim DATETIME,
    
    -- Timestamps
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_ativo_ordem (ativo, ordem),
    INDEX idx_tipo_spot (tipo_spot),
    INDEX idx_vigencia (data_inicio, data_fim)
);

-- Inserir dados de exemplo
INSERT INTO spots (titulo, subtitulo, descricao, icone, link_texto, link_url, ativo, ordem, tipo_spot, configuracoes) VALUES 
(
    'Nova Inscrição',
    'Crisma 2024',
    'Cadastre-se agora para o Sacramento da Crisma. Vagas limitadas para o próximo grupo!',
    '📝',
    'Inscrever-se',
    '/inscricao',
    TRUE,
    1,
    'acao',
    JSON_OBJECT(
        'corFundo', '#4CAF50',
        'corTexto', '#ffffff',
        'mostrarIcone', true,
        'mostrarLink', true
    )
),
(
    'Consultar Inscrições',
    'Área do Candidato',
    'Acompanhe o status da sua inscrição, veja documentos pendentes e receba atualizações.',
    '🔍',
    'Consultar',
    '/consulta',
    TRUE,
    2,
    'informacao',
    JSON_OBJECT(
        'corFundo', '#2196F3',
        'corTexto', '#ffffff',
        'mostrarIcone', true,
        'mostrarLink', true
    )
),
(
    'Cronograma de Preparação',
    'Próximas Atividades',
    'Confira as datas dos retiros, encontros e celebrações preparatórias para a Crisma.',
    '📅',
    'Ver Cronograma',
    '/cronograma',
    TRUE,
    3,
    'destaque',
    JSON_OBJECT(
        'corFundo', '#FF9800',
        'corTexto', '#ffffff',
        'mostrarIcone', true,
        'mostrarLink', true
    )
),
(
    'Nossa Comunidade',
    'Potuvera',
    'Conheça a Comunidade Nossa Senhora Aparecida e participe de nossas atividades pastorais.',
    '⛪',
    'Saiba Mais',
    '/comunidade',
    TRUE,
    4,
    'promocional',
    JSON_OBJECT(
        'corFundo', '#9C27B0',
        'corTexto', '#ffffff',
        'mostrarIcone', true,
        'mostrarLink', true
    )
);

-- Tabela de auditoria para spots (opcional - para histórico de mudanças)
CREATE TABLE spots_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spot_id INT NOT NULL,
    acao ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    dados_anteriores JSON,
    dados_novos JSON,
    usuario_id INT,
    data_acao DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_spot_id (spot_id),
    INDEX idx_data_acao (data_acao)
);

-- Trigger para auditoria (opcional)
DELIMITER $$

CREATE TRIGGER spots_audit_update
AFTER UPDATE ON spots
FOR EACH ROW
BEGIN
    INSERT INTO spots_auditoria (spot_id, acao, dados_anteriores, dados_novos)
    VALUES (
        NEW.id,
        'UPDATE',
        JSON_OBJECT(
            'titulo', OLD.titulo,
            'subtitulo', OLD.subtitulo,
            'descricao', OLD.descricao,
            'ativo', OLD.ativo,
            'ordem', OLD.ordem,
            'tipo_spot', OLD.tipo_spot
        ),
        JSON_OBJECT(
            'titulo', NEW.titulo,
            'subtitulo', NEW.subtitulo,
            'descricao', NEW.descricao,
            'ativo', NEW.ativo,
            'ordem', NEW.ordem,
            'tipo_spot', NEW.tipo_spot
        )
    );
END$$

CREATE TRIGGER spots_audit_delete
AFTER DELETE ON spots
FOR EACH ROW
BEGIN
    INSERT INTO spots_auditoria (spot_id, acao, dados_anteriores)
    VALUES (
        OLD.id,
        'DELETE',
        JSON_OBJECT(
            'titulo', OLD.titulo,
            'subtitulo', OLD.subtitulo,
            'descricao', OLD.descricao,
            'ativo', OLD.ativo,
            'ordem', OLD.ordem,
            'tipo_spot', OLD.tipo_spot
        )
    );
END$$

DELIMITER ;

-- Consultas úteis para gerenciar os spots:

-- Buscar spots ativos ordenados
-- SELECT * FROM spots WHERE ativo = TRUE ORDER BY ordem ASC;

-- Buscar spots por tipo
-- SELECT * FROM spots WHERE tipo_spot = 'acao' AND ativo = TRUE;

-- Buscar spots dentro da vigência
-- SELECT * FROM spots 
-- WHERE ativo = TRUE 
-- AND (data_inicio IS NULL OR data_inicio <= NOW()) 
-- AND (data_fim IS NULL OR data_fim >= NOW())
-- ORDER BY ordem ASC;

-- Reordenar spots
-- UPDATE spots SET ordem = CASE id
--     WHEN 1 THEN 1
--     WHEN 2 THEN 2
--     WHEN 3 THEN 3
--     WHEN 4 THEN 4
-- END
-- WHERE id IN (1, 2, 3, 4);