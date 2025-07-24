/*
  Robot de 4 motores controlado por Bluetooth HC-06
  Shield Motor Driver L293D (Placa azul que se monta en Arduino)
  Comandos: W=adelante, S=atrás, A=izquierda, D=derecha, R=repetir último, Q=parar, L=LED
  
  Conexiones HC-06:
  - VCC -> 5V Arduino
  - GND -> GND Arduino  
  - TX -> Pin 2 Arduino (RX software)
  - RX -> Pin 3 Arduino (TX software)
  
  Tu Motor Shield usa estos pines internamente:
  - Motor 1 (M1): Pin 11 (PWM), Pin 12 (DIR)
  - Motor 2 (M2): Pin 3 (PWM), Pin 12 (DIR) 
  - Motor 3 (M3): Pin 5 (PWM), Pin 8 (DIR)
  - Motor 4 (M4): Pin 6 (PWM), Pin 7 (DIR)
  
  Distribución de motores:
  M1 = Delantero Izquierdo
  M2 = Delantero Derecho  
  M3 = Trasero Izquierdo
  M4 = Trasero Derecho
*/

#include <SoftwareSerial.h>

// Configuración Bluetooth HC-06
SoftwareSerial bluetooth(2, 3); // RX, TX (usar pines libres)

// Pines del Motor Shield (pines que usa internamente)
// Motor 1 (Delantero Izquierdo)
#define M1_PWM 11
#define M1_DIR 12

// Motor 2 (Delantero Derecho) 
#define M2_PWM 3
#define M2_DIR 12  // Comparte DIR con M1

// Motor 3 (Trasero Izquierdo)
#define M3_PWM 5
#define M3_DIR 8

// Motor 4 (Trasero Derecho)
#define M4_PWM 6
#define M4_DIR 7

// Variables de control
char comando = ' ';
char ultimoComando = ' ';
bool ledEncendido = false;

void setup() {
  // Inicializar comunicación serie
  Serial.begin(9600);
  bluetooth.begin(9600);
  
  // Configurar pines del motor shield
  pinMode(M1_PWM, OUTPUT);
  pinMode(M1_DIR, OUTPUT);
  pinMode(M2_PWM, OUTPUT);
  // M2_DIR es el mismo que M1_DIR
  pinMode(M3_PWM, OUTPUT);
  pinMode(M3_DIR, OUTPUT);
  pinMode(M4_PWM, OUTPUT);
  pinMode(M4_DIR, OUTPUT);
  
  // Configurar LED integrado (Pin 13 libre)
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
  
  // Parar todos los motores al inicio
  pararTodos();
  
  Serial.println("Robot con Motor Shield iniciado - MODO AHORRO BATERÍA");
  Serial.println("W=adelante(delanteros), S=atrás(traseros), A=izq(derechos), D=der(izquierdos)");
  Serial.println("L=LED on/off, R=repetir, Q=parar");
  Serial.println("Shield detectado: 4 motores en terminales azules");
}

void loop() {
  // Leer comando del Bluetooth
  if (bluetooth.available()) {
    comando = bluetooth.read();
    
    // PRINT DIAGNÓSTICO
    Serial.print(">>> RECIBIDO RAW: '");
    Serial.print(comando);
    Serial.print("' (ASCII: ");
    Serial.print((int)comando);
    Serial.println(")");
    
    comando = toupper(comando);
    
    Serial.print(">>> PROCESANDO: '");
    Serial.print(comando);
    Serial.println("'");
    
    // Procesar comandos
    switch (comando) {
      case 'W':
        avanzar();
        ultimoComando = 'W';
        break;
        
      case 'S':
        retroceder();
        ultimoComando = 'S';
        break;
        
      case 'A':
        girarIzquierda();
        ultimoComando = 'A';
        break;
        
      case 'D':
        girarDerecha();
        ultimoComando = 'D';
        break;
        
      case 'R':
        repetirUltimoComando();
        break;
        
      case 'Q':
        pararTodos();
        break;
        
      case 'L':
        toggleLED();
        break;
        
      default:
        Serial.print(">>> COMANDO NO RECONOCIDO: '");
        Serial.print(comando);
        Serial.print("' (ASCII: ");
        Serial.print((int)comando);
        Serial.println(")");
        break;
    }
    
    Serial.println(">>> COMANDO COMPLETADO");
    Serial.println("");
  }
}

// Función para avanzar (solo motores delanteros M1 y M2)
void avanzar() {
  Serial.println("Avanzando - solo motores delanteros (M1, M2)...");
  
  // PARAR motores traseros
  analogWrite(M3_PWM, 0);
  analogWrite(M4_PWM, 0);
  
  // ACTIVAR solo motores delanteros
  digitalWrite(M1_DIR, HIGH);  // M1 adelante
  analogWrite(M1_PWM, 255);    // M1 velocidad máxima
  
  digitalWrite(M2_DIR, HIGH);  // M2 adelante  
  analogWrite(M2_PWM, 255);    // M2 velocidad máxima
}

// Función para retroceder (solo motores traseros M3 y M4)
void retroceder() {
  Serial.println("Retrocediendo - solo motores traseros (M3, M4)...");
  
  // PARAR motores delanteros
  analogWrite(M1_PWM, 0);
  analogWrite(M2_PWM, 0);
  
  // ACTIVAR solo motores traseros
  digitalWrite(M3_DIR, LOW);   // M3 atrás
  analogWrite(M3_PWM, 255);    // M3 velocidad máxima
  
  digitalWrite(M4_DIR, LOW);   // M4 atrás
  analogWrite(M4_PWM, 255);    // M4 velocidad máxima
}

// Función para girar izquierda (solo motores derechos M2 y M4)
void girarIzquierda() {
  Serial.println("Girando izquierda - solo motores derechos (M2, M4)...");
  
  // PARAR motores izquierdos
  analogWrite(M1_PWM, 0);
  analogWrite(M3_PWM, 0);
  
  // ACTIVAR solo motores derechos
  digitalWrite(M2_DIR, HIGH);  // M2 adelante
  analogWrite(M2_PWM, 255);
  
  digitalWrite(M4_DIR, HIGH);  // M4 adelante  
  analogWrite(M4_PWM, 255);
}

// Función para girar derecha (solo motores izquierdos M1 y M3)
void girarDerecha() {
  Serial.println("Girando derecha - solo motores izquierdos (M1, M3)...");
  
  // PARAR motores derechos
  analogWrite(M2_PWM, 0);
  analogWrite(M4_PWM, 0);
  
  // ACTIVAR solo motores izquierdos
  digitalWrite(M1_DIR, HIGH);  // M1 adelante
  analogWrite(M1_PWM, 255);
  
  digitalWrite(M3_DIR, HIGH);  // M3 adelante
  analogWrite(M3_PWM, 255);
}

// Función para repetir último comando
void repetirUltimoComando() {
  Serial.print("Repitiendo último comando: ");
  Serial.println(ultimoComando);
  
  switch (ultimoComando) {
    case 'W':
      avanzar();
      break;
    case 'S':
      retroceder();
      break;
    case 'A':
      girarIzquierda();
      break;
    case 'D':
      girarDerecha();
      break;
    default:
      Serial.println("No hay comando previo válido");
      pararTodos();
      break;
  }
}

// Función para parar todos los motores
void pararTodos() {
  Serial.println("Parando todos los motores...");
  
  // Parar todos los motores (PWM a 0)
  analogWrite(M1_PWM, 0);
  analogWrite(M2_PWM, 0);
  analogWrite(M3_PWM, 0);
  analogWrite(M4_PWM, 0);
}

// Función para controlar LED
void toggleLED() {
  ledEncendido = !ledEncendido;
  digitalWrite(LED_BUILTIN, ledEncendido);
  
  if (ledEncendido) {
    Serial.println("LED encendido");
  } else {
    Serial.println("LED apagado");
  }
}

/* 
  CONEXIONES FÍSICAS:
  
  1. HC-06 BLUETOOTH:
     - VCC -> 5V Arduino
     - GND -> GND Arduino
     - TX -> Pin 2 Arduino  
     - RX -> Pin 3 Arduino
  
  2. MOTOR SHIELD:
     - Se monta directamente sobre Arduino
     - Conecta motores en terminales azules M1, M2, M3, M4
     - Alimentación: 6-12V en bloque de alimentación del shield
  
  3. MOTORES:
     - M1 (terminal azul) = Motor delantero izquierdo
     - M2 (terminal azul) = Motor delantero derecho
     - M3 (terminal azul) = Motor trasero izquierdo  
     - M4 (terminal azul) = Motor trasero derecho
  
  4. MODO AHORRO:
     - W: Solo M1, M2 (delanteros)
     - S: Solo M3, M4 (traseros)
     - A: Solo M2, M4 (derechos) 
     - D: Solo M1, M3 (izquierdos)
     
  ¡Mucho más simple que L298N separados!
*/