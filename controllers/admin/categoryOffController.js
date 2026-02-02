const CAtegory = require("../../models/categoryModel");
const Product = require("../../models/productModel");

const loadAddCategoryOffer = async (req, res) => {
  try {
    let categories = await CAtegory.find();
    let emessage = null;
    if (req.query.err) emessage = req.query.err;
    return res.render("addOffer", { categories, emessage });
  } catch (error) {
    res.status(500).send('internal error')
    return res.status(500).send("internal error");
  }
};

const submitCategoryOffer = async (req, res) => {
  try {
    let { category_name, offerName, DiscountPercentage, offerStartDate, offerEndDate } = req.body;
    let today = new Date();
    let start = new Date(offerStartDate).setHours(0, 0, 0, 0);
    let end = new Date(offerEndDate).setHours(0, 0, 0, 0);
    let product = await Product.findOne({ category: category_name });
    let err = null;

    if ([category_name, offerName, DiscountPercentage, offerStartDate, offerEndDate].some((field) => field.trim() == "")) {
      err = "Field can't be empty";
    } else if (start >= end) {
      err = "Offer end date should be greater than start date";
    } else if (start < today) {
      err = "Start date should be day after today";
    } else if (Number(DiscountPercentage) > 99 || Number(DiscountPercentage) < 1) {
      err = "Discount percentage is invalid";
    } else if (product.category_OfferDetails) {
      err = "Product currently have an offer";
    } else if (product.product_OfferDetails && product.product_OfferDetails.discountPercentage >= DiscountPercentage) {
      err = "A better or equel product offer already applied to this product";
    }

    if (err) return res.redirect("/admin/addCategoryOffer/?err=" + err);

    const offerData = {
      discountPercentage: Number(DiscountPercentage),
      offerName,
      offerStartDate,
      offerEndDate,
    };

    await Product.updateMany({ category: category_name }, { $set: { category_OfferDetails: offerData }, $unset: { product_OfferDetails: "" } });
    return res.redirect("/admin/offerManagement");
  } catch (error) {
    res.status(500).send('internal error')
    return res.status(500).send("internal error");
  }
};

const loadEditCategoryOffer = async (req, res) => {
  try {
    let product = await Product.findOne({ category: req.query.id });
    let err = null;

    if (req.query.err) err = req.query.err;
    return res.render("editOffer", { product, err });
  } catch (error) {
    res.status(500).send('internal error')
    return res.status(500).send("internal error");
  }
};

const submitEditCategoryOffer = async (req, res) => {
  try {
    let { category_name, offerName, DiscountPercentage, offerStartDate, offerEndDate } = req.body;

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
      err = "Invalid category name";
    } else if (product.product_OfferDetails && product.product_OfferDetails.discountPercentage >= DiscountPercentage) {
      err = "A better or equel product offer already applied to this product";
    }

    if (err) return res.redirect("/admin/editCategoryOffer/?err=" + err + "&id=" + category_name);

    const offerData = {
      discountPercentage: Number(DiscountPercentage),
      offerName,
      offerStartDate,
      offerEndDate,
    };

    await Product.updateMany({ category: category_name }, { $set: { category_OfferDetails: offerData }, $unset: { product_OfferDetails: "" } });
    return res.redirect("/admin/offerManagement");
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

const loadDeleteCategoryOffer = async (req, res) => {
  try {
    let category = req.params.category;
    await Product.updateMany({ category: category }, { $unset: { category_OfferDetails: "" } });
    return res.redirect("/admin/offerManagement");
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

module.exports = {
  loadAddCategoryOffer,
  submitCategoryOffer,
  loadEditCategoryOffer,
  submitEditCategoryOffer,
  loadDeleteCategoryOffer,
};
