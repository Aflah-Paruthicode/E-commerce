const Coupon = require("../../models/couponModel");

const loadcouponManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;
    let i = skip + 1;

    const totalCoupons = await Coupon.countDocuments();
    const totalPages = Math.ceil(totalCoupons / limit);
    const coupons = await Coupon.find().sort({ _id: -1 }).skip(skip).limit(limit);
    let emessage = null;
    let message = null;

    if (req.query.err) {
      emessage = req.query.err;
    } else if (req.query.success) {
      message = "Coupon added successful";
    } else if (req.query.creation) {
      message = "Coupon updated successful";
    }

    return res.render("addCoupon", {
      coupons,
      message,
      emessage,
      pagination: { totalCoupons, totalPages, currentPage: page, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
      i,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const addCoupon = async (req, res) => {
  try {
    const today = new Date();
    const { code, discount, expiry, amount } = req.body;
    const couponCapiteled = code.toUpperCase();
    const coupons = await Coupon.find({ code: couponCapiteled });
    const gotExpiry = new Date(expiry);
    let err = null;

    if ([code, discount, expiry, amount].some((field) => field.trim() == "")) {
      err = "Fields can't be empty";
    } else if (gotExpiry < today) {
      err = "Expiry date should be day after today";
    } else if (coupons.length > 0) {
      err = "Coupon code should be unique";
    } else if (parseInt(discount) >= parseInt(amount)) {
      err = "Discount must be less than purchase amount";
    }

    if (err) return res.redirect("/admin/couponManagement/?err=" + err);

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discount: parseInt(discount),
      amount: parseInt(amount),
      expiry: expiry,
    });

    await coupon.save();
    return res.redirect("/admin/couponManagement/?success=true");
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const editCoupon = async (req, res) => {
  try {
    let coupon = await Coupon.findById({ _id: req.query.id });
    let emessage = req?.query?.err ? req.query.err : null;
    return res.render("couponEdit", { coupon, emessage });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const updateCoupon = async (req, res) => {
  try {
    let today = new Date();

    const { code, discount, expiry, amount, id } = req.body;
    const coupons = await Coupon.findOne({ code: code.toUpperCase() });
    const currentCoupon = await Coupon.findById({ _id: id });
    const gotExpiry = new Date(expiry);
    let err = null;

    if ([code, discount, expiry, amount].some((field) => field.trim() == "")) {
      err = "Feilds can't be empty";
    } else if (gotExpiry < today) {
      err = "Expiry date should be day after today";
    } else if (coupons && coupons.code !== currentCoupon.code) {
      err = "Coupon code should be unique";
    } else if (parseInt(discount) >= parseInt(amount)) {
      err = "Discount must be less than purchase amount";
    }

    if (err) return res.redirect(`/admin/editCoupon/?id=${id}&err=${err}`);

    await Coupon.findByIdAndUpdate({ _id: id },
       { $set: { code: code.toUpperCase(), discount: discount, expiry: expiry, amount: amount } });
    return res.redirect("/admin/couponManagement/?creation=true");
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findOneAndDelete({ _id: req.params.id });
    return res.redirect("/admin/couponManagement");
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

module.exports = {
  loadcouponManagement,
  addCoupon,
  editCoupon,
  updateCoupon,
  deleteCoupon,
};
