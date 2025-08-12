const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

// Load test data
const testData = JSON.parse(fs.readFileSync(path.join(__dirname, 'mqtt-test-data.json'), 'utf8'));

// Connect to MQTT broker
const client = mqtt.connect('mqtt://test.mosquitto.org:1883', {
    clientId: `mqtt-publisher-demo-${Math.random().toString(16).substr(2, 8)}`,
    reconnectPeriod: 5000,
    connectTimeout: 30 * 1000
});

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    console.log('🚀 Starting to publish test data...\n');
    
    // Publish data for each topic
    for (let index = 0; index < 10000; index++) {
        publishTestData();
    }
});

client.on('error', (error) => {
    console.error('❌ MQTT connection error:', error);
});

function publishTestData() {
    // Publish arduino/sensors data
    testData['arduino/sensors'].forEach((data, index) => {
        setTimeout(() => {
            client.publish('arduino/sensors', JSON.stringify(data));
            console.log(`📡 Published to arduino/sensors:`, data);
        }, index * 2000);
    });

    // Publish arduino/commands data
    testData['arduino/commands'].forEach((data, index) => {
        setTimeout(() => {
            client.publish('arduino/commands', JSON.stringify(data));
            console.log(`📡 Published to arduino/commands:`, data);
        }, (index + testData['arduino/sensors'].length) * 2000);
    });

    // Publish test/topic data
    testData['test/topic'].forEach((data, index) => {
        setTimeout(() => {
            client.publish('test/topic', JSON.stringify(data));
            console.log(`📡 Published to test/topic:`, data);
        }, (index + testData['arduino/sensors'].length + testData['arduino/commands'].length) * 2000);
    });

    // Close connection after all messages are sent
    const totalMessages = testData['arduino/sensors'].length + testData['arduino/commands'].length + testData['test/topic'].length;
    setTimeout(() => {
        console.log('\n✅ All test messages published!');
        client.end();
        process.exit(0);
    }, (totalMessages + 1) * 2000);
}

client.on('close', () => {
    console.log('🔌 MQTT client disconnected');
});