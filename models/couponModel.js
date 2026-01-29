const mongoose = require("mongoose");

const CouponSchema = mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  expiry: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Coupon", CouponSchema);
