// Required libraries for ESP8266
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "INFINITUM306F";
const char* password = "tXDyJ8U9pe";

// MQTT Configuration
const char* mqtt_server = "test.mosquitto.org";  // Public MQTT Broker
const int mqtt_port = 1883;
const char* mqtt_client_id = "sparky_robot";
const char* mqtt_topic_subscribe = "robots/sparky/commands";
const char* mqtt_topic_publish = "robots/sparky/status";

// WiFi and MQTT objects
WiFiClient espClient;
PubSubClient client(espClient);

// LEFT MOTOR pins (ESP8266)
int ENA_L = D5;    // PWM speed left motor (GPIO14)
int IN1_L = D6;    // Direction 1 left motor (GPIO12)
int IN2_L = D7;    // Direction 2 left motor (GPIO13)

// RIGHT MOTOR pins (ESP8266)
int ENA_R = D0;    // PWM speed right motor (GPIO16)
int IN1_R = D1;    // Direction 1 right motor (GPIO5)
int IN2_R = D2;    // Direction 2 right motor (GPIO4)

// Left motor encoder pins (OPTIONAL)
int encoderA_L = D3;    // Encoder A left motor (GPIO0)
int encoderB_L = D4;    // Encoder B left motor (GPIO2)
volatile long pulses_L = 0;

// Right motor encoder pins (OPTIONAL)
int encoderA_R = D8;    // Encoder A right motor (GPIO15)
int encoderB_R = A0;    // Encoder B right motor (analog as digital)

// Speed variables
int speed = 200;    // Base speed (0-255)
String last_command = "STOP";

// --- ADDITIONAL MQTT FUNCTIONS ---

// --- FUNCTION DECLARATIONS ---
void publishStatus(String state);

// --- INTERRUPT FUNCTIONS ---
void IRAM_ATTR countPulsesL() {
  if (digitalRead(encoderB_L) == HIGH) {
    pulses_L++;
  } else {
    pulses_L--;
  }
}

// --- MOTOR CONTROL FUNCTIONS ---

void stopMotors() {
  digitalWrite(IN1_L, LOW);
  digitalWrite(IN2_L, LOW);
  digitalWrite(IN1_R, LOW);
  digitalWrite(IN2_R, LOW);
  analogWrite(ENA_L, 0);
  analogWrite(ENA_R, 0);
  last_command = "STOP";
  Serial.println("Motors stopped");
  publishStatus("STOPPED");
}

void moveForward() {
  // Both motors forward
  digitalWrite(IN1_L, HIGH);
  digitalWrite(IN2_L, LOW);
  digitalWrite(IN1_R, HIGH);
  digitalWrite(IN2_R, LOW);
  analogWrite(ENA_L, speed);
  analogWrite(ENA_R, speed);
  last_command = "FORWARD";
  Serial.println("Moving forward");
  publishStatus("MOVING_FORWARD");
}

void moveBackward() {
  // Both motors backward
  digitalWrite(IN1_L, LOW);
  digitalWrite(IN2_L, HIGH);
  digitalWrite(IN1_R, LOW);
  digitalWrite(IN2_R, HIGH);
  analogWrite(ENA_L, speed);
  analogWrite(ENA_R, speed);
  last_command = "BACKWARD";
  Serial.println("Moving backward");
  publishStatus("MOVING_BACKWARD");
}

void turnLeft() {
  // Left motor backward, right motor forward
  digitalWrite(IN1_L, LOW);
  digitalWrite(IN2_L, HIGH);
  digitalWrite(IN1_R, HIGH);
  digitalWrite(IN2_R, LOW);
  analogWrite(ENA_L, speed);
  analogWrite(ENA_R, speed);
  last_command = "LEFT";
  Serial.println("Turning left");
  publishStatus("TURNING_LEFT");
}

void turnRight() {
  // Left motor forward, right motor backward
  digitalWrite(IN1_L, HIGH);
  digitalWrite(IN2_L, LOW);
  digitalWrite(IN1_R, LOW);
  digitalWrite(IN2_R, HIGH);
  analogWrite(ENA_L, speed);
  analogWrite(ENA_R, speed);
  last_command = "RIGHT";
  Serial.println("Turning right");
  publishStatus("TURNING_RIGHT");
}

void changeSpeed(int new_speed) {
  if (new_speed >= 50 && new_speed <= 255) {
    speed = new_speed;
    Serial.println("New speed: " + String(speed));
    Serial.println("DEBUG: Speed variable updated to: " + String(speed));
    
    // If moving, update speed immediately
    if (last_command != "STOP") {
      analogWrite(ENA_L, speed);
      analogWrite(ENA_R, speed);
    }
    
    publishStatus("SPEED_CHANGED");
  } else {
    Serial.println("Speed out of range (50-255)");
  }
}

// --- MQTT FUNCTIONS ---

void publishStatus(String state) {
  if (client.connected()) {
    JsonDocument status_doc;
    status_doc["robot"] = "sparky";
    status_doc["status"] = state;
    status_doc["speed"] = speed;
    status_doc["last_command"] = last_command;
    status_doc["encoder_pulses"] = pulses_L;
    status_doc["timestamp"] = millis();
    
    String status_json;
    serializeJson(status_doc, status_json);
    
    client.publish(mqtt_topic_publish, status_json.c_str());
    Serial.println("Status sent: " + status_json);
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  // Convert payload to string
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("Message received [" + String(topic) + "]: " + message);
  
  // Parse JSON
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("JSON parsing error: " + String(error.c_str()));
    return;
  }
  
  // Extract command and speed (optional)
  String command = doc["command"] | "";
  int new_speed = doc["speed"] | -1;
  
  // Change speed if specified
  if (new_speed != -1) {
    changeSpeed(new_speed);
  }
  
  // Execute command
  if (command == "W") {
    moveForward();
  }
  else if (command == "S") {
    moveBackward();
  }
  else if (command == "A") {
    turnLeft();
  }
  else if (command == "D") {
    turnRight();
  }
  else if (command == "Q") {
    stopMotors();
  }
  else if (command == "+") {
    changeSpeed(speed + 20);
  }
  else if (command == "-") {
    changeSpeed(speed - 20);
  }
  else {
    Serial.println("Unrecognized command: " + command);
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (client.connect(mqtt_client_id)) {
      Serial.println(" connected!");
      
      // Subscribe to command topic
      client.subscribe(mqtt_topic_subscribe);
      Serial.println("Subscribed to: " + String(mqtt_topic_subscribe));
      
      // Send connection message
      publishStatus("CONNECTED");
      
    } else {
      Serial.print(" failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// --- SETUP ---
void setup() {
  Serial.begin(115200);
  delay(100);
  
  // Configure motor pins
  pinMode(ENA_L, OUTPUT);
  pinMode(IN1_L, OUTPUT);
  pinMode(IN2_L, OUTPUT);
  pinMode(ENA_R, OUTPUT);
  pinMode(IN1_R, OUTPUT);
  pinMode(IN2_R, OUTPUT);
  
  // Configure encoders (OPTIONAL)
  pinMode(encoderA_L, INPUT_PULLUP);
  pinMode(encoderB_L, INPUT_PULLUP);
  pinMode(encoderA_R, INPUT_PULLUP);
  pinMode(encoderB_R, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(encoderA_L), countPulsesL, RISING);
  
  // Stop motors initially
  stopMotors();
  
  // Connect WiFi
  connectWiFi();
  
  // Configure MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  Serial.println("=== SPARKY ROBOT STARTED ===");
  Serial.println("Command topic: " + String(mqtt_topic_subscribe));
  Serial.println("Status topic: " + String(mqtt_topic_publish));
  Serial.println("Command format: {\"command\":\"W\",\"speed\":200}");
  Serial.println("Commands: W(forward), S(backward), A(left), D(right), Q(stop), +(speed up), -(speed down)");
}

void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Report status every 10 seconds
  static unsigned long lastReport = 0;
  if (millis() - lastReport > 10000) {
    Serial.print("Status - Command: " + last_command);
    Serial.print(" | Speed: " + String(speed));
    Serial.print(" | Pulses: " + String(pulses_L));
    Serial.println(" | IP: " + WiFi.localIP().toString());
    
    publishStatus("HEARTBEAT");
    lastReport = millis();
  }
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectWiFi();
  }
}
