package com.example.vurocontrol.ui.control

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.example.vurocontrol.databinding.FragmentControlBinding
import com.example.vurocontrol.shared.SharedBluetoothViewModel

class ControlFragment : Fragment() {

    private var _binding: FragmentControlBinding? = null
    private val binding get() = _binding!!

    // Usar Shared ViewModel
    private val sharedBluetoothViewModel: SharedBluetoothViewModel by activityViewModels()

    // TAG para logs
    private val TAG = "ControlFragment"
    
    // SAFE: Store delayed runnables to cancel them on destroy
    private val pendingRunnables = mutableListOf<Runnable>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        Log.d(TAG, "onCreateView: Iniciando ControlFragment")
        _binding = FragmentControlBinding.inflate(inflater, container, false)

        setupObservers()
        setupClickListeners()

        return binding.root
    }

    private fun setupObservers() {
        Log.d(TAG, "setupObservers: Configurando observadores")

        // Estado de conexión
        sharedBluetoothViewModel.isConnected.observe(viewLifecycleOwner) { isConnected ->
            Log.d(TAG, "isConnected cambió a: $isConnected")
            updateUI(isConnected)
        }

        // Dispositivo conectado
        sharedBluetoothViewModel.connectedDevice.observe(viewLifecycleOwner) { device ->
            Log.d(TAG, "connectedDevice cambió: ${device?.address ?: "null"}")
            if (device != null) {
                val deviceName = try {
                    device.name ?: "Desconocido"
                } catch (e: SecurityException) {
                    "Sin permisos"
                }
                binding.textDeviceStatus.text = "📱 Conectado: $deviceName"
                binding.textDeviceStatus.setTextColor(resources.getColor(android.R.color.holo_green_dark, null))
            } else {
                binding.textDeviceStatus.text = "❌ Sin conexión"
                binding.textDeviceStatus.setTextColor(resources.getColor(android.R.color.holo_red_dark, null))
            }
        }

        // Último comando enviado
        sharedBluetoothViewModel.lastCommandSent.observe(viewLifecycleOwner) { command ->
            Log.d(TAG, "lastCommandSent cambió a: $command")
//            if (command.isNotEmpty()) {
//                binding.textLastCommand.text = "Último: $command"
//                binding.textLastCommand.visibility = View.VISIBLE
//            }
        }

        // Estado de conexión
        sharedBluetoothViewModel.connectionStatus.observe(viewLifecycleOwner) { status ->
            Log.d(TAG, "connectionStatus cambió a: $status")
        }

        // Mensajes de error
        sharedBluetoothViewModel.errorMessage.observe(viewLifecycleOwner) { error ->
            if (error.isNotEmpty()) {
                Log.e(TAG, "Error recibido: $error")
                Toast.makeText(context, error, Toast.LENGTH_SHORT).show()
                sharedBluetoothViewModel.clearError()
            }
        }

        // Mensajes recibidos - Mostrar notificación cuando llega mensaje nuevo
        sharedBluetoothViewModel.newMessageNotifier.observe(viewLifecycleOwner) { newMessage ->
            Log.d(TAG, "Nuevo mensaje recibido: ${newMessage.content}")
//            showMessageNotification(newMessage)
        }
    }

    private fun setupClickListeners() {
        Log.d(TAG, "setupClickListeners: Configurando listeners de botones de auto")

        // Movimiento WASD
        binding.btnLeft.setOnClickListener {
            Log.d(TAG, "Botón LEFT (A) presionado")
            sendCommand("A")
        }

        binding.btnForward.setOnClickListener {
            Log.d(TAG, "Botón FORWARD (W) presionado")
            sendCommand("W")
        }

        binding.btnRight.setOnClickListener {
            Log.d(TAG, "Botón RIGHT (D) presionado")
            sendCommand("D")
        }

        binding.btnBackward.setOnClickListener {
            Log.d(TAG, "Botón BACKWARD (S) presionado")
            sendCommand("S")
        }

        // Control de velocidad
        binding.btnSpeedDown.setOnClickListener {
            Log.d(TAG, "Botón SPEED DOWN (-) presionado")
            sendCommand("-")
        }

        binding.btnSpeedUp.setOnClickListener {
            Log.d(TAG, "Botón SPEED UP (+) presionado")
            sendCommand("+")
        }

        // Modo turbo
        binding.btnTurbo.setOnClickListener {
            Log.d(TAG, "Botón TURBO (T) presionado")
            sendCommand("T")
        }

        // Ayuda
        binding.btnHelp.setOnClickListener {
            Log.d(TAG, "Botón HELP (?) presionado")
            sendCommand("?")
        }

        // Long click en ayuda para mostrar información de mensajes
        binding.btnHelp.setOnLongClickListener {
            Log.d(TAG, "Long click en HELP - mostrando info de mensajes")
            Toast.makeText(context, "📨 Ver mensajes en la pestaña Notificaciones", Toast.LENGTH_LONG).show()
            true
        }

        // Parada de emergencia
        binding.btnEmergencyStop.setOnClickListener {
            Log.d(TAG, "Botón EMERGENCY STOP (X) presionado")
            sendCommand("X")
        }

        // Long click en emergency para test de mensajes
        binding.btnEmergencyStop.setOnLongClickListener {
            Log.d(TAG, "Long click en EMERGENCY - añadiendo mensaje de test")
            sharedBluetoothViewModel.addTestMessage("Mensaje de prueba desde la app")
            Toast.makeText(context, "Mensaje de test añadido", Toast.LENGTH_SHORT).show()
            true
        }
    }

    private fun sendCommand(command: String) {
        Log.d(TAG, "sendCommand: Intentando enviar comando '$command'")

        val isConnected = sharedBluetoothViewModel.isConnected.value
        Log.d(TAG, "Estado de conexión: $isConnected")

        if (isConnected == true) {
            Log.d(TAG, "Conexión activa, enviando comando...")
            sharedBluetoothViewModel.sendCommand(command)

            // Mostrar feedback visual
            showCommandFeedback(command)

            Log.d(TAG, "Comando '$command' enviado exitosamente")
        } else {
            val errorMsg = "❌ No hay conexión Bluetooth"
            Log.w(TAG, errorMsg)
            Toast.makeText(context, errorMsg, Toast.LENGTH_SHORT).show()
        }
    }

    private fun showCommandFeedback(command: String) {
        Log.d(TAG, "showCommandFeedback: Comando '$command' enviado")
        // REMOVED: Dynamic text display to prevent layout breaking
        // Text display removed to maintain stable button positions
    }

    private fun updateUI(isConnected: Boolean) {
        Log.d(TAG, "updateUI: Actualizando UI con isConnected = $isConnected")

        // Habilitar/deshabilitar todos los botones según conexión
        val buttonsEnabled = isConnected

        binding.btnLeft.isEnabled = buttonsEnabled
        binding.btnForward.isEnabled = buttonsEnabled
        binding.btnRight.isEnabled = buttonsEnabled
        binding.btnBackward.isEnabled = buttonsEnabled
        binding.btnSpeedDown.isEnabled = buttonsEnabled
        binding.btnSpeedUp.isEnabled = buttonsEnabled
        binding.btnTurbo.isEnabled = buttonsEnabled
        binding.btnHelp.isEnabled = buttonsEnabled
        binding.btnEmergencyStop.isEnabled = true // Siempre habilitado

        // Cambiar apariencia visual
        val alpha = if (buttonsEnabled) 1.0f else 0.5f
        binding.layoutControls.alpha = alpha

        // Mostrar mensaje de ayuda si no está conectado
        if (isConnected) {
            binding.textHelpMessage.visibility = View.GONE
            Log.d(TAG, "UI: Controles habilitados")
        } else {
            binding.textHelpMessage.visibility = View.VISIBLE
            binding.textHelpMessage.text = "💡 Ve a Dashboard para conectar un dispositivo Bluetooth"
            Log.d(TAG, "UI: Controles deshabilitados - sin conexión")
        }
    }

    private fun showMessageNotification(message: com.example.vurocontrol.shared.BluetoothMessage) {
        Log.d(TAG, "Mensaje recibido (guardado en BD): ${message.content}")
        
        // REMOVED: Toast notification - only save to database now
        // val notificationText = "📨 [${message.timestamp}] ${message.content}"
        // Toast.makeText(context, notificationText, Toast.LENGTH_LONG).show()
        
        // Show in TextView with FIXED HEIGHT
//        binding.textLastCommand.text = "📨 Recibido: ${message.content}"
//        binding.textLastCommand.setTextColor(resources.getColor(android.R.color.holo_green_light, null))
//        binding.textLastCommand.visibility = View.VISIBLE
        
        // Hide after 3 seconds - SAFE: Store runnable to cancel on destroy
        val hideRunnable = Runnable {
            // CRITICAL: Check if binding is still valid (fragment not destroyed)
            if (_binding != null && binding.textLastCommand.text.toString().startsWith("📨 Recibido:")) {
                binding.textLastCommand.visibility = View.GONE
            }
        }
        pendingRunnables.add(hideRunnable)
//        binding.textLastCommand.postDelayed(hideRunnable, 3000)
    }


    override fun onResume() {
        super.onResume()
        Log.d(TAG, "onResume: Fragment visible")

        // Verificar estado actual
        val currentConnection = sharedBluetoothViewModel.isConnected.value
        val currentDevice = sharedBluetoothViewModel.connectedDevice.value
        Log.d(TAG, "Estado actual - Conectado: $currentConnection, Dispositivo: ${currentDevice?.address}")
    }

    override fun onDestroyView() {
        Log.d(TAG, "onDestroyView: Limpiando Fragment")
        
        // CRITICAL: Cancel all pending delayed callbacks to prevent crashes
        pendingRunnables.forEach { runnable ->
            binding.textLastCommand.removeCallbacks(runnable)
        }
        pendingRunnables.clear()
        Log.d(TAG, "onDestroyView: Cancelled all pending callbacks")
        
        super.onDestroyView()
        _binding = null
    }
}