import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Control Platform Serial Device API',
      version: '1.0.0',
      description: `
        RESTful API for managing Arduino serial connections and communication.
        
        ## Features
        - Multi-device support
        - Real-time serial communication
        - MongoDB persistence
        - Session tracking
        - Command history
        - Data buffering
        
        ## Authentication
        Currently no authentication required.
        
        ## Rate Limiting
        No rate limiting currently implemented.
      `,
      contact: {
        name: 'API Support',
        url: 'https://github.com/your-repo/control-platform',
        email: 'support@controlplatform.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.controlplatform.com/v1',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Arduino',
        description: 'Arduino device management and communication'
      },
      {
        name: 'Connection',
        description: 'Device connection management'
      },
      {
        name: 'Data',
        description: 'Serial data operations'
      },
      {
        name: 'Status',
        description: 'Device status and monitoring'
      }
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Operation success status'
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            error: {
              type: 'string',
              description: 'Error message if operation failed'
            },
            apiVersion: {
              type: 'string',
              example: '1.0.0'
            },
            namespace: {
              type: 'string',
              example: 'v1'
            }
          },
          required: ['success']
        },
        SerialPortInfo: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              example: '/dev/cu.usbmodem14101',
              description: 'Serial port path'
            },
            manufacturer: {
              type: 'string',
              example: 'Arduino LLC',
              description: 'Device manufacturer'
            },
            serialNumber: {
              type: 'string',
              example: '85735313038351F03181',
              description: 'Device serial number'
            },
            vendorId: {
              type: 'string',
              example: '2341',
              description: 'USB vendor ID'
            },
            productId: {
              type: 'string',
              example: '0043',
              description: 'USB product ID'
            }
          },
          required: ['path']
        },
        ConnectRequest: {
          type: 'object',
          properties: {
            port: {
              type: 'string',
              example: '/dev/cu.usbmodem14101',
              description: 'Serial port path to connect to'
            },
            baudRate: {
              type: 'integer',
              example: 9600,
              default: 9600,
              description: 'Communication baud rate'
            }
          },
          required: ['port']
        },
        SendDataRequest: {
          type: 'object',
          properties: {
            data: {
              oneOf: [
                { type: 'string' },
                { type: 'number' }
              ],
              example: 'LED_ON',
              description: 'Data to send to Arduino'
            }
          },
          required: ['data']
        },
        CommandRequest: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              example: 'LED',
              description: 'Command name'
            },
            value: {
              oneOf: [
                { type: 'string' },
                { type: 'number' }
              ],
              example: 'ON',
              description: 'Command value (optional)'
            }
          },
          required: ['command']
        },
        DataEntry: {
          type: 'object',
          properties: {
            data: {
              type: 'string',
              example: 'Temperature: 25.6C',
              description: 'Received data'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:30:00.000Z',
              description: 'Data timestamp'
            }
          },
          required: ['data', 'timestamp']
        },
        ArduinoStatus: {
          type: 'object',
          properties: {
            isConnected: {
              type: 'boolean',
              example: true,
              description: 'Connection status'
            },
            port: {
              type: 'string',
              nullable: true,
              example: '/dev/cu.usbmodem14101',
              description: 'Connected port path'
            },
            baudRate: {
              type: 'integer',
              nullable: true,
              example: 9600,
              description: 'Current baud rate'
            },
            lastData: {
              allOf: [{ $ref: '#/components/schemas/DataEntry' }],
              nullable: true,
              description: 'Last received data'
            },
            bufferSize: {
              type: 'integer',
              example: 45,
              description: 'Current buffer size'
            }
          },
          required: ['isConnected', 'port', 'baudRate', 'lastData', 'bufferSize']
        },
        ConnectionInfo: {
          type: 'object',
          properties: {
            connectedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:00:00.000Z'
            },
            lastActivity: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:30:00.000Z'
            },
            port: {
              type: 'string',
              example: '/dev/cu.usbmodem14101'
            },
            baudRate: {
              type: 'integer',
              example: 9600
            }
          }
        },
        DeviceStatusResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                status: { $ref: '#/components/schemas/ArduinoStatus' },
                deviceId: {
                  type: 'string',
                  example: 'arduino1'
                },
                connectionInfo: { $ref: '#/components/schemas/ConnectionInfo' }
              }
            }
          ]
        },
        AllDevicesStatusResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                totalConnections: {
                  type: 'integer',
                  example: 2
                },
                devices: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      deviceId: { type: 'string', example: 'arduino1' },
                      status: { $ref: '#/components/schemas/ArduinoStatus' },
                      connectionInfo: { $ref: '#/components/schemas/ConnectionInfo' }
                    }
                  }
                }
              }
            }
          ]
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Device arduino1 not connected'
            },
            apiVersion: {
              type: 'string',
              example: '1.0.0'
            },
            namespace: {
              type: 'string',
              example: 'v1'
            }
          },
          required: ['success', 'error']
        }
      },
      parameters: {
        DeviceId: {
          name: 'deviceId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            example: 'arduino1'
          },
          description: 'Unique device identifier'
        },
        Limit: {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          },
          description: 'Maximum number of records to return'
        }
      },
      responses: {
        Success: {
          description: 'Operation successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' }
            }
          }
        },
        BadRequest: {
          description: 'Bad request - missing required parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Device ID requerido',
                apiVersion: '1.0.0',
                namespace: 'v1'
              }
            }
          }
        },
        NotFound: {
          description: 'Device not found or not connected',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Device arduino1 not connected',
                apiVersion: '1.0.0',
                namespace: 'v1'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Error interno del servidor',
                apiVersion: '1.0.0',
                namespace: 'v1'
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './src/api/v1/routes/*.ts',
    './src/api/v1/controllers/*.ts'
  ]
};

export default swaggerOptions;