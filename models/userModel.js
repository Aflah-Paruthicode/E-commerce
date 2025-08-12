 const mongoose = require('mongoose');


 const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },

    is_verified:{
        type:Number
    },

    address:{
        type:Array
    },
    
    image:{
        type:String
    },
    block:{
        type:Boolean,
        default:false
    }

 })

 module.exports = mongoose.model('user',userSchema);  