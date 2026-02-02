const isLogin = async (req, res, next) => {
    try {

        if (req.session.admin_id) {
            next();
            return
        }

        res.redirect('/admin');


    } catch (error) {
        console.log(error.message);
        res.status(500).send('internal error')
    }
}

const isLogout = async (req, res, next) => {
    try {

        if (req.session.admin_id) return res.redirect('/admin/home');
        next();

    } catch (error) {
        res.status(500).send('internal error')

    }
}


module.exports = {
    isLogin,
    isLogout
}