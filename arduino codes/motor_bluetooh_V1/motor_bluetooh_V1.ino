/*
  Robot WASD - Arduino UNO + L293D Shield + HC-05 Bluetooth
  Control inalámbrico estilo videojuego
  
  Hardware:
  - Arduino UNO
  - L293D Motor Shield (AFMotor)
  - 4 motores TT o similares
  - Módulo HC-05/HC-06 Bluetooth
  - 8 pilas AA para motores
  
  Conexiones HC-05:
  - VCC → Arduino 5V
  - GND → Arduino GND
  - RX → Arduino Pin 9
  - TX → Arduino Pin 10
*/

#include <AFMotor.h>
#include <SoftwareSerial.h>

// Bluetooth en pines 9,10 (como en el código original)
SoftwareSerial bluetooth(9, 10); // RX, TX

// Motores en L293D Shield
AF_DCMotor motor1(1); // M1 - Delantero izquierdo
AF_DCMotor motor2(2); // M2 - Trasero izquierdo  
AF_DCMotor motor3(3); // M3 - Delantero derecho
AF_DCMotor motor4(4); // M4 - Trasero derecho

// Variables de control
int velocidad = 200;           // Velocidad inicial (0-255)
int velocidadMinima = 50;      // Velocidad mínima
int velocidadMaxima = 255;     // Velocidad máxima
String estadoActual = "PARADO";
bool modoTurbo = false;
char comando;
unsigned long tiempoUltimoComando = 0;

void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600); // Velocidad HC-05/HC-06
  
  Serial.println("=== ROBOT WASD UNO v2.0 ===");
  Serial.println("Arduino UNO + L293D + HC-05");
  Serial.println("Bluetooth en pines 9,10");
  Serial.println("Conectar celular a HC-05/HC-06");
  Serial.println("");
  
  // Configurar velocidad inicial motores
  motor1.setSpeed(velocidad);
  motor2.setSpeed(velocidad);
  motor3.setSpeed(velocidad);
  motor4.setSpeed(velocidad);
  
  // Parar todos al inicio
  pararTodos();
  mostrarComandos();
  
  // Mensaje inicial por Bluetooth
  delay(1000); // Esperar inicialización HC-05
  bluetooth.println("🤖 Robot UNO WASD conectado!");
  bluetooth.println("🎮 W=↑ A=← S=↓ D=→ X=stop");
  bluetooth.println("⚡ +=vel+ -=vel- T=turbo ?=ayuda");
}

void loop() {
  // Leer comandos Bluetooth
  if (bluetooth.available()) {
    comando = bluetooth.read();
    procesarComando(comando);
    tiempoUltimoComando = millis();
  }
  
  // También leer desde monitor serie (debug)
  if (Serial.available()) {
    comando = Serial.read();
    procesarComando(comando);
  }
  
  // Timeout de seguridad (parar si no hay comandos por 3 segundos)
  verificarTimeout();
  
  delay(50); // Estabilidad
}

void procesarComando(char cmd) {
  cmd = toupper(cmd); // Convertir a mayúscula
  
  Serial.print("📨 Comando: ");
  Serial.println(cmd);
  
  switch(cmd) {
    // === MOVIMIENTO WASD ===
    case 'W':
      avanzar();
      bluetooth.println("🤖 ⬆️ ADELANTE");
      break;
      
    case 'S':
      retroceder();
      bluetooth.println("🤖 ⬇️ ATRÁS");
      break;
      
    case 'A':
      girarIzquierda();
      bluetooth.println("🤖 ⬅️ IZQUIERDA");
      break;
      
    case 'D':
      girarDerecha();
      bluetooth.println("🤖 ➡️ DERECHA");
      break;
      
    case 'X':
    case ' ':
      pararTodos();
      bluetooth.println("🤖 🛑 PARADO");
      break;
      
    // === CONTROL VELOCIDAD ===
    case '+':
    case '=':
      aumentarVelocidad();
      break;
      
    case '-':
    case '_':
      disminuirVelocidad();
      break;
      
    // === MODO TURBO ===
    case 'T':
      toggleTurbo();
      break;
      
    // === AYUDA E INFO ===
    case '?':
    case 'H':
      mostrarAyuda();
      break;
      
    case 'I':
      mostrarInfo();
      break;
      
    case 'R':
      resetearConfiguracion();
      break;
      
    default:
      if (cmd >= 32 && cmd <= 126) {
        bluetooth.println("❓ Comando [" + String(cmd) + "] no válido");
        bluetooth.println("💡 Envía ? para ayuda");
      }
      break;
  }
}

// === FUNCIONES DE MOVIMIENTO ===

void avanzar() {
  int vel = modoTurbo ? velocidadMaxima : velocidad;
  
  motor1.setSpeed(vel);
  motor2.setSpeed(vel);
  motor3.setSpeed(vel);
  motor4.setSpeed(vel);
  
  motor1.run(FORWARD);
  motor2.run(FORWARD);
  motor3.run(FORWARD);
  motor4.run(FORWARD);
  
  estadoActual = "ADELANTE";
  Serial.println("→ ADELANTE");
}

void retroceder() {
  int vel = modoTurbo ? velocidadMaxima : velocidad;
  
  motor1.setSpeed(vel);
  motor2.setSpeed(vel);
  motor3.setSpeed(vel);
  motor4.setSpeed(vel);
  
  motor1.run(BACKWARD);
  motor2.run(BACKWARD);
  motor3.run(BACKWARD);
  motor4.run(BACKWARD);
  
  estadoActual = "ATRÁS";
  Serial.println("→ ATRÁS");
}

void girarIzquierda() {
  int vel = modoTurbo ? velocidadMaxima : velocidad;
  
  // Motores izquierdos PARADOS (ahorro energía)
  motor1.setSpeed(0);
  motor2.setSpeed(0);
  motor1.run(RELEASE);
  motor2.run(RELEASE);
  
  // Motores derechos ADELANTE
  motor3.setSpeed(vel);
  motor4.setSpeed(vel);
  motor3.run(FORWARD);
  motor4.run(FORWARD);
  
  estadoActual = "GIRANDO IZQUIERDA";
  Serial.println("→ IZQUIERDA");
}

void girarDerecha() {
  int vel = modoTurbo ? velocidadMaxima : velocidad;
  
  // Motores derechos PARADOS (ahorro energía)
  motor3.setSpeed(0);
  motor4.setSpeed(0);
  motor3.run(RELEASE);
  motor4.run(RELEASE);
  
  // Motores izquierdos ADELANTE
  motor1.setSpeed(vel);
  motor2.setSpeed(vel);
  motor1.run(FORWARD);
  motor2.run(FORWARD);
  
  estadoActual = "GIRANDO DERECHA";
  Serial.println("→ DERECHA");
}

void pararTodos() {
  motor1.setSpeed(0);
  motor2.setSpeed(0);
  motor3.setSpeed(0);
  motor4.setSpeed(0);
  
  motor1.run(RELEASE);
  motor2.run(RELEASE);
  motor3.run(RELEASE);
  motor4.run(RELEASE);
  
  estadoActual = "PARADO";
  Serial.println("→ PARADO");
}

// === CONTROL DE VELOCIDAD ===

void aumentarVelocidad() {
  if (velocidad < velocidadMaxima) {
    velocidad += 25;
    if (velocidad > velocidadMaxima) velocidad = velocidadMaxima;
    
    // Actualizar velocidad en motores
    motor1.setSpeed(velocidad);
    motor2.setSpeed(velocidad);
    motor3.setSpeed(velocidad);
    motor4.setSpeed(velocidad);
    
    Serial.println("⚡ Velocidad: " + String(velocidad));
    bluetooth.println("🚀 Velocidad: " + String(velocidad) + "/255");
  } else {
    bluetooth.println("⚡ Velocidad máxima alcanzada!");
  }
}

void disminuirVelocidad() {
  if (velocidad > velocidadMinima) {
    velocidad -= 25;
    if (velocidad < velocidadMinima) velocidad = velocidadMinima;
    
    // Actualizar velocidad en motores
    motor1.setSpeed(velocidad);
    motor2.setSpeed(velocidad);
    motor3.setSpeed(velocidad);
    motor4.setSpeed(velocidad);
    
    Serial.println("🐌 Velocidad: " + String(velocidad));
    bluetooth.println("🐢 Velocidad: " + String(velocidad) + "/255");
  } else {
    bluetooth.println("🐌 Velocidad mínima alcanzada!");
  }
}

void toggleTurbo() {
  modoTurbo = !modoTurbo;
  if (modoTurbo) {
    bluetooth.println("🚀 TURBO ON - Velocidad máxima!");
    Serial.println("🚀 TURBO ACTIVADO");
  } else {
    bluetooth.println("🐢 TURBO OFF - Velocidad: " + String(velocidad));
    Serial.println("🐢 TURBO DESACTIVADO");
  }
}

// === FUNCIONES DE INFORMACIÓN ===

void mostrarComandos() {
  Serial.println("📋 === COMANDOS WASD ===");
  Serial.println("🎮 W/A/S/D = Movimiento");
  Serial.println("⚡ +/- = Velocidad");
  Serial.println("🚀 T = Turbo");
  Serial.println("🛑 X = Parar");
  Serial.println("❓ ? = Ayuda");
  Serial.println("📊 I = Info");
  Serial.println("🔄 R = Reset");
  Serial.println("=====================");
}

void mostrarAyuda() {
  bluetooth.println("📋 === ROBOT UNO WASD ===");
  bluetooth.println("🎮 MOVIMIENTO:");
  bluetooth.println("  W = ⬆️ Adelante");
  bluetooth.println("  A = ⬅️ Izquierda");
  bluetooth.println("  S = ⬇️ Atrás");
  bluetooth.println("  D = ➡️ Derecha");
  bluetooth.println("  X = 🛑 Parar");
  bluetooth.println("");
  bluetooth.println("⚡ VELOCIDAD:");
  bluetooth.println("  + = Aumentar velocidad");
  bluetooth.println("  - = Disminuir velocidad");
  bluetooth.println("  T = Modo turbo on/off");
  bluetooth.println("");
  bluetooth.println("📊 EXTRA:");
  bluetooth.println("  I = Info sistema");
  bluetooth.println("  R = Reset configuración");
  bluetooth.println("====================");
}

void mostrarInfo() {
  bluetooth.println("📊 === INFO SISTEMA ===");
  bluetooth.println("🤖 Estado: " + estadoActual);
  bluetooth.println("⚡ Velocidad: " + String(velocidad) + "/255");
  bluetooth.println("🚀 Turbo: " + String(modoTurbo ? "ON" : "OFF"));
  bluetooth.println("📡 Bluetooth: HC-05 pines 9,10");
  bluetooth.println("🔋 RAM libre: " + String(freeMemory()) + " bytes");
  bluetooth.println("🕒 Uptime: " + String(millis()/1000) + " seg");
  bluetooth.println("==================");
}

void resetearConfiguracion() {
  velocidad = 200;
  modoTurbo = false;
  pararTodos();
  
  // Actualizar velocidad motores
  motor1.setSpeed(velocidad);
  motor2.setSpeed(velocidad);
  motor3.setSpeed(velocidad);
  motor4.setSpeed(velocidad);
  
  bluetooth.println("🔄 Configuración reseteada");
  bluetooth.println("⚡ Velocidad: " + String(velocidad));
  bluetooth.println("🚀 Turbo: OFF");
  Serial.println("🔄 Reset realizado");
}

// === FUNCIONES DE SEGURIDAD ===

void verificarTimeout() {
  // Parar robot si no hay comandos por 3 segundos (seguridad)
  if (estadoActual != "PARADO" && tiempoUltimoComando > 0) {
    if (millis() - tiempoUltimoComando > 3000) {
      pararTodos();
      bluetooth.println("⏰ Timeout - Robot parado por seguridad");
      Serial.println("⏰ Timeout safety stop");
    }
  }
}

// Función para calcular memoria libre (opcional)
int freeMemory() {
  extern int __heap_start, *__brkval;
  int v;
  return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval);
}

/*
=== INSTRUCCIONES DE USO ===

HARDWARE NECESARIO:
✅ Arduino UNO
✅ L293D Motor Shield montado
✅ 4x motores TT o similares
✅ Módulo HC-05 o HC-06 Bluetooth
✅ 8 pilas AA + portapilas
✅ Cables jumper

CONEXIONES HC-05/HC-06:
🔴 VCC → Arduino 5V
⚫ GND → Arduino GND
🟡 RX → Arduino Pin 9
🟢 TX → Arduino Pin 10

LIBRERÍAS NECESARIAS:
📚 AFMotor (Adafruit Motor Shield Library)
📚 SoftwareSerial (incluida en Arduino IDE)

CONFIGURACIÓN:
🔧 Board: "Arduino UNO"
⚡ Port: Tu puerto COM
📱 App: "Serial Bluetooth Terminal"
🔍 Conectar a: "HC-05" o "HC-06"

COMANDOS WASD:
🎮 W = ⬆️ Adelante
🎮 A = ⬅️ Izquierda  
🎮 S = ⬇️ Atrás
🎮 D = ➡️ Derecha
🛑 X = Parar
⚡ + = Subir velocidad
🐌 - = Bajar velocidad
🚀 T = Modo turbo
❓ ? = Ayuda
📊 I = Info sistema
🔄 R = Reset

CARACTERÍSTICAS:
🤖 Control inalámbrico desde celular
⚡ Control velocidad dinámico
🚀 Modo turbo activable
🛡️ Timeout de seguridad
🔄 Giros modo ahorro energía
📊 Telemetría básica

¡ROBOT WASD ARDUINO UNO LISTO! 🎮
*/