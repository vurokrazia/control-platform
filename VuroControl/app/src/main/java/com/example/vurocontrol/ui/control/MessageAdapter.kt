package com.example.vurocontrol.ui.control

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.vurocontrol.R
import com.example.vurocontrol.database.entities.MessageEntity
import com.example.vurocontrol.database.entities.MessageType
import java.text.SimpleDateFormat
import java.util.*

/**
 * RecyclerView adapter for displaying Bluetooth messages
 * Uses MessageEntity instead of BluetoothMessage for better database integration
 */
class MessageAdapter : ListAdapter<MessageEntity, MessageAdapter.MessageViewHolder>(MessageDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_message, parent, false)
        return MessageViewHolder(view)
    }

    override fun onBindViewHolder(holder: MessageViewHolder, position: Int) {
        holder.bind(getItem(position), position)
    }

    class MessageViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val messageTypeIcon: TextView = itemView.findViewById(R.id.text_message_type)
        private val timestampText: TextView = itemView.findViewById(R.id.text_timestamp)
        private val positionText: TextView = itemView.findViewById(R.id.text_position)
        private val contentText: TextView = itemView.findViewById(R.id.text_content)
        private val deviceNameText: TextView = itemView.findViewById(R.id.text_device_name)
        private val deviceAddressText: TextView = itemView.findViewById(R.id.text_device_address)

        fun bind(message: MessageEntity, position: Int) {
            // Show position number for debugging
            positionText.text = "#$position"
            // Set message type icon
            messageTypeIcon.text = when (message.messageType) {
                MessageType.RECEIVED -> "📨"
                MessageType.SENT -> "📤"
                MessageType.SYSTEM -> "⚙️"
            }

            // Format timestamp
            val formatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
            timestampText.text = formatter.format(Date(message.createdAt))

            // Set content
            contentText.text = message.content

            // Set device info if available
            if (!message.deviceName.isNullOrBlank()) {
                deviceNameText.text = message.deviceName
                deviceNameText.visibility = View.VISIBLE
            } else {
                deviceNameText.visibility = View.GONE
            }

            if (!message.deviceAddress.isNullOrBlank()) {
                deviceAddressText.text = message.deviceAddress
                deviceAddressText.visibility = View.VISIBLE
            } else {
                deviceAddressText.visibility = View.GONE
            }
        }
    }

    private class MessageDiffCallback : DiffUtil.ItemCallback<MessageEntity>() {
        override fun areItemsTheSame(oldItem: MessageEntity, newItem: MessageEntity): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: MessageEntity, newItem: MessageEntity): Boolean {
            return oldItem == newItem
        }
    }
}