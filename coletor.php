<?php
// IP que apareceu no Monitor Serial do ESP
$ip_esp = "192.168.0.100"; // IP real do seu ESP

// Conexão com o MySQL local
$conn = new mysqli("localhost", "root", "", "esp8266");

if ($conn->connect_error) {
    die("Erro no banco: " . $conn->connect_error);
}

// O PC busca o JSON diretamente de dentro do ESP
$url = "http://" . $ip_esp . "/status";
$context = stream_context_create(['http' => ['timeout' => 2]]);
$dadosJson = @file_get_contents($url, false, $context);

if ($dadosJson === FALSE) {
    echo "Não foi possível conectar ao ESP8266. Verifique se ele está ligado no Wi-Fi.<br>";
} else {
    $dados = json_decode($dadosJson, true);
    $distancia = floatval($dados['distancia']);

    $sql = "INSERT INTO leituras (distancia) VALUES ('$distancia')";
    if ($conn->query($sql) === TRUE) {
        echo "Sucesso! Distância coletada do ESP: " . $distancia . " cm<br>";
    } else {
        echo "Erro ao gravar: " . $conn->error . "<br>";
    }
}

$conn->close();
?>

<!-- Atualiza a página automaticamente a cada 3 segundos -->
<meta http-equiv="refresh" content="3">