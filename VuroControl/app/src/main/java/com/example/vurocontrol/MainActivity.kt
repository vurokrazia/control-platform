package com.example.vurocontrol

import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import com.google.android.material.bottomnavigation.BottomNavigationView
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.example.vurocontrol.databinding.ActivityMainBinding
import com.example.vurocontrol.shared.SharedBluetoothViewModel

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val sharedBluetoothViewModel: SharedBluetoothViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val navView: BottomNavigationView = binding.navView

        val navController = findNavController(R.id.nav_host_fragment_activity_main)
        
        // SAFE NAVIGATION: Block navigation during database operations
        setupSafeNavigation(navView, navController)
        
        // Passing each menu ID as a set of Ids because each
        // menu should be considered as top level destinations.
        val appBarConfiguration = AppBarConfiguration(
            setOf(
                R.id.navigation_home, R.id.navigation_dashboard, R.id.navigation_control, R.id.navigation_notifications,
            )
        )
        setupActionBarWithNavController(navController, appBarConfiguration)
        
        navController.addOnDestinationChangedListener { _, destination, _ ->
            // SAFE: Check if database operations are in progress
            if (!isFinishing && !isDestroyed) {
                when (destination.id) {
                    R.id.navigation_control -> {
                        supportActionBar?.hide() // Ocultar en Control
                    }
                    else -> {
                        supportActionBar?.show() // Mostrar en otras vistas
                    }
                }
            }
        }
    }
    
    private fun setupSafeNavigation(navView: BottomNavigationView, navController: androidx.navigation.NavController) {
        // Observe database busy state
        sharedBluetoothViewModel.isDatabaseBusy.observe(this) { isBusy ->
            if (isBusy) {
                android.util.Log.d("MainActivity", "DATABASE BUSY: Blocking navigation")
                // Disable navigation during database operations
                for (i in 0 until navView.menu.size()) {
                    navView.menu.getItem(i).isEnabled = false
                }
            } else {
                android.util.Log.d("MainActivity", "DATABASE FREE: Enabling navigation")
                // Re-enable navigation when database is free
                for (i in 0 until navView.menu.size()) {
                    navView.menu.getItem(i).isEnabled = true
                }
            }
        }
        
        // Custom navigation listener to block when database is busy
        navView.setOnItemSelectedListener { item ->
            val isDatabaseBusy = sharedBluetoothViewModel.isDatabaseBusy.value ?: false
            
            if (isDatabaseBusy) {
                android.util.Log.w("MainActivity", "NAVIGATION BLOCKED: Database operation in progress")
                Toast.makeText(this, "⏳ Operación en curso...", Toast.LENGTH_SHORT).show()
                false // Block navigation
            } else {
                // Allow navigation
                android.util.Log.d("MainActivity", "NAVIGATION ALLOWED: Database is free")
                navController.navigate(item.itemId)
                true
            }
        }
    }
}