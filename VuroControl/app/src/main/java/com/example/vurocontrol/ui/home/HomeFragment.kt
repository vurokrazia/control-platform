package com.example.vurocontrol.ui.home

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.example.vurocontrol.databinding.FragmentHomeBinding
import com.example.vurocontrol.shared.SharedBluetoothViewModel
@SuppressLint("MissingPermission")
class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    // USAR MISMO SHARED VIEWMODEL 🔑
    private val sharedBluetoothViewModel: SharedBluetoothViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)

        setupObservers()
        setupClickListeners()

        return binding.root
    }

    private fun setupObservers() {
        // Estado de conexión
        sharedBluetoothViewModel.isConnected.observe(viewLifecycleOwner) { isConnected ->
            updateUI(isConnected)
        }

        // Dispositivo conectado
        sharedBluetoothViewModel.connectedDevice.observe(viewLifecycleOwner) { device ->
            if (device != null) {
                binding.textDeviceName.text = "Dispositivo: ${device.name}"
                binding.textDeviceName.visibility = View.VISIBLE
            } else {
                binding.textDeviceName.visibility = View.GONE
            }
        }

        // Estado de conexión
        sharedBluetoothViewModel.connectionStatus.observe(viewLifecycleOwner) { status ->
            binding.textConnectionStatus.text = status
        }

        // Último comando enviado
        sharedBluetoothViewModel.lastCommandSent.observe(viewLifecycleOwner) { command ->
            if (command.isNotEmpty()) {
                binding.textLastCommand.text = "Último comando: $command"
                binding.textLastCommand.visibility = View.VISIBLE
            }
        }

        // Mensajes de error
        sharedBluetoothViewModel.errorMessage.observe(viewLifecycleOwner) { error ->
            if (error.isNotEmpty()) {
                Toast.makeText(context, error, Toast.LENGTH_SHORT).show()
                sharedBluetoothViewModel.clearError()
            }
        }
    }

    private fun setupClickListeners() {
        // Botones de control LED
        binding.btnLedOn.setOnClickListener {
            sendCommand("LED_ON")
        }

        binding.btnLedOff.setOnClickListener {
            sendCommand("LED_OFF")
        }

        // Botones de control de motor
        binding.btnMotorStart.setOnClickListener {
            sendCommand("MOTOR_START")
        }

        binding.btnMotorStop.setOnClickListener {
            sendCommand("MOTOR_STOP")
        }

        // Botones de servo
        binding.btnServo0.setOnClickListener {
            sendCommand("SERVO_0")
        }

        binding.btnServo90.setOnClickListener {
            sendCommand("SERVO_90")
        }

        binding.btnServo180.setOnClickListener {
            sendCommand("SERVO_180")
        }

        // Botón de emergencia
        binding.btnEmergency.setOnClickListener {
            sendCommand("EMERGENCY_STOP")
        }
    }

    private fun sendCommand(command: String) {
        if (sharedBluetoothViewModel.isConnected.value == true) {
            sharedBluetoothViewModel.sendCommand(command)
        } else {
            Toast.makeText(context, "No hay conexión Bluetooth activa", Toast.LENGTH_SHORT).show()
        }
    }

    private fun updateUI(isConnected: Boolean) {
        // Habilitar/deshabilitar botones según conexión
        val buttonsEnabled = isConnected

        binding.btnLedOn.isEnabled = buttonsEnabled
        binding.btnLedOff.isEnabled = buttonsEnabled
        binding.btnMotorStart.isEnabled = buttonsEnabled
        binding.btnMotorStop.isEnabled = buttonsEnabled
        binding.btnServo0.isEnabled = buttonsEnabled
        binding.btnServo90.isEnabled = buttonsEnabled
        binding.btnServo180.isEnabled = buttonsEnabled
        binding.btnEmergency.isEnabled = buttonsEnabled

        // Cambiar apariencia visual
        val alpha = if (buttonsEnabled) 1.0f else 0.5f
        binding.layoutControls.alpha = alpha

        // Mostrar mensaje de estado
        if (isConnected) {
            binding.textConnectionInfo.text = "✅ Conectado - Controles activos"
            binding.textConnectionInfo.setTextColor(resources.getColor(android.R.color.holo_green_dark, null))
        } else {
            binding.textConnectionInfo.text = "❌ Sin conexión - Ve a Dashboard para conectar"
            binding.textConnectionInfo.setTextColor(resources.getColor(android.R.color.holo_red_dark, null))
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}