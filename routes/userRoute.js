const express = require("express");
const userRoute = express();
const userController = require("../controllers/user/userController");
const authController = require("../controllers/user/authController");
const auth = require("../authentication/userAuth");
const BlockAuth = require("../authentication/blockAuth");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const nocache = require("nocache");
const passport = require("passport");
require("../passport");

const session = require("express-session");

userRoute.use(passport.initialize());
userRoute.use(passport.session());

userRoute.use(
  session({
    secret: "there is no secret",
    resave: false,
    saveUninitialized: true,
  })
);

userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/users");

userRoute.use(nocache());
userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));

userRoute.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

userRoute.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/success",
    failureRedirect: "/failure",
  })
);

// -- Auth controller
userRoute.get("/success", authController.successGoogleLogin);
userRoute.get("/failure", authController.failureGoogleLogin);
userRoute.get("/register", auth.isLogout, authController.loadSignup);
userRoute.post("/register", auth.isLogout, authController.handleSignup);
userRoute.get("/login", auth.isLogout, authController.loadLogin);
userRoute.post("/login", BlockAuth.isblock, authController.handleLogin);
userRoute.get("/logout", auth.isLogin, authController.userLogout);
userRoute.get("/loadRegisterOtpVerification", auth.isLogout, authController.loadRegisterOtpVerification);
userRoute.post("/otpSubmit", auth.isLogout, authController.verifyRegisterOtp);
userRoute.get("/forget", auth.isLogout, authController.forget);
userRoute.post("/loadFpOtpPage", auth.isLogout, authController.loadForgetPassOTPPage);
userRoute.post("/submitFpOtpPage", auth.isLogout, authController.otpValidation);
userRoute.get("/loadSetNPage", auth.isLogout, authController.loadSetNewPass);
userRoute.post("/setNewPass", auth.isLogout, authController.changePassword);
userRoute.post("/forget", auth.isLogout, authController.forgetAction);

// -- Proffile controller
userRoute.get("/profile", auth.isLogin, userController.loadProfile);
userRoute.get("/editUser", auth.isLogin, userController.editUser);
userRoute.post("/editUser", auth.isLogin, userController.submitEditUser);
userRoute.get("/manageAddress", auth.isLogin, userController.loadManageAddress);
userRoute.get("/addAddress", auth.isLogin, userController.loadAddAddress);
userRoute.post("/addAddress", auth.isLogin, userController.addANewAddress);
userRoute.get("/EditAddress", auth.isLogin, userController.EditAddress);
userRoute.post("/EditAddress", auth.isLogin, userController.submitEditAddress);
userRoute.get("/DeleteAddress/:id", auth.isLogin, userController.deleteAddress);
userRoute.get("/selectAddress", auth.isLogin, userController.selectAddresss);
userRoute.get("/wallet", auth.isLogin, userController.loadWallet);

// -- Product controller
userRoute.get("/", auth.isLogin, userController.loadHome);
userRoute.post("/search", auth.isLogin, userController.search);
userRoute.get("/viewAllBestProducts", auth.isLogin, userController.viewAllBestProducts);
userRoute.get("/viewProduct", auth.isLogin, userController.loadViewProduct);
userRoute.get("/ChangeImageInViewPro", auth.isLogin, userController.ChangeImageInViewProduct);
userRoute.get("/aboutUs", auth.isLogin, userController.loadAboutUs);
userRoute.get("/contactUs", auth.isLogin, userController.loadContactUs);

// -- Cart controller
userRoute.get("/addToCart", auth.isLogin, userController.addToCart);
userRoute.get("/cart", auth.isLogin, userController.loadCart);
userRoute.post("/updateCartQuantity", auth.isLogin, userController.updateCartQuantity);
userRoute.post("/cart", auth.isLogin, userController.updatePriceOnCart);
userRoute.get("/RemovePdtFrmCart/:id", auth.isLogin, userController.RemovePdtFrmCart);
userRoute.get("/couponAdding", auth.isLogin, userController.couponAdding);

// -- Order controller
userRoute.get("/cartCheckout", auth.isLogin, userController.loadCartCheckout);
userRoute.post("/cartCheckout", auth.isLogin, userController.cartCheckQSetup);
userRoute.post("/placeOrder", auth.isLogin, userController.placeOrder);
userRoute.post("/onlinePaymentOrder", auth.isLogin, userController.onlinePaymentController);
userRoute.post("/confirmRetryOrder", auth.isLogin, userController.confirmRetryOrder);
userRoute.get("/loadOrderSuccess", auth.isLogin, userController.loadOrderSuccess);
userRoute.get("/myOrders", auth.isLogin, userController.loadmyOrders);
userRoute.get("/orderDetails", auth.isLogin, userController.orderDetails);
userRoute.get("/orderReturn", auth.isLogin, userController.orderReturn);
userRoute.get("/cancelOrder", auth.isLogin, userController.cancelOrder);
userRoute.get("/downloadOrderInvoice", auth.isLogin, userController.downloadOrderInvoice);
userRoute.get("/updateOrderInDb", auth.isLogin, userController.updateOrderInDb);

// -- Wishlist controller
userRoute.get("/whishlist", auth.isLogin, userController.LoadWhishlist);
userRoute.get("/addToWhishlist", auth.isLogin, userController.addToWhishlist);
userRoute.get("/RemovePdtFrmWhishlist/:id/:from", auth.isLogin, userController.RemovePdtFrmWhishlist);

userRoute.get("*", function (req, res) {
  res.redirect("/");
});

module.exports = userRoute;
