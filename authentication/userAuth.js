const User = require('../models/userModel');

const isLogin = async (req, res, next) => {

    try {
        if (req.session.user_id) {

            let user = await User.findOne({_id:req.session.user_id});
            
            if(user.block) {
                console.log('yeven blocked')
                delete req.session.user_id
                res.redirect('/login');         
               }
            next();
            return
        }
        console.log('evde session')
            res.redirect('/login');
       


    } catch (error) {
        console.log(error.message);
    }

}


const isLogout = async (req, res, next) => {

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
    isLogin,
    isLogout
}