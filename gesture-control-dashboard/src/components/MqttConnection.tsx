import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge, Row, Col, ListGroup, Spinner } from 'react-bootstrap';
import { useDevices, useMqttTopics, useTopicMessages } from '../hooks';
import { useTranslation } from 'react-i18next';
import { jsonFormatter } from '../utils/jsonFormatter';
import type { MqttTopic } from '../repositories/mqttTopicsRepository';

interface MqttConnectionProps {
  // No props needed - this component manages its own topic selection
}

const MqttConnection: React.FC<MqttConnectionProps> = () => {
  const { t } = useTranslation();
  
  // 3-layer architecture hooks
  const devices = useDevices();
  const topics = useMqttTopics();
  const topicMessages = useTopicMessages();
  
  // Local UI state only
  const [selectedTopicData, setSelectedTopicData] = useState<MqttTopic | null>(null);

  useEffect(() => {
    devices.actions.loadAllDevices();
  }, []);

  useEffect(() => {
    if (devices.state.selectedDevice) {
      topics.actions.loadTopicsByDevice(devices.state.selectedDevice.deviceId);
    } else {
      setSelectedTopicData(null);
    }
  }, [devices.state.selectedDevice]);

  useEffect(() => {
    if (selectedTopicData?.id) {
      void topicMessages.actions.loadTopicMessages(selectedTopicData.id);
      void topicMessages.actions.startMessageAutoRefresh(selectedTopicData.id, topicMessages.state.refreshInterval);
    } else {
      void topicMessages.actions.stopMessageAutoRefresh();
      void topicMessages.actions.clearMessages();
    }

    return () => {
      void topicMessages.actions.stopMessageAutoRefresh();
    };
  }, [selectedTopicData, topicMessages.state.refreshInterval]);

  useEffect(() => {
    if (topicMessages.state.deviceAutoRefresh) {
      void topicMessages.actions.startDeviceAutoRefresh();
    } else {
      void topicMessages.actions.stopDeviceAutoRefresh();
    }

    return () => {
      void topicMessages.actions.stopDeviceAutoRefresh();
    };
  }, [topicMessages.state.deviceAutoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void topicMessages.actions.cleanupAllIntervals();
    };
  }, []);

  return (
    <Card className="mb-3">
      <Card.Header className="bg-primary text-white d-flex align-items-center">
        <h5 className="mb-0">📡 {t('mqtt.connection.title')}</h5>
        <Badge bg="success" className="ms-auto">
          {t('mqtt.connection.connected')}
        </Badge>
      </Card.Header>
      <Card.Body>
        {(devices.state.error || topics.state.error || topicMessages.state.error) && (
          <Alert variant="danger" dismissible onClose={() => {
            devices.actions.clearError();
            topics.actions.clearError();
            topicMessages.actions.clearError();
          }}>
            {devices.state.error || topics.state.error || topicMessages.state.error}
          </Alert>
        )}

        {/* Device Selection */}
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fw-bold mb-0">{t('mqtt.modal.selectDevice')}:</Form.Label>
            <div className="d-flex gap-2">
              <Button
                variant={topicMessages.state.deviceAutoRefresh ? "success" : "outline-secondary"}
                size="sm"
                onClick={() => topicMessages.actions.setDeviceAutoRefresh(!topicMessages.state.deviceAutoRefresh)}
                title={topicMessages.state.deviceAutoRefresh ? t('common.autoRefreshOn') : t('common.autoRefreshOff')}
              >
                {topicMessages.state.deviceAutoRefresh ? '⏰ Auto' : '⏰ Manual'}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  devices.actions.loadAllDevices();
                  topicMessages.actions.updateLastDeviceUpdate();
                }}
                disabled={devices.state.isLoading}
              >
                {devices.state.isLoading ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh')}
              </Button>
            </div>
          </div>
          <Form.Select
            value={devices.state.selectedDevice?.deviceId || ''}
            onChange={(e) => {
              topicMessages.actions.handleDeviceSelection(
                devices.state.devices,
                e.target.value,
                devices.actions.setSelectedDevice,
                () => setSelectedTopicData(null)
              );
            }}
            disabled={devices.state.isLoading || !devices.state.hasDevices}
          >
            {devices.state.isLoading ? (
              <option>{t('common.loading')}</option>
            ) : !devices.state.hasDevices ? (
              <option>{t('devices.noDevices')}</option>
            ) : (
              <>
                <option value="">{t('mqtt.modal.selectDevice')}</option>
                {devices.state.devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.name} ({device.deviceId})
                  </option>
                ))}
              </>
            )}
          </Form.Select>
          <Form.Text className="text-muted">
            {t('mqtt.modal.helpText')}
            {topicMessages.state.deviceAutoRefresh && (
              <span className="ms-2 text-success">
                ⏰ {t('common.autoRefresh')} (30s)
              </span>
            )}
          </Form.Text>
        </Form.Group>

        {/* Topic Selection - Only show if device is selected */}
        {devices.state.selectedDevice && (
          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="fw-bold mb-0">{t('mqtt.topics.addTopic')}:</Form.Label>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  if (devices.state.selectedDevice) {
                    topics.actions.loadTopicsByDevice(devices.state.selectedDevice.deviceId);
                  }
                }}
                disabled={topics.state.loading.topics}
              >
                {topics.state.loading.topics ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh')}
              </Button>
            </div>
            <Form.Select
              value={selectedTopicData?.name || ''}
              onChange={(e) => {
                topicMessages.actions.handleTopicSelection(
                  topics.state.topics,
                  e.target.value,
                  setSelectedTopicData
                );
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
          </Form.Group>
        )}

        {devices.state.selectedDevice && selectedTopicData && (
          <div className="mb-3">
            <Alert variant="info" className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{t('devices.title')}:</strong> {devices.state.selectedDevice.name} ({devices.state.selectedDevice.deviceId})
                  <br />
                  <strong>{t('mqtt.topics.title')}:</strong> {selectedTopicData.name}
                  <br />
                  <small>{t('common.refresh')} {topicMessages.state.refreshInterval}s</small>
                </div>
                <div style={{ minWidth: '140px' }}>
                  <Form.Label className="fw-bold small mb-1 d-block">{t('common.refresh')}:</Form.Label>
                  <Form.Select
                    size="sm"
                    value={topicMessages.state.refreshInterval}
                    onChange={(e) => topicMessages.actions.setRefreshInterval(parseInt(e.target.value))}
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
              <h6 className="fw-bold mb-0">{t('mqtt.topics.messages')} ({topicMessages.state.messageCount})</h6>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  if (selectedTopicData?.id) {
                    topicMessages.actions.loadTopicMessages(selectedTopicData.id);
                  }
                }}
                disabled={topicMessages.state.isLoadingMessages}
              >
                {topicMessages.state.isLoadingMessages ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh')}
              </Button>
            </div>

            {/* Loading indicator - shown inline without hiding messages */}
            {topicMessages.state.isLoadingMessages && (
              <div className="text-center py-2 mb-2 bg-light rounded">
                <Spinner animation="border" size="sm" className="me-2" />
                <small className="text-muted">{t('common.loading')}</small>
              </div>
            )}

            {!topicMessages.state.hasMessages && !topicMessages.state.isLoadingMessages ? (
              <Alert variant="info" className="text-center">
                {t('mqtt.topics.noTopics')}
              </Alert>
            ) : (
              <ListGroup style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {topicMessages.state.messages.map((message) => (
                  <ListGroup.Item key={message.id} className="py-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-bold small text-muted mb-1">
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                        <div className="small" style={{ wordBreak: 'break-word' }}>
                          {jsonFormatter.formatPayload(message.payload)}
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