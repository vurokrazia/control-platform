package com.example.vurocontrol.ui.dashboard

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.example.vurocontrol.databinding.FragmentDashboardBinding
import com.example.vurocontrol.shared.SharedBluetoothViewModel
@SuppressLint("MissingPermission")
class DashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!

    // USAR SHARED VIEWMODEL - CLAVE AQUÍ 🔑
    private val sharedBluetoothViewModel: SharedBluetoothViewModel by activityViewModels()

    private lateinit var devicesAdapter: ArrayAdapter<String>
    private val devicesList = mutableListOf<BluetoothDevice>()

    // Launcher para permisos
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.all { it.value }
        if (allGranted) {
            sharedBluetoothViewModel.startDeviceDiscovery()
        } else {
            Toast.makeText(context, "Permisos de Bluetooth requeridos", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)

        setupUI()
        setupObservers()
        setupClickListeners()

        return binding.root
    }

    private fun setupUI() {
        // Configurar adaptador para la lista de dispositivos
        devicesAdapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_list_item_1,
            mutableListOf<String>()
        )
        binding.listViewDevices.adapter = devicesAdapter

        // Click en dispositivo para conectar
        binding.listViewDevices.setOnItemClickListener { _, _, position, _ ->
            if (position < devicesList.size) {
                val device = devicesList[position]
                sharedBluetoothViewModel.connectToDevice(device)
            }
        }
    }

    private fun setupObservers() {
        // Estado de la conexión
        sharedBluetoothViewModel.connectionStatus.observe(viewLifecycleOwner) { status ->
            binding.textConnectionStatus.text = status
        }

        // Lista de dispositivos encontrados
        sharedBluetoothViewModel.discoveredDevices.observe(viewLifecycleOwner) { devices ->
            devicesList.clear()
            devicesList.addAll(devices)

            val deviceNames = devices.map { device ->
                "${device.name ?: "Dispositivo desconocido"} - ${device.address}"
            }

            devicesAdapter.clear()
            devicesAdapter.addAll(deviceNames)
            devicesAdapter.notifyDataSetChanged()
        }

        // Estado de búsqueda
        sharedBluetoothViewModel.isScanning.observe(viewLifecycleOwner) { isScanning ->
            binding.btnScanDevices.text = if (isScanning) "Buscando..." else "Buscar Dispositivos"
            binding.btnScanDevices.isEnabled = !isScanning
            binding.progressBarScanning.visibility = if (isScanning) View.VISIBLE else View.GONE
        }

        // Mensajes de error
        sharedBluetoothViewModel.errorMessage.observe(viewLifecycleOwner) { error ->
            if (error.isNotEmpty()) {
                Toast.makeText(context, error, Toast.LENGTH_LONG).show()
                sharedBluetoothViewModel.clearError()
            }
        }

        // Dispositivo conectado
        sharedBluetoothViewModel.connectedDevice.observe(viewLifecycleOwner) { device ->
            if (device != null) {
                binding.textConnectedDevice.text = "Conectado: ${device.name}"
                binding.textConnectedDevice.visibility = View.VISIBLE
                binding.btnDisconnect.visibility = View.VISIBLE
                binding.layoutDeviceList.visibility = View.GONE // Ocultar lista cuando conectado
            } else {
                binding.textConnectedDevice.visibility = View.GONE
                binding.btnDisconnect.visibility = View.GONE
                binding.layoutDeviceList.visibility = View.VISIBLE // Mostrar lista cuando desconectado
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnScanDevices.setOnClickListener {
            checkBluetoothPermissions()
        }

        binding.btnDisconnect.setOnClickListener {
            sharedBluetoothViewModel.disconnect()
        }
    }

    private fun checkBluetoothPermissions() {
        val permissions = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            arrayOf(
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.ACCESS_FINE_LOCATION
            )
        } else {
            arrayOf(
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN,
                Manifest.permission.ACCESS_FINE_LOCATION
            )
        }

        val allGranted = permissions.all { permission ->
            ContextCompat.checkSelfPermission(requireContext(), permission) == PackageManager.PERMISSION_GRANTED
        }

        if (allGranted) {
            sharedBluetoothViewModel.startDeviceDiscovery()
        } else {
            requestPermissionLauncher.launch(permissions)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // NO llamar disconnect() aquí - la conexión debe persistir
        _binding = null
    }
}