<?php
session_start();
if (!empty($_SESSION['usuario_id'])) {
    header("Location: painel.html");
    exit;
}
header("Location: index.html");
exit;
?>