const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    category:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        required:true,
        default:true
    }
});

// here the list and unlist, the meaning of true is listing, the false is oposit,

module.exports = mongoose.model("Category",categorySchema);