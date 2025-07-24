package com.example.vurocontrol.database.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import androidx.room.Index

/**
 * Room entity representing a Bluetooth message in the database
 * 
 * Best practices implemented:
 * - Indexed columns for fast queries
 * - Non-null constraints where appropriate
 * - Clear column names
 * - Primary key with auto-generation
 */
@Entity(
    tableName = "bluetooth_messages",
    indices = [
        Index(value = ["created_at"], name = "idx_created_at"),
        Index(value = ["message_type"], name = "idx_message_type")
    ]
)
data class MessageEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0,
    
    @ColumnInfo(name = "content", collate = ColumnInfo.NOCASE)
    val content: String,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),
    
    @ColumnInfo(name = "message_type")
    val messageType: MessageType = MessageType.RECEIVED,
    
    @ColumnInfo(name = "device_address")
    val deviceAddress: String? = null,
    
    @ColumnInfo(name = "device_name")
    val deviceName: String? = null,
    
    @ColumnInfo(name = "is_read")
    val isRead: Boolean = false
)

/**
 * Enum representing the type of message
 */
enum class MessageType {
    RECEIVED,
    SENT,
    SYSTEM
}