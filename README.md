# 🚗 SENAI Parking — Estacionamento Inteligente com ESP8266 & IoT

Sistema completo de monitoramento, reserva e liberação inteligente de vagas de estacionamento integrado com hardware IoT (**ESP8266 NodeMCU**, **2 Sensores Ultrassônicos HC-SR04** e **LEDs RGB**).

---

## 📁 Estrutura de Arquivos

| Arquivo / Pasta | Descrição |
| :--- | :--- |
| `firmware_esp8266.ino` | Código completo para o Arduino / ESP8266 (leitura de 2 sensores ultrassônicos e controle de LEDs RGB). |
| `banco_esp8266.sql` | Dump completo do banco de dados MySQL (`esp8266`) com tabelas de usuários, veículos, agendamentos e leituras. |
| `acoes.php` | Backend em PHP / API REST conectando com o ESP8266 e com o banco MySQL. |
| `agendar.html` | Página de visualização das vagas em tempo real (Vaga 01 e Vaga 02) com bloqueio inteligente de reserva. |
| `painel.html` | Dashboard principal com indicadores de vagas livres, ocupadas e agendadas. |
| `minhas-vagas.html` | Histórico e gerenciamento de agendamentos do usuário logado. |
| `veiculos.html` | Cadastro e gerenciamento de veículos vinculados ao usuário. |
| `perfil.html` | Perfil do usuário com alteração de senha e notificações. |
| `index.html` | Tela de login e cadastro de usuários no MySQL. |
| `css/` e `js/` | Estilos visuais e lógica de polling e reatividade em tempo real. |

---

## 🔌 Pinagem no ESP8266 (NodeMCU)

| Componente | Pino do Módulo | Pino no ESP8266 | Função |
| :--- | :--- | :--- | :--- |
| **Sensor 1 (Vaga 01) - TRIG** | TRIG | **D5** (GPIO 14) | Disparo ultrassônico |
| **Sensor 1 (Vaga 01) - ECHO** | ECHO | **D6** (GPIO 12) | Retorno do pulso |
| **LED RGB 1 (Vaga 01) - R** | R (Vermelho) | **D1** (GPIO 5) | Ocupada |
| **LED RGB 1 (Vaga 01) - G** | G (Verde) | **D2** (GPIO 4) | Livre |
| **LED RGB 1 (Vaga 01) - B** | B (Azul) | **D7** (GPIO 13) | Auxiliar / Desligado |
| **LED RGB 1 - Cátodo (-)** | - (GND) | **GND** | Terra |
| | | | |
| **Sensor 2 (Vaga 02) - TRIG** | TRIG | **D0** (GPIO 16) | Disparo ultrassônico |
| **Sensor 2 (Vaga 02) - ECHO** | ECHO | **D8** (GPIO 15) | Retorno do pulso |
| **LED Vaga 02 - R** | R | **D3** (GPIO 0) | Ocupada |
| **LED Vaga 02 - G** | G | **D4** (GPIO 2) | Livre |
| **Alimentação dos Sensores** | VCC | **VIN (5V)** | Alimentação 5V |
| **Terra dos Sensores** | GND | **GND** | Terra comum |

---

## 🚦 Regras de Cores e Estados

1. **Livre ($> 30\text{ cm}$)**: LED **Verde** aceso. Vaga disponível para reserva.
2. **Ocupada ($\le 30\text{ cm}$)**: LED **Vermelho** aceso. Botão de reserva bloqueado com aviso.
3. **Agendada**: LED **Amarelo** (Vermelho + Verde acesos simultaneamente). Apenas o próprio usuário que agendou pode cancelar/liberar a vaga.

---

## 🛠️ Como Executar Localmente

1. Coloque a pasta do projeto no servidor web Apache (ex: `C:\xampp\htdocs\esp\` ou `C:\Programas\htdocs\esp\`).
2. Importe o arquivo `banco_esp8266.sql` no phpMyAdmin ou MySQL (`CREATE DATABASE esp8266;`).
3. Abra a IDE do Arduino, carregue o arquivo `firmware_esp8266.ino` para o ESP8266 na porta COM correspondente.
4. Acesse pelo navegador: `http://localhost:8080/esp/` ou `http://localhost/esp/`.
