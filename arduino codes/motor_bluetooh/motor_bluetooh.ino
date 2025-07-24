/*
  Control Robot + LED por Bluetooth HC-06
  
  Motores:
  F = Avanzar
  B = Retroceder  
  Z = Parar
  
  LED:
  L = LED ON (pin 13)
  R = LED OFF (pin 13)
  
  Bluetooth HC-06:
  VCC -> 5V, GND -> GND, TX -> Pin 2, RX -> Pin 3
*/

#include <SoftwareSerial.h>

SoftwareSerial bluetooth(2, 3); // RX=2, TX=3

// Driver 1 - Pines (SIN PWM)
#define IN1_1 4     // Input 1 motor A del driver 1
#define IN2_1 5     // Input 2 motor A del driver 1
#define IN3_1 6     // Input 3 motor B del driver 1
#define IN4_1 7     // Input 4 motor B del driver 1

// Driver 2 - Pines (SIN PWM)
#define IN1_2 8     // Input 1 motor A del driver 2
#define IN2_2 9     // Input 2 motor A del driver 2
#define IN3_2 10    // Input 3 motor B del driver 2
#define IN4_2 11    // Input 4 motor B del driver 2c:\Users\jeesu\OneDrive\Documents\ArduinoData

char comando = ' ';

void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);
  
  // Configurar pines Driver 1
  pinMode(IN1_1, OUTPUT);
  pinMode(IN2_1, OUTPUT);
  pinMode(IN3_1, OUTPUT);
  pinMode(IN4_1, OUTPUT);
  
  // Configurar pines Driver 2
  pinMode(IN1_2, OUTPUT);
  pinMode(IN2_2, OUTPUT);
  pinMode(IN3_2, OUTPUT);
  pinMode(IN4_2, OUTPUT);
  
  // Configurar LED pin 13
  pinMode(13, OUTPUT);
  digitalWrite(13, LOW);
  
  // Parar todos los motores al inicio
  pararTodos();
  
  Serial.println("=== ROBOT BLUETOOTH CONTROL ===");
  Serial.println("F=avanzar, B=retroceder, L=izq, R=der, Z=parar");
  Serial.println("O=LED ON, Q=LED OFF");
  Serial.println("Listo...");
}

// Función para girar a la izquierda (solo motores derechos)
void girarIzquierda() {
  Serial.println("Girando izquierda...");
  
  // Driver 1 - motor izq OFF, motor der ON
  digitalWrite(IN1_1, LOW);
  digitalWrite(IN2_1, LOW);
  digitalWrite(IN3_1, HIGH);
  digitalWrite(IN4_1, LOW);
  
  // Driver 2 - motor izq OFF, motor der ON
  digitalWrite(IN1_2, LOW);
  digitalWrite(IN2_2, LOW);
  digitalWrite(IN3_2, HIGH);
  digitalWrite(IN4_2, LOW);
}

// Función para girar a la derecha (solo motores izquierdos)
void girarDerecha() {
  Serial.println("Girando derecha...");
  
  // Driver 1 - motor izq ON, motor der OFF
  digitalWrite(IN1_1, HIGH);
  digitalWrite(IN2_1, LOW);
  digitalWrite(IN3_1, LOW);
  digitalWrite(IN4_1, LOW);
  
  // Driver 2 - motor izq ON, motor der OFF
  digitalWrite(IN1_2, HIGH);
  digitalWrite(IN2_2, LOW);
  digitalWrite(IN3_2, LOW);
  digitalWrite(IN4_2, LOW);
}

void loop() {
  // Leer comando del Bluetooth
  if (bluetooth.available()) {
    comando = bluetooth.read();
    
    Serial.print("Comando: ");
    Serial.println(comando);
    
    // Procesar comandos
    switch (comando) {
      // MOTORES
      case 'F':
      case 'f':
        avanzar();
        break;
        
      case 'B':
      case 'b':
        retroceder();
        break;
        
      case 'L':
      case 'l':
        girarIzquierda();
        break;
        
      case 'R':
      case 'r':
        girarDerecha();
        break;
        
      case 'Z':
      case 'z':
        pararTodos();
        break;
        
      // LED
      case 'O':
      case 'o':
        digitalWrite(13, HIGH);
        Serial.println("LED ON");
        break;
        
      case 'Q':
      case 'q':
        digitalWrite(13, LOW);
        Serial.println("LED OFF");
        break;
        
      default:
        Serial.print("Desconocido: ");
        Serial.println(comando);
        break;
    }
  }
  
  // Test desde Monitor Serie
  if (Serial.available()) {
    comando = Serial.read();
    Serial.print("PC: ");
    Serial.println(comando);
    
    switch (comando) {
      case 'F': case 'f': avanzar(); break;
      case 'B': case 'b': retroceder(); break;
      case 'L': case 'l': girarIzquierda(); break;
      case 'R': case 'r': girarDerecha(); break;
      case 'Z': case 'z': pararTodos(); break;
      case 'O': case 'o': 
        digitalWrite(13, HIGH);
        Serial.println("LED ON (PC)");
        break;
      case 'Q': case 'q':
        digitalWrite(13, LOW);
        Serial.println("LED OFF (PC)");
        break;
    }
  }
}

// Función para avanzar (todos los motores hacia adelante)
void avanzar() {
  Serial.println("Avanzando...");
  
  // Driver 1 - motor izq adelante
  digitalWrite(IN1_1, HIGH);
  digitalWrite(IN2_1, LOW);
  
  // Driver 1 - motor der adelante
  digitalWrite(IN3_1, HIGH);
  digitalWrite(IN4_1, LOW);
  
  // Driver 2 - motor izq adelante
  digitalWrite(IN1_2, HIGH);
  digitalWrite(IN2_2, LOW);
  
  // Driver 2 - motor der adelante
  digitalWrite(IN3_2, HIGH);
  digitalWrite(IN4_2, LOW);
}

// Función para retroceder (todos los motores hacia atrás)
void retroceder() {
  Serial.println("Retrocediendo...");
  
  // Driver 1 - motor izq atrás
  digitalWrite(IN1_1, LOW);
  digitalWrite(IN2_1, HIGH);
  
  // Driver 1 - motor der atrás
  digitalWrite(IN3_1, LOW);
  digitalWrite(IN4_1, HIGH);
  
  // Driver 2 - motor izq atrás
  digitalWrite(IN1_2, LOW);
  digitalWrite(IN2_2, HIGH);
  
  // Driver 2 - motor der atrás
  digitalWrite(IN3_2, LOW);
  digitalWrite(IN4_2, HIGH);
}

// Función para parar todos los motores
void pararTodos() {
  Serial.println("Parando...");
  
  // Driver 1 - parar ambos motores
  digitalWrite(IN1_1, LOW);
  digitalWrite(IN2_1, LOW);
  digitalWrite(IN3_1, LOW);
  digitalWrite(IN4_1, LOW);
  
  // Driver 2 - parar ambos motores
  digitalWrite(IN1_2, LOW);
  digitalWrite(IN2_2, LOW);
  digitalWrite(IN3_2, LOW);
  digitalWrite(IN4_2, LOW);
}

/*
COMANDOS:
F = Avanzar
B = Retroceder
L = Izquierda
R = Derecha  
Z = Parar motores
O = LED ON
Q = LED OFF

CONEXIONES:
Bluetooth: TX->Pin2, RX->Pin3
Drivers: Pines 4,5,6,7,8,9,10,11
LED: Pin 13
*/