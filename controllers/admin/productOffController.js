const Product = require("../../models/productModel");

const loadOfferManagement = async (req, res) => {
  try {
    const categoryOfferQuery = Product.aggregate([
      { $match: { category_OfferDetails: { $exists: true } } },
      { $group: { _id: "$category", offer: { $first: "$category_OfferDetails" } } },
    ]);

    const productOfferQuery = Product.find({ product_OfferDetails: { $exists: true } });
    const [categoryOffers, productOffers] = await Promise.all([categoryOfferQuery, productOfferQuery]);
    return res.render("offerManagement", { productOffers, categoryOffers });
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

const loadAddProductOffer = async (req, res) => {
  try {
    let products = await Product.find();
    let emessage = null;
    if (req.query.err) emessage = req.query.err;

    return res.render("addOffer", { products, emessage });
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

const submitProductOffer = async (req, res) => {
  try {

    let { product_Id, offerName, DiscountPercentage, offerStartDate, offerEndDate } = req.body;
    let today = new Date();
    let start = new Date(offerStartDate).setHours(0, 0, 0, 0);
    let end = new Date(offerEndDate).setHours(0, 0, 0, 0);
    let product = await Product.findOne({ _id: product_Id });
    let err = null;

    if ([product_Id, offerName, DiscountPercentage, offerStartDate, offerEndDate].some((field) => field.trim() == "")) {
      err = "Field can't be empty";
    } else if (start >= end) {
      err = "Offer end date should be greater than start date";
    } else if (start < today) {
      err = "Start date should be day after today";
    } else if (Number(DiscountPercentage) > 99 || Number(DiscountPercentage) < 1) {
      err = "Discount percentage is invalid";
    } else if (product.product_OfferDetails) {
      err = "Product currently have an offer";
    } else if (product.category_OfferDetails && product.category_OfferDetails.discountPercentage >= DiscountPercentage) {
      err = "A better or equel category offer already applied to this product";
    }

    if (err) return res.redirect("/admin/addProductOffer/?err=" + err);

    const offerData = {
      discountPercentage: Number(DiscountPercentage),
      offerName,
      offerStartDate,
      offerEndDate,
    };

    await Product.findOneAndUpdate({ _id: product_Id }, { $set: { product_OfferDetails: offerData }, $unset: { category_OfferDetails: "" } });
    return res.redirect("/admin/offerManagement");
  } catch (error) {
    
    return res.status(500).send("internal error");
  }
};

const loadEditProductOffer = async (req, res) => {
  try {
    let product = await Product.findOne({ _id: req.query.id });
    let emessage = null;
    if (req.query.err) emessage = req.query.err;

    return res.render("editOffer", { product, emessage });
  } catch (error) {
    
    return res.status(500).send("internal error");
  }
};

const submitEditProductOffer = async (req, res) => {
  try {
    let { offerName, id, DiscountPercentage, offerStartDate, offerEndDate } = req.body;

    let today = new Date();
    let start = new Date(offerStartDate).setHours(0, 0, 0, 0);
    let end = new Date(offerEndDate).setHours(0, 0, 0, 0);
    const product = await Product.findById({ _id: id });
    let err = null;

    if ([offerName, DiscountPercentage, offerStartDate, offerEndDate].some((field) => field.trim() == "")) {
      err = "Field can't be empty";
    } else if (start >= end) {
      err = "Offer end date should be greater than start date";
    } else if (start < today) {
      err = "Start date should be day after today";
    } else if (Number(DiscountPercentage) > 99 || Number(DiscountPercentage) < 1) {
      err = "Discount percentage is invalid";
    } else if (!product) {
      err = "Invalid product id";
    } else if (product.category_OfferDetails && product.category_OfferDetails.discountPercentage >= DiscountPercentage) {
      err = "A better or equel category offer already applied to this product";
    }

    if (err) return res.redirect("/admin/editProductOffer/?err=" + err + "&id=" + id);

    const offerData = {
      discountPercentage: Number(DiscountPercentage),
      offerName,
      offerStartDate,
      offerEndDate,
    };

    await Product.findOneAndUpdate(id, { $set: { product_OfferDetails: offerData }, $unset: { category_OfferDetails: "" } });
    return res.redirect("/admin/offerManagement");
  } catch (error) {
    
    return res.status(500).send("internal error");
  }
};

const loadDeleteProductOffer = async (req, res) => {
  try {
    let id = req.params.id;
    await Product.findOneAndUpdate({ _id: id }, { $unset: { product_OfferDetails: "" } });
    return res.redirect("/admin/offerManagement");
  } catch (error) {
    
    return res.status(500).send("internal error");
  }
};

module.exports = {
  loadOfferManagement,
  loadAddProductOffer,
  submitProductOffer,
  loadEditProductOffer,
  submitEditProductOffer,
  loadDeleteProductOffer,
};
