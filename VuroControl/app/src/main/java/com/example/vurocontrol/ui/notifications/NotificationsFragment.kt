package com.example.vurocontrol.ui.notifications

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import kotlinx.coroutines.launch
import com.example.vurocontrol.R
import com.example.vurocontrol.databinding.FragmentNotificationsBinding
// REMOVED: import com.example.vurocontrol.database.VuroControlDatabase
// REMOVED: import com.example.vurocontrol.repository.MessageRepository
import com.example.vurocontrol.shared.SharedBluetoothViewModel
import com.example.vurocontrol.ui.control.MessageAdapter

/**
 * Fragment to display Bluetooth messages in the Notifications tab
 * Shows last 20 messages with proper database integration
 */
class NotificationsFragment : Fragment() {

    private var _binding: FragmentNotificationsBinding? = null
    private val binding get() = _binding!!

    // Use shared ViewModel for Bluetooth functionality
    private val sharedBluetoothViewModel: SharedBluetoothViewModel by activityViewModels()
    
    private lateinit var messageAdapter: MessageAdapter
    // REMOVED: private lateinit var messageRepository: MessageRepository

    // TAG for logging
    private val TAG = "NotificationsFragment"
    
    // PAGINATION CONSTANTS
    companion object {
        private const val TRIGGER_THRESHOLD = 10       // When to trigger load more (when 10 items remaining)
        private const val PAGE_SIZE = 20              // How many more messages to load
        private const val INITIAL_LOAD_SIZE = 20      // Initial messages to load
    }
    
    // Pagination state
    private var isLoadingMore = false
    private var hasMoreData = true

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        Log.d(TAG, "onCreateView: Iniciando NotificationsFragment")
        _binding = FragmentNotificationsBinding.inflate(inflater, container, false)

        // setupDatabase() // REMOVED - now handled by SharedBluetoothViewModel
        setupRecyclerView()
        setupClickListeners()
        setupDatabaseBusyObserver()
        
        // SIMPLE: Load initial data when fragment opens
        loadMessagesOnce(INITIAL_LOAD_SIZE)

        return binding.root
    }

    // REMOVED: Database setup now handled by SharedBluetoothViewModel
    // private fun setupDatabase() { ... }

    private fun setupRecyclerView() {
        try {
            messageAdapter = MessageAdapter()
            
            binding.recyclerMessages.apply {
                adapter = messageAdapter
                layoutManager = LinearLayoutManager(requireContext())
                // Add some additional safety
                setHasFixedSize(true)
                
                // FIXED: Only trigger at absolute end of list
                addOnScrollListener(object : androidx.recyclerview.widget.RecyclerView.OnScrollListener() {
                    override fun onScrollStateChanged(recyclerView: androidx.recyclerview.widget.RecyclerView, newState: Int) {
                        super.onScrollStateChanged(recyclerView, newState)
                        
                        // Only check when scroll stops AND we have initial data loaded
                        if (newState == androidx.recyclerview.widget.RecyclerView.SCROLL_STATE_IDLE && messageAdapter.currentList.isNotEmpty()) {
                            
                            // Check if we can scroll down more (means we're at bottom)
                            val canScrollDown = recyclerView.canScrollVertically(1)
                            
                            Log.d(TAG, "=== SCROLL STATE CHECK ===")
                            Log.d(TAG, "Can scroll down more: $canScrollDown")
                            Log.d(TAG, "Current list size: ${messageAdapter.currentList.size}")
                            Log.d(TAG, "isLoadingMore: $isLoadingMore")
                            Log.d(TAG, "hasMoreData: $hasMoreData")
                            
                            // TRIGGER: Only when user CANNOT scroll down anymore = reached absolute bottom
                            if (!canScrollDown && !isLoadingMore && hasMoreData) {
                                Log.d(TAG, "🚀 REACHED BOTTOM: Loading 20 more messages...")
                                loadMoreMessages()
                            } else {
                                Log.d(TAG, "❌ NOT AT BOTTOM - Can still scroll: $canScrollDown")
                            }
                            
                            Log.d(TAG, "=== END CHECK ===")
                        }
                    }
                })
            }
            Log.d(TAG, "RecyclerView with infinite scroll setup completed successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error setting up RecyclerView: ${e.message}", e)
        }
    }

    private fun setupClickListeners() {
        // Clear all messages
        binding.btnClearAll.setOnClickListener {
            showClearAllDialog()
        }
    }

    // SIMPLE: Load messages once when fragment opens
    private fun loadMessagesOnce(numberOfItems: Int = 20) {
        Log.d(TAG, "=== LOADING $numberOfItems MESSAGES ONCE ===")
        
        lifecycleScope.launch {
            try {
                Log.d(TAG, "Starting one-time database query for $numberOfItems messages...")
                
                // Get N messages once - no observers, no subscriptions
                val messages = sharedBluetoothViewModel.getLastNMessagesOnce(numberOfItems)
                val unreadCount = sharedBluetoothViewModel.getUnreadMessageCountOnce()
                
                Log.d(TAG, "Database query completed - Messages: ${messages.size}, Unread: $unreadCount")
                
                // Update UI on main thread
                if (messages.isEmpty()) {
                    Log.d(TAG, "No messages found, showing empty state")
                    showEmptyState()
                } else {
                    Log.d(TAG, "Showing ${messages.size} messages in RecyclerView")
                    showMessages(messages.size)
                    messageAdapter.submitList(messages)
                    updateMessageCount(messages.size)
                }
                
                // Update unread count
                binding.textUnreadCount.text = getString(R.string.unread_messages).replace("0", unreadCount.toString())
                
                Log.d(TAG, "=== $numberOfItems MESSAGES LOADED SUCCESSFULLY ===")
                
            } catch (e: Exception) {
                Log.e(TAG, "=== ERROR LOADING $numberOfItems MESSAGES: ${e.message}", e)
                e.printStackTrace()
                showEmptyState()
            }
        }
    }

    private fun showEmptyState() {
        try {
            if (_binding != null) {
                binding.recyclerMessages.visibility = View.GONE
                binding.textEmptyState.visibility = View.VISIBLE
                updateMessageCount(0)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error showing empty state: ${e.message}", e)
        }
    }

    private fun showMessages(count: Int) {
        try {
            if (_binding != null) {
                binding.recyclerMessages.visibility = View.VISIBLE
                binding.textEmptyState.visibility = View.GONE
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error showing messages: ${e.message}", e)
        }
    }

    private fun updateMessageCount(count: Int) {
        try {
            if (_binding != null) {
                binding.textMessageCount.text = getString(R.string.total_messages).replace("0", count.toString())
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating message count: ${e.message}", e)
        }
    }

    private fun showClearAllDialog() {
        AlertDialog.Builder(requireContext())
            .setTitle(getString(R.string.dialog_delete_title))
            .setMessage(getString(R.string.dialog_delete_message))
            .setPositiveButton(getString(R.string.dialog_delete_confirm)) { _, _ ->
                clearAllMessages()
            }
            .setNegativeButton(getString(R.string.dialog_cancel), null)
            .show()
    }

    private fun clearAllMessages() {
        // OPTIMIZED: Clear messages through SharedBluetoothViewModel
        try {
            sharedBluetoothViewModel.clearReceivedMessages()
            Toast.makeText(requireContext(), getString(R.string.messages_deleted), Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(requireContext(), getString(R.string.error_deleting_messages, e.message), Toast.LENGTH_LONG).show()
        }
    }
    
    /**
     * SAFETY: Observe database busy state for visual feedback
     */
    private fun setupDatabaseBusyObserver() {
        sharedBluetoothViewModel.isDatabaseBusy.observe(viewLifecycleOwner) { isBusy ->
            try {
                if (isBusy) {
                    Log.d(TAG, "DATABASE BUSY: Showing loading state")
                    
                    // Show different loading messages based on operation type
                    if (isLoadingMore) {
                        // Infinite scroll loading
                        binding.textMessageCount.text = getString(R.string.loading_more_messages)
                        binding.btnClearAll.isEnabled = false
                        binding.btnClearAll.text = "⏳"
                    } else {
                        // Initial loading
                        binding.textMessageCount.text = getString(R.string.loading_data)
                        binding.btnClearAll.isEnabled = false
                        binding.btnClearAll.text = "⏳"
                    }
                    
                } else {
                    Log.d(TAG, "DATABASE FREE: Hiding loading state")
                    // Re-enable clear button
                    binding.btnClearAll.isEnabled = true
                    binding.btnClearAll.text = "🗑️"
                    
                    // Will be updated by loadMessagesOnce when it completes
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating busy state UI: ${e.message}", e)
            }
        }
    }
    
    /**
     * INFINITE SCROLL: Load more messages when user reaches last 7 items
     * Automatically triggered by scroll listener
     */
    private fun loadMoreMessages() {
        if (isLoadingMore || !hasMoreData) {
            Log.d(TAG, "=== LOAD MORE BLOCKED: isLoading=$isLoadingMore, hasMore=$hasMoreData ===")
            return
        }
        
        Log.d(TAG, "=== INFINITE SCROLL: LOADING MORE MESSAGES ===")
        
        // Set loading state
        isLoadingMore = true
        
        val currentSize = messageAdapter.currentList.size
        val newSize = currentSize + PAGE_SIZE  // Load PAGE_SIZE more (constant = 20)
        
        Log.d(TAG, "Current messages: $currentSize, Loading total: $newSize messages")
        
        lifecycleScope.launch {
            try {
                // Get more messages
                val messages = sharedBluetoothViewModel.getLastNMessagesOnce(newSize)
                
                Log.d(TAG, "Requested: $newSize messages, Got: ${messages.size} messages, Current: $currentSize")
                
                // IMPROVED: Check if we actually got more data
                if (messages.size <= currentSize) {
                    Log.d(TAG, "❌ No new messages loaded - reached end of data")
                    hasMoreData = false
                    
                    // Update UI to show "no more data"
                    binding.textMessageCount.text = getString(R.string.messages_loaded_all, messages.size)
                } else if (messages.size < newSize) {
                    // We got some new messages, but less than requested = reached end
                    Log.d(TAG, "⚠️ Got ${messages.size} messages (less than requested $newSize) - reached end")
                    hasMoreData = false
                    
                    // Update adapter with final batch of messages - scroll position maintained automatically
                    messageAdapter.submitList(messages)
                    binding.textMessageCount.text = getString(R.string.messages_loaded_all, messages.size)
                } else {
                    // We got exactly what we requested - might be more data
                    Log.d(TAG, "✅ Successfully loaded ${messages.size - currentSize} new messages")
                    
                    // Update adapter with new messages - scroll position maintained automatically
                    messageAdapter.submitList(messages)
                    updateMessageCount(messages.size)
                    
                    Log.d(TAG, "Still might have more data - hasMoreData remains true")
                }
                
                // IMPORTANT: Always log final state after loading
                Log.d(TAG, "📊 Final state: hasMoreData=$hasMoreData, totalMessages=${messages.size}")
                
                Log.d(TAG, "🔄 Normal list: Scroll position maintained automatically")
                
            } catch (e: Exception) {
                Log.e(TAG, "=== ERROR LOADING MORE MESSAGES: ${e.message}", e)
                e.printStackTrace()
            } finally {
                // Always clear loading state
                isLoadingMore = false
                Log.d(TAG, "=== INFINITE SCROLL: Loading completed ===")
            }
        }
    }
    
    /**
     * PUBLIC: Manually refresh messages (resets pagination)
     * Call this method to reload from scratch: refreshMessages(50)
     */
    fun refreshMessages(numberOfItems: Int = INITIAL_LOAD_SIZE) {
        Log.d(TAG, "=== MANUAL REFRESH REQUESTED: $numberOfItems messages ===")
        
        // Reset pagination state
        isLoadingMore = false
        hasMoreData = true
        
        loadMessagesOnce(numberOfItems)
    }

    override fun onResume() {
        super.onResume()
        Log.d(TAG, "onResume: Fragment visible")
    }

    override fun onDestroyView() {
        Log.d(TAG, "onDestroyView: Limpiando Fragment")
        super.onDestroyView()
        _binding = null
    }
}