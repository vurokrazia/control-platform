import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge, ListGroup, Spinner } from 'react-bootstrap';
import { useMqttTopics, useTopicMessages } from '../hooks';
import { useTranslation } from 'react-i18next';
import { jsonFormatter } from '../utils/jsonFormatter';
import type { MqttTopic } from '../repositories/mqttTopicsRepository';
import type { Device } from '../repositories/devicesRepository';

interface MqttConnectionProps {
  devices: Device[];
  selectedDevice: Device | null;
  isLoading: boolean;
  error: string | null;
  onDeviceSelect: (device: Device | null) => void;
  onRefresh: () => void;
}

const MqttConnection: React.FC<MqttConnectionProps> = ({
  devices,
  selectedDevice,
  isLoading,
  error,
  onDeviceSelect,
  onRefresh
}) => {
  const { t } = useTranslation();
  
  // Hooks for topics and messages - now topics loading is managed by parent
  const topics = useMqttTopics();
  const topicMessages = useTopicMessages();
  
  // Local UI state only
  const [selectedTopicData, setSelectedTopicData] = useState<MqttTopic | null>(null);

  // Removed: Device loading moved to parent ControlPage to prevent duplicate calls
  // Removed: Topic loading moved to parent ControlPage to prevent duplicate calls

  useEffect(() => {
    if (!selectedDevice) {
      setSelectedTopicData(null);
    }
  }, [selectedDevice?.deviceId]); // Reset topic selection when device changes

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
  }, [selectedTopicData?.id, topicMessages.state.refreshInterval]); // Use stable ID instead of full object

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
        {(error || topics.state.error || topicMessages.state.error) && (
          <Alert variant="danger" dismissible onClose={() => {
            // Note: devices error clearing is handled by parent
            topics.actions.clearError();
            topicMessages.actions.clearError();
          }}>
            {error || topics.state.error || topicMessages.state.error}
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
                  onRefresh(); // Force refresh when manually clicked
                  topicMessages.actions.updateLastDeviceUpdate();
                }}
                disabled={isLoading}
              >
                {isLoading ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh')}
              </Button>
            </div>
          </div>
          <Form.Select
            value={selectedDevice?.deviceId || ''}
            onChange={(e) => {
              const device = devices.find(d => d.deviceId === e.target.value) || null;
              onDeviceSelect(device);
              setSelectedTopicData(null); // Reset topic selection when device changes
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
            {topicMessages.state.deviceAutoRefresh && (
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
                  <option value="">{t('mqtt.connection.selectTopic')}</option>
                  {topics.state.topics.map((topic) => (
                    <option key={topic.id || topic.name} value={topic.name}>
                      {topic.name} {topic.autoSubscribe ? '📡' : '⚠️'}
                    </option>
                  ))}
                </>
              )}
            </Form.Select>
            <Form.Text className="text-muted">
              {t('mqtt.connection.selectTopicHelp')}
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
                  <strong>{t('mqtt.topics.titleCommands')}:</strong> {selectedTopicData.name}
                  <div className="mt-2 d-flex align-items-center gap-2">
                    <span className={`badge ${selectedTopicData.autoSubscribe ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {selectedTopicData.autoSubscribe ? `📡 ${t('mqtt.topics.subscriptionStatus.auto')}` : `⚠️ ${t('mqtt.topics.subscriptionStatus.manual')}`}
                    </span>
                    <Button
                      variant={selectedTopicData.autoSubscribe ? "outline-warning" : "outline-success"}
                      size="sm"
                      onClick={async () => {
                        if (selectedTopicData.id) {
                          const result = await topics.actions.updateTopic(selectedTopicData.id, !selectedTopicData.autoSubscribe);
                          if (result.success) {
                            // Update local state to reflect the change
                            setSelectedTopicData({ ...selectedTopicData, autoSubscribe: !selectedTopicData.autoSubscribe });
                            // Reload topics to sync with server
                            if (selectedDevice) {
                              void topics.actions.loadTopicsByDevice(selectedDevice.deviceId, true);
                            }
                          }
                        }
                      }}
                      disabled={false}
                      title={selectedTopicData.autoSubscribe ? 'Disable auto-subscribe' : 'Enable auto-subscribe'}
                    >
                      {topics.state.loading.updating ? (
                        <>
                          <Spinner size="sm" className="me-1" />
                          {t('common.loading')}
                        </>
                      ) : selectedTopicData.autoSubscribe ? (
                        <>🔕 {t('mqtt.topics.unsubscribe')}</>
                      ) : (
                        <>📡 {t('mqtt.topics.subscribe')}</>
                      )}
                    </Button>
                  </div>
                  <small className="text-muted">{t('common.refresh')} {topicMessages.state.refreshInterval}s</small>
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