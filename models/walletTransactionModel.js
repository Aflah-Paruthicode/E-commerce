const mongoose = require("mongoose");

const walletTransactionSchema = mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  product_name: {
    type: String,
    required: true,
  },
  money: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  type: {
    type: Boolean,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("walletTransaction", walletTransactionSchema);

//  the wallet's type maybe give a doubt, that is if the type is false the meening is order cancelled(payment get in wallet), true is the oposit
