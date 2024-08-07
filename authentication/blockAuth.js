
const User = require('../models/userModel');


const isblock = async (req, res, next) => {

    try {

        


        if (req.session.user_id) {
            res.redirect('/');
            return
        }
        next()

    } catch (error) {
        console.log(error.message);
    }


}


module.exports = {
    isblock
}