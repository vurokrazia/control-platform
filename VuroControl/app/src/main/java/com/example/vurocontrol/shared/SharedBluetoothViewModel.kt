package com.example.vurocontrol.shared

import android.app.Application
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.util.UUID
import kotlinx.coroutines.Job
import java.text.SimpleDateFormat
import java.util.*
import com.example.vurocontrol.database.VuroControlDatabase
import com.example.vurocontrol.repository.MessageRepository
import com.example.vurocontrol.database.entities.MessageType

data class BluetoothMessage(
    val content: String,
    val timestamp: String = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date()),
    val id: String = UUID.randomUUID().toString()
)

class SharedBluetoothViewModel(application: Application) : AndroidViewModel(application) {

    private val bluetoothAdapter: BluetoothAdapter? =
        (application.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter

    // Database and Repository
    private val database = VuroControlDatabase.getDatabase(application)
    private val messageRepository = MessageRepository(database.messageDao())

    private var bluetoothSocket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var inputStream: InputStream? = null
    private var messageReaderJob: Job? = null

    // UUID estándar para SPP (Serial Port Profile)
    private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    // Estados de conexión
    private val _connectionStatus = MutableLiveData<String>().apply {
        value = "Desconectado"
    }
    val connectionStatus: LiveData<String> = _connectionStatus

    private val _isConnected = MutableLiveData<Boolean>().apply {
        value = false
    }
    val isConnected: LiveData<Boolean> = _isConnected

    private val _connectedDevice = MutableLiveData<BluetoothDevice?>()
    val connectedDevice: LiveData<BluetoothDevice?> = _connectedDevice

    // Descubrimiento de dispositivos
    private val _discoveredDevices = MutableLiveData<List<BluetoothDevice>>()
    val discoveredDevices: LiveData<List<BluetoothDevice>> = _discoveredDevices

    private val _isScanning = MutableLiveData<Boolean>().apply {
        value = false
    }
    val isScanning: LiveData<Boolean> = _isScanning

    // Mensajes y errores
    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> = _errorMessage

    private val _lastCommandSent = MutableLiveData<String>()
    val lastCommandSent: LiveData<String> = _lastCommandSent

    // DATABASE OPERATION BLOCKING STATE
    private val _isDatabaseBusy = MutableLiveData<Boolean>().apply {
        value = false
    }
    val isDatabaseBusy: LiveData<Boolean> = _isDatabaseBusy

    // SAFE: Database operations with blocking state management
    suspend fun getLastNMessagesOnce(limit: Int = 20): List<com.example.vurocontrol.database.entities.MessageEntity> {
        return withContext(Dispatchers.IO) {
            try {
                // Set database busy state
                withContext(Dispatchers.Main) {
                    _isDatabaseBusy.value = true
                }
                
                android.util.Log.d("BluetoothViewModel", "DATABASE BUSY: Starting query for $limit messages")
                
                val result = messageRepository.getLastNMessagesSync(limit)
                
                android.util.Log.d("BluetoothViewModel", "DATABASE OPERATION COMPLETE: Retrieved ${result.size} messages")
                
                result
            } catch (e: Exception) {
                android.util.Log.e("BluetoothViewModel", "Error getting $limit messages: ${e.message}", e)
                emptyList()
            } finally {
                // Always clear busy state
                withContext(Dispatchers.Main) {
                    _isDatabaseBusy.value = false
                    android.util.Log.d("BluetoothViewModel", "DATABASE FREE: Query operation finished")
                }
            }
        }
    }
    
    suspend fun getUnreadMessageCountOnce(): Int {
        return withContext(Dispatchers.IO) {
            try {
                // Set database busy state  
                withContext(Dispatchers.Main) {
                    _isDatabaseBusy.value = true
                }
                
                android.util.Log.d("BluetoothViewModel", "DATABASE BUSY: Getting unread count")
                
                val result = messageRepository.getUnreadMessageCountSync()
                
                android.util.Log.d("BluetoothViewModel", "DATABASE OPERATION COMPLETE: Unread count = $result")
                
                result
            } catch (e: Exception) {
                android.util.Log.e("BluetoothViewModel", "Error getting unread count: ${e.message}", e)
                0
            } finally {
                // Always clear busy state
                withContext(Dispatchers.Main) {
                    _isDatabaseBusy.value = false
                    android.util.Log.d("BluetoothViewModel", "DATABASE FREE: Unread count operation finished")
                }
            }
        }
    }
    
    // Mensajes recibidos como lista - ahora desde la base de datos (backward compatibility)
    val receivedMessagesList: LiveData<List<BluetoothMessage>> = messageRepository.getLast20Messages()
    
    // Nuevo mensaje notificador - para mostrar notificaciones en tiempo real
    private val _newMessageNotifier = MutableLiveData<BluetoothMessage>()
    val newMessageNotifier: LiveData<BluetoothMessage> = _newMessageNotifier

    // Compatibilidad - mantener la propiedad anterior pero como string concatenado
    private val _receivedMessages = MutableLiveData<String>().apply {
        value = ""
    }
    val receivedMessages: LiveData<String> = _receivedMessages

    private val deviceList = mutableListOf<BluetoothDevice>()

    // BroadcastReceiver para descubrir dispositivos
    private val bluetoothReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                BluetoothDevice.ACTION_FOUND -> {
                    val device: BluetoothDevice? = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
                    device?.let {
                        if (!deviceList.contains(it)) {
                            deviceList.add(it)
                            _discoveredDevices.value = deviceList.toList()
                        }
                    }
                }
                BluetoothAdapter.ACTION_DISCOVERY_FINISHED -> {
                    _isScanning.value = false
                    if (deviceList.isEmpty()) {
                        _errorMessage.value = "No se encontraron dispositivos Bluetooth"
                    }
                }
                BluetoothAdapter.ACTION_DISCOVERY_STARTED -> {
                    _isScanning.value = true
                    deviceList.clear()
                    _discoveredDevices.value = emptyList()
                }
            }
        }
    }

    init {
        // Registrar el BroadcastReceiver
        val filter = IntentFilter().apply {
            addAction(BluetoothDevice.ACTION_FOUND)
            addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)
            addAction(BluetoothAdapter.ACTION_DISCOVERY_STARTED)
        }
        getApplication<Application>().registerReceiver(bluetoothReceiver, filter)
    }

    // ========== FUNCIONES DE DESCUBRIMIENTO ==========

    fun startDeviceDiscovery() {
        if (bluetoothAdapter == null) {
            _errorMessage.value = "Bluetooth no disponible en este dispositivo"
            return
        }

        if (!bluetoothAdapter.isEnabled) {
            _errorMessage.value = "Bluetooth está desactivado. Por favor actívalo"
            return
        }

        try {
            if (bluetoothAdapter.isDiscovering) {
                bluetoothAdapter.cancelDiscovery()
            }

            _connectionStatus.value = "Buscando dispositivos..."
            bluetoothAdapter.startDiscovery()
        } catch (e: SecurityException) {
            _errorMessage.value = "Error de permisos: ${e.message}"
        }
    }

    fun stopDiscovery() {
        try {
            bluetoothAdapter?.cancelDiscovery()
            _isScanning.value = false
        } catch (e: SecurityException) {
            // Ignorar errores de permisos al parar descubrimiento
        }
    }

    // ========== FUNCIONES DE CONEXIÓN ==========

    fun connectToDevice(device: BluetoothDevice) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                withContext(Dispatchers.Main) {
                    _connectionStatus.value = "Conectando a ${device.name}..."
                }

                // Parar descubrimiento antes de conectar
                bluetoothAdapter?.cancelDiscovery()

                // Crear socket
                bluetoothSocket = device.createRfcommSocketToServiceRecord(SPP_UUID)

                // Conectar
                bluetoothSocket?.connect()
                outputStream = bluetoothSocket?.outputStream
                inputStream = bluetoothSocket?.inputStream

                withContext(Dispatchers.Main) {
                    _connectionStatus.value = "Conectado a ${device.name}"
                    _connectedDevice.value = device
                    _isConnected.value = true
                }

                // Iniciar lectura de mensajes
                startMessageReader()

            } catch (e: IOException) {
                withContext(Dispatchers.Main) {
                    _errorMessage.value = "Error al conectar: ${e.message}"
                    _connectionStatus.value = "Error de conexión"
                    _isConnected.value = false
                }
                disconnect()
            } catch (e: SecurityException) {
                withContext(Dispatchers.Main) {
                    _errorMessage.value = "Error de permisos: ${e.message}"
                    _connectionStatus.value = "Error de permisos"
                    _isConnected.value = false
                }
            }
        }
    }

    fun disconnect() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Cancelar lectura de mensajes
                messageReaderJob?.cancel()
                messageReaderJob = null

                outputStream?.close()
                inputStream?.close()
                bluetoothSocket?.close()
                outputStream = null
                inputStream = null
                bluetoothSocket = null

                withContext(Dispatchers.Main) {
                    _connectionStatus.value = "Desconectado"
                    _connectedDevice.value = null
                    _isConnected.value = false
                }
            } catch (e: IOException) {
                withContext(Dispatchers.Main) {
                    _errorMessage.value = "Error al desconectar: ${e.message}"
                }
            }
        }
    }

    // ========== FUNCIONES DE COMUNICACIÓN ==========

    fun sendCommand(command: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (outputStream != null && bluetoothSocket?.isConnected == true) {
                    outputStream?.write("$command\n".toByteArray())
                    outputStream?.flush()

                    withContext(Dispatchers.Main) {
                        _lastCommandSent.value = command
                        _connectionStatus.value = "Comando enviado: $command"
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        _errorMessage.value = "No hay conexión activa"
                    }
                }
            } catch (e: IOException) {
                withContext(Dispatchers.Main) {
                    _errorMessage.value = "Error al enviar comando: ${e.message}"
                }
                disconnect()
            }
        }
    }

    // ========== FUNCIONES DE LECTURA DE MENSAJES ==========

    private fun startMessageReader() {
        messageReaderJob = CoroutineScope(Dispatchers.IO).launch {
            try {
                val buffer = ByteArray(1024)
                val stringBuilder = StringBuilder()
                
                while (isActive && bluetoothSocket?.isConnected == true) {
                    try {
                        inputStream?.let { stream ->
                            val bytesRead = stream.read(buffer)
                            if (bytesRead > 0) {
                                val receivedText = String(buffer, 0, bytesRead).trim()
                                
                                if (receivedText.isNotEmpty()) {
                                    // Crear BluetoothMessage para notificación inmediata
                                    val bluetoothMessage = BluetoothMessage(content = receivedText)
                                    
                                    // SAFE: Guardar mensaje en la base de datos con blocking state
                                    launch(Dispatchers.IO) {
                                        try {
                                            // Set database busy state
                                            withContext(Dispatchers.Main) {
                                                _isDatabaseBusy.value = true
                                            }
                                            
                                            android.util.Log.d("BluetoothViewModel", "DATABASE BUSY: Saving new message: $receivedText")
                                            
                                            val deviceName = _connectedDevice.value?.name
                                            val deviceAddress = _connectedDevice.value?.address
                                            
                                            messageRepository.insertMessage(
                                                content = receivedText,
                                                deviceAddress = deviceAddress,
                                                deviceName = deviceName,
                                                messageType = MessageType.RECEIVED
                                            )
                                            
                                            android.util.Log.d("BluetoothViewModel", "DATABASE OPERATION COMPLETE: Message saved successfully")
                                            
                                            // Notificar mensaje nuevo en UI thread
                                            withContext(Dispatchers.Main) {
                                                _newMessageNotifier.value = bluetoothMessage
                                                
                                                // Mantener compatibilidad con string concatenado
                                                val currentMessages = _receivedMessages.value ?: ""
                                                val newMessages = "$currentMessages$receivedText\n"
                                                _receivedMessages.value = newMessages
                                            }
                                        } catch (e: Exception) {
                                            android.util.Log.e("BluetoothViewModel", "Error saving message: ${e.message}", e)
                                        } finally {
                                            // Always clear busy state
                                            withContext(Dispatchers.Main) {
                                                _isDatabaseBusy.value = false
                                                android.util.Log.d("BluetoothViewModel", "DATABASE FREE: Message save operation finished")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e: IOException) {
                        if (isActive) {
                            withContext(Dispatchers.Main) {
                                _errorMessage.value = "Error leyendo mensajes: ${e.message}"
                            }
                        }
                        break
                    }
                }
            } catch (e: Exception) {
                if (messageReaderJob?.isActive == true) {
                    withContext(Dispatchers.Main) {
                        _errorMessage.value = "Error en lector de mensajes: ${e.message}"
                    }
                }
            }
        }
    }

    fun clearReceivedMessages() {
        _receivedMessages.value = ""
        // Clear messages from database in background
        CoroutineScope(Dispatchers.IO).launch {
            try {
                messageRepository.clearAllMessages()
            } catch (e: Exception) {
                android.util.Log.e("BluetoothViewModel", "Error clearing messages: ${e.message}", e)
            }
        }
    }
    
    fun getMessageHistory(): LiveData<List<BluetoothMessage>> {
        return messageRepository.getAllMessages()
    }
    
    // REMOVED: fun getUnreadMessageCount() - conflicts with val unreadMessageCount property
    
    // Test function - manually add a message to test the system
    fun addTestMessage(content: String = "Test message ${System.currentTimeMillis()}") {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val deviceName = _connectedDevice.value?.name ?: "Test Device"
                val deviceAddress = _connectedDevice.value?.address ?: "00:11:22:33:44:55"
                
                messageRepository.insertMessage(
                    content = content,
                    deviceAddress = deviceAddress,
                    deviceName = deviceName,
                    messageType = MessageType.RECEIVED
                )
                
                // Trigger notification
                val bluetoothMessage = BluetoothMessage(content = content)
                withContext(Dispatchers.Main) {
                    _newMessageNotifier.value = bluetoothMessage
                }
                
                android.util.Log.d("BluetoothViewModel", "Test message added: $content")
            } catch (e: Exception) {
                android.util.Log.e("BluetoothViewModel", "Error adding test message: ${e.message}", e)
            }
        }
    }

    // ========== FUNCIONES DE UTILIDAD ==========

    fun clearError() {
        _errorMessage.value = ""
    }

    fun isBluetoothAvailable(): Boolean {
        return bluetoothAdapter != null
    }

    fun isBluetoothEnabled(): Boolean {
        return bluetoothAdapter?.isEnabled == true
    }

    override fun onCleared() {
        super.onCleared()
        try {
            getApplication<Application>().unregisterReceiver(bluetoothReceiver)
            stopDiscovery()
            disconnect()
        } catch (e: Exception) {
            // Ignorar errores al limpiar
        }
    }
}