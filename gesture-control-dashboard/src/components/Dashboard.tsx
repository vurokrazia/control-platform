import React from 'react';
import { Container, Row, Col, Card, Button, Navbar, Nav, Dropdown } from 'react-bootstrap';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

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
            🎮 {t('app.title')} {t('app.subtitle')}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <LanguageSelector />
            </Nav>
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
                    👤 {t('navigation.settings')}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => navigate('/mqtt')}>
                    📡 {t('mqtt.topics.title')}
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

      {/* Dashboard Content */}
      <Container>
        <Row className="mb-4">
          <Col>
            <h1 className="display-4">{t('dashboard.welcome')}, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
            <p className="lead text-muted">
              {t('dashboard.welcome')}
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
                <Card.Title className="h4">{t('app.title')}</Card.Title>
                <Card.Text className="text-muted">
                  {t('dashboard.welcome')}
                </Card.Text>
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="mt-auto"
                  onClick={handleNavigateToControl}
                >
                  {t('dashboard.devices.connectDevice')}
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
                <Card.Title className="h4">{t('devices.title')}</Card.Title>
                <Card.Text className="text-muted">
                  {t('devices.title')}
                </Card.Text>
                <Button 
                  variant="success" 
                  size="lg" 
                  className="mt-auto"
                  onClick={() => navigate('/devices')}
                >
                  {t('navigation.devices')}
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
                <Card.Title className="h4">{t('mqtt.topics.title')}</Card.Title>
                <Card.Text className="text-muted">
                  {t('mqtt.connection.title')}
                </Card.Text>
                <Button 
                  variant="info" 
                  size="lg" 
                  className="mt-auto"
                  onClick={() => navigate('/mqtt')}
                >
                  {t('navigation.dashboard')}
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
                <Card.Title className="h4">{t('common.info')}</Card.Title>
                <Card.Text className="text-muted">
                  {t('common.info')}
                </Card.Text>
                <Button 
                  variant="warning" 
                  size="lg" 
                  className="mt-auto"
                  onClick={() => navigate('/analytics')}
                >
                  {t('common.info')}
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
                <Card.Title className="h4">{t('common.info')}</Card.Title>
                <Card.Text className="text-muted">
                  {t('common.info')}
                </Card.Text>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="mt-auto"
                  onClick={() => window.open('/docs', '_blank')}
                >
                  {t('common.info')}
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
                <Card.Title className="h4">{t('navigation.settings')}</Card.Title>
                <Card.Text className="text-muted">
                  {t('navigation.settings')}
                </Card.Text>
                <Button 
                  variant="dark" 
                  size="lg" 
                  className="mt-auto"
                  onClick={() => navigate('/profile')}
                >
                  {t('navigation.settings')}
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
                    <div className="h5 mb-0">{t('dashboard.welcome')}</div>
                    <small className="text-muted">{t('common.success')}</small>
                  </Col>
                  <Col md={3}>
                    <div className="h3 text-success mb-1">✅</div>
                    <div className="h5 mb-0">{t('common.success')}</div>
                    <small className="text-muted">{user?.emailVerified ? t('common.success') : t('common.warning')}</small>
                  </Col>
                  <Col md={3}>
                    <div className="h3 text-info mb-1">🔗</div>
                    <div className="h5 mb-0">{t('mqtt.connection.connected')}</div>
                    <small className="text-muted">{t('common.success')}</small>
                  </Col>
                  <Col md={3}>
                    <div className="h3 text-warning mb-1">🚀</div>
                    <div className="h5 mb-0">{t('common.success')}</div>
                    <small className="text-muted">{t('dashboard.devices.connectDevice')}</small>
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