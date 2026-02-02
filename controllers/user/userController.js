const User = require("../../models/userModel");
const Address = require("../../models/addressModel");
const Cart = require("../../models/cartModel");
const Order = require("../../models/orderModel");
const Coupon = require("../../models/couponModel");
const Whishlist = require("../../models/whishlistModel");
const Product = require("../../models/productModel");
const Wallet = require("../../models/walletModel");
const Banner = require("../../models/bannerModel");
require("dotenv").config();


const Razorpay = require("razorpay");
const walletTransactionModel = require("../../models/walletTransactionModel");


const verifyMail = async (req, res) => {
  try {
    const updateInfo = await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
    req.session.user_id = req.query.id;

    res.render("home");
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $addFields: { productIdObjectId: { $toObjectId: "$product" } } },
      {
        $group: {
          _id: "$productIdObjectId",
          totalQuantity: { $sum: "$quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: "$_id",
          name: "$productDetails.name",
          price: "$productDetails.price",
          images: "$productDetails.images",
          product_desc: "$productDetails.product_desc",
          company: "$productDetails.company",
          quantity: "$productDetails.quantity",
          og_price: "$productDetails.og_price",
          product_OfferDetails: "$productDetails.product_OfferDetails",
          category_OfferDetails: "$productDetails.category_OfferDetails",
        },
      },
    ]);

    const productss = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "category",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $match: {
          "categoryDetails.isListed": true,
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          images: 1,
          product_desc: 1,
          company: 1,
          quantity: 1,
          og_price: 1,
          product_OfferDetails: 1,
          category_OfferDetails: 1,
          // Include other fields you want to retrieve from the product document
          category: "$categoryDetails.name",
        },
      },
      { $limit: 8 },
    ]);

    let products = productss.reverse();

    const whishlist = await Whishlist.find();
    const SlideBanners = await Banner.find({
      description: "Banner for home page slide",
    });
    const ThankBanner = await Banner.findOne({
      description: "Banner for home page thankyou",
    });
    let user = await User.findById({ _id: req.session.user_id });
    let fromLogin = req.query.fromLogin;

    if (fromLogin) {
      res.render("home", {
        products,
        whishlist,
        message: "Welcome " + user.name,
        SlideBanners,
        ThankBanner,
        topProducts,
      });
    } else {
      res.render("home", {
        products,
        whishlist,
        SlideBanners,
        ThankBanner,
        topProducts,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewAllBestProducts = async (req, res) => {
  try {
    let { page = 1, limit = 5, sorted, filtered, Pricefiltered, searchData } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    const sortOptions = {
      "Price Low To High": { price: 1 },
      "Price High To Low": { price: -1 },
      "A to Z": { name: 1 },
      "Z to A": { name: -1 },
    };
    const priceOptions = {
      "under rs 999": { price: { $lte: 999 } },
      "rs 1000 to rs 2999": {
        $and: [{ price: { $gte: 1000 } }, { price: { $lte: 2999 } }],
      },
      "rs 3000 to rs 5000": {
        $and: [{ price: { $gte: 3000 } }, { price: { $lte: 5000 } }],
      },
      "rs 5000 to rs 10000": {
        $and: [{ price: { $gte: 5000 } }, { price: { $lte: 10000 } }],
      },
      "rs 10000 to rs 20000": {
        $and: [{ price: { $gte: 10000 } }, { price: { $lte: 20000 } }],
      },
    };

    let products = [];
    let totalProducts = 0;
    let sortedAs, filteredAs, pricefilteredAs;

    if (searchData && Pricefiltered && sorted && filtered) {
      let { price } = priceOptions[Pricefiltered];
      let { $and } = priceOptions[Pricefiltered];

      if (Pricefiltered == "under rs 999") {
        if (filtered === "all") {
          products = await Product.aggregate([
            {
              $match: {
                price,
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $sort: sortOptions[sorted] },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            {
              $match: {
                price,
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        } else {
          products = await Product.aggregate([
            {
              $match: {
                price,
                company: filtered.toUpperCase(),
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $sort: sortOptions[sorted] },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            {
              $match: {
                price,
                company: filtered.toUpperCase(),
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        }
      } else {
        if (filtered === "all") {
          products = await Product.aggregate([
            {
              $match: {
                $and,
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $sort: sortOptions[sorted] },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            {
              $match: {
                $and,
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        } else {
          products = await Product.aggregate([
            {
              $match: {
                $and,
                company: filtered.toUpperCase(),
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $sort: sortOptions[sorted] },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            {
              $match: {
                $and,
                company: filtered.toUpperCase(),
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        }
      }

      filteredAs = filtered;
      pricefilteredAs = Pricefiltered;
      sortedAs = sorted;
    } else if (sorted && searchData && filtered) {
      if (filtered === "all") {
        products = await Product.aggregate([
          { $match: { name: { $regex: `.*${searchData}.*`, $options: "i" } } },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $sort: sortOptions[sorted] },
          { $skip: skip },
          { $limit: limit },
        ]);
        totalProducts = await Product.aggregate([
          { $match: { name: { $regex: `.*${searchData}.*`, $options: "i" } } },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      } else {
        products = await Product.aggregate([
          {
            $match: {
              company: filtered.toUpperCase(),
              name: { $regex: `.*${searchData}.*`, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $sort: sortOptions[sorted] },
          { $skip: skip },
          { $limit: limit },
        ]);
        totalProducts = await Product.aggregate([
          {
            $match: {
              company: filtered.toUpperCase(),
              name: { $regex: `.*${searchData}.*`, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      }

      filteredAs = filtered;
      sortedAs = sorted;
    } else if (sorted && Pricefiltered && filtered) {
      let { price } = priceOptions[Pricefiltered];
      let { $and } = priceOptions[Pricefiltered];

      if (Pricefiltered == "under rs 999") {
        if (filtered === "all") {
          products = await Product.aggregate([
            { $match: { price } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $sort: sortOptions[sorted] },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            { $match: { price } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        } else {
          products = await Product.aggregate([
            { $match: { price, company: filtered.toUpperCase() } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $sort: sortOptions[sorted] },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            { $match: { price, company: filtered.toUpperCase() } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        }
      } else {
        if (filtered === "all") {
          products = await Product.aggregate([
            { $match: { $and } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $sort: sortOptions[sorted] },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            { $match: { $and } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        } else {
          products = await Product.aggregate([
            { $match: { $and, company: filtered.toUpperCase() } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $sort: sortOptions[sorted] },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            { $match: { $and, company: filtered.toUpperCase() } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        }
      }

      filteredAs = filtered;
      pricefilteredAs = Pricefiltered;
      sortedAs = sorted;
    } else if (searchData && Pricefiltered && filtered) {
      let { price } = priceOptions[Pricefiltered];
      let { $and } = priceOptions[Pricefiltered];

      if (Pricefiltered == "under rs 999") {
        if (filtered === "all") {
          products = await Product.aggregate([
            {
              $match: {
                price,
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            {
              $match: {
                price,
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        } else {
          products = await Product.aggregate([
            {
              $match: {
                price,
                company: filtered.toUpperCase(),
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            {
              $match: {
                price,
                company: filtered.toUpperCase(),
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        }
      } else {
        if (filtered === "all") {
          products = await Product.aggregate([
            {
              $match: {
                $and,
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            {
              $match: {
                $and,
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        } else {
          products = await Product.aggregate([
            {
              $match: {
                $and,
                company: filtered.toUpperCase(),
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            {
              $match: {
                $and,
                company: filtered.toUpperCase(),
                name: { $regex: `.*${searchData}.*`, $options: "i" },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        }
      }

      filteredAs = filtered;
      pricefilteredAs = Pricefiltered;
    } else if (searchData && Pricefiltered && sorted) {
      let { price } = priceOptions[Pricefiltered];
      let { $and } = priceOptions[Pricefiltered];

      if (Pricefiltered == "under rs 999") {
        products = await Product.aggregate([
          {
            $match: {
              price,
              name: { $regex: `.*${searchData}.*`, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $sort: sortOptions[sorted] },
          { $skip: skip },
          { $limit: limit },
        ]);
        totalProducts = await Product.aggregate([
          {
            $match: {
              price,
              name: { $regex: `.*${searchData}.*`, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      } else {
        products = await Product.aggregate([
          {
            $match: {
              $and,
              name: { $regex: `.*${searchData}.*`, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $sort: sortOptions[sorted] },
          { $skip: skip },
          { $limit: limit },
        ]);
        totalProducts = await Product.aggregate([
          {
            $match: {
              $and,
              name: { $regex: `.*${searchData}.*`, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      }

      pricefilteredAs = Pricefiltered;
      sortedAs = sorted;
    } else if (sorted && searchData) {
      products = await Product.aggregate([
        { $match: { name: { $regex: `.*${searchData}.*`, $options: "i" } } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "category",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        { $match: { "categoryDetails.isListed": true } },
        { $sort: sortOptions[sorted] },
        { $skip: skip },
        { $limit: limit },
      ]);
      totalProducts = await Product.aggregate([
        { $match: { name: { $regex: `.*${searchData}.*`, $options: "i" } } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "category",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        { $match: { "categoryDetails.isListed": true } },
        { $count: "total" },
      ]).then((result) => (result[0] ? result[0].total : 0));

      sortedAs = sorted;
    } else if (sorted && filtered) {
      if (filtered === "all") {
        products = await Product.aggregate([
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $sort: sortOptions[sorted] },
          { $skip: skip },
          { $limit: limit },
        ]);
        totalProducts = await Product.aggregate([
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      } else {
        let capitaledCompany = filtered.toUpperCase();

        products = await Product.aggregate([
          { $match: { company: capitaledCompany } },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $sort: sortOptions[sorted] },
          { $skip: skip },
          { $limit: limit },
        ]);
        totalProducts = await Product.aggregate([
          { $match: { company: capitaledCompany } },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      }

      filteredAs = filtered;
      sortedAs = sorted;
    } else if (sorted && Pricefiltered) {
      products = await Product.aggregate([
        { $match: priceOptions[Pricefiltered] },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "category",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        { $match: { "categoryDetails.isListed": true } },
        { $sort: sortOptions[sorted] },
        { $skip: skip },
        { $limit: limit },
      ]);
      totalProducts = await Product.aggregate([
        { $match: priceOptions[Pricefiltered] },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "category",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        { $match: { "categoryDetails.isListed": true } },
        { $count: "total" },
      ]).then((result) => (result[0] ? result[0].total : 0));

      pricefilteredAs = Pricefiltered;
      sortedAs = sorted;
    } else if (filtered && searchData) {
      if (filtered === "all") {
        products = await Product.aggregate([
          { $match: { name: { $regex: `.*${searchData}.*`, $options: "i" } } },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $skip: skip },
          { $limit: limit },
        ]);
        totalProducts = await Product.aggregate([
          { $match: { name: { $regex: `.*${searchData}.*`, $options: "i" } } },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      } else {
        products = await Product.aggregate([
          {
            $match: {
              name: { $regex: `.*${searchData}.*`, $options: "i" },
              company: filtered.toUpperCase(),
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $skip: skip },
          { $limit: limit },
        ]);
        totalProducts = await Product.aggregate([
          {
            $match: {
              name: { $regex: `.*${searchData}.*`, $options: "i" },
              company: filtered.toUpperCase(),
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      }

      filteredAs = filtered;
    } else if (filtered && Pricefiltered) {
      let { price } = priceOptions[Pricefiltered];
      let { $and } = priceOptions[Pricefiltered];

      if (Pricefiltered == "under rs 999") {
        if (filtered === "all") {
          products = await Product.aggregate([
            { $match: { price } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            { $match: { price } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        } else {
          products = await Product.aggregate([
            { $match: { price, company: filtered.toUpperCase() } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            { $match: { price, company: filtered.toUpperCase() } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        }
      } else {
        if (filtered === "all") {
          products = await Product.aggregate([
            { $match: { $and } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            { $match: { $and } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        } else {
          products = await Product.aggregate([
            { $match: { $and, company: filtered.toUpperCase() } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $skip: skip },
            { $limit: limit },
          ]);
          totalProducts = await Product.aggregate([
            { $match: { $and, company: filtered.toUpperCase() } },
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "category",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isListed": true } },
            { $count: "total" },
          ]).then((result) => (result[0] ? result[0].total : 0));
        }
      }

      filteredAs = filtered;
      pricefilteredAs = Pricefiltered;
    } else if (Pricefiltered && searchData) {
      let { price } = priceOptions[Pricefiltered];
      let { $and } = priceOptions[Pricefiltered];

      if (Pricefiltered == "under rs 999") {
        products = await Product.aggregate([
          {
            $match: {
              price,
              name: { $regex: `.*${searchData}.*`, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $skip: skip },
          { $limit: limit },
        ]);
        totalProducts = await Product.aggregate([
          {
            $match: {
              price,
              name: { $regex: `.*${searchData}.*`, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      } else {
        products = await Product.aggregate([
          {
            $match: {
              $and,
              name: { $regex: `.*${searchData}.*`, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $skip: skip },
          { $limit: limit },
        ]);
        totalProducts = await Product.aggregate([
          {
            $match: {
              $and,
              name: { $regex: `.*${searchData}.*`, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      }

      pricefilteredAs = Pricefiltered;
    } else if (sorted) {
      products = await handleSorting(sorted, skip, limit);
      totalProducts = await Product.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "category",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        { $match: { "categoryDetails.isListed": true } },
        { $count: "total" },
      ]).then((result) => (result[0] ? result[0].total : 0));
      sortedAs = sorted;
    } else if (filtered) {
      if (filtered !== "all") {
        products = await handleCompanyFiltering(filtered, skip, limit);
        totalProducts = await Product.aggregate([
          { $match: { company: filtered.toUpperCase() } },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      } else {
        products = await handleCompanyFiltering(filtered, skip, limit);
        totalProducts = await Product.aggregate([
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "category",
              as: "categoryDetails",
            },
          },
          { $unwind: "$categoryDetails" },
          { $match: { "categoryDetails.isListed": true } },
          { $count: "total" },
        ]).then((result) => (result[0] ? result[0].total : 0));
      }

      filteredAs = filtered;
    } else if (Pricefiltered) {
      products = await handlePriceFiltering(Pricefiltered, skip, limit);
      totalProducts = await Product.aggregate([
        { $match: priceOptions[Pricefiltered] },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "category",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        { $match: { "categoryDetails.isListed": true } },
        { $count: "total" },
      ]).then((result) => (result[0] ? result[0].total : 0));

      pricefilteredAs = Pricefiltered;
    } else if (searchData) {
      products = await handleSearch(searchData, skip, limit);
      totalProducts = await Product.aggregate([
        { $match: { name: { $regex: `.*${searchData}.*`, $options: "i" } } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "category",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        { $match: { "categoryDetails.isListed": true } },
        { $count: "total" },
      ]).then((result) => (result[0] ? result[0].total : 0));
    } else {
      products = await Product.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "category",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        { $match: { "categoryDetails.isListed": true } },
        { $skip: skip },
        { $limit: limit },
      ]);
      totalProducts = await Product.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "category",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        { $match: { "categoryDetails.isListed": true } },
        { $count: "total" },
      ]).then((result) => (result[0] ? result[0].total : 0));
    }

    const totalPages = Math.ceil(totalProducts / limit);

    const queryString = Object.keys(req.query)
      .filter((key) => key !== "page" && key !== "limit")
      .map((key) => `&${key}=${req.query[key]}`)
      .join("");

    res.render("viewAllProducts", {
      products,
      pagination: {
        totalProducts,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
      },
      queryString,
      searchData,
      i: 1,
      sortedAs,
      filteredAs,
      pricefilteredAs,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const handleSearch = async (searchData, skip, limit) => {
  return await Product.aggregate([
    {
      $match: {
        name: { $regex: `.*${searchData}.*`, $options: "i" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "category",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },
    {
      $match: {
        "categoryDetails.isListed": true,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);
};

const handlePriceFiltering = async (priceRange, skip, limit) => {
  const priceOptions = {
    "under rs 999": { price: { $lte: 999 } },
    "rs 1000 to rs 2999": {
      $and: [{ price: { $gte: 1000 } }, { price: { $lte: 2999 } }],
    },
    "rs 3000 to rs 5000": {
      $and: [{ price: { $gte: 3000 } }, { price: { $lte: 5000 } }],
    },
    "rs 5000 to rs 10000": {
      $and: [{ price: { $gte: 5000 } }, { price: { $lte: 10000 } }],
    },
    "rs 10000 to rs 20000": {
      $and: [{ price: { $gte: 10000 } }, { price: { $lte: 20000 } }],
    },
  };
  return await Product.aggregate([
    {
      $match: priceOptions[priceRange],
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "category",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },
    {
      $match: {
        "categoryDetails.isListed": true,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);
};

const handleCompanyFiltering = async (company, skip, limit) => {
  if (company === "all") {
    return await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "category",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $match: {
          "categoryDetails.isListed": true,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);
  } else {
    let capitaledCompany = company.toUpperCase();
    return await Product.aggregate([
      {
        $match: {
          company: capitaledCompany,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "category",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $match: {
          "categoryDetails.isListed": true,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);
  }
};

const handleSorting = async (sortQuery, skip, limit) => {
  const sortOptions = {
    "Price Low To High": { price: 1 },
    "Price High To Low": { price: -1 },
    "A to Z": { name: 1 },
    "Z to A": { name: -1 },
  };
  return await Product.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "category",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },
    {
      $match: {
        "categoryDetails.isListed": true,
      },
    },
    {
      $sort: sortOptions[sortQuery],
    },
    { $skip: skip },
    { $limit: limit },
  ]);
};

const loadProfile = async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.session.user_id });

    let ordersCount = await Order.find({ user: req.session.user_id }).count();
    let wishCount = await Whishlist.find({
      user_id: req.session.user_id,
    }).count();

    let wallet = await Wallet.findOne({ user_id: req.session.user_id });

    if (req.query.edited) {
      res.render("user-profile", {
        uSER: user,
        ordersCount,
        wallet,
        wishCount,
        message: "user edited was successfully",
      });
    } else {
      res.render("user-profile", {
        uSER: user,
        ordersCount,
        wallet,
        wishCount,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const editUser = async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.session.user_id });

    if (req.query.wrong) {
      res.render("user-proffileEdit", {
        user,
        emessage: "enter details properly",
        user,
      });
    } else {
      res.render("user-proffileEdit", { user });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const submitEditUser = async (req, res) => {
  try {
    let { name, id, email, mobile } = req.body;

    if (name.trim() == "" || email.trim() == "" || mobile.trim() == "") {
      res.redirect("/editUser/?wrong=true");
    } else {
      let updateUser = await User.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            name: name.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
          },
        }
      );

      res.redirect("/profile/?edited=true");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadManageAddress = async (req, res) => {
  try {
    let address = await Address.find({ user_id: req.session.user_id });
    let user = await User.findById({ _id: req.session.user_id });
    let from = req.query.from;

    res.render("user-manageAdd", { address, from, user });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddAddress = async (req, res) => {
  try {
    let user = await User.findById({ _id: req.session.user_id });

    res.render("user-addAddress", { user });
  } catch (error) {
    console.log(error.message);
  }
};

const loadmyOrders = async (req, res) => {
  try {
    const retrySuccess = req.query.retrySuccess;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    let orderdb = await Order.find({ user: req.session.user_id }).sort({ _id: -1 }).skip(skip).limit(limit);
    let productsdb = [];

    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    for (let i = 0; i < orderdb.length; i++) {
      let product = await Product.findOne({ _id: orderdb[i].product });
      productsdb.push(product);
    }

    let products = productsdb;
    let order = orderdb;

    let user = await User.findById({ _id: req.session.user_id });
    let message = null;

    if (retrySuccess) message = "Order Placed";

    res.render("user-orders", {
      products,
      order,
      user,
      pagination: { totalOrders, totalPages, currentPage: page, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (error) {
    console.log(error.message);
  }
};

const orderDetails = async (req, res) => {
  try {
    let orderId = req.query.orderId;
    let order = await Order.findById({ _id: orderId });
    let user = await User.findById({ _id: req.session.user_id });
    let product = await Product.findById({ _id: order.product });
    // for delivery date
    let dateParts = order.date.split("/");
    let dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    let taxAmount = Math.floor((order.quantity * product.price) / 10);
    // Calculate the date 7 days ago
    let date7DaysLater = new Date();
    date7DaysLater.setDate(dateObject.getDate() + 7);

    if (order.coupon_applied !== "no") {
      res.render("user-orderDetails", {
        user,
        product,
        order,
        delivery: date7DaysLater.toDateString(),
        coupon: order.coupon_Discount,
        taxAmount,
      });
    } else {
      res.render("user-orderDetails", {
        user,
        product,
        order,
        delivery: date7DaysLater.toDateString(),
        coupon: "no",
        taxAmount,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const orderReturn = async (req, res) => {
  try {
    console.log("choosed one is : ", req.query.choosed);
    console.log("order id is : ", req.query.orderId);
    let order = await Order.findOne({ _id: req.query.orderId });

    let orderStatus_Update = await Order.findOneAndUpdate(
      { _id: req.query.orderId },
      {
        $set: {
          status: "Return Requested",
          reasonForReturn: req.query.choosed,
        },
      }
    );

    res.redirect("/orderDetails/?orderId=" + order._id);
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    let id = req.query.id;
    let FindProductForRestoreQuantity = await Order.findOne({ _id: id });
    let restoreQuantity = await Product.findOneAndUpdate({ _id: FindProductForRestoreQuantity.product }, { $inc: { quantity: req.query.quantity } });
    let updateOrderStatus = await Order.findOneAndUpdate({ _id: id }, { $set: { status: "Cancelled" } });

    if (updateOrderStatus.paymentMethod !== "Cash On Delivery") {
      let reducePoinValue = Math.floor(updateOrderStatus.totelAmmount);
      let walletUpdate = await Wallet.findOneAndUpdate({ user_id: req.session.user_id }, { $inc: { Money: reducePoinValue } });

      const newTransaction = new walletTransactionModel({
        user: req.session.user_id,
        product_name: restoreQuantity.name,
        money: FindProductForRestoreQuantity.totelAmmount,
        quantity: FindProductForRestoreQuantity.quantity,
        type: false,
        paymentMethod: FindProductForRestoreQuantity.paymentMethod,
      });

      const saveTransaction = await newTransaction.save();
    }

    res.redirect("/myOrders");
  } catch (error) {
    console.log(error.message);
  }
};

const loadWallet = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 5; // Default to 10 items per page

    // Calculate the number of items to skip
    const skip = (page - 1) * limit;
    let i = skip + 1;

    let wallet = await Wallet.findOne({ user_id: req.session.user_id });
    let walletHistory = await walletTransactionModel.find({ user: req.session.user_id }).sort({ _id: -1 }).skip(skip).limit(limit);
    const totalTransactions = await walletTransactionModel.countDocuments({
      user: req.session.user_id,
    });
    let user = await User.findById({ _id: req.session.user_id });
    // let reversedHistory = walletHistory.reverse()
    const totalPages = Math.ceil(totalTransactions / limit);

    if (req.query.empty) {
      res.render("user-wallet", {
        wallet,
        walletHistory: walletHistory,
        user,
        emessage: "Ammount not enough in wallet",
        pagination: {
          totalTransactions,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        i,
      });
    } else {
      res.render("user-wallet", {
        wallet,
        walletHistory: walletHistory,
        user,
        pagination: {
          totalTransactions,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        i,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addANewAddress = async (req, res) => {
  try {
    let user = await User.findById({ _id: req.session.user_id });

    let { country, state, district, pincode, city, street, houseNo } = req.body;

    if (
      country.trim() == "" ||
      state.trim() == "" ||
      district.trim() == "" ||
      pincode.trim() == "" ||
      city.trim() == "" ||
      street.trim() == "" ||
      houseNo.trim() == ""
    ) {
      res.render("user-addAddress", {
        emessage: "fields can't be empty",
        user,
        details: {
          country,
          state,
          district,
          pincode,
          city,
          street,
          houseNo,
        },
      });
    } else if (
      city.length < 6 ||
      city.length > 25 ||
      street.length < 6 ||
      street.length > 20 ||
      houseNo.length < 6 ||
      houseNo.length > 20 ||
      pincode.length !== 6
    ) {
      res.render("user-addAddress", {
        emessage: "please enter  a propper address",
        user,
        details: {
          country,
          state,
          district,
          pincode,
          city,
          street,
          houseNo,
        },
      });
    } else {
      const ADdress = new Address({
        user_id: req.session.user_id,
        country: country,
        state: state,
        district: district,
        pincode: pincode,
        city: city,
        street: street,
        houseNo: houseNo,
      });

      const aDDress = await ADdress.save();
      let address = await Address.find({ user_id: req.session.user_id });
      res.render("user-manageAdd", { message: `address added`, address, user });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const EditAddress = async (req, res) => {
  try {
    let user = await User.findById({ _id: req.session.user_id });

    const id = req.query.id;
    const user_id = req.session.user_id;
    const addressData = await Address.findById({ _id: id, user_id: user_id });

    if (addressData) {
      res.render("user-editAdd", { address: addressData, user });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const submitEditAddress = async (req, res) => {
  try {
    const { id } = req.query;
    let USer = await User.findById({ _id: req.session.user_id });

    const { country, state, district, pincode, city, street, houseNo } = req.body;
    const addressData = await Address.findById({ _id: id });

    if (
      country.trim() == "" ||
      state.trim() == "" ||
      district.trim() == "" ||
      pincode.trim() == "" ||
      city.trim() == "" ||
      street.trim() == "" ||
      houseNo.trim() == ""
    ) {
      res.render("user-editAdd", {
        emessage: "fields cant be empty",
        address: addressData,
        user: USer,
      });
    } else if (
      city.length < 6 ||
      city.length > 25 ||
      street.length < 6 ||
      street.length > 20 ||
      houseNo.length < 6 ||
      houseNo.length > 20 ||
      pincode.length !== 6
    ) {
      res.render("user-editAdd", {
        emessage: "enter proper address",
        address: addressData,
        user: USer,
      });
    } else {
      const update = await Address.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            country: country,
            state: state,
            district: district,
            pincode: pincode,
            city: city,
            street: street,
            houseNo: houseNo,
          },
        }
      );
      if (update) {
        if (req.query.from == "checkout") {
          let array = [];
          let user = await User.findById({ _id: req.session.user_id });
          let id = req.query.id;
          let addresS = await Address.findById({ _id: id });

          array.push(addresS.houseNo);
          array.push(addresS.street);
          array.push(addresS.city);
          array.push(addresS.district);
          array.push(addresS.state);
          array.push(addresS.country);
          array.push(addresS.pincode);

          let updateUserAddress = await User.findOneAndUpdate({ _id: user._id }, { $set: { address: array } });

          res.redirect("/cartCheckout");
        } else {
          res.redirect("/manageAddress");
        }
      } else {
        res.render("user-editAdd", { emessage: "Updation failed" });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteAddress = await Address.deleteOne({ _id: id });
    if (deleteAddress) {
      res.redirect("/manageAddress");
    } else {
      res.render("user-editAdd", { emessage: "failed to delete" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const selectAddresss = async (req, res) => {
  try {
    let array = [];
    let user = await User.findById({ _id: req.session.user_id });
    let id = req.query.id;
    let addresS = await Address.findById({ _id: id });
    let address = await Address.find({ user_id: req.session.user_id });

    array.push(addresS.houseNo);
    array.push(addresS.street);
    array.push(addresS.city);
    array.push(addresS.district);
    array.push(addresS.state);
    array.push(addresS.country);
    array.push(addresS.pincode);

    let updateUserAddress = await User.findOneAndUpdate({ _id: user._id }, { $set: { address: array } });
    let allAddSetToFalse = await Address.updateMany({}, { $set: { isSelected: false } });
    let addresSelected = await Address.findOneAndUpdate({ _id: id }, { $set: { isSelected: true } });

    if (req.query.from) {
      res.render("user-manageAdd", {
        address,
        user: updateUserAddress,
        message: "address selected",
      });
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadAboutUs = async (req, res) => {
  try {
    res.render("about-us");
  } catch (error) {
    console.log(error);
  }
};

const loadContactUs = async (req, res) => {
  try {
    res.render("contactUs");
  } catch (error) {
    console.log(error);
  }
};

const loadViewProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const whishlist = await Whishlist.find({
      product_id: id,
      user_id: req.session.user_id,
    });
    const productDetail = await Product.findById({ _id: id });
    const producTs = await Product.find({
      category: productDetail.category,
    }).limit(4);

    if (whishlist.length > 0) {
      res.render("viewProduct", {
        produCt: productDetail,
        products: producTs,
        thisIsWhish: true,
      });
    } else {
      res.render("viewProduct", {
        produCt: productDetail,
        products: producTs,
        thisIsWhish: false,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const ChangeImageInViewProduct = async (req, res) => {
  try {
    res.status(200).json({ message: "got it" });
  } catch (error) {
    console.log(error.message);
  }
};

const loadCart = async (req, res) => {
  try {
    let user = req.session.user_id;
    let ThisFrom = req.query.ThisFrom;
    let isError = req.query.qMessage;

    let cartProducts = await Cart.aggregate([
      { $match: { user_id: user } },
      { $unwind: "$products_id" },
      {
        $addFields: {
          products_id: { $toObjectId: "$products_id" }, 
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "products_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.category", // Assuming product schema has a category field
          foreignField: "category",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $match: {
          "categoryDetails.isListed": true,
        },
      },
      {
        $project: {
          productDetails: 1,
        },
      },
    ]);

    let array = cartProducts.map((item) => item.productDetails);

    if (array.length > 0) {
      let sumOfProducts = array.reduce((accumulator, element) => {
        let today = new Date();
        if (
          (element.product_OfferDetails && element.product_OfferDetails.offerStartDate <= today && element.product_OfferDetails.offerEndDate >= today) ||
          (element.category_OfferDetails && element.category_OfferDetails.offerStartDate <= today && element.category_OfferDetails.offerEndDate >= today)
        ) {
          if (element.category_OfferDetails) {
            console.log("category offer");

            const price = element.price;
            const discountPercentage = element.category_OfferDetails ? element.category_OfferDetails.discountPercentage : 0; // Example: 20%
            const discountAmount = (price * discountPercentage) / 100;
            const finalPrice = price - discountAmount;

            accumulator += Math.floor(finalPrice);
            return accumulator;
          } else {
            console.log("product offer");

            const price = element.price;
            const discountPercentage = element.product_OfferDetails ? element.product_OfferDetails.discountPercentage : 0; // Example: 20%
            const discountAmount = (price * discountPercentage) / 100;
            const finalPrice = price - discountAmount;

            accumulator += Math.floor(finalPrice);
            return accumulator;
          }
        } else {
          accumulator += element.price;
          return accumulator;
        }
      }, 0);

      if (isError) {
        res.render("cart", {
          products: array,
          sum: sumOfProducts,
          emessage: req.query.qMessage,
        });
      } else {
        if (ThisFrom) {
          res.render("cart", {
            products: array,
            sum: sumOfProducts,
            emessage: "select an address first",
          });
        } else {
          if (req.query.quantityOf1) {
            res.render("cart", {
              products: array,
              sum: sumOfProducts,
              emessage: req.query.qMessage,
              theK: req.query,
            });
          } else {
            res.render("cart", {
              products: array,
              sum: sumOfProducts,
              emessage: req.query.qMessage,
            });
          }
        }
      }
    }
    res.render("cart", { products: array, sum: 0, emessage: req.query.qMessage });
  } catch (error) {
    console.log(error.message);
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    let coupons = await Coupon.find();

    let array = [];
    let user = req.session.user_id;
    let productQuantitys = [];
    let bodyValues = Object.values(req.body);
    productQuantitys.push(...bodyValues);

    let findcartProducts = await Cart.find({ user_id: user });

    if (findcartProducts.length > 0) {
      for (let i = 0; i < findcartProducts.length; i++) {
        array.push(await Product.findOne({ _id: findcartProducts[i].products_id }));
      }
    }

    let today = new Date();
    let sumOfProducts = array.reduce((accumulator, element) => {
      if (element.category_OfferDetails && element.category_OfferDetails.offerStartDate <= today && element.category_OfferDetails.offerEndDate >= today) {
        console.log("category offer");

        const price = element.price;
        const discountPercentage = element.category_OfferDetails ? element.category_OfferDetails.discountPercentage : 0; // Example: 20%
        const discountAmount = (price * discountPercentage) / 100;
        const finalPrice = price - discountAmount;

        accumulator += Math.floor(finalPrice);
        return accumulator;
      } else if (element.product_OfferDetails && element.product_OfferDetails.offerStartDate <= today && element.product_OfferDetails.offerEndDate >= today) {
        console.log("product offer");

        const price = element.price;
        const discountPercentage = element.product_OfferDetails ? element.product_OfferDetails.discountPercentage : 0; // Example: 20%
        const discountAmount = (price * discountPercentage) / 100;
        const finalPrice = price - discountAmount;

        accumulator += Math.floor(finalPrice);
        return accumulator;
      } else {
        accumulator += element.price;
        return accumulator;
      }
    }, 0);

    let Qchecker = 0;
    let positionForQcheck = 0;
    for (let i = 0; i < productQuantitys.length; i++) {
      if (productQuantitys[i] > 1) {
        if (array[i].quantity - productQuantitys[i] < 0) {
          productQuantitys[i] = productQuantitys[i] - 1;

          if (
            array[i].category_OfferDetails &&
            array[i].category_OfferDetails.offerStartDate <= today &&
            array[i].category_OfferDetails.offerEndDate >= today
          ) {
            const price = array[i].price;
            const discountPercentage = array[i].category_OfferDetails ? array[i].category_OfferDetails.discountPercentage : 0; // Example: 20%
            const discountAmount = (price * discountPercentage) / 100;
            const finalPrice = price - discountAmount;

            sumOfProducts = sumOfProducts - Math.floor(finalPrice) + Math.floor(finalPrice) * productQuantitys[i];
          } else if (
            array[i].product_OfferDetails &&
            array[i].product_OfferDetails.offerStartDate <= today &&
            array[i].product_OfferDetails.offerEndDate >= today
          ) {
            const price = array[i].price;
            const discountPercentage = array[i].product_OfferDetails ? array[i].product_OfferDetails.discountPercentage : 0; // Example: 20%
            const discountAmount = (price * discountPercentage) / 100;
            const finalPrice = price - discountAmount;

            sumOfProducts = sumOfProducts - Math.floor(finalPrice) + Math.floor(finalPrice) * productQuantitys[i];
          } else {
            sumOfProducts = sumOfProducts - array[i].price + array[i].price * productQuantitys[i];
          }

          Qchecker++;
          positionForQcheck = i;
        } else {
          if (
            array[i].category_OfferDetails &&
            array[i].category_OfferDetails.offerStartDate <= today &&
            array[i].category_OfferDetails.offerEndDate >= today
          ) {
            const price = array[i].price;
            const discountPercentage = array[i].category_OfferDetails ? array[i].category_OfferDetails.discountPercentage : 0; // Example: 20%
            const discountAmount = (price * discountPercentage) / 100;
            const finalPrice = price - discountAmount;

            sumOfProducts = sumOfProducts - Math.floor(finalPrice) + Math.floor(finalPrice) * productQuantitys[i];
          } else if (
            array[i].product_OfferDetails &&
            array[i].product_OfferDetails.offerStartDate <= today &&
            array[i].product_OfferDetails.offerEndDate >= today
          ) {
            const price = array[i].price;
            const discountPercentage = array[i].product_OfferDetails ? array[i].product_OfferDetails.discountPercentage : 0; // Example: 20%
            const discountAmount = (price * discountPercentage) / 100;
            const finalPrice = price - discountAmount;

            sumOfProducts = sumOfProducts - Math.floor(finalPrice) + Math.floor(finalPrice) * productQuantitys[i];
          } else {
            sumOfProducts = sumOfProducts - array[i].price + array[i].price * productQuantitys[i];
          }
        }
      }
    }

    if (Qchecker > 0) {
      // let slisedName = array[positionForQcheck].name.slice(0,20)
      res.render("cart", {
        products: array,
        sum: sumOfProducts,
        coupons,
        emessage: ` Quantity is not have that much`,
        productQuantitys,
      });
    } else {
      res.render("cart", {
        products: array,
        sum: sumOfProducts,
        coupons,
        emessage: req.query.qMessage,
        productQuantitys,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updatePriceOnCart = async (req, res) => {
  try {
    res.redirect(`/cart/?quantity=${req.body}`);
  } catch (error) {
    console.log(error.message);
  }
};

const LoadWhishlist = async (req, res) => {
  try {
    let array = [];
    let user = req.session.user_id;

    let findwhishProducts = await Whishlist.find({ user_id: user });
    console.log("yeaah got it got it");
    if (findwhishProducts.length > 0) {
      for (let i = 0; i < findwhishProducts.length; i++) {
        array.push(await Product.findOne({ _id: findwhishProducts[i].product_id }));
      }

      // let sumOfProducts = array.reduce((accumulator, element) => {
      //     accumulator += element.price;
      //     return accumulator;
      // }, 0);

      res.render("whishlist", { whishlist: array, wishes: findwhishProducts });
    } else {
      res.render("whishlist", { whishlist: array, wishes: findwhishProducts });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addToWhishlist = async (req, res) => {
  try {
    let whereFrom = req.query.from;
    // Whishlist date settings here
    const currentDate = new Date();

    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = currentDate.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;

    // Whishlist date settings ends here

    let product_id = req.query.id;
    let user_id = req.session.user_id;

    let ifAlreadyAdded = await Whishlist.findOne({
      user_id: user_id,
      product_id: product_id,
    });
    if (ifAlreadyAdded) {
      res.redirect("/");
    } else {
      const whishlist = new Whishlist({
        user_id: user_id,
        product_id: product_id,
        added_on: formattedDate,
        is_wish: "true",
      });

      const addedTOWhishlist = await whishlist.save();
      if (addedTOWhishlist) {
        if (whereFrom == "view") {
          res.redirect(`/viewProduct/?id=${product_id}`);
        } else {
          res.redirect("/");
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addToCart = async (req, res) => {
  try {
    let isWish = req.query.from;
    let id = req.query.id;
    let iid = req.session.user_id;

    if (isWish) {
      let deleteWhishOne = await Whishlist.deleteOne({
        user_id: iid,
        product_id: id,
      });
    }

    let ifAlreadyAdded = await Cart.findOne({ user_id: iid, products_id: id });
    if (ifAlreadyAdded) {
      res.redirect("/cart");
    } else {
      const cart = new Cart({
        user_id: iid,
        products_id: id,
      });

      const addedTOCart = await cart.save();
      if (addedTOCart) {
        res.redirect("/");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const RemovePdtFrmCart = async (req, res) => {
  try {
    const { id } = req.params;
    const usr = req.session.user_id;
    const removeFromCart = await Cart.deleteOne({
      products_id: id,
      user_id: usr,
    });
    if (removeFromCart) {
      res.redirect("/cart");
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const couponAdding = async (req, res) => {
  try {
    if (req.query.code.trim() == "") {
      res.redirect(`/cartCheckout/?couponAdded=wrong&quantity=${req.query.quantity}`);
    } else {
      let coupons = await Coupon.findOne({
        code: req.query.code.toUpperCase(),
      });

      if (coupons) {
        let today = new Date();

        if (coupons.expiry < today) {
          res.redirect(`/cartCheckout/?couponAdded=expired&quantity=${req.query.quantity}`);
        } else if (coupons.amount > req.query.totelAmmount) {
          res.redirect(`/cartCheckout/?couponAdded=minimumAmt&quantity=${req.query.quantity}&amount=${coupons.amount}`);
        } else {
          res.redirect(`/cartCheckout/?couponAdded=${coupons.code}&quantity=${req.query.quantity}`);
        }
      } else {
        res.redirect(`/cartCheckout/?couponAdded=wrong&quantity=${req.query.quantity}`);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const RemovePdtFrmWhishlist = async (req, res) => {
  try {
    const id = req.params.id;
    const usr = req.session.user_id;
    const removeFromWish = await Whishlist.deleteOne({
      product_id: id,
      user_id: usr,
    });
    if (removeFromWish) {
      if (req.params.from == "home") {
        const product = await Product.findOneAndUpdate({ _id: id }, { $set: { is_wish: "false" } });

        res.redirect("/");
      } else if (req.params.from == "view") {
        const product = await Product.findOneAndUpdate({ _id: id }, { $set: { is_wish: "false" } });

        res.redirect("/viewProduct/?id=" + id);
      } else {
        const product = await Product.findOneAndUpdate({ _id: id }, { $set: { is_wish: "false" } });

        res.redirect("/whishlist");
      }
    } else {
      res.redirect("/whishlist");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const cartCheckQSetup = async (req, res) => {
  try {
    let quantity = [];
    let lengthOfReqBody = Object.keys(req.body);
    for (let i = 0; i < lengthOfReqBody.length; i++) {
      let nameStr = "quantityOf" + (i + 1);

      if (req.body.hasOwnProperty(nameStr)) {
        // Check if the property exists in req.body
        quantity.push(req.body[nameStr]); // Push the value of the property to the array
      }
    }

    res.redirect(`/cartCheckout/?quantity=${quantity}`);
  } catch (error) {
    console.log(error.message);
  }
};

const loadCartCheckout = async (req, res) => {
  try {
    let array = [];
    let user = req.session.user_id;
    let quantity = req.query.quantity.split(",");

    let findcartProducts = await Cart.find({ user_id: user });
    let USEr = await User.findById({ _id: user });
    let address = await Address.find({ user_id: user });

    if (USEr.address.length !== 0) {
      let resAddress = address.filter((element) => {
        if (
          element.houseNo == USEr.address[0] &&
          element.street == USEr.address[1] &&
          element.city == USEr.address[2] &&
          element.district == USEr.address[3] &&
          element.state == USEr.address[4] &&
          element.country == USEr.address[5] &&
          element.pincode == USEr.address[6]
        ) {
          return element;
        }
      });

      if (resAddress.length == 0) {
        res.redirect(`/cart/?qMessage=Please select an address`);
      } else {
        if (findcartProducts.length > 0) {
          for (let i = 0; i < findcartProducts.length; i++) {
            array.push(await Product.findOne({ _id: findcartProducts[i].products_id }));
          }

          let today = new Date();

          let sumOfProducts = array.reduce((accumulator, element) => {
            if (element.category_OfferDetails && element.category_OfferDetails.offerStartDate <= today && element.category_OfferDetails.offerEndDate >= today) {
              const price = element.price;
              const discountPercentage = element.category_OfferDetails ? element.category_OfferDetails.discountPercentage : 0; // Example: 20%
              const discountAmount = (price * discountPercentage) / 100;
              const finalPrice = price - discountAmount;

              accumulator += Math.floor(finalPrice);
              return accumulator;
            } else if (
              element.product_OfferDetails &&
              element.product_OfferDetails.offerStartDate <= today &&
              element.product_OfferDetails.offerEndDate >= today
            ) {
              const price = element.price;
              const discountPercentage = element.product_OfferDetails ? element.product_OfferDetails.discountPercentage : 0; // Example: 20%
              const discountAmount = (price * discountPercentage) / 100;
              const finalPrice = price - discountAmount;

              accumulator += Math.floor(finalPrice);
              return accumulator;
            } else {
              accumulator += element.price;
              return accumulator;
            }
          }, 0);

          if (req.query.recome) {
            if (req.query.howMuch) {
              res.render("cart-checkout", {
                emessage: req.query.howMuch + " product is out of stock",
                products: array,
                sum: sumOfProducts,
                USEr,
                resAddress,
              });
            } else {
              res.render("cart-checkout", {
                emessage: "product is out of stock",
                products: array,
                sum: sumOfProducts,
                USEr,
                resAddress,
              });
            }
          } else {
            //
            let count = 0;
            let k;
            let Qchecker = 0;
            for (let i = 0; i < array.length; i++) {
              let integerQty = parseInt(quantity[i]);
              if (quantity[i] !== "1") {
                console.log("haa");

                if (array[i].category_OfferDetails) {
                  const price = array[i].price;
                  const discountPercentage = array[i].category_OfferDetails ? array[i].category_OfferDetails.discountPercentage : 0; // Example: 20%
                  const discountAmount = (price * discountPercentage) / 100;
                  const finalPrice = price - discountAmount;

                  sumOfProducts = sumOfProducts - Math.floor(finalPrice);

                  sumOfProducts += Math.floor(finalPrice) * integerQty;
                } else if (array[i].product_OfferDetails) {
                  const price = array[i].price;
                  const discountPercentage = array[i].product_OfferDetails ? array[i].product_OfferDetails.discountPercentage : 0; // Example: 20%
                  const discountAmount = (price * discountPercentage) / 100;
                  const finalPrice = price - discountAmount;

                  sumOfProducts = sumOfProducts - Math.floor(finalPrice);

                  sumOfProducts += Math.floor(finalPrice) * integerQty;
                } else {
                  sumOfProducts = sumOfProducts - array[i].price;

                  sumOfProducts += array[i].price * integerQty;
                }
              }
              let calc = array[i].quantity - integerQty;
              if (calc < 0) {
                count++;
                k = i;
              }

              if (array[i].quantity == 0) {
                Qchecker++;
              }
            }
            //

            if (Qchecker > 0) {
              res.redirect(`/cart/?qMessage=  Remove Unavailable Produt First `);
            } else {
              if (count == 0) {
                if (req.query.couponAdded) {
                  if (req.query.couponAdded == "expired") {
                    res.render("cart-checkout", {
                      products: array,
                      sum: sumOfProducts,
                      USEr,
                      resAddress,
                      quantity,
                      couponEmessage: "The entered coupon is expired",
                    });
                  } else if (req.query.couponAdded == "minimumAmt") {
                    res.render("cart-checkout", {
                      products: array,
                      sum: sumOfProducts,
                      USEr,
                      resAddress,
                      quantity,
                      couponEmessage: "The entered coupon only for above " + req.query.amount + " purchase.",
                    });
                  } else if (req.query.couponAdded !== "wrong") {
                    let couponCode = req.query.couponAdded;
                    let coupon = await Coupon.findOne({ code: couponCode });
                    res.render("cart-checkout", {
                      products: array,
                      sum: sumOfProducts,
                      USEr,
                      resAddress,
                      quantity,
                      coupon,
                    });
                  } else {
                    res.render("cart-checkout", {
                      products: array,
                      sum: sumOfProducts,
                      USEr,
                      resAddress,
                      quantity,
                      couponEmessage: "The entered coupon is wrong",
                    });
                  }
                } else {
                  res.render("cart-checkout", {
                    products: array,
                    sum: sumOfProducts,
                    USEr,
                    resAddress,
                    quantity,
                  });
                }
              } else {
                if (k == 0) {
                  res.redirect(`cart/?qMessage=  First product's quantity not available that much `);
                } else if (k == 1) {
                  res.redirect(`cart/?qMessage=  Second product's Quantity not available that much `);
                } else if (k == 2) {
                  res.redirect(`cart/?qMessage= Third product's Quantity not available that much `);
                } else {
                  res.redirect(`cart/?qMessage=  ${k + 1}th product's quantity not available that much `);
                }
              }
            }
          }
        } else {
          res.render("cart-checkout", {
            emessage: "product is out of stock",
            products: array,
            sum: sumOfProducts,
          });
        }
      }
    } else {
      res.redirect("/cart?ThisFrom=nonAd");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const placeOrder = async (req, res) => {
  try {
    console.log("the page");
    // ordered date settings here
    const currentDate = new Date();

    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = currentDate.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;

    let ids = typeof req.body.product__Id;

    console.log("totel : ", req.body.totelAmmount);

    if (typeof req.body.product__Id == "string") {
      let user_id = req.session.user_id;
      let payment_method = req.body.method;
      let product_id = req.body.product__Id;
      let findProdcut = await Product.findById({ _id: product_id });
      let quantity = parseInt(req.body.Quantity[0]);
      let deliveryCarge = 50;
      let totelAmmount = parseFloat(req.body.sumofAmmount.replace(/[^0-9.-]+/g, ""));

      let date = formattedDate;

      if (findProdcut.quantity < 1) {
        res.redirect("/cartCheckout/?recome=true");
      } else {
        let order;

        if (req.body.coupon) {
          let coupon = await Coupon.findOne({ code: req.body.coupon });

          order = new Order({
            product: product_id,
            paymentMethod: payment_method,
            quantity: quantity,
            deliveryChaerge: deliveryCarge,
            totelAmmount: totelAmmount,
            user: user_id,
            coupon_applied: coupon.code,
            coupon_Discount: coupon.discount,
            date: date,
            status: "Order Placed",
          });
        } else {
          order = new Order({
            product: product_id,
            paymentMethod: payment_method,
            quantity: quantity,
            deliveryChaerge: deliveryCarge,
            totelAmmount: totelAmmount,
            user: user_id,
            date: date,
            status: "Order Placed",
          });
        }

        if (findProdcut.product_OfferDetails) {
          order.product_OfferDetails = findProdcut.product_OfferDetails;
        } else if (findProdcut.category_OfferDetails) {
          order.category_OfferDetails = findProdcut.category_OfferDetails;
        }

        if (req.body.method == "Wallet") {
          let wallet = await Wallet.findOne({ user_id: req.session.user_id });
          let money = wallet.Money - (totelAmmount + 50 + totelAmmount / 10);
          if (money < 0) {
            res.redirect("/wallet/?empty=true");
          } else {
            let MoneyCHangeFromWALLET = await Wallet.findOneAndUpdate({ user_id: req.session.user_id }, { $inc: { Money: -totelAmmount } });
            const orderSaved = await order.save();

            let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -parseInt(req.body.Quantity) } });

            const removeFromCart = await Cart.deleteOne({
              products_id: product_id,
              user_id: user_id,
            });

            if (orderSaved) {
              const newTransaction = new walletTransactionModel({
                user: req.session.user_id,
                product_name: findProdcut.name,
                money: totelAmmount,
                quantity: quantity,
                type: true,
                paymentMethod: payment_method,
              });

              const saveTransaction = await newTransaction.save();

              let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -parseInt(req.body.Quantity) } });

              const removeFromCart = await Cart.deleteOne({
                products_id: product_id,
                user_id: user_id,
              });

              res.redirect("/loadOrderSuccess");
            }
          }
        } else {
          if (totelAmmount > 1000) {
            res.redirect("/cart/?qMessage=Can`t buy products greater than 1000rs using `Cash On Delivery`");
          } else {
            const orderSaved = await order.save();

            if (orderSaved) {
              let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -parseInt(req.body.Quantity) } });

              const removeFromCart = await Cart.deleteOne({
                products_id: product_id,
                user_id: user_id,
              });
              res.redirect("/loadOrderSuccess");
            }
          }
        }
      }
    } else {
      let count = 0;

      for (let i = 0; i < req.body.product__Id.length; i++) {
        let product_id = req.body.product__Id[i];

        let findProdcut = await Product.findById({ _id: product_id });

        if (findProdcut.quantity < 1) {
          count++;
        }
      }

      if (count > 0) {
        res.redirect(`/cart/?qMessage=product unavailable`);
      } else {
        // Your object
        const obj = { quantity: "1,2" };

        // Extract the quantity string
        const quantityString = req.body.Quantity;

        // Split the string by commas to get an array of strings
        const quantityArray = quantityString.split(",");

        // Convert the array of strings to an array of numbers
        const quantityNumbers = quantityArray.map(Number);

        // Output the resulting array
        let wallet = await Wallet.findOne({ user_id: req.session.user_id });
        let thenWalletMoney = wallet.Money;

        for (let k = 0; k < req.body.product__Id.length; k++) {
          // let money = wallet.Money - (totelAmmount + 50 + totelAmmount/10 )

          let findProd = await Product.findById({
            _id: req.body.product__Id[k],
          });
          thenWalletMoney = thenWalletMoney - (findProd.price * quantityNumbers[k] + findProd.price / 10 + 50);
        }

        for (let i = 0; i < req.body.product__Id.length; i++) {
          let user_id = req.session.user_id;
          let payment_method = req.body.method;
          let product_id = req.body.product__Id[i];

          let findProdcut = await Product.findById({ _id: product_id });

          let quantity = quantityNumbers[i];
          let deliveryCarge = 50;
          let totelAmmount = findProdcut.price * quantity + 50;
          let date = formattedDate;

          let order;

          if (req.body.coupon) {
            let isCouponApplied = await Coupon.findOne({
              code: req.body.coupon,
            });
            totelAmmount = totelAmmount - isCouponApplied.discount / req.body.product__Id.length;

            order = new Order({
              product: product_id,
              paymentMethod: payment_method,
              quantity: quantity,
              deliveryChaerge: deliveryCarge,
              totelAmmount: Math.floor(totelAmmount + (findProdcut.price * quantity) / 10),
              user: user_id,
              coupon_applied: isCouponApplied.code,
              coupon_Discount: isCouponApplied.discount,
              is_multi: req.body.product__Id.length,
              date: date,
              status: "Order Placed",
            });
          } else {
            order = new Order({
              product: product_id,
              paymentMethod: payment_method,
              quantity: quantity,
              deliveryChaerge: deliveryCarge,
              totelAmmount: Math.floor(totelAmmount + (findProdcut.price * quantity) / 10),
              user: user_id,
              is_multi: req.body.product__Id.length,
              date: date,
              status: "Order Placed",
            });
          }

          console.log("totel aammmmooounttt : ", totelAmmount);

          //
          if (req.body.method == "Wallet") {
            if (thenWalletMoney < 0) {
              res.redirect("/wallet/?empty=true");
            } else {
              let MoneyCHangeFromWALLET = await Wallet.findOneAndUpdate(
                { user_id: req.session.user_id },
                {
                  $inc: {
                    Money: -Math.floor(totelAmmount + (findProdcut.price * quantity) / 10),
                  },
                }
              );
              const orderSaved = await order.save();

              if (orderSaved) {
                const newTransaction = new walletTransactionModel({
                  user: req.session.user_id,
                  product_name: findProdcut.name,
                  money: Math.floor(totelAmmount + (findProdcut.price * quantity) / 10),
                  quantity: quantity,
                  type: true,
                  paymentMethod: payment_method,
                });

                const saveTransaction = await newTransaction.save();

                let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -quantityNumbers[i] } });

                const removeFromCart = await Cart.deleteOne({
                  products_id: product_id,
                  user_id: user_id,
                });
              }
            }
          } else {
            let parsedSum = parseFloat(req.body.sumofAmmount.replace(/[^0-9.-]+/g, ""));

            if (parsedSum > 1000) {
              res.redirect("/cart/?qMessage=Can`t buy products greater than 1000rs using `Cash On Delivery`");
            } else {
              const orderSaved = await order.save();

              if (orderSaved) {
                let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -quantityNumbers[i] } });

                const removeFromCart = await Cart.deleteOne({
                  products_id: product_id,
                  user_id: user_id,
                });
              }
            }
          }
          //
        }

        res.redirect("/loadOrderSuccess");
      }
    }
  } catch (error) {
    console.log(error.message);
    console.log("huhuhuhuhuhuhuhuhuh");
    res.status(500).send("internal error");
  }
};

const loadOrderSuccess = async (req, res) => {
  try {
    res.render("orderSuccess");
  } catch (error) {
    console.log(error.message);
  }
};

const onlinePaymentController = async (req, res) => {
  try {
    let isFailed = req.query.failed;

    // ordered date settings here
    const currentDate = new Date();

    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = currentDate.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;

    if (typeof req.body.product__Id == "string") {
      let user_id = req.session.user_id;
      let payment_method = req.body.method;
      let product_id = req.body.product__Id;
      let findProdcut = await Product.findById({ _id: product_id });
      let quantity = parseInt(req.body.Quantity[0]);
      let deliveryCarge = 50;

      // Remove the currency symbol and any non-numeric characters
      let totelAmmount = parseFloat(req.body.sumofAmmount.replace(/[^0-9.-]+/g, ""));
      let date = formattedDate;

      if (findProdcut.quantity < 1) {
        res.redirect("/cartCheckout/?recome=true");
      } else {
        let order;

        if (req.body.coupon) {
          let coupon = await Coupon.findOne({ code: req.body.coupon });

          if (isFailed) {
            order = new Order({
              product: product_id,
              paymentMethod: payment_method,
              quantity: quantity,
              deliveryChaerge: deliveryCarge,
              totelAmmount: totelAmmount,
              coupon_applied: coupon.code,
              coupon_Discount: coupon.discount,
              user: user_id,
              date: date,
              status: "Pending",
            });
          } else {
            order = new Order({
              product: product_id,
              paymentMethod: payment_method,
              quantity: quantity,
              deliveryChaerge: deliveryCarge,
              totelAmmount: totelAmmount,
              coupon_applied: coupon.code,
              coupon_Discount: coupon.discount,
              user: user_id,
              date: date,
              status: "Order Placed",
            });
          }
        } else {
          if (isFailed) {
            order = new Order({
              product: product_id,
              paymentMethod: payment_method,
              quantity: quantity,
              deliveryChaerge: deliveryCarge,
              totelAmmount: totelAmmount,
              user: user_id,
              date: date,
              status: "Pending",
            });
          } else {
            order = new Order({
              product: product_id,
              paymentMethod: payment_method,
              quantity: quantity,
              deliveryChaerge: deliveryCarge,
              totelAmmount: totelAmmount,
              user: user_id,
              date: date,
              status: "Order Placed",
            });
          }
        }

        const orderSaved = await order.save();

        if (orderSaved) {
          let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -parseInt(req.body.Quantity) } });

          const removeFromCart = await Cart.deleteOne({
            products_id: product_id,
            user_id: user_id,
          });

          if (isFailed) {
            res.redirect("/myOrders");
          } else {
            res.redirect("/loadOrderSuccess");
          }
        }
      }
    } else {
      let count = 0;

      for (let i = 0; i < req.body.product__Id.length; i++) {
        let product_id = req.body.product__Id[i];

        let findProdcut = await Product.findById({ _id: product_id });

        if (findProdcut.quantity < 1) {
          count++;
        }
      }

      if (count > 0) {
        res.redirect("/cartCheckout/?recome=true&howMuch=" + count);
      } else {
        // Your object
        const obj = { quantity: "1,2" };

        // Extract the quantity string
        const quantityString = req.body.Quantity;

        // Split the string by commas to get an array of strings
        const quantityArray = quantityString.split(",");

        // Convert the array of strings to an array of numbers
        const quantityNumbers = quantityArray.map(Number);

        // Output the resulting array

        for (let i = 0; i < req.body.product__Id.length; i++) {
          let user_id = req.session.user_id;
          let payment_method = req.body.method;
          let product_id = req.body.product__Id[i];

          let findProdcut = await Product.findById({ _id: product_id });

          let quantity = quantityNumbers[i];
          let deliveryCarge = 50;
          let totelAmmount = findProdcut.price * quantity;
          let date = formattedDate;

          let order;

          if (req.body.coupon) {
            let coupon = await Coupon.findOne({ code: req.body.coupon });

            let sumAmmount = totelAmmount - coupon.discount / req.body.product__Id.length;

            if (isFailed) {
              order = new Order({
                product: product_id,
                paymentMethod: payment_method,
                quantity: quantity,
                deliveryChaerge: deliveryCarge,
                totelAmmount: Math.floor(sumAmmount + totelAmmount / 10 + 50),
                coupon_applied: req.body.coupon,
                is_multi: req.body.product__Id.length,
                user: user_id,
                date: date,
                status: "Pending",
              });
            } else {
              order = new Order({
                product: product_id,
                paymentMethod: payment_method,
                quantity: quantity,
                deliveryChaerge: deliveryCarge,
                totelAmmount: Math.floor(sumAmmount + totelAmmount / 10 + 50),
                coupon_applied: req.body.coupon,
                is_multi: req.body.product__Id.length,
                user: user_id,
                date: date,
                status: "Order Placed",
              });
            }
          } else {
            if (isFailed) {
              order = new Order({
                product: product_id,
                paymentMethod: payment_method,
                quantity: quantity,
                deliveryChaerge: deliveryCarge,
                totelAmmount: totelAmmount + totelAmmount / 10 + 50,
                is_multi: req.body.product__Id.length,
                user: user_id,
                date: date,
                status: "Pending",
              });
            } else {
              order = new Order({
                product: product_id,
                paymentMethod: payment_method,
                quantity: quantity,
                deliveryChaerge: deliveryCarge,
                totelAmmount: totelAmmount + totelAmmount / 10 + 50,
                is_multi: req.body.product__Id.length,
                user: user_id,
                date: date,
                status: "Order Placed",
              });
            }
          }

          const orderSaved = await order.save();

          if (orderSaved) {
            let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -quantityNumbers[i] } });

            const removeFromCart = await Cart.deleteOne({
              products_id: product_id,
              user_id: user_id,
            });
          }
        }

        if (isFailed) {
          res.redirect("/myOrders");
        } else {
          res.redirect("/loadOrderSuccess");
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const downloadOrderInvoice = async (req, res) => {
  try {
    // throw new Error('This is a simulated error for testing purposes.');

    const easyinvoice = require("easyinvoice");
    const fs = require("fs");

    let order = await Order.findById({ _id: req.query.orderId });
    let product = await Product.findById({ _id: order.product });
    let user = await User.findById({ _id: req.session.user_id });

    // for delivery date
    let dateParts = order.date.split("/");
    let dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);

    // Calculate the date 7 days later
    let date7DaysLater = new Date();
    date7DaysLater.setDate(dateObject.getDate() + 7);

    // Define delivery charge
    const deliveryCharge = 50;

    // Calculate total including delivery charge
    const itemTotal = order.quantity * product.price;
    const totalAmount = itemTotal + deliveryCharge + (order.quantity * product.price) / 10;

    // Define your invoice data
    let data = {
      translate: {
        invoice: "Order Invoice",
        taxNotation: "GST",
        number: "Id",
        date: "Order",
        dueDate: "Delivery",
        subtotal: "Total",
        products: "Product",
        quantity: "Quantity",
        price: "Unit Price",
        productTotal: "Total",
        total: `Amount (including GST and delivery charge)`,
      },

      settings: {
        documentTitle: "Order Invoice",
        currency: "INR",
        marginTop: 25,
        marginRight: 25,
        marginLeft: 25,
        marginBottom: 25,
      },
      images: {
        // The logo on top of your invoice
        logo: "https://dashfootwares.shop/logo/DashFootwares.png",
      },
      sender: {
        company: "DASH FOOTWARES",
        address: "Malappuram, Kerala",
        zip: "675636",
        city: "Malappuram",
        country: "India",
      },
      client: {
        company: `${user.name}`,
        address: `${user.address}`,
      },
      information: {
        number: `${order._id}`,
        date: `${dateObject.toDateString()}`,
        dueDate: `${date7DaysLater.toDateString()}`,
      },
      products: [
        {
          quantity: `${order.quantity}`,
          description: `${product.name}`,
          taxRate: 10,
          price: `${product.price}`,
          total: `${itemTotal}`,
        },
        {
          quantity: 1, // Set quantity to 1
          description: "Delivery Charge",
          price: `${deliveryCharge}`,
          total: `${deliveryCharge}`,
        },
      ],
      bottomNotice: `Thank you for choosing DASH FOOTWARES. Delivery charge: ₹${deliveryCharge}.`,
      total: `₹${totalAmount}`,
    };

    if (order.coupon_applied !== "no") {
      if (order.is_multi > 1) {
        data.products.push({
          quantity: 1, // Set quantity to 1
          description: `${order.coupon_applied}`,
          price: `${-order.coupon_Discount / order.is_multi}`,
          total: `${-order.coupon_Discount / order.is_multi}`,
        });
      } else {
        data.products.push({
          quantity: 1, // Set quantity to 1
          description: `${order.coupon_applied}`,
          price: `${-order.coupon_Discount}`,
          total: `${-order.coupon_Discount}`,
        });
      }
    }

    if (order.product_OfferDetails) {
      const price = product.price; // Example: 1000
      const discountPercentage = order.product_OfferDetails ? order.product_OfferDetails.discountPercentage : 0; // Example: 20%
      const discountAmount = (price * discountPercentage) / 100;

      data.products.push({
        quantity: 1, // Set quantity to 1
        description: `${order.product_OfferDetails.offerName}`,
        price: `${-discountAmount}`,
        total: `${-discountAmount}`,
      });
    } else if (order.category_OfferDetails) {
      const price = product.price; // Example: 1000
      const discountPercentage = order.category_OfferDetails ? order.category_OfferDetails.discountPercentage : 0; // Example: 20%
      const discountAmount = (price * discountPercentage) / 100;

      data.products.push({
        quantity: 1, // Set quantity to 1
        description: `${order.category_OfferDetails.offerName}`,
        price: `${-discountAmount}`,
        total: `${-discountAmount}`,
      });
    }

    try {
      // Create the invoice
      const result = await easyinvoice.createInvoice(data);

      // Save the invoice to a file
      fs.writeFileSync("invoice.pdf", result.pdf, "base64");

      // Send the invoice as a download
      res.download("invoice.pdf", "invoice.pdf", (err) => {
        if (err) {
          console.log(err);
        }

        // Optionally, delete the file after sending
        fs.unlinkSync("invoice.pdf");
      });
    } catch (error) {
      let user = await User.findById({ _id: req.session.user_id });
      let order = await Order.findById({ _id: req.query.orderId });

      res.status(500).render("user-orderDetails", {
        errorMessage: "An unexpected error occurred. Please try again later.",
        user,
        order,
      });
    }
  } catch (error) {
    let user = await User.findById({ _id: req.session.user_id });
    let order = await Order.findById({ _id: req.query.orderId });

    res.status(500).render("user-orderDetails", {
      errorMessage: "An unexpected error occurred. Please try again later.",
      user,
      order,
    });
  }
};

const isNotCOD = async (req, res, next) => {
  try {
    function cleanCurrencyString(str) {
      let cleanedStr = str.slice(2); // Remove '₹ ' from the start
      cleanedStr = cleanedStr.slice(0, -3); // Remove '.00' from the end
      return Number(cleanedStr);
    }

    let number = cleanCurrencyString(req.body.sumofAmmount);

    let ammouunt = number;

    if (req.body.method !== "Cash On Delivery" && req.body.method !== "Wallet") {
      let product_id = req.body.product__Id;
      let product = await Product.findOne({ _id: product_id });
      const options = {
        amount: ammouunt * 100, // Convert amount to paise
        currency: "INR",
        receipt: "receipt#" + Math.random().toString(36).substring(7), // Generate a random receipt number
      };

      // razorpayInstance.orders.create(options, (error, order) => {
      //   if (!error) {
      //     res.status(200).json({
      //       success: true,
      //       msg: "Order Created",
      //       order_id: order.id,
      //       amount: ammouunt * 100,
      //       key_id: RAZORPAY_KEY_ID,
      //       product_name: product.name,
      //       description: product.description,
      //       contact: "208320932",
      //       name: "aflu",
      //       email: "aflutech2@gmail.com",
      //     });
      //   } else {
      //     console.error("Error creating order:", error);
      //     res
      //       .status(400)
      //       .send({ success: false, msg: "Something went wrong!" });
      //   }
      // });
    } else {
      next();
    }
  } catch (error) {
    console.error("Error in isNotCOD:", error.message);
    res.status(500).send({ success: false, msg: "Internal server errorr" });
  }
};

const confirmRetryOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    // Fetch order details from your database
    const order = await Order.findById({ _id: req.body.id });
    const product = await Product.findById({ _id: order.product });
    const user = await User.findById({ _id: req.session.user_id });

    const options = {
      amount: order.totelAmmount * 100, // Amount in paise
      currency: "INR",
      receipt: "receipt#" + Math.random().toString(36).substring(7),
    };

    // razorpayInstance.orders.create(options, (error, order) => {
    //   if (!error) {
    //     res.status(200).json({
    //       success: true,
    //       msg: "Order Created",
    //       order_id: order.id,
    //       amount: options.amount,
    //       key_id: RAZORPAY_KEY_ID,
    //       product_name: product.name,
    //       description: product.description,
    //       contact: user.mobile,
    //       name: user.name,
    //       email: user.email,
    //     });
    //   } else {
    //     console.error("Error creating order:", error);
    //     res.status(400).send({ success: false, msg: "Something went wrong!" });
    //   }
    // });
  } catch (error) {
    res.status(500).send({ success: false, msg: "Internal server error" });
  }
};

const updateOrderInDb = async (req, res) => {
  try {
    let updateOrder = await Order.findByIdAndUpdate({ _id: req.query.id }, { $set: { status: "Order Placed" } });
    res.redirect("/myOrders/?retrySuccess=true");
  } catch (error) {
    console.log(error.message);
  }
};

const search = async (req, res) => {
  try {
    res.redirect("/viewAllBestProducts/?searchData=" + req.body.search);
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  verifyMail,
  loadHome,
  viewAllBestProducts,
  loadProfile,
  loadmyOrders,
  orderDetails,
  orderReturn,
  cancelOrder,
  loadWallet,
  editUser,
  submitEditUser,
  loadManageAddress,
  loadAddAddress,
  addANewAddress,
  EditAddress,
  submitEditAddress,
  deleteAddress,
  selectAddresss,
  loadAboutUs,
  loadContactUs,
  loadViewProduct,
  ChangeImageInViewProduct,
  loadCart,
  updateCartQuantity,
  updatePriceOnCart,
  addToCart,
  RemovePdtFrmCart,
  RemovePdtFrmWhishlist,
  LoadWhishlist,
  addToWhishlist,
  cartCheckQSetup,
  loadCartCheckout,
  couponAdding,
  placeOrder,
  loadOrderSuccess,
  onlinePaymentController,
  downloadOrderInvoice,
  isNotCOD,
  confirmRetryOrder,
  updateOrderInDb,
  search,
};
