import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Navbar, Button, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import { useDevices, useMqttTopics, useTopicMessages } from '../hooks';

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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'hands' | 'arduino' | 'mqtt'>(initialTab);
  const [showMqttModal, setShowMqttModal] = useState(false);
  
  // Load shared data once at page level to prevent duplicate calls from child components
  const devices = useDevices();
  const topics = useMqttTopics();
  const topicMessages = useTopicMessages();
  
  useEffect(() => {
    console.log('🏗️ ControlPage: Loading devices once at page level');
    devices.actions.loadAllDevices();
  }, []);

  // Load topics when selected device changes
  useEffect(() => {
    if (devices.state.selectedDevice) {
      console.log('🏗️ ControlPage: Loading topics for device', devices.state.selectedDevice.deviceId);
      topics.actions.loadTopicsByDevice(devices.state.selectedDevice.deviceId);
    }
  }, [devices.state.selectedDevice?.deviceId]);

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
            🤖 {t('app.title')}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                active={activeTab === 'arduino'}
                onClick={() => setActiveTab('arduino')}
                className="fw-bold"
              >
                🔌 {t('navigation.devices')}
              </Nav.Link>
              <Nav.Link 
                active={activeTab === 'mqtt'}
                onClick={() => setActiveTab('mqtt')}
                className="fw-bold"
              >
                📡 {t('mqtt.connection.title')}
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
                📡 {t('mqtt.topics.title')}
              </Button>
            </Nav>
            <Nav className="me-3">
              <LanguageSelector />
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
                    🏠 {t('navigation.dashboard')}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => navigate('/profile')}>
                    👤 {t('navigation.settings')}
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    🚪 {t('navigation.logout')}
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
              <MqttConnection 
                devices={devices.state.devices}
                selectedDevice={devices.state.selectedDevice}
                isLoading={devices.state.isLoading}
                error={devices.state.error}
                onDeviceSelect={devices.actions.setSelectedDevice}
                onRefresh={() => devices.actions.loadAllDevices(true)}
              />
            </Col>
            {/* MQTT Control Panel */}
            <Col lg={6}>
              <MqttDashboard 
                devices={devices.state.devices}
                selectedDevice={devices.state.selectedDevice}
                isLoading={devices.state.isLoading}
                error={devices.state.error}
                onDeviceSelect={devices.actions.setSelectedDevice}
                onRefresh={() => devices.actions.loadAllDevices(true)}
              />
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
        devices={devices.state.devices}
        selectedDevice={devices.state.selectedDevice}
        isLoading={devices.state.isLoading}
        error={devices.state.error}
        onDeviceSelect={devices.actions.setSelectedDevice}
        onRefresh={() => devices.actions.loadAllDevices(true)}
      />
    </div>
  );
};