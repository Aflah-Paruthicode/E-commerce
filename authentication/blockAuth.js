
const User = require('../models/userModel');

const isblock = async (req, res, next) => {

    try {
        if (req.session.user_id) return res.redirect('/');
        next()
    } catch (error) {
        res.status(500).send('internal error from is block')
    }
}

module.exports = {
    isblock
}