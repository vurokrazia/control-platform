import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Arduino MQTT Control Platform API',
      version: '1.0.0',
      description: `
        RESTful API for managing Arduino devices, MQTT topics, and real-time communication.
        
        ## Features
        - Device management (create, connect, control)
        - MQTT topic management per device
        - Real-time message publishing and monitoring
        - MongoDB persistence
        - Device connection tracking
        - Message history
        
        ## Core Functionality
        - **Devices**: Create and manage Arduino devices
        - **MQTT Topics**: Device-specific topic management with auto-subscribe
        - **Topic Messages**: Publish and retrieve topic messages with history
        - **Connections**: Serial device communication
        
        ## Authentication
        JWT Bearer token authentication required for all endpoints except registration and login.
        Include Authorization header: 'Bearer <your-jwt-token>'
        
        ## Security
        - All data is filtered by authenticated user ownership
        - Users can only access their own devices, topics, and messages
        - 404 responses are returned for unauthorized resource access
        
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
        name: 'Devices',
        description: 'Device creation and management'
      },
      {
        name: 'Arduino',
        description: 'Arduino device connection and communication'
      },
      {
        name: 'MQTT Topics',
        description: 'MQTT topic management and configuration'
      },
      {
        name: 'Topic Messages',
        description: 'Topic message publishing and history'
      },
      {
        name: 'Status',
        description: 'Device status and monitoring'
      },
      {
        name: 'Sessions',
        description: 'Device session tracking and analytics'
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
        Device: {
          type: 'object',
          properties: {
            deviceId: {
              type: 'string',
              example: 'device-1728912345678-ab3cd9ef2',
              description: 'Auto-generated unique device identifier'
            },
            name: {
              type: 'string',
              example: 'Arduino Robot Car',
              description: 'Device display name'
            },
            type: {
              type: 'string',
              example: 'arduino',
              default: 'arduino',
              description: 'Device type'
            },
            port: {
              type: 'string',
              nullable: true,
              example: '/dev/cu.usbmodem14101',
              description: 'Serial port path (optional)'
            },
            baudRate: {
              type: 'integer',
              example: 9600,
              default: 9600,
              description: 'Communication baud rate'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:00:00.000Z'
            }
          },
          required: ['deviceId', 'name', 'type', 'baudRate', 'createdAt']
        },
        CreateDeviceRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Arduino Robot Car',
              description: 'Device display name'
            },
            type: {
              type: 'string',
              example: 'arduino',
              default: 'arduino',
              description: 'Device type'
            },
            port: {
              type: 'string',
              nullable: true,
              example: '/dev/cu.usbmodem14101',
              description: 'Serial port path (optional)'
            },
            baudRate: {
              type: 'integer',
              example: 9600,
              default: 9600,
              description: 'Communication baud rate'
            }
          },
          required: ['name']
        },
        MqttTopic: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              description: 'UUID topic identifier'
            },
            name: {
              type: 'string',
              example: 'robots/sparky/commands',
              description: 'MQTT topic name'
            },
            deviceId: {
              type: 'string',
              example: 'device-1728912345678-ab3cd9ef2',
              description: 'Associated device identifier'
            },
            autoSubscribe: {
              type: 'boolean',
              example: true,
              description: 'Whether to automatically subscribe to this topic'
            },
            userId: {
              type: 'string',
              example: 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              description: 'User who owns this topic'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:30:00.000Z'
            }
          },
          required: ['id', 'name', 'deviceId', 'autoSubscribe', 'userId', 'createdAt', 'updatedAt']
        },
        CreateTopicRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'robots/sparky/commands',
              description: 'MQTT topic name'
            },
            deviceId: {
              type: 'string',
              example: 'device-1728912345678-ab3cd9ef2',
              description: 'Associated device identifier'
            },
            autoSubscribe: {
              type: 'boolean',
              example: true,
              default: false,
              description: 'Whether to automatically subscribe to this topic'
            }
          },
          required: ['name', 'deviceId']
        },
        UpdateTopicRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'robots/sparky/commands/updated',
              description: 'Updated MQTT topic name'
            },
            autoSubscribe: {
              type: 'boolean',
              example: false,
              description: 'Whether to automatically subscribe to this topic'
            }
          }
        },
        PublishTopicRequest: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              example: 'robots/sparky/commands',
              description: 'MQTT topic name to publish to'
            },
            payload: {
              type: 'object',
              example: { "command": "W", "speed": 200 },
              description: 'Message payload to publish'
            }
          },
          required: ['topic', 'payload']
        },
        TopicMessage: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              description: 'UUID message identifier'
            },
            payload: {
              type: 'object',
              example: { "command": "W", "speed": 200 },
              description: 'Message payload data'
            },
            topicId: {
              type: 'string',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              description: 'Topic ID that owns this message'
            },
            userId: {
              type: 'string',
              example: 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              description: 'User who sent this message'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:30:00.000Z'
            }
          },
          required: ['id', 'payload', 'topicId', 'userId', 'createdAt']
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
        SessionUsage: {
          type: 'object',
          properties: {
            commandsSent: {
              type: 'integer',
              example: 25,
              description: 'Number of commands sent during session'
            },
            dataReceived: {
              type: 'integer',
              example: 150,
              description: 'Amount of data received during session'
            },
            gesturesDetected: {
              type: 'integer',
              example: 12,
              description: 'Number of gestures detected during session'
            },
            errorCount: {
              type: 'integer',
              example: 2,
              description: 'Number of errors encountered during session'
            }
          },
          required: ['commandsSent', 'dataReceived', 'gesturesDetected', 'errorCount']
        },
        SessionConnectionInfo: {
          type: 'object',
          properties: {
            connectedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:00:00.000Z',
              description: 'When the connection was established'
            },
            disconnectedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2024-01-20T11:30:00.000Z',
              description: 'When the connection was terminated'
            },
            duration: {
              type: 'integer',
              nullable: true,
              example: 5400,
              description: 'Connection duration in seconds'
            },
            reason: {
              type: 'string',
              example: 'session_start',
              description: 'Reason for connection/disconnection'
            }
          },
          required: ['connectedAt', 'reason']
        },
        DeviceSession: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
              description: 'Session MongoDB ObjectId'
            },
            deviceId: {
              type: 'string',
              example: 'device-1728912345678-ab3cd9ef2',
              description: 'Associated device identifier'
            },
            sessionDate: {
              type: 'string',
              format: 'date',
              example: '2024-01-20',
              description: 'Date of the session'
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:00:00.000Z',
              description: 'Session start timestamp'
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2024-01-20T11:30:00.000Z',
              description: 'Session end timestamp'
            },
            isActive: {
              type: 'boolean',
              example: true,
              description: 'Whether the session is currently active'
            },
            totalDuration: {
              type: 'integer',
              example: 5400,
              description: 'Total session duration in seconds'
            },
            connections: {
              type: 'array',
              items: { $ref: '#/components/schemas/SessionConnectionInfo' },
              description: 'List of connections during this session'
            },
            usage: {
              $ref: '#/components/schemas/SessionUsage',
              description: 'Session usage statistics'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T11:30:00.000Z'
            }
          },
          required: ['deviceId', 'sessionDate', 'startTime', 'isActive', 'totalDuration', 'connections', 'usage', 'createdAt', 'updatedAt']
        },
        SessionStats: {
          type: 'object',
          properties: {
            deviceId: {
              type: 'string',
              example: 'device-1728912345678-ab3cd9ef2'
            },
            totalSessions: {
              type: 'integer',
              example: 15,
              description: 'Total number of sessions'
            },
            activeDays: {
              type: 'integer',
              example: 12,
              description: 'Number of days with activity'
            },
            totalUsageTime: {
              type: 'integer',
              example: 54000,
              description: 'Total usage time in seconds'
            },
            averageSessionDuration: {
              type: 'number',
              example: 3600.5,
              description: 'Average session duration in seconds'
            },
            totalCommands: {
              type: 'integer',
              example: 350,
              description: 'Total commands sent across all sessions'
            },
            totalDataReceived: {
              type: 'integer',
              example: 2500,
              description: 'Total data received across all sessions'
            },
            totalErrors: {
              type: 'integer',
              example: 8,
              description: 'Total errors across all sessions'
            },
            longestSession: {
              type: 'integer',
              example: 7200,
              description: 'Longest session duration in seconds'
            },
            mostActiveDay: {
              type: 'string',
              format: 'date',
              example: '2024-01-20',
              description: 'Date with most activity'
            },
            dateRange: {
              type: 'object',
              properties: {
                from: {
                  type: 'string',
                  format: 'date-time',
                  example: '2024-01-01T00:00:00.000Z'
                },
                to: {
                  type: 'string',
                  format: 'date-time',
                  example: '2024-01-20T23:59:59.000Z'
                },
                days: {
                  type: 'integer',
                  example: 30
                }
              }
            }
          }
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
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token. Include as Authorization: Bearer <token>'
        }
      },
      parameters: {
        DeviceId: {
          name: 'deviceId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            example: 'device-1728912345678-ab3cd9ef2'
          },
          description: 'Unique device identifier'
        },
        TopicId: {
          name: 'topicId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
          },
          description: 'Unique topic identifier'
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
        Unauthorized: {
          description: 'Authentication required - missing or invalid JWT token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Unauthorized - User not authenticated or invalid token',
                apiVersion: '1.0.0',
                namespace: 'v1'
              }
            }
          }
        },
        Forbidden: {
          description: 'Access denied - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Access denied - insufficient permissions',
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