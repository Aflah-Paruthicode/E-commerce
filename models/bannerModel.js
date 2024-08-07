
const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema({
    description: { 
        type: String,
        required: true
    },
    startDate: { 
        type: Date,
        required: true 
    },
    endDate: {
        type: Date,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default:true
    },
});

module.exports = mongoose.model("Banner",bannerSchema);