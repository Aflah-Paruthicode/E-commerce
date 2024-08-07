const mongoose = require('mongoose');

const addressSchema = mongoose.Schema({

    user_id:{
        type:String,
        required:true
    },
    
    
    houseNo:{
        type:String,
        required:true
    },
    street:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    district:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    pincode:{
        type:Number,
        required:true
    },
    isSelected:{
        type:Boolean,
        required:true,
        default:false
    }
    
    
});


module.exports = mongoose.model('address',addressSchema);


