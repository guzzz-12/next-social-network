const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  // Usuario dueño del chat
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Usuario con el que chatea
  messagesWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Último mensaje recibido en el chat
  latestMessage: {
    text: String,
    date: Date
  },
  // Verificar si el chat tiene mensajes
  isEmpty: {
    type: Boolean,
    default: true
  },
  // Status del chat. El usuario puede desactivarlo si no desea recibir más mensajes
  // en este chat pero el chat permanecerá visible para ambos usuarios
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  disabledBy: {}
}, {timestamps: true});

module.exports = mongoose.models.Chat || mongoose.model("Chat", chatSchema);