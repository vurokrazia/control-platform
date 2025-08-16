import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { useTranslation } from 'react-i18next';
import { authValidation } from '../utils/formValidation';
import { passwordStrength } from '../utils/passwordStrength';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { state, actions } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [state.isAuthenticated, navigate]);

  // Pure UI computed values using utilities
  const currentPasswordStrength = passwordStrength.calculate(formData.password);
  const passwordStrengthLabel = t(passwordStrength.getLabel(currentPasswordStrength));
  const passwordStrengthVariant = passwordStrength.getVariant(currentPasswordStrength);

  // Pure UI validation using utility
  const validateForm = (): boolean => {
    const errors = authValidation.validateRegisterForm(
      formData.name, 
      formData.email, 
      formData.password, 
      formData.confirmPassword, 
      t
    );
    const cleanErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, value]) => value !== undefined)
    );
    setFormErrors(cleanErrors);
    return Object.keys(cleanErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear global error
    if (state.error) {
      actions.clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    await actions.handleRegisterSubmit(formData.name.trim(), formData.email, formData.password, navigate);
  };

  // Remove - already computed above

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-4">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={5}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-success text-white text-center py-4">
              <h3 className="mb-0">🎮 {t('app.title')}</h3>
              <p className="mb-0 mt-2">{t('auth.register.title')}</p>
            </Card.Header>
            
            <Card.Body className="p-4">
              {state.error && (
                <Alert variant="danger" dismissible onClose={actions.clearError}>
                  {state.error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('auth.register.fullName')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.name}
                    placeholder={t('auth.register.namePlaceholder')}
                    disabled={state.isLoading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('auth.register.email')}</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.email}
                    placeholder={t('auth.register.emailPlaceholder')}
                    disabled={state.isLoading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('auth.register.password')}</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.password}
                      placeholder={t('auth.register.passwordPlaceholder')}
                      disabled={state.isLoading}
                    />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="position-absolute top-50 translate-middle-y end-0 me-2 border-0"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={state.isLoading}
                    >
                      {showPassword ? '👁️‍🗨️' : '👁️'}
                    </Button>
                  </div>
                  
                  {formData.password && (
                    <div className="mt-2">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>{t('auth.register.passwordStrength')}</span>
                        <span className={`fw-bold text-${passwordStrengthVariant}`}>
                          {passwordStrengthLabel}
                        </span>
                      </div>
                      <ProgressBar 
                        variant={passwordStrengthVariant}
                        now={currentPasswordStrength} 
                        style={{ height: '4px' }}
                      />
                    </div>
                  )}
                  
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>{t('auth.register.confirmPassword')}</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.confirmPassword}
                      placeholder={t('auth.register.confirmPasswordPlaceholder')}
                      disabled={state.isLoading}
                    />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="position-absolute top-50 translate-middle-y end-0 me-2 border-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={state.isLoading}
                    >
                      {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                    </Button>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="success"
                    type="submit"
                    disabled={state.isLoading}
                    size="lg"
                  >
                    {state.isLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {t('auth.register.loading')}
                      </>
                    ) : (
                      t('auth.register.button')
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
            
            <Card.Footer className="text-center py-3 bg-light">
              <p className="mb-0">
                {t('auth.register.hasAccount')}{' '}
                <Link to="/login" className="text-success text-decoration-none fw-bold">
                  {t('auth.register.signInHere')}
                </Link>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};