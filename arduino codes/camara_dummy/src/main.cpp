#include <WiFi.h>
#include <WebServer.h>
#include "esp_camera.h"
#include "esp_timer.h"

// Pin definition for AI Thinker Model
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

const char *ssid = "INFINITUM306F";
const char *password = "tXDyJ8U9pe";

WebServer server(80);

// Declaración de funciones
void handleRoot();
void handleStream();
void handleCapture();

void setup()
{
  Serial.begin(115200);

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM; // Corregido: sccb no sscb
  config.pin_sccb_scl = SIOC_GPIO_NUM; // Corregido: sccb no sscb
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound())
  {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  }
  else
  {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK)
  {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }

  Serial.println();
  Serial.print("Camera Ready! Use 'http://");
  Serial.print(WiFi.localIP());
  Serial.println("' to connect");

  server.on("/", handleRoot);
  server.on("/stream", handleStream);
  server.on("/capture", handleCapture);
  server.begin();
}

void loop()
{
  server.handleClient();
}

void handleRoot()
{
  String html = "<!DOCTYPE html><html><head><title>ESP32-CAM Control</title>";
  html += "<style>body { font-family: Arial; text-align: center; margin: 20px; }";
  html += "img { border: 2px solid #333; margin: 10px; }";
  html += "button { font-size: 16px; padding: 10px 20px; margin: 10px; }</style></head>";
  html += "<body><h1>ESP32-CAM Control</h1>";
  html += "<h2>Video Stream</h2>";
  html += "<img id='stream' src='/stream' width='640' height='480'>";
  html += "<h2>Photo Capture</h2>";
  html += "<img id='photo' width='640' height='480' style='border: 2px dashed #ccc;'><br>";
  html += "<button onclick='capturePhoto()'>Take Photo</button>";
  html += "<button onclick='downloadPhoto()'>Download Photo</button>";
  html += "<script>";
  html += "function capturePhoto() { document.getElementById('photo').src = '/capture?' + Date.now(); }";
  html += "function downloadPhoto() { const link = document.createElement('a'); link.href = '/capture';";
  html += "link.download = 'esp32cam_photo_' + Date.now() + '.jpg'; link.click(); }";
  html += "</script></body></html>";

  server.send(200, "text/html", html);
}

void handleStream()
{
  WiFiClient client = server.client();

  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n\r\n";
  server.sendContent(response);

  while (client.connected())
  {
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb)
    {
      Serial.println("Camera capture failed");
      break;
    }

    String header = "--frame\r\n";
    header += "Content-Type: image/jpeg\r\n";
    header += "Content-Length: " + String(fb->len) + "\r\n\r\n";

    server.sendContent(header);
    client.write(fb->buf, fb->len);
    server.sendContent("\r\n");

    esp_camera_fb_return(fb);

    if (!client.connected())
      break;
  }
}

void handleCapture()
{
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb)
  {
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send_P(200, "image/jpeg", (const char *)fb->buf, fb->len);
  esp_camera_fb_return(fb);
}
.