#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

// ==========================================
// CONFIGURAÇÕES DO WI-FI
// ==========================================
const char* WIFI_SSID   = "EstacionaAI";
const char* WIFI_SENHA  = "47271890";

ESP8266WebServer servidor(80);

// ==========================================
// PINAGEM DO HARDWARE - 2 VAGAS
// ==========================================
// SENSOR 1 (VAGA 01)
const uint8_t TRIG_1 = D5; // GPIO 14
const uint8_t ECHO_1 = D6; // GPIO 12

// SENSOR 2 (VAGA 02)
const uint8_t TRIG_2 = D0; // GPIO 16
const uint8_t ECHO_2 = D8; // GPIO 15 (com resistor pull-down)

// LED RGB VAGA 01 (4 pinos: R, G, B e GND/-)
const uint8_t LED1_R = D1; // GPIO 5 (Vermelho)
const uint8_t LED1_G = D2; // GPIO 4 (Verde)
const uint8_t LED1_B = D7; // GPIO 13 (Azul)

// LED RGB VAGA 02 (4 pinos: R, G, B e GND/-)
// Se estiver usando 1 LED RGB ou 2 LEDs dedicados
const uint8_t LED2_R = D3; // GPIO 0
const uint8_t LED2_G = D4; // GPIO 2
const uint8_t LED2_B = 255; // Não conectado ou opcional

// ==========================================
// ESTRUTURA DE ESTADO DE CADA VAGA
// ==========================================
struct Vaga {
  String nome;
  uint8_t trigPin;
  uint8_t echoPin;
  uint8_t rPin;
  uint8_t gPin;
  uint8_t bPin;
  float distancia;
  bool temLeitura;
  bool reservado;
  String reservadoPor;
};

Vaga vaga1 = {"Vaga 01", TRIG_1, ECHO_1, LED1_R, LED1_G, LED1_B, 0.0, false, false, ""};
Vaga vaga2 = {"Vaga 02", TRIG_2, ECHO_2, LED2_R, LED2_G, LED2_B, 0.0, false, false, ""};

unsigned long ultimaMedicao = 0;
unsigned long ultimaTentativaWiFi = 0;
unsigned long ultimoPrintSerial = 0;

// ==========================================
// CONTROLE DOS LEDS RGB (Cátodo comum: HIGH liga)
// ==========================================
void setCorRGB(const Vaga &v, bool r, bool g, bool b) {
  if (v.rPin != 255) digitalWrite(v.rPin, r ? HIGH : LOW);
  if (v.gPin != 255) digitalWrite(v.gPin, g ? HIGH : LOW);
  if (v.bPin != 255) digitalWrite(v.bPin, b ? HIGH : LOW);
}

void atualizarLED(Vaga &v) {
  // PRIORIDADE 1: Reservada via site -> Amarelo (Vermelho + Verde acesos, Azul apagado)
  if (v.reservado) {
    setCorRGB(v, true, true, false);
    return;
  }

  // Se não teve leitura ainda -> Apagado
  if (!v.temLeitura) {
    setCorRGB(v, false, false, false);
    return;
  }

  // PRIORIDADE 2: Leitura do sensor ultrassônico
  if (v.distancia > 30.0) {
    // Livre (> 30cm) -> Verde (R=0, G=1, B=0)
    setCorRGB(v, false, true, false);
  } else {
    // Ocupada (<= 30cm) -> Vermelho (R=1, G=0, B=0)
    setCorRGB(v, true, false, false);
  }
}

String obterStatus(const Vaga &v) {
  if (v.reservado) return "RESERVADA";
  if (!v.temLeitura) return "AGUARDANDO";
  if (v.distancia > 30.0) return "LIVRE";
  return "OCUPADA";
}

String obterCor(const Vaga &v) {
  if (v.reservado) return "AMARELO";
  if (!v.temLeitura) return "APAGADO";
  if (v.distancia > 30.0) return "VERDE";
  return "VERMELHO";
}

// ==========================================
// LEITURA DOS SENSORES ULTRASSÔNICOS
// ==========================================
float lerDistancia(uint8_t trigPin, uint8_t echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  unsigned long tempo = pulseIn(echoPin, HIGH, 30000UL);
  if (tempo > 0) {
    return (tempo * 0.0343) / 2.0;
  }
  return 0.0;
}

void medirTodas() {
  // Mede Vaga 01
  float d1 = lerDistancia(vaga1.trigPin, vaga1.echoPin);
  if (d1 > 0) {
    vaga1.distancia = d1;
    vaga1.temLeitura = true;
  }
  atualizarLED(vaga1);

  delay(25); // Intervalo essencial para evitar eco cruzado entre os sensores

  // Mede Vaga 02
  float d2 = lerDistancia(vaga2.trigPin, vaga2.echoPin);
  if (d2 > 0) {
    vaga2.distancia = d2;
    vaga2.temLeitura = true;
  }
  atualizarLED(vaga2);
}

// ==========================================
// ROTAS DO SERVIDOR WEB
// ==========================================
void rotaStatus() {
  String json = "{";
  // Compatibilidade com cliente legado (Vaga 01)
  json += "\"distancia\":" + (vaga1.temLeitura ? String(vaga1.distancia, 1) : "0.0") + ",";
  json += "\"status\":\"" + obterStatus(vaga1) + "\",";
  json += "\"cor\":\"" + obterCor(vaga1) + "\",";
  json += "\"reservado\":" + String(vaga1.reservado ? "true" : "false") + ",";
  json += "\"reservado_por\":\"" + vaga1.reservadoPor + "\",";

  // Objeto completo com as 2 vagas
  json += "\"vagas\":{";

  // Vaga 01
  json += "\"Vaga 01\":{";
  json += "\"distancia\":" + (vaga1.temLeitura ? String(vaga1.distancia, 1) : "0.0") + ",";
  json += "\"status\":\"" + obterStatus(vaga1) + "\",";
  json += "\"cor\":\"" + obterCor(vaga1) + "\",";
  json += "\"reservado\":" + String(vaga1.reservado ? "true" : "false") + ",";
  json += "\"reservado_por\":\"" + vaga1.reservadoPor + "\"";
  json += "},";

  // Vaga 02
  json += "\"Vaga 02\":{";
  json += "\"distancia\":" + (vaga2.temLeitura ? String(vaga2.distancia, 1) : "0.0") + ",";
  json += "\"status\":\"" + obterStatus(vaga2) + "\",";
  json += "\"cor\":\"" + obterCor(vaga2) + "\",";
  json += "\"reservado\":" + String(vaga2.reservado ? "true" : "false") + ",";
  json += "\"reservado_por\":\"" + vaga2.reservadoPor + "\"";
  json += "}";

  json += "}";
  json += "}";

  servidor.sendHeader("Access-Control-Allow-Origin", "*");
  servidor.send(200, "application/json; charset=utf-8", json);
}

void rotaReservar() {
  String vagaAlvo = servidor.hasArg("vaga") ? servidor.arg("vaga") : "Vaga 01";
  String nome = servidor.hasArg("nome") ? servidor.arg("nome") : "Agendado via Site";

  if (vagaAlvo == "Vaga 02" || vagaAlvo == "2") {
    vaga2.reservado = true;
    vaga2.reservadoPor = nome;
    atualizarLED(vaga2);
  } else {
    vaga1.reservado = true;
    vaga1.reservadoPor = nome;
    atualizarLED(vaga1);
  }

  Serial.println("\n>>> [SITE] VAGA RESERVADA! <<<");
  Serial.print("Vaga: "); Serial.println(vagaAlvo);
  Serial.print("Motorista: "); Serial.println(nome);

  servidor.sendHeader("Access-Control-Allow-Origin", "*");
  servidor.send(200, "application/json; charset=utf-8", "{\"sucesso\":true,\"reservado\":true}");
}

void rotaLiberar() {
  String vagaAlvo = servidor.hasArg("vaga") ? servidor.arg("vaga") : "todas";

  if (vagaAlvo == "Vaga 01" || vagaAlvo == "1") {
    vaga1.reservado = false;
    vaga1.reservadoPor = "";
    atualizarLED(vaga1);
  } else if (vagaAlvo == "Vaga 02" || vagaAlvo == "2") {
    vaga2.reservado = false;
    vaga2.reservadoPor = "";
    atualizarLED(vaga2);
  } else {
    // Libera ambas
    vaga1.reservado = false;
    vaga1.reservadoPor = "";
    vaga2.reservado = false;
    vaga2.reservadoPor = "";
    atualizarLED(vaga1);
    atualizarLED(vaga2);
  }

  Serial.println("\n>>> [SITE] VAGA LIBERADA! <<<");
  servidor.sendHeader("Access-Control-Allow-Origin", "*");
  servidor.send(200, "application/json; charset=utf-8", "{\"sucesso\":true,\"reservado\":false}");
}

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n\n====================================");
  Serial.println("  SENAI PARKING - 2 VAGAS (ESP8266) ");
  Serial.println("====================================");

  // Configura pinos LED RGB Vaga 01
  pinMode(vaga1.rPin, OUTPUT);
  pinMode(vaga1.gPin, OUTPUT);
  if (vaga1.bPin != 255) pinMode(vaga1.bPin, OUTPUT);
  setCorRGB(vaga1, false, false, false);

  // Configura pinos Sensor Vaga 01
  pinMode(vaga1.trigPin, OUTPUT);
  pinMode(vaga1.echoPin, INPUT);
  digitalWrite(vaga1.trigPin, LOW);

  // Configura pinos LED Vaga 02
  pinMode(vaga2.rPin, OUTPUT);
  pinMode(vaga2.gPin, OUTPUT);
  if (vaga2.bPin != 255) pinMode(vaga2.bPin, OUTPUT);
  setCorRGB(vaga2, false, false, false);

  // Configura pinos Sensor Vaga 02
  pinMode(vaga2.trigPin, OUTPUT);
  pinMode(vaga2.echoPin, INPUT);
  digitalWrite(vaga2.trigPin, LOW);

  // Teste de inicialização dos LEDs (Pisca 1 vez rápido para confirmar funcionamento elétrico)
  setCorRGB(vaga1, true, false, false); // Vermelho
  delay(200);
  setCorRGB(vaga1, false, true, false); // Verde
  delay(200);
  setCorRGB(vaga1, false, false, false); // Apaga

  // Faz a primeira medição
  medirTodas();

  servidor.on("/status", rotaStatus);
  servidor.on("/reservar", rotaReservar);
  servidor.on("/liberar", rotaLiberar);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_SENHA);
  Serial.print("Conectando ao Wi-Fi: ");
  Serial.println(WIFI_SSID);

  // Timeout não-bloqueante de 8 segundos: se o Wi-Fi demorar, o LED e os sensores continuam funcionando normalmente!
  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - inicio < 8000)) {
    delay(400);
    Serial.print(".");
    yield();
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n>>> Wi-Fi CONECTADO COM SUCESSO! <<<");
    Serial.print(">>> IP DO ESP: http://");
    Serial.print(WiFi.localIP());
    Serial.println("/ <<<");
    servidor.begin();
    Serial.println("Servidor Web pronto na porta 80!");
  } else {
    Serial.println("\n[AVISO] Nao conectou ao Wi-Fi agora. Rodando autonomo (Sensor + LEDs ativos)!");
  }
}

// ==========================================
// LOOP
// ==========================================
void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    servidor.handleClient();
  } else {
    // Tenta reconectar a cada 15 segundos em segundo plano, sem travar as leituras
    if (millis() - ultimaTentativaWiFi >= 15000) {
      ultimaTentativaWiFi = millis();
      WiFi.begin(WIFI_SSID, WIFI_SENHA);
    }
  }

  // Medição contínua dos dois sensores a cada 300 ms
  if (millis() - ultimaMedicao >= 300) {
    ultimaMedicao = millis();
    medirTodas();
  }

  // Print de diagnóstico no Serial Monitor a cada 1 segundo
  if (millis() - ultimoPrintSerial >= 1000) {
    ultimoPrintSerial = millis();
    Serial.print("[VAGA 01] ");
    Serial.print(vaga1.distancia, 1);
    Serial.print(" cm | ");
    Serial.print(obterStatus(vaga1));
    Serial.print(" ("); Serial.print(obterCor(vaga1)); Serial.print(")");

    Serial.print("  ||  [VAGA 02] ");
    Serial.print(vaga2.distancia, 1);
    Serial.print(" cm | ");
    Serial.print(obterStatus(vaga2));
    Serial.print(" ("); Serial.print(obterCor(vaga2)); Serial.println(")");
  }

  yield();
}
