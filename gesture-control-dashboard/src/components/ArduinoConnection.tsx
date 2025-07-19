import React, { useState } from 'react';
import { Card, Form, Button, Alert, Badge, Row, Col, Accordion } from 'react-bootstrap';
import { useArduinoContext } from '../context/ArduinoContext';

const ArduinoConnection: React.FC = () => {
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
            🔌 Servidor Arduino API no disponible
          </Card.Title>
          <Card.Text className="text-muted">
            Asegúrate de que el servidor esté ejecutándose en http://localhost:3001
          </Card.Text>
          <Button variant="primary" onClick={handleRetryServer}>
            🔄 Reintentar Conexión
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">🔌 Conexión Arduino</h5>
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
            {isConnected ? 'Arduino Conectado' : 'Arduino Desconectado'}
          </Alert.Heading>
          {selectedPort && (
            <small className="text-muted">Puerto: {selectedPort}</small>
          )}
        </Alert>

        {/* Controles de conexión */}
        {!isConnected ? (
          <>
            <Row className="mb-3">
              <Col md={8}>
                <Form.Label className="fw-bold">Seleccionar Puerto:</Form.Label>
                <Form.Select
                  value={selectedPort || ''}
                  onChange={(e) => selectPort(e.target.value)}
                  disabled={isLoadingPorts || ports.length === 0}
                >
                  <option value="">
                    {isLoadingPorts ? 'Cargando puertos...' : 
                     ports.length === 0 ? 'No hay puertos disponibles' : 
                     'Selecciona un puerto'}
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
                  {isLoadingPorts ? '🔄 Cargando...' : '🔄 Refrescar'}
                </Button>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Label className="fw-bold">Velocidad (Baud Rate):</Form.Label>
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
                {isConnecting ? '🔄 Conectando...' : '🔌 Conectar'}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleDisconnect}
                disabled={isConnecting}
                className="w-100"
                size="lg"
              >
                {isConnecting ? '🔄 Desconectando...' : '🔌 Desconectar'}
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
                Ver detalles de puertos <Badge bg="info" className="ms-2">{ports.length}</Badge>
              </Accordion.Header>
              <Accordion.Body>
                {ports.map((port) => (
                  <Card key={port.path} className="mb-2 border-light">
                    <Card.Body className="py-2">
                      <div className="fw-bold text-primary">{port.path}</div>
                      {port.manufacturer && <small className="text-muted">Fabricante: {port.manufacturer}</small>}
                      {port.serialNumber && <><br /><small className="text-muted">Serie: {port.serialNumber}</small></>}
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
