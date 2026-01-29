const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  products_id: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Cart", cartSchema);
