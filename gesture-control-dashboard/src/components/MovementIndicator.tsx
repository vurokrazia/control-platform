import React from 'react';
import type { Movement } from '../utils/movementDetection';
import { useTranslation } from 'react-i18next';

interface MovementIndicatorProps {
  currentMovement: Movement | null;
  dominantDirection: Movement['direction'];
}

const MovementIndicator: React.FC<MovementIndicatorProps> = ({ 
  currentMovement, 
  dominantDirection 
}) => {
  const { t } = useTranslation();
  const getDirectionIcon = (direction: Movement['direction']) => {
    switch (direction) {
      case 'up': return '⬆️';
      case 'down': return '⬇️';
      case 'left': return '⬅️';
      case 'right': return '➡️';
      default: return '🔄';
    }
  };

  const getDirectionColor = (direction: Movement['direction']) => {
    switch (direction) {
      case 'up': return '#28a745';
      case 'down': return '#dc3545';
      case 'left': return '#ffc107';
      case 'right': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getDirectionName = (direction: Movement['direction']) => {
    switch (direction) {
      case 'up': return 'UP';
      case 'down': return 'DOWN';
      case 'left': return 'LEFT';
      case 'right': return 'RIGHT';
      default: return t('common.info');
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '10px',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
        {t('app.title')}
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px' 
      }}>
        {/* Movimiento actual */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
            {t('mqtt.connection.status')}
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: getDirectionColor(currentMovement?.direction || 'none')
          }}>
            {getDirectionIcon(currentMovement?.direction || 'none')}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {getDirectionName(currentMovement?.direction || 'none')}
          </div>
        </div>

        {/* Dirección dominante */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
            {t('common.info')}
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: getDirectionColor(dominantDirection)
          }}>
            {getDirectionIcon(dominantDirection)}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {getDirectionName(dominantDirection)}
          </div>
        </div>

        {/* Magnitud del movimiento */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
            {t('devices.deviceType')}
          </div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#007bff'
          }}>
            {currentMovement?.magnitude ? 
              (currentMovement.magnitude * 100).toFixed(1) : '0.0'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {t('common.info')}
          </div>
        </div>
      </div>

      {/* Indicador visual de dirección */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '20px' 
      }}>
        <div style={{ 
          width: '100px', 
          height: '100px', 
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          {/* Punto central */}
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            position: 'absolute'
          }} />
          
          {/* Indicador de dirección */}
          {dominantDirection !== 'none' && (
            <div style={{
              position: 'absolute',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: getDirectionColor(dominantDirection),
              transform: `translate(${
                dominantDirection === 'right' ? '25px' : 
                dominantDirection === 'left' ? '-25px' : '0'
              }, ${
                dominantDirection === 'down' ? '25px' : 
                dominantDirection === 'up' ? '-25px' : '0'
              })`,
              transition: 'all 0.3s ease'
            }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MovementIndicator;