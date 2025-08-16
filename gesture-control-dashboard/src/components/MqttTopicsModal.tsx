import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, ListGroup, Spinner, InputGroup, Row, Col } from 'react-bootstrap';
import { useDevices, useMqttTopics } from '../hooks';
import { DeviceCreateModal } from './DeviceCreateModal';
import { useTranslation } from 'react-i18next';
import { MqttTopic } from '../repositories/mqttTopicsRepository';

interface MqttTopicsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MqttTopicsModal: React.FC<MqttTopicsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  
  // 3-layer architecture hooks
  const devices = useDevices();
  const topics = useMqttTopics();
  
  // Local UI state only
  const [newTopicName, setNewTopicName] = useState('');
  const [autoSubscribe, setAutoSubscribe] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<MqttTopic | null>(null);

  // Load devices when modal opens
  useEffect(() => {
    if (isOpen) {
      devices.actions.loadAllDevices();
    }
  }, [isOpen]);

  // Load topics when device changes
  useEffect(() => {
    if (isOpen && devices.state.selectedDevice) {
      topics.actions.loadTopicsByDevice(devices.state.selectedDevice.deviceId);
    }
  }, [isOpen, devices.state.selectedDevice]);

  // Pure UI event handlers - no business logic
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !devices.state.selectedDevice) return;

    const result = await topics.actions.createTopic(
      newTopicName.trim(), 
      devices.state.selectedDevice.deviceId, 
      autoSubscribe
    );
    
    if (result.success) {
      setNewTopicName('');
      setAutoSubscribe(true);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    const result = await topics.actions.deleteTopic(topicId);
    if (result.success) {
      setDeleteConfirmation(null);
    }
  };

  const handleUpdateTopic = async (topic: MqttTopic) => {
    const result = await topics.actions.updateTopic(topic.id!, topic.autoSubscribe);
    if (result.success) {
      setEditingTopic(null);
    }
  };

  const handleDeviceCreated = (newDevice: any) => {
    devices.actions.setSelectedDevice(newDevice);
    setShowDeviceModal(false);
  };

  return (
    <>
      <Modal show={isOpen} onHide={onClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📡 {t('mqtt.modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(devices.state.error || topics.state.error) && (
            <Alert variant="danger" dismissible onClose={() => {
              devices.actions.clearError();
              topics.actions.clearError();
            }}>
              {devices.state.error || topics.state.error}
            </Alert>
          )}

          {/* Device Selection - Simplified for testing */}
          <div className="mb-4">
            <Form.Label className="fw-bold">{t('mqtt.modal.deviceSelection')}</Form.Label>
            <Form.Select
              value={devices.state.selectedDevice?.deviceId || ''}
              onChange={(e) => {
                const device = devices.state.devices.find(d => d.deviceId === e.target.value);
                devices.actions.setSelectedDevice(device || null);
              }}
              disabled={devices.state.isLoading}
            >
              <option value="">{t('mqtt.modal.selectDevice')}</option>
              {devices.state.devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.name} ({device.deviceId})
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              {t('mqtt.modal.helpText')}
            </Form.Text>
          </div>

          {/* Create new topic form - Only show if device is selected */}
          {devices.state.selectedDevice && (
            <Form onSubmit={handleCreateTopic} className="mb-4">
              <Form.Label className="fw-bold">{t('mqtt.topics.addTopic')}</Form.Label>
              
              <InputGroup className="mb-2">
                <Form.Control
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder={t('mqtt.topics.topicName')}
                  disabled={topics.state.topics.state.loading.topics.creating}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={topics.state.topics.state.loading.topics.creating || !newTopicName.trim()}
                >
                  {topics.state.topics.state.loading.topics.creating ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {t('common.topics.state.loading.topics')}
                    </>
                  ) : (
                    t('mqtt.topics.addTopic')
                  )}
                </Button>
              </InputGroup>
              
              <Form.Check
                type="switch"
                id="autoSubscribe-create"
                label={`📡 ${t('mqtt.topics.autoSubscribe')}`}
                checked={autoSubscribe}
                onChange={(e) => setAutoSubscribe(e.target.checked)}
                className="mb-2"
              />
              
              <Form.Text className="text-muted">
                {t('mqtt.modal.helpText')}: {devices.state.selectedDevice?.deviceId || ''}
              </Form.Text>
            </Form>
          )}

          {/* Message when no device selected */}
          {!devices.state.selectedDevice?.deviceId || '' && (
            <Alert variant="info" className="mb-4">
              <strong>{t('mqtt.modal.selectDevice')}</strong>
            </Alert>
          )}

          {/* Topics list - Only show if device is selected */}
          {devices.state.selectedDevice?.deviceId || '' && (
            <>
              <h6 className="fw-bold mb-3">
                {t('mqtt.topics.title')} {devices.state.selectedDevice?.deviceId || ''}
              </h6>
              {topics.state.loading.topics ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading topics...</span>
                  </Spinner>
                  <div className="mt-2">{t('common.topics.state.loading.topics')}</div>
                </div>
              ) : topics.state.topics.length === 0 ? (
                <Alert variant="info" className="text-center">
                  {t('mqtt.topics.noTopics')}
                </Alert>
              ) : (
                <ListGroup>
                  {topics.state.topics.map((topic) => {
                    const isEditing = editingTopic?.id === topic.id;
                    return (
                      <ListGroup.Item
                        key={topic.id || topic.name}
                        className="d-flex justify-content-between align-items-start"
                      >
                        <div className="flex-grow-1">
                          <div className="fw-bold d-flex align-items-center">
                            {topic.name}
                            <span className={`ms-2 badge ${topic.autoSubscribe ? 'bg-success' : 'bg-secondary'}`}>
                              {topic.autoSubscribe ? `📡 ${t('mqtt.topics.subscriptionStatus.auto')}` : `⚠️ ${t('mqtt.topics.subscriptionStatus.manual')}`}
                            </span>
                          </div>
                          <small className="text-muted">
                            Created: {new Date(topic.createdAt).toLocaleDateString()}
                          </small>
                          {isEditing && (
                            <div className="mt-2">
                              <Form.Check
                                type="switch"
                                id={`autoSubscribe-${topic.id}`}
                                label={`📡 ${t('mqtt.topics.autoSubscribe')}`}
                                checked={editingTopic.autoSubscribe}
                                onChange={(e) => {
                                  const updatedTopic = { ...editingTopic, autoSubscribe: e.target.checked };
                                  setEditingTopic(updatedTopic);
                                }}
                                className="mb-2"
                              />
                              <div className="d-flex gap-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleUpdateTopic(editingTopic)}
                                >
                                  ✓ {t('common.save')}
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setEditingTopic(null)}
                                >
                                  {t('common.cancel')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="d-flex gap-2">
                          {!isEditing && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => setEditingTopic(topic)}
                              title="Edit subscription settings"
                            >
                              ⚙️
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => confirmDelete(topic.id || topic.name)}
                            title="Delete topic"
                          >
                            ×
                          </Button>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            {t('mqtt.modal.close')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal show={!!deleteConfirmation} onHide={cancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('common.delete')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {t('common.warning')}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            {t('common.no')}
          </Button>
          <Button variant="danger" onClick={() => handleDeleteTopic(deleteConfirmation!)}>
            {t('common.yes')}, {t('common.delete')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Device Creation Modal - Temporarily disabled for testing */}
      {showDeviceModal && (
        <Modal show={true} onHide={() => setShowDeviceModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Device Modal</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Device creation temporarily disabled for 3-layer testing</p>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
};