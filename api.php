<?php
$servidor = "localhost";
$usuario  = "root";
$senha    = "";
$banco    = "esp8266";

$conn = new mysqli($servidor, $usuario, $senha, $banco);

if ($conn->connect_error) {
    die("Falha na conexao: " . $conn->connect_error);
}

if (isset($_POST['distancia'])) {
    $distancia = floatval($_POST['distancia']);
    $sql = "INSERT INTO leituras (distancia) VALUES ('$distancia')";

    if ($conn->query($sql) === TRUE) {
        echo "Sucesso: " . $distancia;
    } else {
        echo "Erro ao gravar: " . $conn->error;
    }
} else {
    echo "Nenhum dado recebido via POST.";
}

$conn->close();
?>
