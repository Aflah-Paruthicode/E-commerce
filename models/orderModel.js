const mongoose = require('mongoose');

const OrderSchema = mongoose.Schema({
    product:{
        type:String,
        required:true
    },
    paymentMethod:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    variance:{
        type:Array,
    },
    deliveryChaerge:{
        type:Number,
        required:true
    },
    totelAmmount:{
        type:Number,
        required:true
    },
    user:{
        type:String,
        required:true
    },
    date:{
        type:String,
        required:true
    },
    coupon_applied:{
        type:String,
        required:true,
        default:'no'
    },
    coupon_Discount:{
        type:Number
    },
    is_multi:{
        type:Number,
        required:true,
        default:1
    },
    status:{
        type:String,
        required:true
    },
    reasonForReturn:{
        type:String,
    },
    product_OfferDetails: {
        type: {
          discountPercentage: Number,
          offerName: String,
          

        },
       
      },
      category_OfferDetails: {
        type: {
          discountPercentage: Number,
          offerName: String,
          

        },
       
      },
});

module.exports = mongoose.model("Order",OrderSchema);
