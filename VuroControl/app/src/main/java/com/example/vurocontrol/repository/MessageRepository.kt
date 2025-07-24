package com.example.vurocontrol.repository

import androidx.lifecycle.LiveData
import androidx.lifecycle.map
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import com.example.vurocontrol.database.dao.MessageDao
import com.example.vurocontrol.database.dao.DatabaseStats
import com.example.vurocontrol.database.entities.MessageEntity
import com.example.vurocontrol.database.entities.MessageType
import com.example.vurocontrol.shared.BluetoothMessage
import java.text.SimpleDateFormat
import java.util.*
/**
 * Repository pattern implementation for message data access
 * 
 * Best practices implemented:
 * - Single source of truth
 * - Data mapping between database and domain models
 * - Error handling and logging
 * - Coroutine support
 * - Clean separation between data layer and domain layer
 */
class MessageRepository(
    private val messageDao: MessageDao
) {

    companion object {
        private const val TAG = "MessageRepository"
        private const val MAX_MESSAGES_TO_KEEP = 1000
    }

    /**
     * Get the last 20 messages for notification display
     */
    fun getLast20Messages(): LiveData<List<BluetoothMessage>> {
        return messageDao.getLast20Messages().map { entities ->
            entities.map { entity -> entity.toBluetoothMessage() }
        }
    }

    /**
     * Get the last 20 messages as MessageEntity for RecyclerView
     */
    fun getLast20MessagesFromDao(): LiveData<List<MessageEntity>> {
        return messageDao.getLast20Messages()
    }

    /**
     * Get the last 20 messages as Flow for reactive programming
     */
    fun getLast20MessagesFlow(): Flow<List<BluetoothMessage>> {
        return messageDao.getLast20MessagesFlow().map { entities ->
            entities.map { entity -> entity.toBluetoothMessage() }
        }
    }

    /**
     * Get all messages
     */
    fun getAllMessages(): LiveData<List<BluetoothMessage>> {
        return messageDao.getAllMessages().map { entities ->
            entities.map { entity -> entity.toBluetoothMessage() }
        }
    }

    /**
     * Get unread message count
     */
    fun getUnreadMessageCount(): LiveData<Int> {
        return messageDao.getUnreadMessageCount()
    }

    /**
     * SIMPLE: Get last N messages synchronously (one-time query)
     */
    suspend fun getLastNMessagesSync(limit: Int): List<MessageEntity> = withContext(Dispatchers.IO) {
        try {
            messageDao.getLastNMessagesSync(limit)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error getting last $limit messages: ${e.message}", e)
            emptyList()
        }
    }

    /**
     * SIMPLE: Get unread message count synchronously (one-time query)
     */
    suspend fun getUnreadMessageCountSync(): Int = withContext(Dispatchers.IO) {
        try {
            messageDao.getUnreadMessageCountSync()
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error getting unread count: ${e.message}", e)
            0
        }
    }

    /**
     * Insert a new Bluetooth message
     */
    suspend fun insertMessage(
        content: String,
        deviceAddress: String? = null,
        deviceName: String? = null,
        messageType: MessageType = MessageType.RECEIVED
    ): Long = withContext(Dispatchers.IO) {
        try {
            val entity = MessageEntity(
                content = content.trim(),
                messageType = messageType,
                deviceAddress = deviceAddress,
                deviceName = deviceName,
                createdAt = System.currentTimeMillis()
            )
            
            val messageId = messageDao.insertMessage(entity)
            
            // Clean up old messages if we have too many
            cleanupOldMessagesIfNeeded()
            
            messageId
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error inserting message: ${e.message}", e)
            -1L
        }
    }

    /**
     * Insert a BluetoothMessage (for compatibility)
     */
    suspend fun insertBluetoothMessage(
        bluetoothMessage: BluetoothMessage,
        deviceAddress: String? = null,
        deviceName: String? = null
    ): Long {
        return insertMessage(
            content = bluetoothMessage.content,
            deviceAddress = deviceAddress,
            deviceName = deviceName,
            messageType = MessageType.RECEIVED
        )
    }

    /**
     * Mark message as read
     */
    suspend fun markAsRead(messageId: Long) = withContext(Dispatchers.IO) {
        try {
            messageDao.markAsRead(messageId)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error marking message as read: ${e.message}", e)
        }
    }

    /**
     * Mark all messages as read
     */
    suspend fun markAllAsRead() = withContext(Dispatchers.IO) {
        try {
            messageDao.markAllAsRead()
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error marking all messages as read: ${e.message}", e)
        }
    }

    /**
     * Delete all messages
     */
    suspend fun clearAllMessages() = withContext(Dispatchers.IO) {
        try {
            messageDao.deleteAllMessages()
            android.util.Log.d(TAG, "All messages cleared")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error clearing messages: ${e.message}", e)
        }
    }

    /**
     * Search messages by content
     */
    fun searchMessages(searchTerm: String, limit: Int = 100): LiveData<List<BluetoothMessage>> {
        return messageDao.searchMessages(searchTerm, limit).map { entities ->
            entities.map { entity -> entity.toBluetoothMessage() }
        }
    }

    /**
     * Get database statistics
     */
    suspend fun getDatabaseStats(): DatabaseStats? = withContext(Dispatchers.IO) {
        try {
            messageDao.getDatabaseStats()
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error getting database stats: ${e.message}", e)
            null
        }
    }

    /**
     * Clean up old messages if we exceed the limit
     */
    private suspend fun cleanupOldMessagesIfNeeded() {
        try {
            messageDao.keepOnlyLatestMessages(MAX_MESSAGES_TO_KEEP)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error during cleanup: ${e.message}", e)
        }
    }

    /**
     * Manual cleanup - delete messages older than specified days
     */
    suspend fun deleteMessagesOlderThan(days: Int) = withContext(Dispatchers.IO) {
        try {
            val cutoffTime = System.currentTimeMillis() - (days * 24 * 60 * 60 * 1000L)
            val deletedCount = messageDao.deleteMessagesOlderThan(cutoffTime)
            android.util.Log.d(TAG, "Deleted $deletedCount messages older than $days days")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error deleting old messages: ${e.message}", e)
        }
    }
}

/**
 * Extension function to convert MessageEntity to BluetoothMessage
 */
private fun MessageEntity.toBluetoothMessage(): BluetoothMessage {
    val formatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    return BluetoothMessage(
        content = this.content,
        timestamp = formatter.format(Date(this.createdAt)),
        id = this.id.toString()
    )
}

/**
 * Extension function to convert BluetoothMessage to MessageEntity
 */
private fun BluetoothMessage.toMessageEntity(
    deviceAddress: String? = null,
    deviceName: String? = null,
    messageType: MessageType = MessageType.RECEIVED
): MessageEntity {
    return MessageEntity(
        content = this.content,
        messageType = messageType,
        deviceAddress = deviceAddress,
        deviceName = deviceName,
        createdAt = System.currentTimeMillis()
    )
}