/*
  Robot WASD 2 Motores - ESP32 + Bluetooth + L298N
  Control simple ON/OFF sin PWM
  
  Hardware:
  - ESP32 DevKit V1
  - 1x L298N Motor Driver
  - 2x Motores DC
*/

#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

// === PINES L298N ===
// Motor A (Izquierdo)
#define IN1_PIN 27
#define IN2_PIN 14

// Motor B (Derecho)  
#define IN3_PIN 12
#define IN4_PIN 13

#define LED_STATUS 2

// === VARIABLES ===
String estadoActual = "PARADO";
bool robotEnMovimiento = false;
unsigned long tiempoUltimoComando = 0;
bool dispositivoConectado = false;

// === FUNCIONES DE MOTORES ===
void setMotorA(bool encendido, bool adelante) {
  if (encendido) {
    digitalWrite(IN1_PIN, adelante ? HIGH : LOW);
    digitalWrite(IN2_PIN, adelante ? LOW : HIGH);
  } else {
    digitalWrite(IN1_PIN, LOW);
    digitalWrite(IN2_PIN, LOW);
  }
}

void setMotorB(bool encendido, bool adelante) {
  if (encendido) {
    digitalWrite(IN3_PIN, adelante ? HIGH : LOW);
    digitalWrite(IN4_PIN, adelante ? LOW : HIGH);
  } else {
    digitalWrite(IN3_PIN, LOW);
    digitalWrite(IN4_PIN, LOW);
  }
}

void avanzar() {
  setMotorA(true, true);
  setMotorB(true, true);
  estadoActual = "ADELANTE";
  robotEnMovimiento = true;
}

void retroceder() {
  setMotorA(true, false);
  setMotorB(true, false);
  estadoActual = "ATRÁS";
  robotEnMovimiento = true;
}

void girarIzquierda() {
  setMotorA(true, false);  // Izquierdo atrás
  setMotorB(true, true);   // Derecho adelante
  estadoActual = "GIRANDO IZQUIERDA";
  robotEnMovimiento = true;
}

void girarDerecha() {
  setMotorA(true, true);   // Izquierdo adelante
  setMotorB(true, false);  // Derecho atrás
  estadoActual = "GIRANDO DERECHA";
  robotEnMovimiento = true;
}

void pararTodos() {
  setMotorA(false, true);
  setMotorB(false, true);
  estadoActual = "PARADO";
  robotEnMovimiento = false;
}

// === SETUP ===
void setup() {
  Serial.begin(115200);
  
  // Configurar pines
  pinMode(IN1_PIN, OUTPUT);
  pinMode(IN2_PIN, OUTPUT);
  pinMode(IN3_PIN, OUTPUT);
  pinMode(IN4_PIN, OUTPUT);
  pinMode(LED_STATUS, OUTPUT);
  
  // Inicializar Bluetooth
  SerialBT.begin("Robot_WASD_2Motors");
  
  pararTodos();
  
  Serial.println("Robot WASD 2 Motores - Listo");
}

// === LOOP ===
void loop() {
  // Verificar conexión BT
  bool estadoBT = SerialBT.hasClient();
  if (estadoBT != dispositivoConectado) {
    dispositivoConectado = estadoBT;
    digitalWrite(LED_STATUS, estadoBT ? HIGH : LOW);
    if (!estadoBT) pararTodos();
  }
  
  // Procesar comandos
  if (SerialBT.available()) {
    char comando = toupper(SerialBT.read());
    tiempoUltimoComando = millis();
    
    switch(comando) {
      case 'W':
        avanzar();
        SerialBT.println("ADELANTE");
        break;
      case 'S':
        retroceder();
        SerialBT.println("ATRÁS");
        break;
      case 'A':
        girarIzquierda();
        SerialBT.println("IZQUIERDA");
        break;
      case 'D':
        girarDerecha();
        SerialBT.println("DERECHA");
        break;
      case 'X':
      case ' ':
        pararTodos();
        SerialBT.println("PARADO");
        break;
      case 'I':
        SerialBT.println("Estado: " + estadoActual);
        SerialBT.println("BT: " + String(dispositivoConectado ? "ON" : "OFF"));
        break;
    }
  }
  
  // Timeout seguridad - parar si no hay comandos por 5 segundos
  if (robotEnMovimiento && (millis() - tiempoUltimoComando > 5000)) {
    pararTodos();
    SerialBT.println("TIMEOUT - PARADO");
  }
  
  delay(20);
}

/*
CONEXIONES:
ESP32 → L298N
Pin 27 → IN1  
Pin 14 → IN2
Pin 12 → IN3
Pin 13 → IN4
GND → GND

L298N:
OUT1,OUT2 → Motor Izquierdo
OUT3,OUT4 → Motor Derecho
+12V → Pilas positivo
GND → Pilas negativo

MANTENER jumpers ENA y ENB en el L298N

COMANDOS:
W = Adelante
A = Izquierda  
S = Atrás
D = Derecha
X = Parar
I = Info
*/