const mongoose = require("mongoose");

const walletSchema = mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  Money: {
    type: Number,
    default: 0,
    required: true,
  },
});

module.exports = mongoose.model("wallet", walletSchema);
