const Order = require("../../models/orderModel");

const loadOrders = async (req, res) => {
  try {
    let orders;
    let queryFilters = {}
    let totalPages;
    let totalOrders;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let i = skip + 1;
    totalOrders = await Order.countDocuments();

    if (req.query.searchData) {
        queryFilters.paymentMethod = { $regex: req.query.searchData, $options: "i" }
    } 
    totalOrders = await Order.countDocuments(queryFilters);
    orders = await Order.find(queryFilters).sort({ _id: -1 }).skip(skip).limit(limit);

    totalPages = Math.ceil(totalOrders / limit);

    const queryString = Object.keys(req.query)
      .filter((key) => key !== "page" && key !== "limit")
      .map((key) => `&${key}=${req.query[key]}`)
      .join("");

    res.render("listOrders", {
      orders,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      i,
      message: req?.query?.orderChanged ? "Order Status Has Been Changed" : null,
      searchData: req.query.searchData,
      queryString,
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadOrders,
};
