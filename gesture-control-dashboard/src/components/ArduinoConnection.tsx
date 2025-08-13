import React, { useState } from 'react';
import { Card, Form, Button, Alert, Badge, Row, Col, Accordion } from 'react-bootstrap';
import { useArduinoContext } from '../context/ArduinoContext';
import { useTranslation } from 'react-i18next';

const ArduinoConnection: React.FC = () => {
  const { t } = useTranslation();
  const {
    ports,
    selectedPort,
    isConnected,
    isConnecting,
    connectionError,
    isLoadingPorts,
    isServerAvailable,
    error,
    status,
    loadPorts,
    connect,
    disconnect,
    selectPort,
    clearError,
    checkServerAvailability,
    refreshStatus,
  } = useArduinoContext();

  const [baudRate, setBaudRate] = useState(9600);

  const handleConnect = async () => {
    if (!selectedPort) return;
    
    try {
      await connect(selectedPort, baudRate);
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleRefreshPorts = async () => {
    try {
      await loadPorts();
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleRetryServer = async () => {
    await checkServerAvailability();
  };

  if (!isServerAvailable) {
    return (
      <Card className="mb-3 border-danger">
        <Card.Body className="text-center">
          <Card.Title className="text-danger">
            🔌 {t('devices.title')} API {t('mqtt.connection.error')}
          </Card.Title>
          <Card.Text className="text-muted">
            {t('mqtt.connection.error')}
          </Card.Text>
          <Button variant="primary" onClick={handleRetryServer}>
            🔄 {t('common.refresh')}
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">🔌 {t('devices.title')}</h5>
      </Card.Header>
      <Card.Body>
        {/* Errores */}
        {(error || connectionError) && (
          <Alert variant="danger" dismissible onClose={clearError}>
            {error || connectionError}
          </Alert>
        )}

        {/* Estado de conexión */}
        <Alert variant={isConnected ? 'success' : 'warning'} className="text-center">
          <div style={{ fontSize: '2rem' }}>
            {isConnected ? '✅' : '⚠️'}
          </div>
          <Alert.Heading className="h6">
            {isConnected ? t('mqtt.connection.connected') : t('mqtt.connection.disconnected')}
          </Alert.Heading>
          {selectedPort && (
            <small className="text-muted">{t('mqtt.connection.port')}: {selectedPort}</small>
          )}
        </Alert>

        {/* Controles de conexión */}
        {!isConnected ? (
          <>
            <Row className="mb-3">
              <Col md={8}>
                <Form.Label className="fw-bold">{t('mqtt.modal.selectDevice')}:</Form.Label>
                <Form.Select
                  value={selectedPort || ''}
                  onChange={(e) => selectPort(e.target.value)}
                  disabled={isLoadingPorts || ports.length === 0}
                >
                  <option value="">
                    {isLoadingPorts ? t('common.loading') : 
                     ports.length === 0 ? t('devices.noDevices') : 
                     t('mqtt.modal.selectDevice')}
                  </option>
                  {ports.map((port) => (
                    <option key={port.path} value={port.path}>
                      {port.path} 
                      {port.manufacturer && ` - ${port.manufacturer}`}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={4} className="d-flex align-items-end">
                <Button 
                  variant="outline-info" 
                  size="sm" 
                  onClick={handleRefreshPorts}
                  disabled={isLoadingPorts}
                  className="w-100"
                >
                  {isLoadingPorts ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh')}
                </Button>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Label className="fw-bold">{t('devices.deviceType')}:</Form.Label>
                <Form.Select
                  value={baudRate}
                  onChange={(e) => setBaudRate(parseInt(e.target.value))}
                >
                  <option value={9600}>9600</option>
                  <option value={19200}>19200</option>
                  <option value={38400}>38400</option>
                  <option value={57600}>57600</option>
                  <option value={115200}>115200</option>
                </Form.Select>
              </Col>
            </Row>
          </>
        ) : null}

        {/* Botones de acción */}
        <Row className="g-2">
          <Col>
            {!isConnected ? (
              <Button
                variant="success"
                onClick={handleConnect}
                disabled={!selectedPort || isConnecting || !isServerAvailable}
                className="w-100"
                size="lg"
              >
                {isConnecting ? '🔄 ' + t('mqtt.connection.connecting') : '🔌 ' + t('mqtt.connection.connect')}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleDisconnect}
                disabled={isConnecting}
                className="w-100"
                size="lg"
              >
                {isConnecting ? '🔄 ' + t('mqtt.connection.connecting') : '🔌 ' + t('mqtt.connection.disconnect')}
              </Button>
            )}
          </Col>
          <Col xs="auto">
            <Button
              variant="secondary"
              onClick={async () => {
                console.log('🐛 Estado actual del contexto:', {
                  isConnected,
                  selectedPort,
                  status,
                  isServerAvailable
                });
                console.log('🔄 Forzando actualización de estado...');
                await refreshStatus();
                setTimeout(() => {
                  console.log('🐛 Estado después del refresh:', {
                    isConnected,
                    selectedPort,
                    status,
                    isServerAvailable
                  });
                }, 500);
              }}
              size="lg"
            >
              🔄
            </Button>
          </Col>
        </Row>

        {/* Información de puertos */}
        {ports.length > 0 && (
          <Accordion className="mt-3">
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                {t('common.info')} <Badge bg="info" className="ms-2">{ports.length}</Badge>
              </Accordion.Header>
              <Accordion.Body>
                {ports.map((port) => (
                  <Card key={port.path} className="mb-2 border-light">
                    <Card.Body className="py-2">
                      <div className="fw-bold text-primary">{port.path}</div>
                      {port.manufacturer && <small className="text-muted">{t('devices.deviceName')}: {port.manufacturer}</small>}
                      {port.serialNumber && <><br /><small className="text-muted">{t('devices.deviceId')}: {port.serialNumber}</small></>}
                      {port.vendorId && <><br /><small className="text-muted">Vendor ID: {port.vendorId}</small></>}
                      {port.productId && <><br /><small className="text-muted">Product ID: {port.productId}</small></>}
                    </Card.Body>
                  </Card>
                ))}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )}
      </Card.Body>
    </Card>
  );
};

export default ArduinoConnection;
