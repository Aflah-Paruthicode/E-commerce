const isLogin = async (req, res, next) => {
    try {

        if (req.session.admin_id) {
            next();
            return
        }

        res.redirect('/admin');


    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) => {
    try {

        if (req.session.admin_id) {
            res.redirect('/admin/home');
            return;
        }
        next();

    } catch (error) {

    }
}


module.exports = {
    isLogin,
    isLogout
}