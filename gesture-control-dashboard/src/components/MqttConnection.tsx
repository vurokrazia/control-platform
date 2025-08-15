import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Alert, Badge, Row, Col, ListGroup, Spinner } from 'react-bootstrap';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';
import { mqttTopicsRepository, MqttTopic, TopicMessage } from '../repositories/mqttTopicsRepository';
import { devicesRepository, Device } from '../repositories/devicesRepository';
import { useTranslation } from 'react-i18next';

interface MqttConnectionProps {
  // No props needed - this component manages its own topic selection
}

const MqttConnection: React.FC<MqttConnectionProps> = () => {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [topics, setTopics] = useState<MqttTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<TopicMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedTopicData, setSelectedTopicData] = useState<MqttTopic | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5); // Default 5 seconds
  const [autoRefreshDevices, setAutoRefreshDevices] = useState(false); // Auto refresh devices
  const [lastDeviceUpdate, setLastDeviceUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const deviceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadTopics();
    } else {
      setTopics([]);
      setSelectedTopicData(null);
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (selectedTopicData) {
      loadMessages();
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [selectedTopicData, refreshInterval]);

  useEffect(() => {
    if (autoRefreshDevices) {
      startDeviceAutoRefresh();
    } else {
      stopDeviceAutoRefresh();
    }

    return () => stopDeviceAutoRefresh();
  }, [autoRefreshDevices]);

  const loadDevices = async () => {
    setLoadingDevices(true);
    setError(null);
    try {
      const devicesList = await devicesRepository.getAllDevices();
      
      // Check if devices list actually changed
      const devicesChanged = JSON.stringify(devices) !== JSON.stringify(devicesList);
      if (devicesChanged) {
        setLastDeviceUpdate(new Date());
        console.log('📱 Devices list updated:', devicesList.length, 'devices');
      }
      
      setDevices(devicesList);
      
      if (devicesList.length > 0 && !selectedDevice) {
        setSelectedDevice(devicesList[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading devices');
    } finally {
      setLoadingDevices(false);
    }
  };

  const loadTopics = async () => {
    if (!selectedDevice) return;
    
    setLoading(true);
    setError(null);
    try {
      const topicsList = await mqttTopicsRepository.getDeviceTopics(selectedDevice.deviceId);
      setTopics(topicsList);
      
      if (topicsList.length > 0 && !selectedTopicData) {
        setSelectedTopicData(topicsList[0]);
      } else if (topicsList.length === 0) {
        setSelectedTopicData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading topics');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedTopicData?.id) return;
    
    setLoadingMessages(true);
    try {
      const response = await mqttTopicsRepository.getTopicMessages(selectedTopicData.id);
      setMessages(response.messages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleRefreshDevices = async () => {
    await loadDevices();
  };

  const handleRefreshTopics = async () => {
    await loadTopics();
  };

  const handleRefreshMessages = async () => {
    await loadMessages();
  };

  const startAutoRefresh = () => {
    stopAutoRefresh(); // Clear any existing interval
    intervalRef.current = setInterval(() => {
      loadMessages();
    }, refreshInterval * 1000); // Convert seconds to milliseconds
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startDeviceAutoRefresh = () => {
    stopDeviceAutoRefresh(); // Clear any existing interval
    deviceIntervalRef.current = setInterval(() => {
      loadDevices();
    }, 30000); // Refresh devices every 30 seconds
  };

  const stopDeviceAutoRefresh = () => {
    if (deviceIntervalRef.current) {
      clearInterval(deviceIntervalRef.current);
      deviceIntervalRef.current = null;
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId);
    setSelectedDevice(device || null);
    setSelectedTopicData(null); // Reset topic selection
  };

  const handleTopicChange = (topicName: string) => {
    const topic = topics.find(t => t.name === topicName);
    setSelectedTopicData(topic || null);
  };

  const clearError = () => {
    setError(null);
  };

  const formatPayload = (payload: string) => {
    try {
      const parsed = JSON.parse(payload);
      return <JSONPretty data={parsed} theme="monikai" />;
    } catch {
      return <span className="font-monospace">{payload}</span>;
    }
  };

  return (
    <Card className="mb-3">
      <Card.Header className="bg-primary text-white d-flex align-items-center">
        <h5 className="mb-0">📡 {t('mqtt.connection.title')}</h5>
        <Badge bg="success" className="ms-auto">
          {t('mqtt.connection.connected')}
        </Badge>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Device Selection */}
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fw-bold mb-0">{t('mqtt.modal.selectDevice')}:</Form.Label>
            <div className="d-flex gap-2">
              <Button
                variant={autoRefreshDevices ? "success" : "outline-secondary"}
                size="sm"
                onClick={() => setAutoRefreshDevices(!autoRefreshDevices)}
                title={autoRefreshDevices ? t('common.autoRefreshOn') : t('common.autoRefreshOff')}
              >
                {autoRefreshDevices ? '⏰ Auto' : '⏰ Manual'}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleRefreshDevices}
                disabled={loadingDevices}
              >
                {loadingDevices ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh')}
              </Button>
            </div>
          </div>
          <Form.Select
            value={selectedDevice?.deviceId || ''}
            onChange={(e) => handleDeviceChange(e.target.value)}
            disabled={loadingDevices || devices.length === 0}
          >
            {loadingDevices ? (
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
            {autoRefreshDevices && (
              <span className="ms-2 text-success">
                ⏰ {t('common.autoRefresh')} (30s)
              </span>
            )}
          </Form.Text>
        </Form.Group>

        {/* Topic Selection - Only show if device is selected */}
        {selectedDevice && (
          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="fw-bold mb-0">{t('mqtt.topics.addTopic')}:</Form.Label>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleRefreshTopics}
                disabled={loading}
              >
                {loading ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh')}
              </Button>
            </div>
            <Form.Select
              value={selectedTopicData?.name || ''}
              onChange={(e) => handleTopicChange(e.target.value)}
              disabled={loading || topics.length === 0}
            >
              {loading ? (
                <option>{t('common.loading')}</option>
              ) : topics.length === 0 ? (
                <option>{t('mqtt.topics.noTopics')}</option>
              ) : (
                <>
                  <option value="">{t('mqtt.topics.addTopic')}</option>
                  {topics.map((topic) => (
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
          </Form.Group>
        )}

        {selectedDevice && selectedTopicData && (
          <div className="mb-3">
            <Alert variant="info" className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{t('devices.title')}:</strong> {selectedDevice.name} ({selectedDevice.deviceId})
                  <br />
                  <strong>{t('mqtt.topics.title')}:</strong> {selectedTopicData.name}
                  <br />
                  <small>{t('common.refresh')} {refreshInterval}s</small>
                </div>
                <div style={{ minWidth: '140px' }}>
                  <Form.Label className="fw-bold small mb-1 d-block">{t('common.refresh')}:</Form.Label>
                  <Form.Select
                    size="sm"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  >
                    <option value={5}>5s</option>
                    <option value={15}>15s</option>
                    <option value={30}>30s</option>
                    <option value={60}>1m</option>
                    <option value={180}>3m</option>
                  </Form.Select>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Messages Section */}
        {selectedTopicData && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">{t('mqtt.topics.messages')} ({messages.length})</h6>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleRefreshMessages}
                disabled={loadingMessages}
              >
                {loadingMessages ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh')}
              </Button>
            </div>

            {/* Loading indicator - shown inline without hiding messages */}
            {loadingMessages && (
              <div className="text-center py-2 mb-2 bg-light rounded">
                <Spinner animation="border" size="sm" className="me-2" />
                <small className="text-muted">{t('common.loading')}</small>
              </div>
            )}

            {messages.length === 0 && !loadingMessages ? (
              <Alert variant="info" className="text-center">
                {t('mqtt.topics.noTopics')}
              </Alert>
            ) : (
              <ListGroup style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {messages.map((message) => (
                  <ListGroup.Item key={message.id} className="py-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-bold small text-muted mb-1">
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                        <div className="small" style={{ wordBreak: 'break-word' }}>
                          {formatPayload(message.payload)}
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MqttConnection;