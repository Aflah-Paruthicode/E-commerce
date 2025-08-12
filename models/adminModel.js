const mongoose = require("mongoose");


const adminSchema = new mongoose.Schema({


    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    }
});




module.exports = mongoose.model('Admin', adminSchema);