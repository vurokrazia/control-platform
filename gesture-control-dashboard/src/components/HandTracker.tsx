import React from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import MovementIndicator from './MovementIndicator';
import { useTranslation } from 'react-i18next';

const HandTracker: React.FC = () => {
  const { t } = useTranslation();
  const {
    videoRef,
    canvasRef,
    isLoaded,
    isTracking,
    error,
    indexFingerPosition,
    currentMovement,
    dominantDirection,
    startTracking,
    stopTracking
  } = useHandTracking();

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '30px'
      }}>
        🖐️ {t('app.title')}
      </h1>

      {/* Estado de carga */}
      {!isLoaded && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <p>{t('common.loading')}</p>
        </div>
      )}

      {/* Errores */}
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <strong>{t('common.error')}:</strong> {error}
        </div>
      )}

      {/* Controles */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '15px',
        marginBottom: '20px'
      }}>
        <button
          onClick={startTracking}
          disabled={!isLoaded || isTracking}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoaded && !isTracking ? 'pointer' : 'not-allowed',
            backgroundColor: isLoaded && !isTracking ? '#4CAF50' : '#ccc',
            color: 'white',
            transition: 'background-color 0.3s'
          }}
        >
          {isTracking ? t('common.loading') : t('mqtt.connection.connect')}
        </button>

        <button
          onClick={stopTracking}
          disabled={!isTracking}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '5px',
            cursor: isTracking ? 'pointer' : 'not-allowed',
            backgroundColor: isTracking ? '#f44336' : '#ccc',
            color: 'white',
            transition: 'background-color 0.3s'
          }}
        >
          {t('mqtt.connection.disconnect')}
        </button>
      </div>

      {/* Indicador de movimiento */}
      {isTracking && (
        <MovementIndicator 
          currentMovement={currentMovement}
          dominantDirection={dominantDirection}
        />
      )}

      {/* Video y Canvas */}
      <div style={{ 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            style={{
              width: '640px',
              height: '480px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              transform: 'scaleX(-1)' // Efecto espejo
            }}
            autoPlay
            muted
            playsInline
          />
          
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '640px',
              height: '480px',
              pointerEvents: 'none',
              transform: 'scaleX(-1)' // Efecto espejo
            }}
          />
        </div>
      </div>

      {/* Información de posición */}
      {isTracking && indexFingerPosition && (
        <div style={{ 
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
            Posición del Dedo Índice
          </h4>
          <p style={{ margin: '0', fontFamily: 'monospace' }}>
            X: {indexFingerPosition.x.toFixed(3)} | 
            Y: {indexFingerPosition.y.toFixed(3)}
          </p>
        </div>
      )}

      {/* Instrucciones */}
      <div style={{ 
        backgroundColor: '#e8f5e8',
        padding: '15px',
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
          Instrucciones:
        </h4>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Coloca tu mano frente a la cámara</li>
          <li>Extiende tu dedo índice</li>
          <li>Mueve el dedo en diferentes direcciones</li>
          <li>Observa la detección en tiempo real</li>
        </ul>
      </div>
    </div>
  );
};

export default HandTracker;