CREATE DATABASE IF NOT EXISTS senai_parking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE senai_parking;

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    cpf CHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    cargo VARCHAR(50) DEFAULT 'Usuário',
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE marcas (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    nome_marca VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE modelos (
    id_modelo INT AUTO_INCREMENT PRIMARY KEY,
    id_marca INT NOT NULL,
    nome_modelo VARCHAR(80) NOT NULL,
    CONSTRAINT fk_modelos_marca FOREIGN KEY (id_marca) REFERENCES marcas(id_marca)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_modelo_marca (id_marca, nome_modelo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE veiculos (
    id_veiculo INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_modelo INT NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    cor VARCHAR(30) NOT NULL,
    ano YEAR NOT NULL,
    status ENUM('ativo','inativo') DEFAULT 'ativo',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_veiculos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_veiculos_modelo FOREIGN KEY (id_modelo) REFERENCES modelos(id_modelo)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vagas (
    id_vaga INT AUTO_INCREMENT PRIMARY KEY,
    codigo_vaga VARCHAR(10) NOT NULL UNIQUE,
    bloco VARCHAR(10) NOT NULL,
    status ENUM('disponivel','ocupada','agendada','manutencao') NOT NULL DEFAULT 'disponivel',
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    observacao TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE agendamentos (
    id_agendamento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_veiculo INT NOT NULL,
    id_vaga INT NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    status ENUM('agendado','confirmado','cancelado','concluido','faltou') NOT NULL DEFAULT 'agendado',
    observacao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agendamentos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_agendamentos_veiculo FOREIGN KEY (id_veiculo) REFERENCES veiculos(id_veiculo)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_agendamentos_vaga FOREIGN KEY (id_vaga) REFERENCES vagas(id_vaga)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    KEY idx_agendamento_usuario (id_usuario),
    KEY idx_agendamento_data (data_inicio, data_fim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sancoes (
    id_sancao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_agendamento INT NULL,
    tipo ENUM('nao_compareceu','vaga_indevida','reserva_abusiva','outros') NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('pendente','paga','cancelada') NOT NULL DEFAULT 'pendente',
    data_sancao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sancoes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sancoes_agendamento FOREIGN KEY (id_agendamento) REFERENCES agendamentos(id_agendamento)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pagamentos (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_agendamento INT NULL,
    id_sancao INT NULL,
    valor DECIMAL(10,2) NOT NULL,
    metodo ENUM('dinheiro','pix','cartao','boleto') NOT NULL,
    status ENUM('pendente','pago','cancelado') NOT NULL DEFAULT 'pendente',
    data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagamentos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pagamentos_agendamento FOREIGN KEY (id_agendamento) REFERENCES agendamentos(id_agendamento)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pagamentos_sancao FOREIGN KEY (id_sancao) REFERENCES sancoes(id_sancao)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO marcas (id_marca, nome_marca) VALUES
(1, 'Toyota'),
(2, 'Volkswagen'),
(3, 'Chevrolet'),
(4, 'Fiat'),
(5, 'Honda'),
(6, 'Hyundai'),
(7, 'Ford'),
(8, 'Nissan'),
(9, 'Renault'),
(10, 'Jeep'),
(11, 'Peugeot'),
(12, 'Citroën'),
(13, 'Mitsubishi'),
(14, 'Kia'),
(15, 'BMW');

INSERT INTO modelos (id_modelo, id_marca, nome_modelo) VALUES
(1, 1, 'Corolla'),
(2, 1, 'Hilux'),
(3, 1, 'Yaris'),
(4, 2, 'Gol'),
(5, 2, 'Polo'),
(6, 2, 'T-Cross'),
(7, 3, 'Onix'),
(8, 3, 'Spin'),
(9, 3, 'Tracker'),
(10, 4, 'Uno'),
(11, 4, 'Argo'),
(12, 4, 'Cronos'),
(13, 5, 'Civic'),
(14, 5, 'Fit'),
(15, 5, 'HR-V'),
(16, 6, 'Hb20'),
(17, 6, 'Creta'),
(18, 6, 'Elantra'),
(19, 7, 'Ka'),
(20, 7, 'Focus'),
(21, 7, 'Ranger'),
(22, 8, 'March'),
(23, 8, 'Versa'),
(24, 8, 'Frontier'),
(25, 9, 'Clio'),
(26, 9, 'Logan'),
(27, 9, 'Kwid'),
(28, 10, 'Compass'),
(29, 10, 'Renegade'),
(30, 11, '208'),
(31, 11, '2008'),
(32, 12, 'C3'),
(33, 12, 'C4 Lounge'),
(34, 13, 'Lancer'),
(35, 13, 'Pajero Sport'),
(36, 14, 'Sportage'),
(37, 14, 'Picanto'),
(38, 15, '320i'),
(39, 15, 'X1'),
(40, 15, '330i');

INSERT INTO usuarios (id_usuario, nome, email, cpf, telefone, cargo, senha, perfil) VALUES
(1, 'Administrador', 'admin@gmail.com', '00000000000', '(11) 00000-0000', 'Administrador', '123mudar', 'admin'),
(2, 'Ana Souza', 'ana.souza@email.com', '12345678901', '(11) 99999-1111', 'Usuário', '123456', 'usuario'),
(3, 'Bruno Costa', 'bruno.costa@email.com', '12345678902', '(11) 99999-2222', 'Usuário', '123456', 'usuario'),
(4, 'Carla Mendes', 'carla.mendes@email.com', '12345678903', '(11) 99999-3333', 'Administrador', '123456', 'admin');

INSERT INTO veiculos (id_veiculo, id_usuario, id_modelo, placa, cor, ano) VALUES
(1, 1, 1, 'ABC1D23', 'Prata', 2021),
(2, 2, 8, 'XYZ2E45', 'Azul', 2023),
(3, 3, 16, 'QWE3F67', 'Branco', 2022);

INSERT INTO vagas (id_vaga, codigo_vaga, bloco, status) VALUES
(1, 'A-01', 'A', 'disponivel'),
(2, 'A-02', 'A', 'ocupada'),
(3, 'A-03', 'A', 'agendada'),
(4, 'C-01', 'C', 'disponivel'),
(5, 'C-02', 'C', 'ocupada'),
(6, 'C-03', 'C', 'disponivel'),
(7, 'H-01', 'H', 'disponivel'),
(8, 'H-02', 'H', 'agendada'),
(9, 'H-03', 'H', 'ocupada');

INSERT INTO agendamentos (id_agendamento, id_usuario, id_veiculo, id_vaga, data_inicio, data_fim, status, observacao) VALUES
(1, 1, 1, 3, '2026-10-14 08:00:00', '2026-10-14 18:00:00', 'agendado', 'Reserva para atendimento no SENAI'),
(2, 2, 2, 8, '2026-10-15 07:30:00', '2026-10-15 17:30:00', 'confirmado', 'Uso regular da vaga');

INSERT INTO sancoes (id_sancao, id_usuario, id_agendamento, tipo, descricao, valor, status) VALUES
(1, 2, 2, 'nao_compareceu', 'Usuário não compareceu ao agendamento reservado.', 45.00, 'pendente');

INSERT INTO pagamentos (id_pagamento, id_usuario, id_agendamento, id_sancao, valor, metodo, status) VALUES
(1, 2, 2, 1, 45.00, 'pix', 'pendente');

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_veiculos_placa ON veiculos(placa);
CREATE INDEX idx_vagas_bloco ON vagas(bloco, status);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_sancoes_status ON sancoes(status);

SELECT 'Banco de dados senai_parking criado com sucesso.' AS mensagem;
