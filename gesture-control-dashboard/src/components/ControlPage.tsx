import React, { useState } from 'react';
import { Container, Row, Col, Nav, Navbar, Button, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// Existing components
import HandTracker from './HandTracker';
import ArduinoConnection from './ArduinoConnection';
import ArduinoStatus from './ArduinoStatus';
import ArduinoDashboard from './ArduinoDashboard';
import MqttConnection from './MqttConnection';
import MqttDashboard from './MqttDashboard';
import { MqttTopicsModal } from './MqttTopicsModal';
import { ArduinoProvider } from '../context/ArduinoContext';

interface ControlPageProps {
  initialTab?: 'hands' | 'arduino' | 'mqtt';
}

export const ControlPage: React.FC<ControlPageProps> = ({ 
  initialTab = 'arduino' 
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'hands' | 'arduino' | 'mqtt'>(initialTab);
  const [showMqttModal, setShowMqttModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div>
      {/* Navigation Bar */}
      <Navbar bg="white" expand="lg" className="shadow-sm mb-4">
        <Container>
          <Navbar.Brand 
            className="fw-bold text-primary" 
            role="button"
            onClick={() => navigate('/dashboard')}
          >
            🤖 Arduino & Hand Control
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                active={activeTab === 'arduino'}
                onClick={() => setActiveTab('arduino')}
                className="fw-bold"
              >
                🔌 Arduino Connection
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
            
            {/* User Menu */}
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-dark" size="sm">
                  👤 {user?.name?.split(' ')[0] || 'User'}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Header>
                    <div className="text-muted small">Signed in as</div>
                    <div className="fw-bold">{user?.email}</div>
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => navigate('/dashboard')}>
                    🏠 Dashboard
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => navigate('/profile')}>
                    👤 Profile Settings
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    🚪 Sign Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="px-3">
        {activeTab === 'arduino' ? (
          <ArduinoProvider>
            <Row className="g-4">
              {/* Connection and Status */}
              <Col lg={6}>
                <ArduinoConnection />
                <ArduinoStatus />
              </Col>
              {/* Control Panel */}
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