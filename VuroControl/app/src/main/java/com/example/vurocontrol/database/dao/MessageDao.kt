package com.example.vurocontrol.database.dao

import androidx.room.*
import androidx.lifecycle.LiveData
import kotlinx.coroutines.flow.Flow
import com.example.vurocontrol.database.entities.MessageEntity
import com.example.vurocontrol.database.entities.MessageType

/**
 * Data Access Object (DAO) for MessageEntity
 * 
 * Best practices implemented:
 * - Use Flow for reactive data streams
 * - Use LiveData for UI observation
 * - Suspend functions for coroutine support
 * - Optimized queries with proper indexing
 * - Batch operations for efficiency
 */
@Dao
interface MessageDao {

    /**
     * Get the last 20 messages ordered by creation time (newest first)
     * Uses LiveData for UI observation
     */
    @Query("SELECT * FROM bluetooth_messages ORDER BY created_at DESC LIMIT 20")
    fun getLast20Messages(): LiveData<List<MessageEntity>>

    /**
     * Get the last 20 messages as Flow for reactive programming
     */
    @Query("SELECT * FROM bluetooth_messages ORDER BY created_at DESC LIMIT 20")
    fun getLast20MessagesFlow(): Flow<List<MessageEntity>>

    /**
     * Get all messages ordered by creation time (newest first)
     */
    @Query("SELECT * FROM bluetooth_messages ORDER BY created_at DESC")
    fun getAllMessages(): LiveData<List<MessageEntity>>

    /**
     * Get messages by type with limit
     */
    @Query("SELECT * FROM bluetooth_messages WHERE message_type = :type ORDER BY created_at DESC LIMIT :limit")
    fun getMessagesByType(type: MessageType, limit: Int = 50): LiveData<List<MessageEntity>>

    /**
     * Get unread messages count
     */
    @Query("SELECT COUNT(*) FROM bluetooth_messages WHERE is_read = 0")
    fun getUnreadMessageCount(): LiveData<Int>

    /**
     * SIMPLE: Get last N messages synchronously (one-time query)
     */
    @Query("SELECT * FROM bluetooth_messages ORDER BY created_at DESC LIMIT :limit")
    suspend fun getLastNMessagesSync(limit: Int): List<MessageEntity>

    /**
     * SIMPLE: Get unread messages count synchronously (one-time query)
     */
    @Query("SELECT COUNT(*) FROM bluetooth_messages WHERE is_read = 0")
    suspend fun getUnreadMessageCountSync(): Int

    /**
     * Get messages from specific device
     */
    @Query("SELECT * FROM bluetooth_messages WHERE device_address = :deviceAddress ORDER BY created_at DESC LIMIT :limit")
    fun getMessagesFromDevice(deviceAddress: String, limit: Int = 50): LiveData<List<MessageEntity>>

    /**
     * Insert a single message
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity): Long

    /**
     * Insert multiple messages (batch operation)
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(messages: List<MessageEntity>): List<Long>

    /**
     * Update a message
     */
    @Update
    suspend fun updateMessage(message: MessageEntity)

    /**
     * Mark message as read
     */
    @Query("UPDATE bluetooth_messages SET is_read = 1 WHERE id = :messageId")
    suspend fun markAsRead(messageId: Long)

    /**
     * Mark all messages as read
     */
    @Query("UPDATE bluetooth_messages SET is_read = 1")
    suspend fun markAllAsRead()

    /**
     * Delete a specific message
     */
    @Delete
    suspend fun deleteMessage(message: MessageEntity)

    /**
     * Delete messages older than specified timestamp
     */
    @Query("DELETE FROM bluetooth_messages WHERE created_at < :timestamp")
    suspend fun deleteMessagesOlderThan(timestamp: Long): Int

    /**
     * Delete all messages
     */
    @Query("DELETE FROM bluetooth_messages")
    suspend fun deleteAllMessages()

    /**
     * Keep only the latest N messages (for cleanup)
     */
    @Query("""
        DELETE FROM bluetooth_messages 
        WHERE id NOT IN (
            SELECT id FROM bluetooth_messages 
            ORDER BY created_at DESC 
            LIMIT :keepCount
        )
    """)
    suspend fun keepOnlyLatestMessages(keepCount: Int = 1000)

    /**
     * Get database statistics
     */
    @Query("""
        SELECT 
            COUNT(*) as total_count,
            SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count,
            MAX(created_at) as latest_timestamp,
            MIN(created_at) as oldest_timestamp
        FROM bluetooth_messages
    """)
    suspend fun getDatabaseStats(): DatabaseStats

    /**
     * Search messages by content
     */
    @Query("SELECT * FROM bluetooth_messages WHERE content LIKE '%' || :searchTerm || '%' ORDER BY created_at DESC LIMIT :limit")
    fun searchMessages(searchTerm: String, limit: Int = 100): LiveData<List<MessageEntity>>
}

/**
 * Data class for database statistics
 */
data class DatabaseStats(
    @ColumnInfo(name = "total_count") val totalCount: Int,
    @ColumnInfo(name = "unread_count") val unreadCount: Int,
    @ColumnInfo(name = "latest_timestamp") val latestTimestamp: Long?,
    @ColumnInfo(name = "oldest_timestamp") val oldestTimestamp: Long?
)