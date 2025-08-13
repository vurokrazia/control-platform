import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, ListGroup, Spinner, InputGroup, Row, Col } from 'react-bootstrap';
import { mqttTopicsRepository, MqttTopic } from '../repositories/mqttTopicsRepository';
import { devicesRepository, Device } from '../repositories/devicesRepository';
import { DeviceCreateModal } from './DeviceCreateModal';
import { useTranslation } from 'react-i18next';

interface MqttTopicsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MqttTopicsModal: React.FC<MqttTopicsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [topics, setTopics] = useState<MqttTopic[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // Load devices when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  // Load topics when device changes
  useEffect(() => {
    if (isOpen && selectedDeviceId) {
      loadTopics();
    } else {
      setTopics([]);
    }
  }, [isOpen, selectedDeviceId]);

  const loadTopics = async () => {
    if (!selectedDeviceId) {
      setTopics([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const topicsList = await mqttTopicsRepository.getDeviceTopics(selectedDeviceId);
      setTopics(topicsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading topics');
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const devicesList = await devicesRepository.getAllDevices();
      setDevices(devicesList);
      
      // Auto-select first device if available
      if (devicesList.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devicesList[0].deviceId);
      }
    } catch (err) {
      console.error('Error loading devices:', err);
      // Don't set error here as it's not critical for topic management
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !selectedDeviceId) return;

    setCreating(true);
    setError(null);
    try {
      await mqttTopicsRepository.createTopic(newTopicName.trim(), selectedDeviceId);
      setNewTopicName('');
      await loadTopics(); // Reload list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating topic');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    setError(null);
    try {
      await mqttTopicsRepository.deleteTopic(topicId);
      setDeleteConfirmation(null);
      await loadTopics(); // Reload list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting topic');
      setDeleteConfirmation(null);
    }
  };

  const confirmDelete = (topicId: string) => {
    setDeleteConfirmation(topicId);
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleDeviceCreated = (newDevice: Device) => {
    setDevices(prev => [...prev, newDevice]);
    setSelectedDeviceId(newDevice.deviceId);
    setShowDeviceModal(false);
  };

  return (
    <>
      <Modal show={isOpen} onHide={onClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📡 {t('mqtt.modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Device Selection */}
          <div className="mb-4">
            <Form.Label className="fw-bold">{t('mqtt.modal.deviceSelection')}</Form.Label>
            <Row className="mb-3">
              <Col md={8}>
                <Form.Select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
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
                          {device.name && device.name !== device.deviceId ? device.name : `Device ${device.deviceId.split('-')[1] || device.deviceId}`} ({device.deviceId})
                        </option>
                      ))}
                    </>
                  )}
                </Form.Select>
              </Col>
              <Col md={4} className="d-flex align-items-start">
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => setShowDeviceModal(true)}
                >
                  + {t('mqtt.modal.newDevice')}
                </Button>
              </Col>
            </Row>
            <Form.Text className="text-muted">
              {t('mqtt.modal.helpText')}
            </Form.Text>
          </div>

          {/* Create new topic form - Only show if device is selected */}
          {selectedDeviceId && (
            <Form onSubmit={handleCreateTopic} className="mb-4">
              <Form.Label className="fw-bold">{t('mqtt.topics.addTopic')}</Form.Label>
              
              <InputGroup>
                <Form.Control
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder={t('mqtt.topics.topicName')}
                  disabled={creating}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={creating || !newTopicName.trim()}
                >
                  {creating ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('mqtt.topics.addTopic')
                  )}
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">
                {t('mqtt.modal.helpText')}: {(() => {
                  const device = devices.find(d => d.deviceId === selectedDeviceId);
                  if (!device) return '';
                  return device.name && device.name !== device.deviceId 
                    ? device.name 
                    : `Device ${device.deviceId.split('-')[1] || device.deviceId}`;
                })()}
              </Form.Text>
            </Form>
          )}

          {/* Message when no device selected */}
          {!selectedDeviceId && (
            <Alert variant="info" className="mb-4">
              <strong>{t('mqtt.modal.selectDevice')}</strong>
            </Alert>
          )}

          {/* Topics list - Only show if device is selected */}
          {selectedDeviceId && (
            <>
              <h6 className="fw-bold mb-3">
                {t('mqtt.topics.title')} {(() => {
                  const device = devices.find(d => d.deviceId === selectedDeviceId);
                  if (!device) return '';
                  return device.name && device.name !== device.deviceId 
                    ? device.name 
                    : `Device ${device.deviceId.split('-')[1] || device.deviceId}`;
                })()}
              </h6>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading topics...</span>
                  </Spinner>
                  <div className="mt-2">{t('common.loading')}</div>
                </div>
              ) : topics.length === 0 ? (
                <Alert variant="info" className="text-center">
                  {t('mqtt.topics.noTopics')}
                </Alert>
              ) : (
                <ListGroup>
                  {topics.map((topic) => {
                    const device = devices.find(d => d.deviceId === topic.deviceId);
                    return (
                      <ListGroup.Item
                        key={topic.id || topic.name}
                        className="d-flex justify-content-between align-items-start"
                      >
                        <div className="flex-grow-1">
                          <div className="fw-bold">{topic.name}</div>
                          <small className="text-muted">
                            Created: {new Date(topic.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => confirmDelete(topic.id || topic.name)}
                          title="Delete topic"
                        >
                          ×
                        </Button>
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

      {/* Device Creation Modal */}
      <DeviceCreateModal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        onDeviceCreated={handleDeviceCreated}
      />
    </>
  );
};