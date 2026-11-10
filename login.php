<?php
session_start();

if (isset($_SESSION['usuario_id'])) {
    header("Location: index.php");
    exit;
}

$erro = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario = isset($_POST['usuario']) ? trim($_POST['usuario']) : '';
    $senha   = isset($_POST['senha']) ? trim($_POST['senha']) : '';

    if (!empty($usuario) && !empty($senha)) {
        $conn = new mysqli("localhost", "root", "", "esp8266");
        if ($conn->connect_error) {
            $erro = "Erro de conexão com o banco de dados.";
        } else {
            $stmt = $conn->prepare("SELECT id, nome, usuario, senha FROM usuarios WHERE usuario = ? LIMIT 1");
            $stmt->bind_param("s", $usuario);
            $stmt->execute();
            $res = $stmt->get_result();

            if ($res && $user = $res->fetch_assoc()) {
                if ($senha === $user['senha'] || md5($senha) === $user['senha']) {
                    $_SESSION['usuario_id'] = $user['id'];
                    $_SESSION['usuario_nome'] = $user['nome'];
                    $_SESSION['usuario_login'] = $user['usuario'];
                    header("Location: index.php");
                    exit;
                } else {
                    $erro = "Senha incorreta para o usuário informado.";
                }
            } else {
                $erro = "Usuário não encontrado. Crie sua conta abaixo!";
            }
            $conn->close();
        }
    } else {
        $erro = "Preencha todos os campos.";
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - EstacionaAI</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(17, 24, 39, 0.85);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --accent-glow: rgba(59, 130, 246, 0.25);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    body {
      background: var(--bg);
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.08), transparent 40%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px 16px;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      width: 100%;
      max-width: 440px;
      padding: 36px 32px;
      backdrop-filter: blur(20px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.35s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo-area {
      text-align: center;
      margin-bottom: 28px;
    }

    .logo-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      box-shadow: 0 8px 24px var(--accent-glow);
      margin-bottom: 12px;
    }

    .logo-area h1 {
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #fff;
    }

    .logo-area p {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .alert-error {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.88rem;
      margin-bottom: 20px;
      font-weight: 500;
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 6px;
    }

    .form-control {
      width: 100%;
      padding: 13px 16px;
      font-size: 0.95rem;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #fff;
      outline: none;
      transition: all 0.2s;
    }

    .form-control:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
      background: rgba(0, 0, 0, 0.4);
    }

    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px var(--accent-glow);
      transition: all 0.2s ease;
      margin-top: 8px;
    }

    .btn-submit:hover {
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
      transform: translateY(-1px);
    }

    .footer-link {
      text-align: center;
      margin-top: 24px;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .footer-link a {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }

    .footer-link a:hover {
      color: #93c5fd;
      text-decoration: underline;
    }

    .demo-hint {
      margin-top: 24px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px dashed rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .demo-hint strong {
      color: #93c5fd;
    }
  </style>
</head>
<body>

  <div class="card">
    <div class="logo-area">
      <div class="logo-icon">🅿️</div>
      <h1>EstacionaAI</h1>
      <p>Gestão e Monitoramento de Vagas Inteligentes</p>
    </div>

    <?php if (!empty($erro)): ?>
      <div class="alert-error">
        ⚠️ <?php echo htmlspecialchars($erro); ?>
      </div>
    <?php endif; ?>

    <form method="POST" action="login.php">
      <div class="form-group">
        <label for="usuario">Usuário</label>
        <input type="text" id="usuario" name="usuario" class="form-control" placeholder="Digite seu usuário" required autofocus>
      </div>

      <div class="form-group">
        <label for="senha">Senha</label>
        <input type="password" id="senha" name="senha" class="form-control" placeholder="Digite sua senha" required>
      </div>

      <button type="submit" class="btn-submit">Acessar Painel</button>
    </form>

    <div class="footer-link">
      Ainda não tem conta? <a href="cadastro.php">Criar nova conta</a>
    </div>

    <div class="demo-hint">
      Conta padrão do sistema: Usuário: <strong>admin</strong> | Senha: <strong>senai123</strong>
    </div>
  </div>

</body>
</html>
