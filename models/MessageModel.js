const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat"
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  text: {
    type: String,
    required: true
  },
  // Status del mensaje. Al eliminar el mensaje, éste cambia su status a inactive,
  // esta acción oculta el mensaje para ambos usuarios, pero el mensaje permanecerá
  // almacenado en la DB para fines de seguridad (casos de amenazas, etc.)
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }
}, {timestamps: true});

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);