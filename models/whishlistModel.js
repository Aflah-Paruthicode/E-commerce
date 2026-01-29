const mongoose = require("mongoose");

const whishlistSchema = mongoose.Schema({
  product_id: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  added_on: {
    type: String,
    required: true,
  },
  is_wish: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("whishlist", whishlistSchema);
