const Order = require("../../models/orderModel");
const Product = require("../../models/productModel");
const User = require("../../models/userModel");

const loadOrders = async (req, res) => {
  try {
    let orders;
    let queryFilters = {};
    let totalPages;
    let totalOrders;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let i = skip + 1;
    totalOrders = await Order.countDocuments();

    if (req.query.searchData) {
      queryFilters.paymentMethod = { $regex: req.query.searchData, $options: "i" };
    }
    totalOrders = await Order.countDocuments(queryFilters);
    orders = await Order.find(queryFilters).sort({ _id: -1 }).skip(skip).limit(limit);

    totalPages = Math.ceil(totalOrders / limit);

    const queryString = Object.keys(req.query)
      .filter((key) => key !== "page" && key !== "limit")
      .map((key) => `&${key}=${req.query[key]}`)
      .join("");

    return res.render("listOrders", {
      orders,
      pagination: { totalOrders, totalPages, currentPage: page, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
      i,
      message: req?.query?.orderChanged ? "Order Status Has Been Changed" : null,
      searchData: req.query.searchData,
      queryString,
    });
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

const loadEditOrderStatus = async (req, res) => {
  try {
    let order_id = req.query.id;
    let product_id = req.query.product_id;

    let product = await Product.findOne({ _id: product_id });
    let order = await Order.findOne({ _id: order_id });  
    let user = await User.findOne({ _id: order.user });

    return res.render("orderEdit", { product, order, user });
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

const updateOrder = async (req, res) => {
  try {
    let status = req.body.status;
    let id = req.query.order_id;

    await Order.findOneAndUpdate({ _id: id }, { $set: { status: status } });
    return res.redirect("/admin/orders/?orderChanged=true");
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

module.exports = {
  loadOrders,
  loadEditOrderStatus,
  updateOrder,
};
