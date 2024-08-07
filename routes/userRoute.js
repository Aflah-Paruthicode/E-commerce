const express = require('express');
const userRoute = express();
const userController = require('../controllers/userController');
const auth = require('../authentication/userAuth');
const BlockAuth = require('../authentication/blockAuth');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const nocache = require('nocache');
const passport = require('passport');
require('../passport');


const session = require('express-session');

userRoute.use(passport.initialize());
userRoute.use(passport.session());


userRoute.use(session({
  secret: 'there is no secret',
  resave: false,
  saveUninitialized: true,
}));




userRoute.set('view engine', 'ejs');
userRoute.set('views', './views/users')

userRoute.use(nocache());
userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));


//  Auth
userRoute.get('/auth/google', passport.authenticate('google', {
  scope: ['email', 'profile']
}));

//  Auth Callback

userRoute.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/success',
    failureRedirect: '/failure'
  }));

// success google login.
userRoute.get('/success', userController.successGoogleLogin);

// failure google login.
userRoute.get('/failure', userController.failureGoogleLogin);


userRoute.get('/', auth.isLogin, userController.loadHome);
userRoute.get('/viewAllBestProducts', auth.isLogin, userController.viewAllBestProducts)

userRoute.post('/search', auth.isLogin, userController.search);

userRoute.get('/register', auth.isLogout, userController.loadRegister);
userRoute.post('/register', auth.isLogout, userController.insertUser);
userRoute.get('/loadRegisterOtpVerification',auth.isLogout,userController.loadRegisterOtpVerification)
userRoute.post('/otpSubmit', auth.isLogout, userController.isOtp);

//  userRoute.get('/verify', auth.isLogout,userController.verifyMail);  need to impement otp

userRoute.get('/login', auth.isLogout, userController.loadLogin);
userRoute.post('/login', BlockAuth.isblock, userController.loginSubmit);

userRoute.get('/logout', auth.isLogin, userController.userLogout);

userRoute.get('/profile', auth.isLogin, userController.loadProfile);
userRoute.get('/editUser',auth.isLogin,userController.editUser)
userRoute.post('/editUser',auth.isLogin,userController.submitEditUser)
userRoute.get('/manageAddress', auth.isLogin, userController.loadManageAddress);
userRoute.get('/addAddress', auth.isLogin, userController.loadAddAddress);
userRoute.post('/addAddress', auth.isLogin, userController.addANewAddress);
userRoute.get('/EditAddress', auth.isLogin, userController.EditAddress);
userRoute.post('/EditAddress', auth.isLogin, userController.submitEditAddress);
userRoute.get('/DeleteAddress/:id', auth.isLogin, userController.deleteAddress);
userRoute.get('/selectAddress', auth.isLogin, userController.selectAddresss);

userRoute.get('/myOrders', auth.isLogin,userController.loadmyOrders);
userRoute.get('/orderDetails',auth.isLogin,userController.orderDetails)
userRoute.get('/downloadOrderInvoice',auth.isLogin,userController.downloadOrderInvoice)
userRoute.get('/cancelOrder',auth.isLogin, userController.cancelOrder);

userRoute.get('/wallet', auth.isLogin,userController.loadWallet)

userRoute.get('/aboutUs', auth.isLogin, userController.loadAboutUs);
userRoute.get('/contactUs', auth.isLogin, userController.loadContactUs);
userRoute.get('/viewProduct', auth.isLogin, userController.loadViewProduct);
userRoute.get('/ChangeImageInViewPro',auth.isLogin,userController.ChangeImageInViewProduct)
userRoute.get('/addToCart', auth.isLogin, userController.addToCart)
userRoute.get('/cart', auth.isLogin, userController.loadCart);
userRoute.post('/updateCartQuantity', auth.isLogin, userController.updateCartQuantity);
userRoute.post('/cart', auth.isLogin, userController.updatePriceOnCart);
userRoute.get('/RemovePdtFrmCart/:id', auth.isLogin, userController.RemovePdtFrmCart);

userRoute.get('/couponAdding', auth.isLogin, userController.couponAdding);
userRoute.post('/cartCheckout',auth.isLogin,userController.cartCheckQSetup)
userRoute.get('/cartCheckout', auth.isLogin, userController.loadCartCheckout)
userRoute.post('/placeOrder',auth.isLogin, userController.isNotCOD, userController.placeOrder);
userRoute.get('/loadOrderSuccess', auth.isLogin, userController.loadOrderSuccess)
userRoute.post('/onlinePaymentOrder',auth.isLogin,userController.onlinePaymentController)

userRoute.post('/confirmRetryOrder',auth.isLogin,userController.confirmRetryOrder)
userRoute.get('/updateOrderInDb',auth.isLogin, userController.updateOrderInDb)

userRoute.get('/whishlist', auth.isLogin, userController.LoadWhishlist);
userRoute.get('/addToWhishlist', auth.isLogin, userController.addToWhishlist);
userRoute.get('/RemovePdtFrmWhishlist/:id/:from', auth.isLogin, userController.RemovePdtFrmWhishlist);


userRoute.get('/forget', auth.isLogout, userController.forget);
userRoute.post('/loadFpOtpPage', auth.isLogout, userController.loadForgetPassOTPPage);
userRoute.post('/submitFpOtpPage', auth.isLogout, userController.otpValidation);
userRoute.get('/loadSetNPage', auth.isLogout, userController.loadSetNewPass)
userRoute.post('/setNewPass', auth.isLogout, userController.changePassword)
userRoute.post('/forget', auth.isLogout, userController.forgetAction);

userRoute.get('*', function (req, res) {
  res.redirect('/');
})

//   userRoute.get('/otp',userController.otpVerification);



module.exports = userRoute;