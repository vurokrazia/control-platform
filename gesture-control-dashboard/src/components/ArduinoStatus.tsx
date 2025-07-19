import React from 'react';
import { useArduinoContext } from '../context/ArduinoContext';

const ArduinoStatus: React.FC = () => {
  const {
    status,
    lastData,
    isConnected,
    isLoadingStatus,
    refreshStatus,
  } = useArduinoContext();

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  if (!isConnected) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        textAlign: 'center',
        color: '#666'
      }}>
        <p>Arduino no conectado. Conecta primero para ver el estado.</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>
          📊 Estado del Arduino
        </h3>
        <button
          onClick={refreshStatus}
          disabled={isLoadingStatus}
          style={{
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoadingStatus ? 'not-allowed' : 'pointer',
            opacity: isLoadingStatus ? 0.6 : 1
          }}
        >
          {isLoadingStatus ? '🔄' : '🔄'} Actualizar
        </button>
      </div>

      {status ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {/* Estado de conexión */}
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              Estado
            </div>
            <div style={{
              fontSize: '24px',
              marginBottom: '5px'
            }}>
              {status.isConnected ? '✅' : '❌'}
            </div>
            <div style={{
              fontSize: '12px',
              color: status.isConnected ? '#28a745' : '#dc3545',
              fontWeight: 'bold'
            }}>
              {status.isConnected ? 'Conectado' : 'Desconectado'}
            </div>
          </div>

          {/* Puerto y velocidad */}
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              Puerto
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#007bff',
              marginBottom: '5px'
            }}>
              {status.port || 'N/A'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {status.baudRate ? `${status.baudRate} baud` : 'N/A'}
            </div>
          </div>

          {/* Buffer de datos */}
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              Buffer
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#17a2b8',
              marginBottom: '5px'
            }}>
              {status.bufferSize}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              mensajes
            </div>
          </div>

          {/* Último dato recibido */}
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            gridColumn: 'span 2'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              Último Dato Recibido
            </div>
            {status.lastData ? (
              <div>
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '10px',
                  borderRadius: '5px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  marginBottom: '5px',
                  wordBreak: 'break-all'
                }}>
                  {status.lastData.data}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  textAlign: 'right'
                }}>
                  {formatTimestamp(status.lastData.timestamp)}
                </div>
              </div>
            ) : (
              <div style={{
                color: '#999',
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '20px'
              }}>
                No se han recibido datos
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#666',
          padding: '20px'
        }}>
          {isLoadingStatus ? 'Cargando estado...' : 'No se pudo obtener el estado'}
        </div>
      )}

      {/* Datos en tiempo real */}
      {lastData && (
        <div style={{
          marginTop: '20px',
          backgroundColor: '#e8f5e8',
          padding: '15px',
          borderRadius: '8px',
          border: '2px solid #28a745'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '16px', marginRight: '10px' }}>📡</span>
            <strong style={{ color: '#28a745' }}>Datos en Tiempo Real</strong>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '14px',
            marginBottom: '5px'
          }}>
            {lastData.data}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#666',
            textAlign: 'right'
          }}>
            Recibido: {formatTimestamp(lastData.timestamp)}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#856404'
      }}>
        <strong>💡 Información:</strong>
        <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
          <li>El estado se actualiza automáticamente cada 2 segundos</li>
          <li>El buffer mantiene los últimos 100 mensajes recibidos</li>
          <li>Los datos se muestran tal como los envía el Arduino</li>
        </ul>
      </div>
    </div>
  );
};

export default ArduinoStatus;