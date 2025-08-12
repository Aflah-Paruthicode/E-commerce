const mongoose = require('mongoose');

const productSchema = mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    company:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    og_price:{
        type:Number,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    variance:{
        type:Array
    },
    category:{
        type:String,
        required:true
    },
    product_desc:{
        type:String,
        required:true
    },
    images:{
        type:Array,
        required:true
    },
    product_OfferDetails: {
        type: {
          discountPercentage: Number,
          offerName: String,
          offerStartDate: Date,
          offerEndDate: Date

        },
       
      },
      category_OfferDetails: {
        type: {
          discountPercentage: Number,
          offerName: String,
          offerStartDate: Date,
          offerEndDate: Date

        },
       
      },


});



module.exports = mongoose.model('product',productSchema);