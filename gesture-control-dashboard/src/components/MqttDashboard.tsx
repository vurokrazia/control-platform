import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, InputGroup } from 'react-bootstrap';
import { useMqttTopics, useMqttMessages } from '../hooks';
import { useTranslation } from 'react-i18next';
import type { Device } from '../repositories/devicesRepository';

interface MqttDashboardProps {
  devices: Device[];
  selectedDevice: Device | null;
  isLoading: boolean;
  error: string | null;
  onDeviceSelect: (device: Device | null) => void;
  onRefresh: () => void;
}

const MqttDashboard: React.FC<MqttDashboardProps> = ({
  devices,
  selectedDevice,
  isLoading,
  error,
  onDeviceSelect,
  onRefresh
}) => {
  const { t } = useTranslation();
  const [customMessage, setCustomMessage] = useState('');
  const [speed, setSpeed] = useState(150);
  
  // Hooks for topics and messages only
  const topics = useMqttTopics();
  const messages = useMqttMessages();

  // Predefined commands - speed will be dynamically inserted
  const predefinedCommands = [
    { label: '⬆️ Forward (W)', command: 'W', useSpeed: true },
    { label: '⬇️ Backward (S)', command: 'S', useSpeed: true },
    { label: '⬅️ Left (A)', command: 'A', useSpeed: true },
    { label: '➡️ Right (D)', command: 'D', useSpeed: true },
    { label: '🛑 Stop (Q)', command: 'Q', useSpeed: false, fixedSpeed: 0 },
    { label: '🔥 Speed + (+)', command: '+', useSpeed: false, fixedSpeed: 255 },
    { label: '🐌 Speed - (-)', command: '-', useSpeed: false, fixedSpeed: 100 },
    { label: '📡 ' + t('mqtt.connection.status'), command: 'STATUS', useSpeed: false, fixedSpeed: 0 },
  ];

  // Removed: Device loading moved to parent ControlPage to prevent duplicate calls
  // Removed: Topic loading moved to parent ControlPage to prevent duplicate calls

  // Always enable buttons - ignore autoSubscribe logic
  const isTopicSubscribed = true;

  return (
    <Card>
      <Card.Header className="bg-info text-white">
        <h5 className="mb-0">📡 {t('mqtt.connection.titleCommands')}</h5>
      </Card.Header>
      <Card.Body>
        {(error || topics.state.error || messages.state.error) && (
          <Alert variant="danger" dismissible onClose={() => {
            // Note: devices error clearing is handled by parent
            topics.actions.clearError();
            messages.actions.clearError();
          }}>
            {error || topics.state.error || messages.state.error}
          </Alert>
        )}

        {messages.state.hasLastMessage && (
          <Alert variant="success" className="mb-3">
            <strong>✅ {t('mqtt.topics.message')} {messages.state.lastTopic}:</strong>
            <pre className="mb-0 mt-2" style={{ fontSize: '0.9em' }}>
              {messages.state.lastMessage}
            </pre>
          </Alert>
        )}

        {!selectedDevice && (
          <Alert variant="warning" className="mb-3">
            {t('mqtt.modal.selectDevice')}
          </Alert>
        )}

        {!topics.state.selectedTopic && selectedDevice && (
          <Alert variant="warning" className="mb-3">
            {t('mqtt.topics.addTopic')}
          </Alert>
        )}

        {topics.state.selectedTopic && !isTopicSubscribed && (
          <Alert variant="danger" className="mb-3">
            <strong>⚠️ {t('mqtt.topics.notSubscribed.title')}</strong><br />
            {t('mqtt.topics.notSubscribed.message')}
          </Alert>
        )}

        {/* Device Selection */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fw-bold mb-0">{t('devices.title')}:</Form.Label>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh')}
            </Button>
          </div>
          <Form.Select
            value={selectedDevice?.deviceId || ''}
            onChange={(e) => {
              const device = devices.find(d => d.deviceId === e.target.value) || null;
              onDeviceSelect(device);
            }}
            disabled={isLoading || devices.length === 0}
          >
            {isLoading ? (
              <option>{t('common.loading')}</option>
            ) : devices.length === 0 ? (
              <option>{t('devices.noDevices')}</option>
            ) : (
              <>
                <option value="">{t('mqtt.modal.selectDevice')}</option>
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.name} ({device.deviceId})
                  </option>
                ))}
              </>
            )}
          </Form.Select>
          <Form.Text className="text-muted">
            {t('mqtt.modal.helpText')}
          </Form.Text>
        </div>

        {/* Topic Selection - Only show if device is selected */}
        {selectedDevice && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="fw-bold mb-0">{t('mqtt.topics.title')}:</Form.Label>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  if (selectedDevice) {
                    topics.actions.loadTopicsByDevice(selectedDevice.deviceId, true); // Force refresh
                  }
                }}
                disabled={topics.state.loading.topics}
              >
                {topics.state.loading.topics ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh')}
              </Button>
            </div>
            <Form.Select
              value={topics.state.selectedTopic?.name || ''}
              onChange={(e) => {
                const topic = topics.state.topics.find(t => t.name === e.target.value);
                topics.actions.setSelectedTopic(topic?.id || null);
              }}
              disabled={topics.state.loading.topics || topics.state.topics.length === 0}
            >
              {topics.state.loading.topics ? (
                <option>{t('common.loading')}</option>
              ) : topics.state.topics.length === 0 ? (
                <option>{t('mqtt.topics.noTopics')}</option>
              ) : (
                <>
                  <option value="">{t('mqtt.topics.addTopic')}</option>
                  {topics.state.topics.map((topic) => (
                    <option key={topic.id || topic.name} value={topic.name}>
                      {topic.name}
                    </option>
                  ))}
                </>
              )}
            </Form.Select>
            <Form.Text className="text-muted">
              {t('mqtt.topics.title')}
            </Form.Text>
          </div>
        )}

        {/* Speed Control */}
        <div className="mb-4">
          <Form.Label className="fw-bold">{t('devices.deviceType')}: {speed}</Form.Label>
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
        {selectedDevice && topics.state.selectedTopic && (
          <div className="mb-4">
            <h6 className="fw-bold mb-3">{t('common.actions')} {selectedDevice.name}:</h6>
            <Row className="g-2">
              {predefinedCommands.map((cmd, index) => (
                <Col key={index} xs={12} sm={6} md={4} lg={3}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100"
                    onClick={() => {
                      messages.actions.sendCommandWithSpeed(cmd.command, cmd.useSpeed, speed, cmd.fixedSpeed);
                    }}
                    disabled={messages.state.isPublishing || !isTopicSubscribed}
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
          <h6 className="fw-bold mb-3">{t('mqtt.topics.message')}:</h6>
          <Form onSubmit={(e) => {
            e.preventDefault();
            if (customMessage.trim()) {
              void messages.actions.handleCustomFormSubmit(customMessage.trim(), () => setCustomMessage(''));
            }
          }}>
            <InputGroup className="mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={`${t('mqtt.topics.message')}, e.g., {"command":"W","speed":${speed}}`}
                disabled={messages.state.isPublishing}
              />
            </InputGroup>
            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={messages.state.isPublishing || !customMessage.trim() || !topics.state.selectedTopic || !isTopicSubscribed}
              >
                {messages.state.isPublishing ? '📤 ' + t('common.loading') : '📤 ' + t('mqtt.topics.publish')}
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => setCustomMessage('')}
                disabled={messages.state.isPublishing}
              >
                {t('common.delete')}
              </Button>
            </div>
          </Form>
        </div>

        <hr />

        {/* Arduino Command Help */}
        <div>
          <h6 className="fw-bold mb-2">💡 {t('common.info')}:</h6>
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