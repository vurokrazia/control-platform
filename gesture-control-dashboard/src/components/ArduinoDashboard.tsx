import React, { useState } from 'react';
import { useArduinoContext } from '../context/ArduinoContext';
import { useTranslation } from 'react-i18next';

const ArduinoDashboard: React.FC = () => {
  const { t } = useTranslation();
  const {
    isConnected,
    isSendingData,
    sendData,
    error
  } = useArduinoContext();

  const [message, setMessage] = useState('');
  const [sendHistory, setSendHistory] = useState<string[]>([]);

  const handleSendData = async () => {
    if (!message.trim()) return;

    try {
      await sendData(message);
      setSendHistory(prev => [...prev.slice(-9), message]); // Mantener últimos 10
      setMessage('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const sendQuickCommand = async (command: string) => {
    try {
      await sendData(command);
      setSendHistory(prev => [...prev.slice(-9), command]);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSendingData) {
      handleSendData();
    }
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
        <p>{t('mqtt.connection.disconnected')}. {t('mqtt.connection.connect')}.</p>
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
      <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
        🎮 {t('devices.title')}
      </h3>

      {/* Envío de mensajes personalizados */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>
          {t('mqtt.topics.message')}
        </h4>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('mqtt.topics.message')}
            disabled={isSendingData}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleSendData}
            disabled={!message.trim() || isSendingData}
            style={{
              padding: '10px 20px',
              backgroundColor: (!message.trim() || isSendingData) ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (!message.trim() || isSendingData) ? 'not-allowed' : 'pointer',
              minWidth: '80px'
            }}
          >
            {isSendingData ? '📤' : '📤'} {t('mqtt.topics.publish')}
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            marginBottom: '15px'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Comandos rápidos */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>
          {t('common.actions')}
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '10px'
        }}>
          {[
            { label: '🔴 LED ON', command: 'LED_ON' },
            { label: '⚫ LED OFF', command: 'LED_OFF' },
            { label: '⬆️ ARRIBA', command: 'UP' },
            { label: '⬇️ ABAJO', command: 'DOWN' },
            { label: '⬅️ IZQ', command: 'LEFT' },
            { label: '➡️ DER', command: 'RIGHT' },
            { label: '✋ ALTO', command: 'STOP' },
            { label: '🔄 RESET', command: 'RESET' },
          ].map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => sendQuickCommand(cmd.command)}
              disabled={isSendingData}
              style={{
                padding: '10px',
                backgroundColor: isSendingData ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isSendingData ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                textAlign: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isSendingData) {
                  e.currentTarget.style.backgroundColor = '#218838';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSendingData) {
                  e.currentTarget.style.backgroundColor = '#28a745';
                }
              }}
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Historial de envíos */}
      {sendHistory.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>
            📜 {t('mqtt.topics.messages')}
          </h4>
          
          <div style={{
            maxHeight: '150px',
            overflowY: 'auto',
            border: '1px solid #eee',
            borderRadius: '5px'
          }}>
            {sendHistory.slice().reverse().map((cmd, index) => (
              <div
                key={`${cmd}-${index}`}
                style={{
                  padding: '8px 12px',
                  borderBottom: index < sendHistory.length - 1 ? '1px solid #f0f0f0' : 'none',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  backgroundColor: index === 0 ? '#e3f2fd' : 'transparent'
                }}
              >
                <span style={{ color: '#666' }}>
                  {new Date().toLocaleTimeString('es-ES')}
                </span>
                <span style={{ marginLeft: '10px', color: '#333' }}>
                  {cmd}
                </span>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setSendHistory([])}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🗑️ {t('common.delete')}
          </button>
        </div>
      )}

      {/* Información de ayuda */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#1565c0'
      }}>
        <strong>💡 {t('common.info')}:</strong>
        <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
          <li>Presiona Enter para enviar mensajes rápidamente</li>
          <li>Los comandos se envían tal como los escribes</li>
          <li>Usa los botones rápidos para comandos comunes</li>
          <li>El historial muestra los últimos 10 comandos enviados</li>
        </ul>
      </div>
    </div>
  );
};

export default ArduinoDashboard;