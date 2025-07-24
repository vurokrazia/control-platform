package com.example.vurocontrol.database

import android.content.Context
import androidx.room.*
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.vurocontrol.database.dao.MessageDao
import com.example.vurocontrol.database.entities.MessageEntity
import com.example.vurocontrol.database.entities.MessageType

/**
 * Room Database class for VuroControl app
 * 
 * Best practices implemented:
 * - Singleton pattern for database instance
 * - Migration strategy for database updates
 * - Type converters for enums
 * - Proper error handling
 * - Memory optimization with fallbackToDestructiveMigration for debug builds
 */
@Database(
    entities = [MessageEntity::class],
    version = 1,
    exportSchema = false // Set to true in production for schema validation
)
@TypeConverters(Converters::class)
abstract class VuroControlDatabase : RoomDatabase() {

    abstract fun messageDao(): MessageDao

    companion object {
        private const val DATABASE_NAME = "vuro_control_database"

        @Volatile
        private var INSTANCE: VuroControlDatabase? = null

        /**
         * Get database instance using singleton pattern
         */
        fun getDatabase(context: Context): VuroControlDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    VuroControlDatabase::class.java,
                    DATABASE_NAME
                )
                    // REMOVED: .addCallback(DatabaseCallback()) - causing SQLite errors during navigation
                    .fallbackToDestructiveMigration() // Only for development - remove in production
                    .build()
                
                INSTANCE = instance
                instance
            }
        }

        /**
         * Close database instance (for testing or app cleanup)
         */
        fun closeDatabase() {
            INSTANCE?.close()
            INSTANCE = null
        }
    }

    /**
     * Database callback for initialization tasks
     */
    private class DatabaseCallback : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            
            // You can add initial data insertion here if needed
            // Example:
            // db.execSQL("INSERT INTO bluetooth_messages (content, message_type, created_at) VALUES ('Database initialized', 'SYSTEM', ${System.currentTimeMillis()})")
        }

        override fun onOpen(db: SupportSQLiteDatabase) {
            super.onOpen(db)
            
            // Enable WAL mode for better concurrent performance
            db.execSQL("PRAGMA journal_mode=WAL")
            
            // REMOVED: Cleanup query - cannot execute DELETE during onOpen callback
            // Cleanup will be handled in Repository instead
        }
    }

}

/**
 * Type converters for Room database
 */
class Converters {
    
    @TypeConverter
    fun fromMessageType(value: MessageType): String {
        return value.name
    }

    @TypeConverter
    fun toMessageType(value: String): MessageType {
        return try {
            MessageType.valueOf(value)
        } catch (e: IllegalArgumentException) {
            MessageType.RECEIVED // Default fallback
        }
    }
}