import { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { devicesRepository, Device } from '../repositories/devicesRepository';
import { useTranslation } from 'react-i18next';

interface DeviceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceCreated?: (device: Device) => void;
}

export const DeviceCreateModal: React.FC<DeviceCreateModalProps> = ({ 
  isOpen, 
  onClose, 
  onDeviceCreated 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    type: 'arduino',
    port: '',
    baudRate: 9600
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t('devices.deviceName') + ' ' + t('auth.validation.nameRequired'));
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      const deviceData: any = {
        name: formData.name.trim(),
        type: formData.type,
        baudRate: formData.baudRate
      };

      // Only include port if it's provided
      if (formData.port.trim()) {
        deviceData.port = formData.port.trim();
      }

      const newDevice = await devicesRepository.createDevice(deviceData);
      
      if (onDeviceCreated) {
        onDeviceCreated(newDevice);
      }
      
      // Reset form
      setFormData({
        name: '',
        type: 'arduino',
        port: '',
        baudRate: 9600
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>🔧 {t('devices.addDevice')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              {t('devices.deviceName')} <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t('devices.deviceName')}
              disabled={creating}
              required
            />
            <Form.Text className="text-muted">
              {t('devices.deviceName')}
            </Form.Text>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">{t('devices.deviceType')}</Form.Label>
                <Form.Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  disabled={creating}
                >
                  <option value="arduino">Arduino</option>
                  <option value="esp32">ESP32</option>
                  <option value="raspberry">Raspberry Pi</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  {t('devices.deviceType')}
                </Form.Label>
                <Form.Select
                  value={formData.baudRate.toString()}
                  onChange={(e) => handleInputChange('baudRate', parseInt(e.target.value))}
                  disabled={creating}
                >
                  <option value="9600">9600</option>
                  <option value="19200">19200</option>
                  <option value="38400">38400</option>
                  <option value="57600">57600</option>
                  <option value="115200">115200</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              {t('mqtt.connection.port')}
            </Form.Label>
            <Form.Control
              type="text"
              value={formData.port}
              onChange={(e) => handleInputChange('port', e.target.value)}
              placeholder={t('mqtt.connection.port')}
              disabled={creating}
            />
            <Form.Text className="text-muted">
              {t('mqtt.connection.port')}
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="secondary" 
              onClick={handleClose}
              disabled={creating}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={creating || !formData.name.trim()}
            >
              {creating ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {t('common.loading')}
                </>
              ) : (
                t('devices.addDevice')
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};