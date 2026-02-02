const User = require('../models/userModel');

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {

            const userData = await User.findById({_id:req.session.user_id});
            if(userData.block) {
                delete req.session.user_id;
                return res.redirect('/login');
            }

           return next();
        }
           return res.redirect('/login');
    } catch (error) {
        res.status(500).send('internal error from isLogin')
    }
}
const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) return res.redirect('/');
        
        next()
    } catch (error) {
        res.status(500).send('internal error from isLogout')
    }
}
module.exports = {
    isLogin,
    isLogout
}