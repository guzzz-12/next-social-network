const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  // Usuario dueño del chat
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  // Todos los chats del usuario
  chats: [
    {
      // Usuario con el que se está conversando
      messagesWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      // Todos los mensajes con ese usuario
      messages: [
        {
          // Se usa el type Schema para especificar los timestamps
          type: new mongoose.Schema(
            {
              msg: {
                type: String,
                required: true
              },
              sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
              },
              recipient: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
              }
            },
            {timestamps: true}
          )
        }
      ]
    }
  ]
});

module.exports = mongoose.models.Chat || mongoose.model("Chat", chatSchema);