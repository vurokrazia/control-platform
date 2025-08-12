import React from 'react';
import { Container, Row, Col, Card, Button, Navbar, Nav, Dropdown } from 'react-bootstrap';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigateToControl = () => {
    navigate('/control');
  };

  return (
    <>
      {/* Navigation Bar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#home">
            🎮 Gesture Control Dashboard
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" id="dropdown-basic">
                  👤 {user?.name || 'User'}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Header>
                    <div className="text-muted small">Signed in as</div>
                    <div className="fw-bold">{user?.email}</div>
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => navigate('/profile')}>
                    👤 Profile Settings
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => navigate('/mqtt')}>
                    📡 MQTT Topics
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

      {/* Dashboard Content */}
      <Container>
        <Row className="mb-4">
          <Col>
            <h1 className="display-4">Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
            <p className="lead text-muted">
              Control your Arduino devices with hand gestures and manage your MQTT topics.
            </p>
          </Col>
        </Row>

        <Row className="g-4">
          {/* Gesture Control Card */}
          <Col md={6} lg={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <span style={{ fontSize: '3rem' }}>🤚</span>
                </div>
                <Card.Title className="h4">Gesture Control</Card.Title>
                <Card.Text className="text-muted">
                  Use hand gestures to control your Arduino devices in real-time.
                </Card.Text>
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="mt-auto"
                  onClick={handleNavigateToControl}
                >
                  Start Control Session
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Device Management Card */}
          <Col md={6} lg={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <span style={{ fontSize: '3rem' }}>🔧</span>
                </div>
                <Card.Title className="h4">Device Management</Card.Title>
                <Card.Text className="text-muted">
                  Create, connect, and manage your Arduino devices.
                </Card.Text>
                <Button 
                  variant="success" 
                  size="lg" 
                  className="mt-auto"
                  onClick={() => navigate('/devices')}
                >
                  Manage Devices
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* MQTT Topics Card */}
          <Col md={6} lg={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <span style={{ fontSize: '3rem' }}>📡</span>
                </div>
                <Card.Title className="h4">MQTT Topics</Card.Title>
                <Card.Text className="text-muted">
                  Configure MQTT topics and monitor message flow.
                </Card.Text>
                <Button 
                  variant="info" 
                  size="lg" 
                  className="mt-auto"
                  onClick={() => navigate('/mqtt')}
                >
                  MQTT Dashboard
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Analytics Card */}
          <Col md={6} lg={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <span style={{ fontSize: '3rem' }}>📊</span>
                </div>
                <Card.Title className="h4">Analytics</Card.Title>
                <Card.Text className="text-muted">
                  View usage statistics and session history.
                </Card.Text>
                <Button 
                  variant="warning" 
                  size="lg" 
                  className="mt-auto"
                  onClick={() => navigate('/analytics')}
                >
                  View Analytics
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Documentation Card */}
          <Col md={6} lg={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <span style={{ fontSize: '3rem' }}>📚</span>
                </div>
                <Card.Title className="h4">Documentation</Card.Title>
                <Card.Text className="text-muted">
                  Learn how to use the gesture control system.
                </Card.Text>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="mt-auto"
                  onClick={() => window.open('/docs', '_blank')}
                >
                  View Docs
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Settings Card */}
          <Col md={6} lg={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <span style={{ fontSize: '3rem' }}>⚙️</span>
                </div>
                <Card.Title className="h4">Settings</Card.Title>
                <Card.Text className="text-muted">
                  Configure your account and application preferences.
                </Card.Text>
                <Button 
                  variant="dark" 
                  size="lg" 
                  className="mt-auto"
                  onClick={() => navigate('/profile')}
                >
                  Account Settings
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Stats Row */}
        <Row className="mt-5">
          <Col>
            <Card className="border-0 bg-light">
              <Card.Body>
                <Row className="text-center">
                  <Col md={3}>
                    <div className="h3 text-primary mb-1">👤</div>
                    <div className="h5 mb-0">Welcome!</div>
                    <small className="text-muted">Account Active</small>
                  </Col>
                  <Col md={3}>
                    <div className="h3 text-success mb-1">✅</div>
                    <div className="h5 mb-0">Verified</div>
                    <small className="text-muted">{user?.emailVerified ? 'Email Verified' : 'Email Pending'}</small>
                  </Col>
                  <Col md={3}>
                    <div className="h3 text-info mb-1">🔗</div>
                    <div className="h5 mb-0">Connected</div>
                    <small className="text-muted">Real-time Ready</small>
                  </Col>
                  <Col md={3}>
                    <div className="h3 text-warning mb-1">🚀</div>
                    <div className="h5 mb-0">Ready</div>
                    <small className="text-muted">Start Controlling</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};