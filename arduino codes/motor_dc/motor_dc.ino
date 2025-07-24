/*
  Test Motor Shield L293D - v1
  Secuencia automática: Avanzar → Izquierda → Derecha → Atrás
  3 segundos entre cada movimiento

  Usando librería AFMotor para Shield L293D
*/

#include <AFMotor.h>

// Crear objetos para los 4 motores
AF_DCMotor motor1(1);  // M1 - Delantero izquierdo
AF_DCMotor motor2(3);  // M2 - Delantero derecho  
AF_DCMotor motor3(2);  // M3 - Trasero izquierdo
AF_DCMotor motor4(4);  // M4 - Trasero derecho

void setup() {
  Serial.begin(9600);
  Serial.println("=== TEST MOTOR SHIELD L293D v1 ===");
  Serial.println("Secuencia: Avanzar -> Izquierda -> Derecha -> Atras");
  Serial.println("1 segundo entre movimientos");
  Serial.println("MODO: Ahorro de energía en giros");
  Serial.println("");

  // Configurar velocidad (0-255)
  motor1.setSpeed(255);
  motor2.setSpeed(255);
  motor3.setSpeed(255);
  motor4.setSpeed(255);

  // Parar todos al inicio
  pararTodos();

  delay(2000); // Esperar 2 segundos antes de empezar
  Serial.println("¡Iniciando secuencia!");
}

void loop() {
  // 1. AVANZAR
  Serial.println("1. AVANZANDO...");
  avanzar();
  delay(1000);

  // // 2. IZQUIERDA  
  Serial.println("2. GIRANDO IZQUIERDA...");
  girarIzquierda();
  delay(1000);

  // 3. DERECHA
  Serial.println("3. GIRANDO DERECHA...");
  girarDerecha();
  delay(1000);

  // 4. ATRÁS
  Serial.println("4. RETROCEDIENDO...");
  retroceder();
  delay(1000);

  // Parar y esperar antes de repetir
  Serial.println("5. PARANDO...");
  pararTodos();
  // delay(2000); // 2 segundos de pausa

  Serial.println("--- REPITIENDO SECUENCIA ---");
  Serial.println("");
}

// Función para avanzar
void avanzar() {
  motor1.run(FORWARD);
  motor2.run(FORWARD);
  motor3.run(FORWARD);
  motor4.run(FORWARD);
}

// Función para girar izquierda (AHORRO ENERGÍA - solo motores derechos)
void girarIzquierda() {
  // Motores izquierdos PARADOS, solo derechos adelante
  motor1.run(RELEASE);   // Delantero izq PARADO
  motor2.run(FORWARD);   // Delantero der adelante
  motor3.run(RELEASE);   // Trasero izq PARADO
  motor4.run(FORWARD);   // Trasero der adelante
}

// Función para girar derecha (AHORRO ENERGÍA - solo motores izquierdos)
void girarDerecha() {
  // Motores derechos PARADOS, solo izquierdos adelante
  motor1.run(FORWARD);   // Delantero izq adelante
  motor2.run(RELEASE);   // Delantero der PARADO
  motor3.run(FORWARD);   // Trasero izq adelante
  motor4.run(RELEASE);   // Trasero der PARADO
}

// Función para retroceder
void retroceder() {
  motor1.run(BACKWARD);
  motor2.run(BACKWARD);
  motor3.run(BACKWARD);
  motor4.run(BACKWARD);
}

// Función para parar todos
void pararTodos() {
  motor1.run(RELEASE);
  motor2.run(RELEASE);
  motor3.run(RELEASE);
  motor4.run(RELEASE);
}

/*
INSTALACIÓN PREVIA:
1. Arduino IDE -> Tools -> Manage Libraries
2. Buscar "Adafruit Motor Shield library"
3. Instalar versión V1

CONEXIONES:
- Shield L293D montado sobre Arduino
- Jumper PWR puesto
- 8 pilas AA (12V) en terminales del shield
- Motores en M1, M2, M3, M4

SECUENCIA:
1. Avanzar (1s)
2. Izquierda - AHORRO ENERGÍA (1s) 
3. Derecha - AHORRO ENERGÍA (1s)
4. Atrás (1s)
5. Parar (2s)
6. Repetir

MODO AHORRO:
- Giro izq: Solo motores derechos ON
- Giro der: Solo motores izquierdos ON  
- 50% menos consumo en giros

v1 - Secuencia con ahorro de energía
*/

