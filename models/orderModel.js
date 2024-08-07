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
    status:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model("Order",OrderSchema);
