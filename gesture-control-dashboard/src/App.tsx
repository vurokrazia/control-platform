import React, { useState } from 'react';
import { Container, Row, Col, Nav, Navbar, Button } from 'react-bootstrap';
import HandTracker from './components/HandTracker';
import ArduinoConnection from './components/ArduinoConnection';
import ArduinoStatus from './components/ArduinoStatus';
import ArduinoDashboard from './components/ArduinoDashboard';
import MqttConnection from './components/MqttConnection';
import MqttDashboard from './components/MqttDashboard';
import { MqttTopicsModal } from './components/MqttTopicsModal';
import { ArduinoProvider } from './context/ArduinoContext';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hands' | 'arduino' | 'mqtt'>('arduino');
  const [showMqttModal, setShowMqttModal] = useState(false);

  return (
    <div className="App">
      {/* Navbar Bootstrap */}
      <Navbar bg="white" expand="lg" className="shadow-sm mb-4">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">
            🤖 Arduino & Hand Control
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link 
                active={activeTab === 'arduino'}
                onClick={() => setActiveTab('arduino')}
                className="fw-bold"
              >
                🔌 Conexión Arduino
              </Nav.Link>
              <Nav.Link 
                active={activeTab === 'mqtt'}
                onClick={() => setActiveTab('mqtt')}
                className="fw-bold"
              >
                📡 MQTT Control
              </Nav.Link>
              <Nav.Link 
                active={activeTab === 'hands'}
                onClick={() => setActiveTab('hands')}
                className="fw-bold"
              >
                🖐️ Hand Tracking
              </Nav.Link>
              <Button
                variant="outline-primary"
                onClick={() => setShowMqttModal(true)}
                className="ms-2"
              >
                📡 MQTT Topics
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Contenido principal */}
      <Container fluid className="px-3">
        {activeTab === 'arduino' ? (
          <ArduinoProvider>
            <Row className="g-4">
              {/* Conexión y Estado */}
              <Col lg={6}>
                <ArduinoConnection />
                <ArduinoStatus />
              </Col>
              {/* Panel de Control */}
              <Col lg={6}>
                <ArduinoDashboard />
              </Col>
            </Row>
          </ArduinoProvider>
        ) : activeTab === 'mqtt' ? (
          <Row className="g-4">
            {/* MQTT Connection */}
            <Col lg={6}>
              <MqttConnection />
            </Col>
            {/* MQTT Control Panel */}
            <Col lg={6}>
              <MqttDashboard />
            </Col>
          </Row>
        ) : (
          <Row className="justify-content-center">
            <Col xl={10} xxl={8}>
              <HandTracker />
            </Col>
          </Row>
        )}
      </Container>

      {/* MQTT Topics Modal */}
      <MqttTopicsModal 
        isOpen={showMqttModal}
        onClose={() => setShowMqttModal(false)}
      />
    </div>
  );
};

export default App;