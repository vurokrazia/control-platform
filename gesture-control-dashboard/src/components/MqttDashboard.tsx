import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, InputGroup } from 'react-bootstrap';
import { mqttTopicsRepository, MqttTopic } from '../repositories/mqttTopicsRepository';
import { devicesRepository, Device } from '../repositories/devicesRepository';

interface MqttDashboardProps {
  // No props needed - this component manages its own topic selection
}

const MqttDashboard: React.FC<MqttDashboardProps> = () => {
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(150);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [topics, setTopics] = useState<MqttTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Predefined commands - speed will be dynamically inserted
  const predefinedCommands = [
    { label: '⬆️ Avanzar (W)', command: 'W', useSpeed: true },
    { label: '⬇️ Retroceder (S)', command: 'S', useSpeed: true },
    { label: '⬅️ Girar Izquierda (A)', command: 'A', useSpeed: true },
    { label: '➡️ Girar Derecha (D)', command: 'D', useSpeed: true },
    { label: '🛑 Parar Motores (Q)', command: 'Q', useSpeed: false, fixedSpeed: 0 },
    { label: '🔥 Aumentar Velocidad (+)', command: '+', useSpeed: false, fixedSpeed: 255 },
    { label: '🐌 Disminuir Velocidad (-)', command: '-', useSpeed: false, fixedSpeed: 100 },
    { label: '📡 Estado', command: 'STATUS', useSpeed: false, fixedSpeed: 0 },
  ];

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadTopics();
    } else {
      setTopics([]);
      setSelectedTopic('');
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const devicesList = await devicesRepository.getAllDevices();
      setDevices(devicesList);
      
      if (devicesList.length > 0 && !selectedDevice) {
        setSelectedDevice(devicesList[0]);
      }
    } catch (err) {
      console.error('Error loading devices:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const loadTopics = async () => {
    if (!selectedDevice) return;
    
    setLoadingTopics(true);
    try {
      const topicsList = await mqttTopicsRepository.getDeviceTopics(selectedDevice.deviceId);
      setTopics(topicsList);
      
      if (topicsList.length > 0 && !selectedTopic) {
        setSelectedTopic(topicsList[0].name);
      } else if (topicsList.length === 0) {
        setSelectedTopic('');
      }
    } catch (err) {
      console.error('Error loading topics:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!selectedTopic) {
      setError('No topic selected');
      return;
    }

    setSending(true);
    setError(null);
    
    try {
      await mqttTopicsRepository.publishMessage(selectedTopic, message);
      setLastMessage(message);
      setCustomMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  const sendCommand = async (command: string, useSpeed: boolean, fixedSpeed?: number) => {
    const commandSpeed = useSpeed ? speed : (fixedSpeed || 0);
    const message = JSON.stringify({ command, speed: commandSpeed });
    await sendMessage(message);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMessage.trim()) {
      sendMessage(customMessage.trim());
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId);
    setSelectedDevice(device || null);
    setSelectedTopic(''); // Reset topic selection
  };

  return (
    <Card>
      <Card.Header className="bg-info text-white">
        <h5 className="mb-0">📡 MQTT Control Panel</h5>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {lastMessage && (
          <Alert variant="success" className="mb-3">
            <strong>✅ Message Sent to {selectedTopic}:</strong>
            <pre className="mb-0 mt-2" style={{ fontSize: '0.9em' }}>
              {lastMessage}
            </pre>
          </Alert>
        )}

        {!selectedDevice && (
          <Alert variant="warning" className="mb-3">
            Please select a device first to see available topics.
          </Alert>
        )}

        {!selectedTopic && selectedDevice && (
          <Alert variant="warning" className="mb-3">
            Please select a topic to send messages.
          </Alert>
        )}

        {/* Device Selection */}
        <div className="mb-4">
          <Form.Label className="fw-bold">Device:</Form.Label>
          <Form.Select
            value={selectedDevice?.deviceId || ''}
            onChange={(e) => handleDeviceChange(e.target.value)}
            disabled={loadingDevices || devices.length === 0}
          >
            {loadingDevices ? (
              <option>Loading devices...</option>
            ) : devices.length === 0 ? (
              <option>No devices available</option>
            ) : (
              <>
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.name} ({device.deviceId})
                  </option>
                ))}
              </>
            )}
          </Form.Select>
          <Form.Text className="text-muted">
            First choose which Arduino device to control
          </Form.Text>
        </div>

        {/* Topic Selection - Only show if device is selected */}
        {selectedDevice && (
          <div className="mb-4">
            <Form.Label className="fw-bold">Publishing Topic:</Form.Label>
            <Form.Select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={loadingTopics || topics.length === 0}
            >
              {loadingTopics ? (
                <option>Loading topics...</option>
              ) : topics.length === 0 ? (
                <option>No topics available for this device</option>
              ) : (
                <>
                  <option value="">Select a topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id || topic.name} value={topic.name}>
                      {topic.name}
                    </option>
                  ))}
                </>
              )}
            </Form.Select>
            <Form.Text className="text-muted">
              Choose which topic to publish messages to
            </Form.Text>
          </div>
        )}

        {/* Speed Control */}
        <div className="mb-4">
          <Form.Label className="fw-bold">Speed Control: {speed}</Form.Label>
          <Form.Range
            min={0}
            max={255}
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="mb-2"
          />
          <div className="d-flex justify-content-between small text-muted">
            <span>0 (Min)</span>
            <span>150 (Default)</span>
            <span>255 (Max)</span>
          </div>
        </div>

        {/* Predefined Command Buttons - Only show if device and topic are selected */}
        {selectedDevice && selectedTopic && (
          <div className="mb-4">
            <h6 className="fw-bold mb-3">Quick Commands for {selectedDevice.name}:</h6>
            <Row className="g-2">
              {predefinedCommands.map((cmd, index) => (
                <Col key={index} xs={12} sm={6} md={4} lg={3}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100"
                    onClick={() => sendCommand(cmd.command, cmd.useSpeed, cmd.fixedSpeed)}
                    disabled={sending}
                  >
                    {cmd.label}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>
        )}

        <hr />

        {/* Custom Message Form */}
        <div>
          <h6 className="fw-bold mb-3">Custom Message:</h6>
          <Form onSubmit={handleCustomSubmit}>
            <InputGroup className="mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={`Enter custom JSON message, e.g., {"command":"W","speed":${speed}}`}
                disabled={sending}
              />
            </InputGroup>
            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={sending || !customMessage.trim() || !selectedTopic}
              >
                {sending ? '📤 Sending...' : '📤 Send Custom Message'}
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => setCustomMessage('')}
                disabled={sending}
              >
                Clear
              </Button>
            </div>
          </Form>
        </div>

        <hr />

        {/* Arduino Command Help */}
        <div>
          <h6 className="fw-bold mb-2">💡 Arduino Command Reference:</h6>
          <div className="small text-muted">
            <strong>Format:</strong> <code>{"{"}"command":"W","speed":{speed}{"}"}</code><br />
            <strong>Commands:</strong> W (forward), S (backward), A (left), D (right), Q (stop)<br />
            <strong>Speed:</strong> 0-255, + (increase), - (decrease)
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MqttDashboard;