const express = require("express");
const adminRoute = express();
const auth = require("../authentication/adminAuth");
const adminController = require("../controllers/adminController");
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const nocache = require('nocache');
const session = require('express-session');


adminRoute.set('view engine', 'ejs');
adminRoute.set('views', path.join(__dirname, '../views/admin'));

adminRoute.use(session({
    secret: 'there is no secret',
    resave: false,
    saveUninitialized: true,
}));



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/productImages/'))
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
})

const bannerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/banners/'))
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
})

const upload = multer({ storage: storage });
const bannerStorageUpload = multer({ storage: bannerStorage });

adminRoute.use(nocache());
// Middleware to parse application/json
adminRoute.use(bodyParser.json());
// Middleware to parse application/x-www-form-urlencoded
adminRoute.use(bodyParser.urlencoded({ extended: true }));



adminRoute.get('/', auth.isLogout, adminController.loadLogin);
adminRoute.post('/', auth.isLogout, adminController.verifyLogin);

adminRoute.get('/home', auth.isLogin, adminController.loadDashboard);

adminRoute.get('/customers', auth.isLogin, adminController.loadCustomerList);
adminRoute.get('/blockUser', auth.isLogin, adminController.blockUser);
adminRoute.get('/UnBlockUser', auth.isLogin, adminController.UnBlockUser);
adminRoute.get('/deleteUser/:id',auth.isLogin, adminController.deleteUser)

adminRoute.get('/product', auth.isLogin, adminController.loadProductList);
adminRoute.get('/add-product', auth.isLogin, adminController.loadAddProduct);
adminRoute.post('/add-product', auth.isLogin,upload.array('images',12), adminController.submitNewProduct);
adminRoute.get('/DeleteProduct/:id', auth.isLogin, adminController.deleteProduct);
adminRoute.get('/EditProduct', auth.isLogin, adminController.loadProductEdit);
adminRoute.get('/productDelete/:position/:id', auth.isLogin,adminController.productImageEdit);
adminRoute.post('/productIMGChange',auth.isLogin,upload.single('image') ,adminController.productIMGChange)
adminRoute.post('/EditProduct', auth.isLogin, upload.single('images'), adminController.submitEditedProduct);

adminRoute.get('/orders', auth.isLogin,adminController.loadOrders);
adminRoute.get('/editOrder', auth.isLogin,adminController.loadEditOrder)
adminRoute.post('/editOrder', auth.isLogin,adminController.updateOrder)

adminRoute.get('/banner',auth.isLogin,adminController.loadBanners);
adminRoute.get('/loadUpdateBanner',auth.isLogin,adminController.changeCurrentBanner)
adminRoute.get('/loadDeleteBanner/:id',auth.isLogin,adminController.loadDeleteBanner)
adminRoute.post('/updateBanner',auth.isLogin,  bannerStorageUpload.single('image'),adminController.updateBanner);
adminRoute.get('/loadAddBannerToSlide',auth.isLogin,adminController.loadAddBannerToSlide)
adminRoute.post('/addBannerToSlide',auth.isLogin, bannerStorageUpload.single('image'),adminController.addBannerToSlide)

adminRoute.get('/couponManagement',auth.isLogin,adminController.loadcouponManagement)
adminRoute.post('/addCoupon', auth.isLogin,adminController.addCoupon)


adminRoute.get('/salesReport',auth.isLogin,adminController.loadSalesReport)

adminRoute.get('/category', auth.isLogin, adminController.addCategory);
adminRoute.post('/category',auth.isLogin, adminController.submitNewCategory);
adminRoute.get('/toUnlist',auth.isLogin,adminController.toUnlistCategory);
adminRoute.get('/toList',auth.isLogin,adminController.toListCategory);
adminRoute.get('/deleteCategory/:id', auth.isLogin, adminController.deleteCategory);

adminRoute.get('/logout', auth.isLogin, adminController.logout);


adminRoute.get('*', function (req, res) {
    res.redirect('/admin');
})



module.exports = adminRoute
