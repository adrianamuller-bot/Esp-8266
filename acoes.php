<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$servidor = "localhost";
$usuario  = "root";
$senha    = "";
$banco    = "esp8266";

$conn = new mysqli($servidor, $usuario, $senha, $banco);
if ($conn->connect_error) {
    echo json_encode(["erro" => "Falha no banco de dados: " . $conn->connect_error]);
    exit;
}
$conn->set_charset("utf8mb4");

// Garante que todas as tabelas e colunas existam no banco esp8266
function inicializarBanco($conn) {
    // 1. Tabela usuarios
    $conn->query("CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(150) NULL,
        senha VARCHAR(255) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Garante coluna email em usuarios
    $chkEmail = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'email'");
    if ($chkEmail && $chkEmail->num_rows == 0) {
        $conn->query("ALTER TABLE usuarios ADD COLUMN email VARCHAR(150) NULL DEFAULT NULL AFTER usuario;");
    }

    // Tabela de notificacoes / emails
    $conn->query("CREATE TABLE IF NOT EXISTS notificacoes_email (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT NOT NULL,
        destinatario VARCHAR(150) NOT NULL,
        assunto VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lido TINYINT(1) DEFAULT 0,
        KEY idx_usuario (id_usuario)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 2. Tabela leituras
    $conn->query("CREATE TABLE IF NOT EXISTS leituras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        distancia FLOAT NOT NULL,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 3. Tabela veiculos
    $conn->query("CREATE TABLE IF NOT EXISTS veiculos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT NOT NULL,
        placa VARCHAR(10) NOT NULL,
        marca VARCHAR(50) NOT NULL,
        modelo VARCHAR(50) NOT NULL,
        cor VARCHAR(30) NOT NULL,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_usuario (id_usuario)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 4. Tabela agendamentos
    $conn->query("CREATE TABLE IF NOT EXISTS agendamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT NULL,
        nome VARCHAR(100) NOT NULL,
        placa VARCHAR(20) NOT NULL,
        vaga VARCHAR(20) DEFAULT 'Vaga 01',
        bloco VARCHAR(10) DEFAULT 'H',
        data_reserva VARCHAR(20) NULL,
        horario VARCHAR(20) NULL,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'ativa'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Se usuarios estiver vazio, cadastra usuarios padrao
    $resU = $conn->query("SELECT COUNT(*) as total FROM usuarios");
    if ($resU && ($rowU = $resU->fetch_assoc()) && intval($rowU['total']) == 0) {
        $conn->query("INSERT INTO usuarios (nome, usuario, senha) VALUES
            ('Instrutor / Aluno SENAI', 'admin', 'senai123'),
            ('Diogo Eduardo Da Costa', 'Diogo', '6767'),
            ('Adrian', 'Adrian', '12345'),
            ('Emanuelli Zatt', 'Manuh', '1811'),
            ('Bernardo Antonio Gottardo', 'Bernardo', 'Paralelepipedo');");
    }

    // Se veiculos estiver vazio, popula veiculos de teste (Adrian -> Volvo XC90, Diogo -> Volvo XC60)
    $resV = $conn->query("SELECT COUNT(*) as total FROM veiculos");
    if ($resV && ($rowV = $resV->fetch_assoc()) && intval($rowV['total']) == 0) {
        $resAdrian = $conn->query("SELECT id FROM usuarios WHERE usuario = 'Adrian' LIMIT 1");
        $idAdrian = ($resAdrian && $rA = $resAdrian->fetch_assoc()) ? $rA['id'] : 4;

        $resDiogo = $conn->query("SELECT id FROM usuarios WHERE usuario = 'Diogo' LIMIT 1");
        $idDiogo = ($resDiogo && $rD = $resDiogo->fetch_assoc()) ? $rD['id'] : 3;

        $resAdmin = $conn->query("SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1");
        $idAdmin = ($resAdmin && $rAd = $resAdmin->fetch_assoc()) ? $rAd['id'] : 1;

        $conn->query("INSERT INTO veiculos (id_usuario, placa, marca, modelo, cor) VALUES
            ($idAdrian, 'ABC1D23', 'Volvo', 'XC90', 'Preto'),
            ($idDiogo, 'XYZ4E56', 'Volvo', 'XC60', 'Prata'),
            ($idAdmin, 'SEN1A20', 'Toyota', 'Corolla', 'Cinza');");
    }
}

inicializarBanco($conn);

// Envio e registro de e-mails / notificações do sistema
function enviarNotificacaoEmail($conn, $id_usuario, $destinatario, $assunto, $mensagemHtml) {
    if (empty($destinatario)) {
        if ($id_usuario > 0) {
            $res = $conn->query("SELECT email, usuario FROM usuarios WHERE id = " . intval($id_usuario) . " LIMIT 1");
            if ($res && $row = $res->fetch_assoc()) {
                $destinatario = !empty($row['email']) ? $row['email'] : ($row['usuario'] . '@senai.br');
            }
        }
    }
    if (empty($destinatario)) {
        $destinatario = 'usuario@senai.br';
    }

    // Salva no banco de dados para consulta e histórico em tempo real
    $stmt = $conn->prepare("INSERT INTO notificacoes_email (id_usuario, destinatario, assunto, mensagem) VALUES (?, ?, ?, ?)");
    if ($stmt) {
        $stmt->bind_param("isss", $id_usuario, $destinatario, $assunto, $mensagemHtml);
        $stmt->execute();
    }

    // Envio real via PHP mail() com cabeçalhos HTML
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: SENAI Parking <nao-responda@senai.br>\r\n";
    @mail($destinatario, $assunto, $mensagemHtml, $headers);

    return true;
}

// Detecção inteligente do IP do ESP8266 com cache rápido
function obterIpEsp() {
    $ipFixo = "192.168.0.102";

    // Se já testamos recentemente e falhou, não segura a requisição
    if (!empty($_SESSION['esp_offline_ate']) && time() < $_SESSION['esp_offline_ate']) {
        return !empty($_SESSION['esp_ip']) ? $_SESSION['esp_ip'] : $ipFixo;
    }

    if (!empty($_SESSION['esp_ip'])) {
        $ip = $_SESSION['esp_ip'];
        $ctx = stream_context_create(['http' => ['timeout' => 0.25]]);
        $test = @file_get_contents("http://" . $ip . "/status", false, $ctx);
        if ($test !== FALSE) return $ip;
    }

    $candidatos = [$ipFixo, "192.168.0.100", "192.168.0.101", "192.168.0.103"];
    foreach ($candidatos as $ip) {
        $ctx = stream_context_create(['http' => ['timeout' => 0.2]]);
        $resp = @file_get_contents("http://" . $ip . "/status", false, $ctx);
        if ($resp !== FALSE) {
            $_SESSION['esp_ip'] = $ip;
            unset($_SESSION['esp_offline_ate']);
            return $ip;
        }
    }

    // Se nenhum respondeu, marca como offline por 5 segundos para não travar o site a cada clique
    $_SESSION['esp_offline_ate'] = time() + 5;
    return $ipFixo;
}

$acao = isset($_REQUEST['acao']) ? $_REQUEST['acao'] : 'status';
$ip_esp = ($acao === 'status' || $acao === 'agendar' || $acao === 'liberar' || $acao === 'cancelar_agendamento') ? obterIpEsp() : "192.168.0.102";

// -------------------------------------------------------------
// 1. STATUS DO SENSOR E ESP8266
// -------------------------------------------------------------
if ($acao === 'status') {
    $url = "http://" . $ip_esp . "/status";
    $ctx = stream_context_create(['http' => ['timeout' => 1.0]]);
    $resp = @file_get_contents($url, false, $ctx);

    $espOnline = false;

    // Busca agendamentos ativos para cada vaga no MySQL
    $agendamentosAtivos = [];
    $resAg = $conn->query("
        SELECT a.id, a.id_usuario, a.nome, a.placa, a.vaga, a.bloco, a.data_reserva, a.horario, a.data_hora,
               COALESCE(u.nome, a.nome) as usuario_nome_completo,
               COALESCE(u.usuario, a.nome) as usuario_login,
               COALESCE(v.modelo, '') as modelo,
               COALESCE(v.marca, '') as marca
        FROM agendamentos a
        LEFT JOIN usuarios u ON a.id_usuario = u.id
        LEFT JOIN veiculos v ON a.placa = v.placa
        WHERE a.status = 'ativa'
        ORDER BY a.id DESC
    ");
    if ($resAg) {
        while ($rowAg = $resAg->fetch_assoc()) {
            $vNome = !empty($rowAg['vaga']) ? $rowAg['vaga'] : 'Vaga 01';
            if (!isset($agendamentosAtivos[$vNome])) {
                $partesNome = preg_split('/\s+/', trim($rowAg['usuario_nome_completo']));
                $primeiroNome = !empty($partesNome[0]) ? $partesNome[0] : $rowAg['nome'];
                $modeloVeiculo = !empty($rowAg['modelo']) ? $rowAg['modelo'] : (!empty($rowAg['marca']) ? $rowAg['marca'] : $rowAg['placa']);
                $horaAgendamento = !empty($rowAg['horario']) ? $rowAg['horario'] : (!empty($rowAg['data_hora']) ? substr($rowAg['data_hora'], 11, 5) : '');

                $agendamentosAtivos[$vNome] = [
                    "id"                  => intval($rowAg['id']),
                    "id_usuario"          => intval($rowAg['id_usuario']),
                    "nome"                => $rowAg['nome'],
                    "usuario_login"       => $rowAg['usuario_login'],
                    "primeiro_nome"       => $primeiroNome,
                    "nome_completo"       => $rowAg['usuario_nome_completo'],
                    "placa"               => $rowAg['placa'],
                    "modelo"              => $modeloVeiculo,
                    "marca"               => $rowAg['marca'],
                    "horario"             => $horaAgendamento,
                    "data_reserva"        => $rowAg['data_reserva'],
                    "vaga"                => $vNome,
                    "bloco"               => $rowAg['bloco']
                ];
            }
        }
    }

    // Inicializa estrutura das duas vagas
    $vagasData = [
        "Vaga 01" => [
            "distancia" => 0.0,
            "status" => isset($agendamentosAtivos["Vaga 01"]) ? "RESERVADA" : "DESCONECTADO",
            "cor" => isset($agendamentosAtivos["Vaga 01"]) ? "AMARELO" : "CINZA",
            "reservado" => isset($agendamentosAtivos["Vaga 01"]),
            "reservado_por" => isset($agendamentosAtivos["Vaga 01"]) ? $agendamentosAtivos["Vaga 01"]["nome"] : "",
            "agendamento" => isset($agendamentosAtivos["Vaga 01"]) ? $agendamentosAtivos["Vaga 01"] : null
        ],
        "Vaga 02" => [
            "distancia" => 0.0,
            "status" => isset($agendamentosAtivos["Vaga 02"]) ? "RESERVADA" : "DESCONECTADO",
            "cor" => isset($agendamentosAtivos["Vaga 02"]) ? "AMARELO" : "CINZA",
            "reservado" => isset($agendamentosAtivos["Vaga 02"]),
            "reservado_por" => isset($agendamentosAtivos["Vaga 02"]) ? $agendamentosAtivos["Vaga 02"]["nome"] : "",
            "agendamento" => isset($agendamentosAtivos["Vaga 02"]) ? $agendamentosAtivos["Vaga 02"] : null
        ]
    ];

    if ($resp !== FALSE) {
        $dadosESP = json_decode($resp, true);
        if ($dadosESP) {
            $espOnline = true;

            // Se o ESP retornou o objeto "vagas" com Vaga 01 e Vaga 02
            if (!empty($dadosESP['vagas'])) {
                foreach (["Vaga 01", "Vaga 02"] as $vk) {
                    if (isset($dadosESP['vagas'][$vk])) {
                        $ev = $dadosESP['vagas'][$vk];
                        $vagasData[$vk]['distancia'] = floatval($ev['distancia']);
                        if (!$vagasData[$vk]['reservado']) {
                            $vagasData[$vk]['status'] = $ev['status'];
                            $vagasData[$vk]['cor'] = $ev['cor'];
                        }
                    }
                }
            } else {
                // Modo legado: ESP tem apenas 1 sensor reportado na raiz
                $vagasData["Vaga 01"]['distancia'] = floatval($dadosESP['distancia']);
                if (!$vagasData["Vaga 01"]['reservado']) {
                    $vagasData["Vaga 01"]['status'] = $dadosESP['status'];
                    $vagasData["Vaga 01"]['cor'] = $dadosESP['cor'];
                }
            }

            // Gravação no banco MySQL com Rate Limiting de 12 segundos
            $resUltima = $conn->query("SELECT UNIX_TIMESTAMP(data_hora) as ts FROM leituras ORDER BY id DESC LIMIT 1");
            $ultimoTs = 0;
            if ($resUltima && $rowU = $resUltima->fetch_assoc()) {
                $ultimoTs = intval($rowU['ts']);
            }
            $agora = time();
            if (($agora - $ultimoTs) >= 12) {
                if ($vagasData["Vaga 01"]['distancia'] > 0) {
                    $d1 = $vagasData["Vaga 01"]['distancia'];
                    $conn->query("INSERT INTO leituras (vaga, distancia) VALUES ('Vaga 01', '$d1')");
                }
                if ($vagasData["Vaga 02"]['distancia'] > 0) {
                    $d2 = $vagasData["Vaga 02"]['distancia'];
                    $conn->query("INSERT INTO leituras (vaga, distancia) VALUES ('Vaga 02', '$d2')");
                }
            }
        }
    }

    echo json_encode([
        "online" => $espOnline,
        // Compatibilidade Vaga 01
        "distancia" => $vagasData["Vaga 01"]["distancia"],
        "status" => $vagasData["Vaga 01"]["status"],
        "cor" => $vagasData["Vaga 01"]["cor"],
        "reservado" => $vagasData["Vaga 01"]["reservado"],
        "reservado_por" => $vagasData["Vaga 01"]["reservado_por"],
        "agendamento" => $vagasData["Vaga 01"]["agendamento"],
        // Objeto com todas as vagas
        "vagas" => $vagasData,
        "ip_esp" => $ip_esp
    ]);
    exit;
}

// -------------------------------------------------------------
// 2. AUTENTICAÇÃO: LOGIN
// -------------------------------------------------------------
if ($acao === 'login') {
    $usuario = isset($_POST['usuario']) ? trim($_POST['usuario']) : '';
    $senha   = isset($_POST['senha']) ? trim($_POST['senha']) : '';

    if (empty($usuario) || empty($senha)) {
        echo json_encode(["sucesso" => false, "mensagem" => "Informe usuário e senha."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, nome, usuario, senha FROM usuarios WHERE usuario = ? LIMIT 1");
    $stmt->bind_param("s", $usuario);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res && $user = $res->fetch_assoc()) {
        if ($senha === $user['senha'] || md5($senha) === $user['senha']) {
            $_SESSION['usuario_id']    = $user['id'];
            $_SESSION['usuario_nome']  = $user['nome'];
            $_SESSION['usuario_login'] = $user['usuario'];

            // Busca veículos deste usuário
            $stmtV = $conn->prepare("SELECT id, placa, marca, modelo, cor FROM veiculos WHERE id_usuario = ? ORDER BY id DESC");
            $stmtV->bind_param("i", $user['id']);
            $stmtV->execute();
            $resV = $stmtV->get_result();
            $veiculos = [];
            while ($v = $resV->fetch_assoc()) {
                $veiculos[] = $v;
            }

            echo json_encode([
                "sucesso" => true,
                "usuario" => [
                    "id"      => intval($user['id']),
                    "nome"    => $user['nome'],
                    "usuario" => $user['usuario']
                ],
                "veiculos" => $veiculos
            ]);
            exit;
        } else {
            echo json_encode(["sucesso" => false, "mensagem" => "Senha incorreta para o usuário informado."]);
            exit;
        }
    } else {
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário não encontrado no sistema."]);
        exit;
    }
}

// -------------------------------------------------------------
// 3. AUTENTICAÇÃO: CADASTRO DE NOVO USUÁRIO
// -------------------------------------------------------------
if ($acao === 'cadastrar_usuario') {
    $nome     = isset($_POST['nome']) ? trim($_POST['nome']) : '';
    $usuario  = isset($_POST['usuario']) ? trim($_POST['usuario']) : '';
    $senha    = isset($_POST['senha']) ? trim($_POST['senha']) : '';
    $confirma = isset($_POST['confirma_senha']) ? trim($_POST['confirma_senha']) : '';

    if (empty($nome) || empty($usuario) || empty($senha)) {
        echo json_encode(["sucesso" => false, "mensagem" => "Preencha todos os campos obrigatórios."]);
        exit;
    }

    if (strlen($senha) < 4) {
        echo json_encode(["sucesso" => false, "mensagem" => "A senha deve ter no mínimo 4 caracteres."]);
        exit;
    }

    if (!empty($confirma) && $senha !== $confirma) {
        echo json_encode(["sucesso" => false, "mensagem" => "As senhas não coincidem."]);
        exit;
    }

    // Verifica se login já existe
    $stmtC = $conn->prepare("SELECT id FROM usuarios WHERE usuario = ? LIMIT 1");
    $stmtC->bind_param("s", $usuario);
    $stmtC->execute();
    $resC = $stmtC->get_result();
    if ($resC && $resC->num_rows > 0) {
        echo json_encode(["sucesso" => false, "mensagem" => "Este nome de usuário já está em uso."]);
        exit;
    }

    $email    = isset($_POST['email']) && !empty($_POST['email']) ? trim($_POST['email']) : ($usuario . '@senai.br');

    $stmtI = $conn->prepare("INSERT INTO usuarios (nome, usuario, email, senha) VALUES (?, ?, ?, ?)");
    $stmtI->bind_param("ssss", $nome, $usuario, $email, $senha);
    if ($stmtI->execute()) {
        $novoId = $stmtI->insert_id;
        $_SESSION['usuario_id']    = $novoId;
        $_SESSION['usuario_nome']  = $nome;
        $_SESSION['usuario_login'] = $usuario;

        // Notificação por e-mail de boas-vindas
        $msgBoasVindas = "<p>Olá, <strong>" . htmlspecialchars($nome) . "</strong>!</p><p>Sua conta no <strong>SENAI Parking</strong> foi criada com sucesso.</p><p>Você já pode cadastrar seus veículos e reservar vagas nos blocos A, C e H do campus.</p>";
        enviarNotificacaoEmail($conn, $novoId, $email, "Bem-vindo ao SENAI Parking!", $msgBoasVindas);

        echo json_encode([
            "sucesso" => true,
            "mensagem" => "Conta criada com sucesso!",
            "usuario" => [
                "id"      => $novoId,
                "nome"    => $nome,
                "usuario" => $usuario,
                "email"   => $email
            ]
        ]);
        exit;
    } else {
        echo json_encode(["sucesso" => false, "mensagem" => "Erro ao salvar usuário: " . $conn->error]);
        exit;
    }
}

// -------------------------------------------------------------
// 4. SESSÃO ATUAL
// -------------------------------------------------------------
if ($acao === 'obter_sessao') {
    if (!empty($_SESSION['usuario_id'])) {
        $id = intval($_SESSION['usuario_id']);
        $stmt = $conn->prepare("SELECT id, nome, usuario FROM usuarios WHERE id = ? LIMIT 1");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res && $user = $res->fetch_assoc()) {
            echo json_encode([
                "logado" => true,
                "usuario" => [
                    "id"      => intval($user['id']),
                    "nome"    => $user['nome'],
                    "usuario" => $user['usuario']
                ]
            ]);
            exit;
        }
    }
    echo json_encode(["logado" => false]);
    exit;
}

// -------------------------------------------------------------
// 5. LOGOUT
// -------------------------------------------------------------
if ($acao === 'logout') {
    session_unset();
    session_destroy();
    echo json_encode(["sucesso" => true]);
    exit;
}

// -------------------------------------------------------------
// 5.1 PERFIL DO USUÁRIO: OBTER DADOS COMPLETOS
// -------------------------------------------------------------
if ($acao === 'obter_perfil') {
    $id_usuario = isset($_REQUEST['id_usuario']) ? intval($_REQUEST['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : 0);
    $usuarioParam = isset($_REQUEST['usuario']) ? trim($_REQUEST['usuario']) : '';

    if ($id_usuario <= 0 && !empty($usuarioParam)) {
        $resU = $conn->query("SELECT id FROM usuarios WHERE usuario = '" . $conn->real_escape_string($usuarioParam) . "' LIMIT 1");
        if ($resU && $rowU = $resU->fetch_assoc()) {
            $id_usuario = intval($rowU['id']);
        }
    }

    if ($id_usuario <= 0) {
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário não autenticado."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, nome, usuario, email, senha, criado_em FROM usuarios WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res && $user = $res->fetch_assoc()) {
        $userEmail = !empty($user['email']) ? $user['email'] : ($user['usuario'] . '@senai.br');

        // Estatísticas
        $resV = $conn->query("SELECT COUNT(*) as total FROM veiculos WHERE id_usuario = " . $id_usuario);
        $totalV = ($resV && $rowV = $resV->fetch_assoc()) ? intval($rowV['total']) : 0;

        $resA = $conn->query("SELECT COUNT(*) as total FROM agendamentos WHERE id_usuario = " . $id_usuario . " OR nome = '" . $conn->real_escape_string($user['usuario']) . "'");
        $totalA = ($resA && $rowA = $resA->fetch_assoc()) ? intval($rowA['total']) : 0;

        echo json_encode([
            "sucesso" => true,
            "usuario" => [
                "id"        => intval($user['id']),
                "nome"      => $user['nome'],
                "usuario"   => $user['usuario'],
                "email"     => $userEmail,
                "senha"     => $user['senha'],
                "criado_em" => $user['criado_em']
            ],
            "perfil" => [
                "id"                 => intval($user['id']),
                "nome"               => $user['nome'],
                "usuario"            => $user['usuario'],
                "email"              => $userEmail,
                "senha"              => $user['senha'],
                "criado_em"          => $user['criado_em'],
                "total_veiculos"     => $totalV,
                "total_agendamentos" => $totalA
            ],
            "total_veiculos"     => $totalV,
            "total_agendamentos" => $totalA
        ]);
        exit;
    } else {
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário não encontrado."]);
        exit;
    }
}

// -------------------------------------------------------------
// 5.2 PERFIL DO USUÁRIO: ALTERAR SENHA
// -------------------------------------------------------------
if ($acao === 'alterar_senha') {
    $id_usuario  = isset($_POST['id_usuario']) ? intval($_POST['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : 0);
    $senha_atual = isset($_POST['senha_atual']) ? trim($_POST['senha_atual']) : '';
    $nova_senha  = isset($_POST['nova_senha']) ? trim($_POST['nova_senha']) : '';

    if ($id_usuario <= 0 && !empty($_POST['usuario'])) {
        $userParam = trim($_POST['usuario']);
        $resU = $conn->query("SELECT id FROM usuarios WHERE usuario = '" . $conn->real_escape_string($userParam) . "' LIMIT 1");
        if ($resU && $rowU = $resU->fetch_assoc()) {
            $id_usuario = intval($rowU['id']);
        }
    }

    if ($id_usuario <= 0 || empty($senha_atual) || empty($nova_senha)) {
        echo json_encode(["sucesso" => false, "mensagem" => "Preencha a senha atual e a nova senha."]);
        exit;
    }

    if (strlen($nova_senha) < 4) {
        echo json_encode(["sucesso" => false, "mensagem" => "A nova senha deve ter no mínimo 4 caracteres."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, nome, usuario, email, senha FROM usuarios WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res && $user = $res->fetch_assoc()) {
        if ($senha_atual !== $user['senha'] && md5($senha_atual) !== $user['senha']) {
            echo json_encode(["sucesso" => false, "mensagem" => "Senha atual incorreta."]);
            exit;
        }

        $stmtUp = $conn->prepare("UPDATE usuarios SET senha = ? WHERE id = ?");
        $stmtUp->bind_param("si", $nova_senha, $id_usuario);
        if ($stmtUp->execute()) {
            // Notificação por e-mail sobre a segurança da senha
            $destEmail = !empty($user['email']) ? $user['email'] : ($user['usuario'] . '@senai.br');
            $msgSenha = "<p>Olá, <strong>" . htmlspecialchars($user['nome']) . "</strong>!</p><p>Sua senha de acesso ao <strong>SENAI Parking</strong> foi alterada em <strong>" . date('d/m/Y \à\s H:i') . "</strong>.</p><p>Se você realizou esta alteração, desconsidere esta mensagem. Caso contrário, contate a administração imediatamente.</p>";
            enviarNotificacaoEmail($conn, $id_usuario, $destEmail, "Alerta de Segurança: Senha Alterada", $msgSenha);

            echo json_encode(["sucesso" => true, "mensagem" => "Senha atualizada com sucesso! Notificação enviada por e-mail."]);
            exit;
        } else {
            echo json_encode(["sucesso" => false, "mensagem" => "Erro ao atualizar senha no banco."]);
            exit;
        }
    } else {
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário não encontrado."]);
        exit;
    }
}

// -------------------------------------------------------------
// 5.3 PERFIL DO USUÁRIO: EXCLUIR CONTA DEFINITIVAMENTE
// -------------------------------------------------------------
if ($acao === 'excluir_conta') {
    $id_usuario = isset($_POST['id_usuario']) ? intval($_POST['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : 0);
    $senha      = isset($_POST['senha']) ? trim($_POST['senha']) : '';
    $aceitou    = isset($_POST['aceitou']) && ($_POST['aceitou'] === '1' || $_POST['aceitou'] === 'true' || $_POST['aceitou'] === true);

    if ($id_usuario <= 0 && !empty($_POST['usuario'])) {
        $userParam = trim($_POST['usuario']);
        $resU = $conn->query("SELECT id FROM usuarios WHERE usuario = '" . $conn->real_escape_string($userParam) . "' LIMIT 1");
        if ($resU && $rowU = $resU->fetch_assoc()) {
            $id_usuario = intval($rowU['id']);
        }
    }

    if ($id_usuario <= 0) {
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário não identificado."]);
        exit;
    }

    if (!$aceitou) {
        echo json_encode(["sucesso" => false, "mensagem" => "Você precisa marcar a caixa confirmando que aceita apagar sua conta."]);
        exit;
    }

    if (empty($senha)) {
        echo json_encode(["sucesso" => false, "mensagem" => "Digite sua senha para confirmar a exclusão."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, nome, usuario, email, senha FROM usuarios WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res && $user = $res->fetch_assoc()) {
        if ($senha !== $user['senha'] && md5($senha) !== $user['senha']) {
            echo json_encode(["sucesso" => false, "mensagem" => "Senha incorreta. A conta não foi excluída."]);
            exit;
        }

        // Envia notificação por e-mail de conta encerrada antes de remover
        $destEmail = !empty($user['email']) ? $user['email'] : ($user['usuario'] . '@senai.br');
        $msgEncerrada = "<p>Olá, <strong>" . htmlspecialchars($user['nome']) . "</strong>.</p><p>Confirmamos que sua conta <strong>@" . htmlspecialchars($user['usuario']) . "</strong> e todos os veículos e históricos de vagas foram <strong>excluídos permanentemente</strong> do banco de dados do SENAI Parking.</p><p>Agradecemos pelo período em que utilizou nossos serviços.</p>";
        enviarNotificacaoEmail($conn, $id_usuario, $destEmail, "Conta Encerrada - SENAI Parking", $msgEncerrada);

        // 1. Remove veículos associados
        $conn->query("DELETE FROM veiculos WHERE id_usuario = " . $id_usuario);

        // 2. Remove agendamentos associados
        $conn->query("DELETE FROM agendamentos WHERE id_usuario = " . $id_usuario . " OR nome = '" . $conn->real_escape_string($user['usuario']) . "'");

        // 3. Remove o usuário
        $stmtDel = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmtDel->bind_param("i", $id_usuario);
        $stmtDel->execute();

        // 4. Encerra sessão
        session_unset();
        session_destroy();

        echo json_encode([
            "sucesso" => true,
            "mensagem" => "Sua conta e todos os dados vinculados foram excluídos com sucesso."
        ]);
        exit;
    } else {
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário não encontrado."]);
        exit;
    }
}

// -------------------------------------------------------------
// 5.4 ATUALIZAR E-MAIL DO USUÁRIO
// -------------------------------------------------------------
if ($acao === 'atualizar_email') {
    $id_usuario = isset($_POST['id_usuario']) ? intval($_POST['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : 0);
    $email      = isset($_POST['email']) ? trim($_POST['email']) : '';

    if ($id_usuario <= 0 && !empty($_POST['usuario'])) {
        $uParam = trim($_POST['usuario']);
        $resU = $conn->query("SELECT id FROM usuarios WHERE usuario = '" . $conn->real_escape_string($uParam) . "' LIMIT 1");
        if ($resU && $rowU = $resU->fetch_assoc()) {
            $id_usuario = intval($rowU['id']);
        }
    }

    if ($id_usuario <= 0 || empty($email)) {
        echo json_encode(["sucesso" => false, "mensagem" => "Informe um e-mail válido."]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["sucesso" => false, "mensagem" => "Formato de e-mail inválido."]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE usuarios SET email = ? WHERE id = ?");
    $stmt->bind_param("si", $email, $id_usuario);
    if ($stmt->execute()) {
        $msgEmailAtualizado = "<p>Seu e-mail de notificações no <strong>SENAI Parking</strong> foi atualizado para: <strong>{$email}</strong>.</p><p>Você receberá aqui avisos sobre reservas e segurança.</p>";
        enviarNotificacaoEmail($conn, $id_usuario, $email, "E-mail de Notificações Atualizado", $msgEmailAtualizado);

        echo json_encode(["sucesso" => true, "mensagem" => "E-mail atualizado com sucesso! Notificação enviada.", "email" => $email]);
        exit;
    } else {
        echo json_encode(["sucesso" => false, "mensagem" => "Erro ao salvar e-mail no banco de dados."]);
        exit;
    }
}

// -------------------------------------------------------------
// 5.5 LISTAR NOTIFICAÇÕES / E-MAILS DO USUÁRIO
// -------------------------------------------------------------
if ($acao === 'obter_notificacoes') {
    $id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : 0);
    $usuario    = isset($_GET['usuario']) ? trim($_GET['usuario']) : '';

    if ($id_usuario <= 0 && !empty($usuario)) {
        $resU = $conn->query("SELECT id FROM usuarios WHERE usuario = '" . $conn->real_escape_string($usuario) . "' LIMIT 1");
        if ($resU && $rowU = $resU->fetch_assoc()) {
            $id_usuario = intval($rowU['id']);
        }
    }

    $sql = "SELECT id, id_usuario, destinatario, assunto, mensagem, criado_em, lido FROM notificacoes_email WHERE 1=1";
    if ($id_usuario > 0) {
        $sql .= " AND (id_usuario = $id_usuario OR id_usuario = 0)";
    }
    $sql .= " ORDER BY id DESC LIMIT 20";

    $res = $conn->query($sql);
    $notifs = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $notifs[] = $row;
        }
    }

    echo json_encode(["sucesso" => true, "notificacoes" => $notifs]);
    exit;
}

// -------------------------------------------------------------
// 6. VEÍCULOS: LISTAR VEÍCULOS DO USUÁRIO
// -------------------------------------------------------------
if ($acao === 'obter_veiculos') {
    $id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : 0);

    // Se o usuário passou login em vez de ID
    if ($id_usuario <= 0 && !empty($_GET['usuario'])) {
        $userParam = trim($_GET['usuario']);
        $resU = $conn->query("SELECT id FROM usuarios WHERE usuario = '" . $conn->real_escape_string($userParam) . "' LIMIT 1");
        if ($resU && $rowU = $resU->fetch_assoc()) {
            $id_usuario = intval($rowU['id']);
        }
    }

    $veiculos = [];
    if ($id_usuario > 0) {
        $stmt = $conn->prepare("SELECT id, id_usuario, placa, marca, modelo, cor, data_cadastro FROM veiculos WHERE id_usuario = ? ORDER BY id DESC");
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) {
            $veiculos[] = $row;
        }
    }

    echo json_encode($veiculos);
    exit;
}

// -------------------------------------------------------------
// 7. VEÍCULOS: CADASTRAR VEÍCULO
// -------------------------------------------------------------
if ($acao === 'salvar_veiculo') {
    $id_usuario = isset($_POST['id_usuario']) ? intval($_POST['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : 0);
    $placa      = isset($_POST['placa']) ? strtoupper(trim($_POST['placa'])) : '';
    $marca      = isset($_POST['marca']) ? trim($_POST['marca']) : '';
    $modelo     = isset($_POST['modelo']) ? trim($_POST['modelo']) : '';
    $cor        = isset($_POST['cor']) ? trim($_POST['cor']) : '';

    if ($id_usuario <= 0 && !empty($_POST['usuario'])) {
        $userParam = trim($_POST['usuario']);
        $resU = $conn->query("SELECT id FROM usuarios WHERE usuario = '" . $conn->real_escape_string($userParam) . "' LIMIT 1");
        if ($resU && $rowU = $resU->fetch_assoc()) {
            $id_usuario = intval($rowU['id']);
        }
    }

    if ($id_usuario <= 0) {
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário não identificado. Faça login novamente."]);
        exit;
    }

    if (empty($placa) || empty($marca) || empty($modelo) || empty($cor)) {
        echo json_encode(["sucesso" => false, "mensagem" => "Preencha placa, cor, marca e modelo."]);
        exit;
    }

    // Verifica se a placa já existe cadastrada
    $stmtCheck = $conn->prepare("SELECT id, id_usuario FROM veiculos WHERE placa = ? LIMIT 1");
    $stmtCheck->bind_param("s", $placa);
    $stmtCheck->execute();
    $resCheck = $stmtCheck->get_result();
    if ($resCheck && $resCheck->num_rows > 0) {
        echo json_encode(["sucesso" => false, "mensagem" => "A placa '$placa' já está cadastrada no sistema."]);
        exit;
    }

    $stmtInsert = $conn->prepare("INSERT INTO veiculos (id_usuario, placa, marca, modelo, cor) VALUES (?, ?, ?, ?, ?)");
    $stmtInsert->bind_param("issss", $id_usuario, $placa, $marca, $modelo, $cor);
    if ($stmtInsert->execute()) {
        $novoVeiculoId = $stmtInsert->insert_id;
        echo json_encode([
            "sucesso" => true,
            "mensagem" => "Veículo cadastrado com sucesso no banco de dados!",
            "veiculo" => [
                "id"         => $novoVeiculoId,
                "id_usuario" => $id_usuario,
                "placa"      => $placa,
                "marca"      => $marca,
                "modelo"     => $modelo,
                "cor"        => $cor
            ]
        ]);
        exit;
    } else {
        echo json_encode(["sucesso" => false, "mensagem" => "Erro ao salvar veículo: " . $conn->error]);
        exit;
    }
}

// -------------------------------------------------------------
// 8. VEÍCULOS: EXCLUIR VEÍCULO
// -------------------------------------------------------------
if ($acao === 'excluir_veiculo') {
    $id = isset($_REQUEST['id']) ? intval($_REQUEST['id']) : 0;
    $placa = isset($_REQUEST['placa']) ? trim($_REQUEST['placa']) : '';
    $id_usuario = isset($_REQUEST['id_usuario']) ? intval($_REQUEST['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : 0);

    if ($id <= 0 && empty($placa)) {
        echo json_encode(["sucesso" => false, "mensagem" => "Veículo não especificado."]);
        exit;
    }

    if ($id > 0) {
        if ($id_usuario > 0) {
            $stmt = $conn->prepare("DELETE FROM veiculos WHERE id = ? AND id_usuario = ?");
            $stmt->bind_param("ii", $id, $id_usuario);
        } else {
            $stmt = $conn->prepare("DELETE FROM veiculos WHERE id = ?");
            $stmt->bind_param("i", $id);
        }
    } else {
        if ($id_usuario > 0) {
            $stmt = $conn->prepare("DELETE FROM veiculos WHERE placa = ? AND id_usuario = ?");
            $stmt->bind_param("si", $placa, $id_usuario);
        } else {
            $stmt = $conn->prepare("DELETE FROM veiculos WHERE placa = ?");
            $stmt->bind_param("s", $placa);
        }
    }

    if ($stmt->execute()) {
        echo json_encode(["sucesso" => true, "mensagem" => "Veículo removido com sucesso!"]);
        exit;
    } else {
        echo json_encode(["sucesso" => false, "mensagem" => "Erro ao remover veículo."]);
        exit;
    }
}

// -------------------------------------------------------------
// 9. AGENDAMENTOS: AGENDAR VAGA
// -------------------------------------------------------------
if ($acao === 'agendar') {
    $nome         = isset($_POST['nome']) ? trim($_POST['nome']) : 'Usuário SENAI';
    $placa        = isset($_POST['placa']) ? strtoupper(trim($_POST['placa'])) : '---';
    $id_usuario   = isset($_POST['id_usuario']) ? intval($_POST['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : NULL);
    $vaga         = isset($_POST['vaga']) ? trim($_POST['vaga']) : 'Vaga 01';
    $bloco        = isset($_POST['bloco']) ? trim($_POST['bloco']) : 'H';
    $data_reserva = isset($_POST['data_reserva']) ? trim($_POST['data_reserva']) : date('Y-m-d');
    $horario      = isset($_POST['horario']) ? trim($_POST['horario']) : date('H:i');

    // Se o usuário passou login mas não tem id_usuario
    if (empty($id_usuario)) {
        $resU = $conn->query("SELECT id FROM usuarios WHERE usuario = '" . $conn->real_escape_string($nome) . "' OR nome = '" . $conn->real_escape_string($nome) . "' LIMIT 1");
        if ($resU && $rowU = $resU->fetch_assoc()) {
            $id_usuario = intval($rowU['id']);
        }
    }

    $stmt = $conn->prepare("INSERT INTO agendamentos (id_usuario, nome, placa, vaga, bloco, data_reserva, horario, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'ativa')");
    $stmt->bind_param("issssss", $id_usuario, $nome, $placa, $vaga, $bloco, $data_reserva, $horario);
    $stmt->execute();

    // Avisa o ESP8266 para acender o LED AMARELO na vaga correspondente
    $urlRes = "http://" . $ip_esp . "/reservar?nome=" . urlencode($nome) . "&vaga=" . urlencode($vaga);
    $ctx = stream_context_create(['http' => ['timeout' => 1.5]]);
    @file_get_contents($urlRes, false, $ctx);

    // Envia notificação por e-mail sobre o agendamento
    $msgAgendamento = "<p>Olá, <strong>" . htmlspecialchars($nome) . "</strong>!</p><p>Sua vaga no <strong>SENAI Parking</strong> foi agendada com sucesso:</p><ul><li><strong>Bloco:</strong> {$bloco}</li><li><strong>Vaga:</strong> {$vaga}</li><li><strong>Placa do Veículo:</strong> {$placa}</li><li><strong>Data:</strong> {$data_reserva}</li><li><strong>Horário:</strong> {$horario}</li></ul><p>Ao chegar ao campus, dirija-se à vaga reservada. O sensor identificará seu veículo e o LED mudará para Vermelho.</p>";
    enviarNotificacaoEmail($conn, $id_usuario, '', "Confirmação de Reserva de Vaga - Bloco {$bloco} ({$vaga})", $msgAgendamento);

    echo json_encode([
        "sucesso" => true,
        "mensagem" => "Vaga agendada com sucesso!",
        "agendamento_id" => $stmt->insert_id
    ]);
    exit;
}

// -------------------------------------------------------------
// 10. AGENDAMENTOS: LISTAR AGENDAMENTOS
// -------------------------------------------------------------
if ($acao === 'obter_agendamentos') {
    $id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : 0);
    $usuario    = isset($_GET['usuario']) ? trim($_GET['usuario']) : '';

    $sql = "SELECT a.id, a.id_usuario, a.nome, a.placa, a.vaga, a.bloco, a.data_reserva, a.horario, a.data_hora, a.status,
                   v.marca, v.modelo, v.cor
            FROM agendamentos a
            LEFT JOIN veiculos v ON a.placa = v.placa
            WHERE a.status = 'ativa'";

    if ($id_usuario > 0 || !empty($usuario)) {
        $conds = [];
        if ($id_usuario > 0) $conds[] = "a.id_usuario = $id_usuario";
        if (!empty($usuario)) $conds[] = "a.nome = '" . $conn->real_escape_string($usuario) . "'";
        $sql .= " AND (" . implode(" OR ", $conds) . ")";
    }

    $sql .= " ORDER BY a.id DESC";

    $res = $conn->query($sql);
    $agendamentos = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $agendamentos[] = $row;
        }
    }

    echo json_encode($agendamentos);
    exit;
}

// -------------------------------------------------------------
// 11. AGENDAMENTOS: LIBERAR / CANCELAR AGENDAMENTO
// -------------------------------------------------------------
if ($acao === 'liberar' || $acao === 'cancelar_agendamento') {
    $id = isset($_REQUEST['id']) ? intval($_REQUEST['id']) : 0;
    $usuarioIdRequisitante = isset($_REQUEST['id_usuario']) ? intval($_REQUEST['id_usuario']) : (!empty($_SESSION['usuario_id']) ? intval($_SESSION['usuario_id']) : 0);
    $usuarioLoginRequisitante = isset($_REQUEST['usuario']) ? trim($_REQUEST['usuario']) : (!empty($_SESSION['usuario']) ? trim($_SESSION['usuario']) : '');

    if ($id <= 0) {
        // Se não passou ID específico, pega o agendamento ativo atual
        $resUlt = $conn->query("SELECT id, id_usuario, nome FROM agendamentos WHERE status = 'ativa' ORDER BY id DESC LIMIT 1");
        if ($resUlt && $rUlt = $resUlt->fetch_assoc()) {
            $id = intval($rUlt['id']);
        }
    }

    if ($id > 0) {
        // Busca dados do agendamento para checar propriedade
        $resAg = $conn->query("SELECT id_usuario, nome, bloco, vaga FROM agendamentos WHERE id = $id LIMIT 1");
        $dadosAg = ($resAg && $rAg = $resAg->fetch_assoc()) ? $rAg : null;

        if ($dadosAg) {
            // Trava de segurança: apenas o próprio dono do agendamento (ou admin) pode cancelar/desagendar
            $ehDono = false;
            $agUsuarioId = intval($dadosAg['id_usuario']);
            $agNome = trim($dadosAg['nome']);

            if ($usuarioLoginRequisitante === 'admin' || $usuarioIdRequisitante === 1) {
                $ehDono = true;
            } elseif ($usuarioIdRequisitante > 0 && $agUsuarioId > 0 && $usuarioIdRequisitante === $agUsuarioId) {
                $ehDono = true;
            } elseif (!empty($usuarioLoginRequisitante) && strcasecmp($usuarioLoginRequisitante, $agNome) === 0) {
                $ehDono = true;
            }

            if (!$ehDono) {
                echo json_encode([
                    "sucesso" => false,
                    "bloqueado" => true,
                    "mensagem" => "Apenas o usuário que agendou esta vaga pode cancelá-la."
                ]);
                exit;
            }

            $stmt = $conn->prepare("UPDATE agendamentos SET status = 'concluida' WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();

            $msgLib = "<p>Olá, <strong>" . htmlspecialchars($dadosAg['nome']) . "</strong>!</p><p>Sua reserva da <strong>{$dadosAg['vaga']}</strong> (Bloco {$dadosAg['bloco']}) foi finalizada / cancelada com sucesso.</p><p>Obrigado por utilizar o SENAI Parking.</p>";
            enviarNotificacaoEmail($conn, intval($dadosAg['id_usuario']), '', "Reserva Concluída / Cancelada - {$dadosAg['vaga']}", $msgLib);
        }
    } else {
        $conn->query("UPDATE agendamentos SET status = 'concluida' WHERE status = 'ativa'");
    }

    // Avisa o ESP8266 para voltar ao automático (Verde ou Vermelho)
    $vagaAlvoUrl = !empty($dadosAg['vaga']) ? urlencode($dadosAg['vaga']) : 'todas';
    $urlLib = "http://" . $ip_esp . "/liberar?vaga=" . $vagaAlvoUrl;
    $ctx = stream_context_create(['http' => ['timeout' => 1.5]]);
    @file_get_contents($urlLib, false, $ctx);

    echo json_encode(["sucesso" => true, "mensagem" => "Vaga liberada com sucesso!"]);
    exit;
}

// -------------------------------------------------------------
// 12. HISTÓRICO DE LEITURAS
// -------------------------------------------------------------
if ($acao === 'historico') {
    $res = $conn->query("SELECT id, distancia, data_hora FROM leituras ORDER BY id DESC LIMIT 15");
    $historico = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $historico[] = $row;
        }
    }
    echo json_encode($historico);
    exit;
}

// -------------------------------------------------------------
// 13. PAINEL ADMINISTRATIVO: DADOS COMPLETOS (EXCETO SENHAS)
// -------------------------------------------------------------
if ($acao === 'admin_dados_gerais') {
    // 1. Lista de Usuários (sem o campo senha)
    $resU = $conn->query("SELECT id, nome, usuario, email, criado_em FROM usuarios ORDER BY id DESC");
    $usuarios = [];
    if ($resU) {
        while ($row = $resU->fetch_assoc()) {
            $usuarios[] = [
                "id"        => intval($row['id']),
                "nome"      => $row['nome'],
                "usuario"   => $row['usuario'],
                "email"     => !empty($row['email']) ? $row['email'] : ($row['usuario'] . '@senai.br'),
                "criado_em" => $row['criado_em']
            ];
        }
    }

    // 2. Lista de Veículos com dados do proprietário
    $resV = $conn->query("SELECT v.id, v.id_usuario, v.placa, v.marca, v.modelo, v.cor, v.data_cadastro, u.nome AS proprietario, u.usuario AS login_proprietario 
                          FROM veiculos v 
                          LEFT JOIN usuarios u ON v.id_usuario = u.id 
                          ORDER BY v.id DESC");
    $veiculos = [];
    if ($resV) {
        while ($row = $resV->fetch_assoc()) {
            $veiculos[] = [
                "id"                 => intval($row['id']),
                "id_usuario"         => intval($row['id_usuario']),
                "placa"              => $row['placa'],
                "marca"              => $row['marca'],
                "modelo"             => $row['modelo'],
                "cor"                => $row['cor'],
                "data_cadastro"      => $row['data_cadastro'],
                "proprietario"       => !empty($row['proprietario']) ? $row['proprietario'] : 'Não identificado',
                "login_proprietario" => $row['login_proprietario'] ?? ''
            ];
        }
    }

    // 3. Todos os Agendamentos com dados do veículo e usuário
    $resA = $conn->query("SELECT a.id, a.id_usuario, a.nome, a.placa, a.vaga, a.bloco, a.data_reserva, a.horario, a.data_hora, a.status,
                                 u.usuario AS login_usuario, u.email AS email_usuario,
                                 v.modelo AS veiculo_modelo, v.marca AS veiculo_marca
                          FROM agendamentos a
                          LEFT JOIN usuarios u ON a.id_usuario = u.id
                          LEFT JOIN veiculos v ON a.placa = v.placa
                          ORDER BY a.id DESC");
    $agendamentos = [];
    $totalAtivos = 0;
    if ($resA) {
        while ($row = $resA->fetch_assoc()) {
            if ($row['status'] === 'ativa') $totalAtivos++;
            $agendamentos[] = $row;
        }
    }

    // 4. Últimas leituras dos sensores ultrassônicos (Vaga 01 e Vaga 02)
    $resL = $conn->query("SELECT id, vaga, distancia, data_hora FROM leituras ORDER BY id DESC LIMIT 50");
    $leituras = [];
    if ($resL) {
        while ($row = $resL->fetch_assoc()) {
            $leituras[] = $row;
        }
    }

    // 5. Histórico de Notificações / E-mails disparados
    $resN = $conn->query("SELECT id, id_usuario, destinatario, assunto, mensagem, criado_em, lido FROM notificacoes_email ORDER BY id DESC LIMIT 50");
    $notificacoes = [];
    if ($resN) {
        while ($row = $resN->fetch_assoc()) {
            $notificacoes[] = $row;
        }
    }

    // 6. Resumo numérico / KPIs
    $metricas = [
        "total_usuarios"     => count($usuarios),
        "total_veiculos"     => count($veiculos),
        "total_agendamentos" => count($agendamentos),
        "agendamentos_ativos"=> $totalAtivos,
        "total_emails"       => count($notificacoes),
        "total_leituras"     => count($leituras)
    ];

    echo json_encode([
        "sucesso"      => true,
        "metricas"     => $metricas,
        "usuarios"     => $usuarios,
        "veiculos"     => $veiculos,
        "agendamentos" => $agendamentos,
        "leituras"     => $leituras,
        "notificacoes" => $notificacoes
    ]);
    exit;
}

$conn->close();
?>
