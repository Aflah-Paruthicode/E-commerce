const express = require("express");
const adminRoute = express();
const auth = require("../authentication/adminAuth");
const adminController = require("../controllers/admin/adminController");
const productController = require("../controllers/admin/productController");
const orderController = require("../controllers/admin/orderController");
const bannerController = require("../controllers/admin/bannerController")
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const nocache = require("nocache");
const session = require("express-session");

adminRoute.set("view engine", "ejs");
adminRoute.set("views", path.join(__dirname, "../views/admin"));

adminRoute.use(
  session({
    secret: "there is no secret",
    resave: false,
    saveUninitialized: true,
  })
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/productImages/"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const bannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/banners/"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });
const bannerStorageUpload = multer({ storage: bannerStorage });

adminRoute.use(nocache());
// Middleware to parse application/json
adminRoute.use(bodyParser.json());
// Middleware to parse application/x-www-form-urlencoded
adminRoute.use(bodyParser.urlencoded({ extended: true }));

adminRoute.get("/", auth.isLogout, adminController.loadLogin);
adminRoute.post("/", auth.isLogout, adminController.verifyLogin);

adminRoute.get("/home", auth.isLogin, adminController.loadDashboard);

adminRoute.get("/customers", auth.isLogin, adminController.loadCustomerList);
adminRoute.get("/blockUser", auth.isLogin, adminController.blockUser);
adminRoute.get("/UnBlockUser", auth.isLogin, adminController.UnBlockUser);
adminRoute.get("/deleteUser/:id", auth.isLogin, adminController.deleteUser);

// -- Product controller
adminRoute.get("/product", auth.isLogin, productController.loadProducts);
adminRoute.get("/add-product", auth.isLogin, productController.loadAddProduct);
adminRoute.post("/add-product", auth.isLogin, upload.array("images", 12), productController.submitNewProduct);
adminRoute.get("/deleteProduct/:id", auth.isLogin, productController.deleteProduct);
adminRoute.get("/EditProduct", auth.isLogin, productController.loadEditProduct);
adminRoute.get("/deleteProductImg/:position/:id", auth.isLogin, productController.deleteProductIMG);
adminRoute.post("/productIMGChange", auth.isLogin, upload.single("image"), productController.editProductIMG);
adminRoute.post("/EditProduct", auth.isLogin, upload.single("images"), productController.handleSubmitEditProduct);

// -- Order controller
adminRoute.get("/orders", auth.isLogin, orderController.loadOrders);
adminRoute.get("/editOrder", auth.isLogin, orderController.loadEditOrderStatus);
adminRoute.post("/editOrder", auth.isLogin, orderController.updateOrder);

// -- Banner controller
adminRoute.get("/banner", auth.isLogin, bannerController.loadBanners); 
adminRoute.get("/loadUpdateBanner", auth.isLogin, bannerController.loadUpdateBanner);
adminRoute.post("/updateBanner", auth.isLogin, bannerStorageUpload.single("image"), bannerController.updateBanner);
adminRoute.get("/deleteBanner/:id", auth.isLogin, bannerController.deleteBanner);
adminRoute.get("/loadAddBannerToSlide", auth.isLogin, bannerController.loadAddBannerToSlide);
adminRoute.post("/addBannerToSlide", auth.isLogin, bannerStorageUpload.single("image"), bannerController.addBannerToSlide);

// -- Coupon controller
adminRoute.get("/couponManagement", auth.isLogin, adminController.loadcouponManagement);
adminRoute.post("/addCoupon", auth.isLogin, adminController.addCoupon);
adminRoute.get("/editCoupon", auth.isLogin, adminController.editCoupon);
adminRoute.post("/updateCoupon", auth.isLogin, adminController.updateCoupon);
adminRoute.get("/deleteCoupon/:id", auth.isLogin, adminController.deleteCoupon);

adminRoute.get("/salesReport", auth.isLogin, adminController.loadSalesReport);

adminRoute.get("/category", auth.isLogin, adminController.addCategory);
adminRoute.post("/category", auth.isLogin, adminController.submitNewCategory);
adminRoute.get("/toUnlist", auth.isLogin, adminController.toUnlistCategory);
adminRoute.get("/toList", auth.isLogin, adminController.toListCategory);
adminRoute.get("/deleteCategory/:id", auth.isLogin, adminController.deleteCategory);

adminRoute.get("/offerManagement", auth.isLogin, adminController.loadOfferManagement);
adminRoute.get("/addProductOffer", auth.isLogin, adminController.loadAddProductOffer);
adminRoute.post("/addProductOffer", auth.isLogin, adminController.submitProductOffer);
adminRoute.get("/editProductOffer", auth.isLogin, adminController.loadEditProductOffer);
adminRoute.post("/editProductOffer", auth.isLogin, adminController.submitEditProductOffer);

adminRoute.get("/deleteProductOffer/:id", auth.isLogin, adminController.loadDeleteProductOffer);

adminRoute.get("/addCategoryOffer", auth.isLogin, adminController.loadAddCategoryOffer);
adminRoute.post("/addCategoryOffer", auth.isLogin, adminController.submitCategoryOffer);
adminRoute.get("/editCategoryOffer", auth.isLogin, adminController.loadEditCategoryOffer);
adminRoute.post("/editCategoryOffer", auth.isLogin, adminController.submitEditCategoryOffer);

adminRoute.get("/deleteCategoryOffer/:category", auth.isLogin, adminController.loadDeleteCategoryOffer);

adminRoute.get("/logout", auth.isLogin, adminController.logout);

adminRoute.get("*", function (req, res) {
  res.redirect("/admin");
});

module.exports = adminRoute;
