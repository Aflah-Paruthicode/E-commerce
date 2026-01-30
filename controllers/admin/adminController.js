const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const admin_routes = require("../../routes/adminRoute");
const CAtegory = require("../../models/categoryModel");
const Coupon = require("../../models/couponModel");
const Product = require("../../models/productModel");
const Order = require("../../models/orderModel");
const Admin = require("../../models/adminModel");
const Banner = require("../../models/bannerModel");
const WalletTransaction = require("../../models/walletTransactionModel");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const categoryModel = require("../../models/categoryModel");
const { ObjectId } = require("mongodb");

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminData = await Admin.findOne({ email: email });
    if (adminData) {
      if (adminData.password == password) {
        req.session.admin_id = adminData._id;
        res.redirect("/admin/home");
      } else {
        res.render("login", { emessage: "Email or password is incorrect" });
      }
    } else {
      res.render("login", { emessage: "User not valid" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const userData = await User.find();

    const topProducts = await Order.aggregate([
      { $addFields: { productIdObjectId: { $toObjectId: "$product" } } },
      {
        $group: {
          _id: "$productIdObjectId",
          totalQuantity: { $sum: "$quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
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
          _id: 0,
          productId: "$_id",
          productName: "$productDetails.name",
          totalQuantity: 1,
        },
      },
    ]);

    const totelOrders = await Order.find().count();
    const visitors = await User.find().count();
    const productCount = await Product.find().count();
    const categoryCount = await CAtegory.find().count();
    let result = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },

      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totelAmmount" },
        },
      },
    ]);

    const totalAmmount = result.length > 0 ? result[0].totalAmount : 0;

    const topCategories = await Order.aggregate([
      {
        $addFields: {
          productIdObjectId: { $toObjectId: "$product" }, // Convert productId to ObjectId
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productIdObjectId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: "$productDetails.category",
          totalQuantity: { $sum: "$quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalQuantity: 1,
        },
      },
    ]);

    const topBrands = await Order.aggregate([
      {
        $addFields: {
          productIdObjectId: { $toObjectId: "$product" }, // Convert productId to ObjectId
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productIdObjectId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: "$productDetails.company",
          totalQuantity: { $sum: "$quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          brand: "$_id",
          totalQuantity: 1,
        },
      },
    ]);

    const filter = req.query.filter;
    let salesData;
    if (filter) {
      if (filter === "yearly") {
        const { startDate, endDate } = getDateRange(filter);

        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365); // Calculate the date 365 days ago

        salesData = await Order.aggregate([
          {
            $match: {
              status: "Delivered",
            },
          },
          {
            // Step 1: Convert the 'date' field from 'DD/MM/YYYY' to a Date object
            $addFields: {
              orderDate: {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y",
                },
              },
            },
          },
          {
            // Step 2: Match documents where 'orderDate' is within the last 365 days
            $match: {
              orderDate: {
                $gte: oneYearAgo, // Only include dates from one year ago to now
                $lte: new Date(), // Up to the current date
              },
            },
          },
          {
            // Step 3: Group the results by year and calculate total sales
            $group: {
              _id: { $year: "$orderDate" }, // Group by year
              totalSales: { $sum: "$totelAmmount" },
            },
          },
        ]);

        res.json(salesData);
      } else if (filter === "monthly") {
        const { startDate, endDate } = getDateRange(filter);

        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 30); // Calculate the date 365 days ago

        salesData = await Order.aggregate([
          {
            $match: {
              status: "Delivered",
            },
          },
          {
            // Step 1: Convert the 'date' field from 'DD/MM/YYYY' to a Date object
            $addFields: {
              orderDate: {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y",
                },
              },
            },
          },
          {
            // Step 2: Match documents where 'orderDate' is within the last 365 days
            $match: {
              orderDate: {
                $gte: oneYearAgo, // Only include dates from one year ago to now
                $lte: new Date(), // Up to the current date
              },
            },
          },
          {
            // Step 3: Group the results by year and calculate total sales
            $group: {
              _id: { $year: "$orderDate" }, // Group by year
              totalSales: { $sum: "$totelAmmount" },
            },
          },
        ]);

        res.json(salesData);
      } else if (filter === "weekly") {
        const { startDate, endDate } = getDateRange(filter);

        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 7); // Calculate the date 365 days ago

        salesData = await Order.aggregate([
          {
            $match: {
              status: "Delivered",
            },
          },
          {
            // Step 1: Convert the 'date' field from 'DD/MM/YYYY' to a Date object
            $addFields: {
              orderDate: {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y",
                },
              },
            },
          },
          {
            // Step 2: Match documents where 'orderDate' is within the last 365 days
            $match: {
              orderDate: {
                $gte: oneYearAgo, // Only include dates from one year ago to now
                $lte: new Date(), // Up to the current date
              },
            },
          },
          {
            // Step 3: Group the results by year and calculate total sales
            $group: {
              _id: { $year: "$orderDate" }, // Group by year
              totalSales: { $sum: "$totelAmmount" },
            },
          },
        ]);

        res.json(salesData);
      } else if (filter === "daily") {
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 1);

        salesData = await Order.aggregate([
          {
            $match: {
              status: "Delivered",
            },
          },
          {
            $addFields: {
              orderDate: {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y",
                },
              },
            },
          },
          {
            $match: {
              orderDate: {
                $gte: oneYearAgo, // Only include dates from one year ago to now
                $lte: new Date(), // Up to the current date
              },
            },
          },
          {
            // Step 3: Group the results by year and calculate total sales
            $group: {
              _id: { $year: "$orderDate" }, // Group by year
              totalSales: { $sum: "$totelAmmount" },
            },
          },
        ]);

        res.json(salesData);
      }
    } else {
      res.render("home", {
        userData,
        topProducts,
        topCategories,
        topBrands,
        totelOrders,
        visitors,
        totalAmmount,
        productCount,
        categoryCount,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getDateRange = (filter) => {
  let startDate, endDate;
  const today = new Date();

  switch (filter) {
    case "yearly":
      startDate = new Date(today.getFullYear(), 0, 1); // January 1st of the current year
      endDate = new Date(today.getFullYear() + 1, 0, 0); // December 31st of the current year
      break;
    case "monthly":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the current month
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the current month
      break;
    case "weekly":
      const firstDayOfWeek = today.getDate() - today.getDay(); // Assuming Sunday is the first day of the week
      startDate = new Date(today.setDate(firstDayOfWeek));
      endDate = new Date(today.setDate(firstDayOfWeek + 6)); // Last day of the week
      break;
    case "daily":
      startDate = new Date(today.setHours(0, 0, 0, 0)); // Start of the day
      endDate = new Date(today.setHours(23, 59, 59, 999)); // End of the day
      break;
    default:
      throw new Error("Invalid filter");
  }

  // Reset time for consistency
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

const loadCustomerList = async (req, res) => {
  try {
    let totalUsers;
    let totalPages;
    let useR;

    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    let userDeleted = req.query.userDeleted;
    let userblockUnblock = req.query.userblockUnblock;
    // Calculate the number of items to skip
    const skip = (page - 1) * limit;
    let i = skip + 1;
    // Get total number of products for pagination information
    totalUsers = await User.countDocuments();

    // Calculate total number of pages
    totalPages = Math.ceil(totalUsers / limit);

    if (req.query.searchData) {
      useR = await User.find({
        email: { $regex: `.*${req.query.searchData}.*`, $options: "i" },
      })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);
      totalUsers = await User.countDocuments({
        email: { $regex: `.*${req.query.searchData}.*`, $options: "i" },
      });
    } else {
      useR = await User.find().sort({ _id: -1 }).skip(skip).limit(limit);
    }

    totalPages = Math.ceil(totalUsers / limit);

    const queryString = Object.keys(req.query)
      .filter((key) => key !== "page" && key !== "limit")
      .map((key) => `&${key}=${req.query[key]}`)
      .join("");

    if (userDeleted) {
      res.render("listCustomers", {
        customers: useR,
        message: userDeleted,
        pagination: {
          totalUsers,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        i,
        searchData: req.query.searchData,
        queryString,
      });
    } else if (userblockUnblock) {
      res.render("listCustomers", {
        customers: useR,
        message: userblockUnblock,
        pagination: {
          totalUsers,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        i,
        searchData: req.query.searchData,
        queryString,
      });
    } else {
      res.render("listCustomers", {
        customers: useR,
        pagination: {
          totalUsers,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        i,
        searchData: req.query.searchData,
        queryString,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const blockUser = async (req, res) => {
  try {
    let id = req.query.id;
    const block_User = await User.findByIdAndUpdate({ _id: id }, { $set: { block: true } });
    res.redirect("/admin/customers/?userblockUnblock=User has been blocked");
  } catch (error) {
    console.log(error.message);
  }
};

const UnBlockUser = async (req, res) => {
  try {
    const { id } = req.query;
    const unblock_User = await User.findByIdAndUpdate({ _id: id }, { $set: { block: false } });

    res.redirect("/admin/customers/?userblockUnblock=User has been unblocked");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    let customer = await User.findOneAndDelete({ _id: req.params.id });
    res.redirect("/admin/customers/?userDeleted=User has been deleted");
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    delete req.session.admin_id;
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddCategoryOffer = async (req, res) => {
  try {
    let categories = await CAtegory.find();
    if (req.query.err) {
      res.render("addOffer", { categories, emessage: req.query.err });
    } else {
      res.render("addOffer", { categories });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const submitCategoryOffer = async (req, res) => {
  try {
    console.log("cate : ", req.body);

    let { category_name, offerName, DiscountPercentage, offerStartDate, offerEndDate } = req.body;
    let today = new Date();
    let offerStartDateInDate = new Date(offerStartDate);
    let offerEndDateInDate = new Date(offerEndDate);
    let isAlreadyOfferApplied = await Product.findOne({
      category: category_name,
    });
    offerStartDateInDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (isAlreadyOfferApplied.category_OfferDetails) {
      res.redirect("/admin/addCategoryOffer/?err= Selected category already have an Offer");
    } else if (offerStartDateInDate < today) {
      res.redirect("/admin/addCategoryOffer/?err= Choose a properdate( eg. after today)");
    } else if (offerEndDateInDate <= offerStartDateInDate) {
      res.redirect("/admin/addCategoryOffer/?err= End date should be set greater than start date ");
    } else if (DiscountPercentage > 99) {
      res.redirect("/admin/addCategoryOffer/?err= Put discount properly");
    } else {
      let addOffer = await Product.updateMany(
        {
          category: category_name,
        },
        {
          $unset: { product_OfferDetails: "" }, // Remove product_OfferDetails field
          $set: {
            "category_OfferDetails.discountPercentage": DiscountPercentage,
            "category_OfferDetails.offerName": offerName,
            "category_OfferDetails.offerStartDate": offerStartDate,
            "category_OfferDetails.offerEndDate": offerEndDate,
          },
        }
      );

      res.redirect("/admin/offerManagement");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditCategoryOffer = async (req, res) => {
  try {
    let categoryOfferedProduct = await Product.findOne({
      category: req.query.id,
    });

    console.log("query here : ", req.query);

    if (req.query.err) {
      res.render("editOffer", {
        categoryOfferedProduct,
        emessage: req.query.err,
      });
    } else {
      // let category = await CAtegory.findOne({category:});
      res.render("editOffer", { categoryOfferedProduct });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const submitEditCategoryOffer = async (req, res) => {
  try {
    console.log(req.body);

    let { category_name, offerName, DiscountPercentage, offerStartDate, offerEndDate } = req.body;

    let today = new Date();
    let offerStartingInDate = new Date(offerStartDate);
    let offerEndDateInDate = new Date(offerEndDate);

    offerStartingInDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (offerStartingInDate >= offerEndDateInDate) {
      res.redirect("/admin/editCategoryOffer/?err=Put end date greater than start date&id=" + category_name);
    } else {
      if (offerStartingInDate < today) {
        res.redirect("/admin/editCategoryOffer/?err=Starting date need to be today or after today&id=" + category_name);
      } else if (
        category_name.trim() == "" ||
        offerName.trim() == "" ||
        DiscountPercentage.trim() == "" ||
        offerStartDate.trim() == "" ||
        offerEndDate.trim() == ""
      ) {
        res.redirect("/admin/editCategoryOffer/?err=Enter proper details&id=" + category_name);
      } else if (DiscountPercentage > 99) {
        res.redirect("/admin/editCategoryOffer/?err=put discount properly&id=" + category_name);
      } else {
        let updateOffer = await Product.updateMany(
          { category: category_name },
          {
            $set: {
              "category_OfferDetails.discountPercentage": DiscountPercentage,
              "category_OfferDetails.offerName": offerName,
              "category_OfferDetails.offerStartDate": offerStartDate,
              "category_OfferDetails.offerEndDate": offerEndDate,
            },
          }
        );

        res.redirect("/admin/offerManagement");
      }
    }
  } catch (error) {
    conosle.log(error.message);
  }
};

const loadDeleteCategoryOffer = async (req, res) => {
  try {
    let category = req.params.category;
    let deleteCatOffer = await Product.updateMany({ category: category }, { $unset: { category_OfferDetails: "" } });
    res.redirect("/admin/offerManagement");
  } catch (error) {
    console.log(error.message);
  }
};

const loadSalesReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

    // Calculate the number of items to skip
    const skip = (page - 1) * limit;
    // Get total number of products for pagination information
    let totalOrders = await Order.countDocuments({ status: "Delivered" });

    // Calculate total number of pages

    let orders = await Order.find({ status: "Delivered" }).sort({ _id: -1 }).skip(skip).limit(limit);

    if (req.query.period) {
      if (req.query.period !== "day" && req.query.period !== "week" && req.query.period !== "month" && req.query.period !== "year") {
        let wholeOrders = await Order.find({ status: "Delivered" }).sort({ _id: -1 }).skip(skip).limit(limit);

        // User-provided date in YYYY/MM/DD format
        const userDate = req.query.period;

        // Convert the userDate to a Date object directly
        const startDateObj = new Date(userDate); // This creates a Date object from the string

        orders = await Order.aggregate([
          {
            $match: {
              status: "Delivered",
            },
          },
          {
            // Step 1: Convert the 'date' field in the schema from 'DD/MM/YYYY' to a Date object
            $addFields: {
              dateObj: {
                $dateFromString: {
                  dateString: "$date", // Converts the string date in the schema to Date object
                  format: "%d/%m/%Y", // Format of the date strings in your schema
                },
              },
            },
          },
          {
            // Step 2: Match documents where 'dateObj' is between 'startDateObj' and now
            $match: {
              dateObj: {
                $gte: startDateObj, // Use the Date object created from the user input
                $lte: new Date(), // Compare with the current date
              },
            },
          },
          {
            // Step 3: Optionally remove the temporary 'dateObj' field
            $project: {
              dateObj: 0,
            },
          },
        ]);

        totalOrders = wholeOrders.length;
      } else if (req.query.period == "day") {
        let today = createDateString();
        orders = await Order.find({ status: "Delivered", date: today }).sort({ _id: -1 }).skip(skip).limit(limit);
        totalOrders = orders.length;
      } else if (req.query.period == "week") {
        let wholeOrders = await Order.find({ status: "Delivered" }).sort({ _id: -1 }).skip(skip).limit(limit);

        function parseDate(dateStr) {
          const [day, month, year] = dateStr.split("/");
          return new Date(`${year}-${month}-${day}`);
        }

        // Get today's date
        const today = new Date();

        // Calculate the date 6 days ago
        const sixDaysAgo = new Date(today);
        sixDaysAgo.setDate(today.getDate() - 6);

        // Filter the documents based on the date range
        orders = wholeOrders.filter((doc) => {
          const docDate = parseDate(doc.date);
          return docDate >= sixDaysAgo && docDate <= today;
        });
        totalOrders = wholeOrders.length;
      } else if (req.query.period == "month") {
        let wholeOrders = await Order.find({ status: "Delivered" }).sort({ _id: -1 }).skip(skip).limit();

        function parseDateTODate(dateStr) {
          const [day, month, year] = dateStr.split("/");
          return new Date(`${year}-${month}-${day}`);
        }

        // Get today's date
        const today = new Date();

        // Calculate the date 6 days ago
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Filter the documents based on the date range
        orders = wholeOrders.filter((doc) => {
          const docDate = parseDateTODate(doc.date);
          return docDate >= thirtyDaysAgo && docDate <= today;
        });
        totalOrders = wholeOrders.length;
      } else if (req.query.period == "year") {
        let wholeOrders = await Order.find({ status: "Delivered" }).sort({ _id: -1 }).skip(skip).limit();

        function parseDateTODate(dateStr) {
          const [day, month, year] = dateStr.split("/");
          return new Date(`${year}-${month}-${day}`);
        }

        // Get today's date
        const today = new Date();

        const yearAgo = new Date(today);
        yearAgo.setDate(today.getDate() - 365);

        // Filter the documents based on the date range
        orders = wholeOrders.filter((doc) => {
          const docDate = parseDateTODate(doc.date);
          return docDate >= yearAgo && docDate <= today;
        });
        totalOrders = wholeOrders.length;
      }
    }

    const totalPages = Math.ceil(totalOrders / limit);

    let FindordersSum = await Order.aggregate([
      { $match: { status: "Delivered" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totelAmmount" },
        },
      },
    ]);

    let orderTotel = FindordersSum[0].totalAmount;

    let users = [];
    let products = [];
    let coupon = [];

    for (let i = 0; i < orders.length; i++) {
      users.push(await User.findOne({ _id: orders[i].user }));
      products.push(await Product.findOne({ _id: orders[i].product }));
      if (orders[i].coupon_applied !== "no") {
        coupon.push(await Coupon.findOne({ code: orders[i].coupon_applied }));
      } else {
        coupon.push("no");
      }
    }

    if (req.query.format) {
      let orders = await Order.find({ status: "Delivered" });
      let users = [];
      let products = [];

      for (let i = 0; i < orders.length; i++) {
        users.push(await User.findOne({ _id: orders[i].user }));
        products.push(await Product.findOne({ _id: orders[i].product }));
      }

      if (req.query.format == "pdf") {
        generatePDFReport(orders, users, products, res);
      } else {
        generateExcelReport(orders, users, products, res);
      }
    } else {
      let i = skip;

      const queryString = Object.keys(req.query)
        .filter((key) => key !== "page" && key !== "limit")
        .map((key) => `&${key}=${req.query[key]}`)
        .join("");

      let totel_orders = await Order.countDocuments({ status: "Delivered" });
      res.render("salesReport", {
        orders,
        coupon,
        users,
        products,
        totel_orders,
        orderTotel,
        pagination: {
          totalOrders,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        i,
        queryString,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

function createDateString() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const todayString = `${day}/${month}/${year}`;
  return todayString;
}

function parseDateTOWeek(dateStr) {
  const [day, month, year] = dateStr.split("/");
  return new Date(`${year}-${month}-${day}`);
}

function generateExcelReport(orders, users, products, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Orders");

  worksheet.columns = [
    { header: "No", key: "no", width: 10 },
    { header: "Order ID", key: "_id", width: 30 },
    { header: "Added On", key: "date", width: 15 },
    { header: "Buyer", key: "buyer", width: 10 },
    { header: "Product Name", key: "productName", width: 45 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Product Price", key: "productPrice", width: 20 },
    { header: "GST", key: "productGST", width: 10 },
    { header: "Category", key: "productCate", width: 15 },
    { header: "Totel Ammount", key: "totelAmmount", width: 20 },

    // Define other columns based on your order schema
  ];
  let index = 0;
  let i = 0;
  orders.forEach((order) => {
    order.no = index + 1;

    order.buyer = users[i].name;
    order.productName = products[i].name;
    order.productPrice = products[i].price;
    order.productGST = products[i].price / 10;
    order.productCate = products[i].category;

    worksheet.addRow(order);
    index++;
    i++;
  });

  res.setHeader("Content-disposition", "attachment; filename=report.xlsx");
  res.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  workbook.xlsx.write(res).then(() => {
    res.end();
  });
}

function generatePDFReport(orders, users, products, res) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  let filename = "report.pdf";
  filename = encodeURIComponent(filename);

  res.setHeader("Content-disposition", 'attachment; filename="' + filename + '"');
  res.setHeader("Content-type", "application/pdf");

  doc.pipe(res);

  doc.fontSize(17).text("Sales Report", { align: "center" });
  doc.fillColor("black");
  let i = 0;

  // Add a title
  //    doc.font('Helvetica-Bold')
  //    .fontSize(25)
  //    .fillColor('blue')
  //    .text('Orders Report', {
  //        align: 'center',
  //        underline: true
  //    });

  doc.moveDown();

  // orders.forEach(order => {

  //     doc.fillColor('black')
  //     doc.currentLineHeight('20px')
  //     doc.fontSize(14).text(`No: ${i+1}`);
  //     doc.fontSize(12).text(`Order ID: ${order._id}`);
  //     doc.fontSize(12).text(`Added On: ${order.date}`);
  //     doc.fontSize(12).text(`Buyer: ${users[i].name}`);
  //     doc.fontSize(12).text(`Product Name: ${products[i].name}`);
  //     doc.fontSize(12).text(`Quantity: ${order.quantity}`);
  //     doc.fontSize(12).text(`Product Price: RS ${products[i].price}.00`);
  //     doc.fontSize(12).text(`GST Ammount: RS ${products[i].price/10}.00`);
  //     doc.fontSize(12).text(`Product Category: ${products[i].category}`);
  //     doc.fontSize(12).text(`Totel Ammount: RS ${order.totelAmmount}.00`);
  //     doc.moveDown();
  //     i++
  // });

  // doc.font('Helvetica-Oblique')
  //    .fontSize(10)
  //    .fillColor('gray')
  //    .text(`Generated on ${new Date().toLocaleString()}`, {
  //        align: 'center',
  //        valign: 'bottom'
  //    });

  // Define the table structure
  // Define the table structure
  const table = {
    headers: ["No", "Order ID", "Added On", "Buyer", "Product Name", "Quantity", "Product Price", "GST Amount", "Product Category", "Total Amount"],
    rows: [
      // Add more rows as needed
    ],
  };

  for (let k = 0; k < orders.length; k++) {
    let array = [];

    array.push(k + 1);
    array.push(orders[k]._id);
    array.push(orders[k].date);

    array.push(users[k].name);
    let product_name = products[k].name.slice(0, 32);
    array.push(product_name + "...");
    array.push(orders[k].quantity);
    array.push("RS " + products[k].price + ".00");
    array.push("RS " + products[k].price / 10 + ".00");
    array.push(products[k].category);
    array.push("RS" + orders[k].totelAmmount + ".00");

    table.rows.push(array);
  }

  const startX = 0;
  const startY = 100;
  const rowHeight = 20;
  const columnWidth = 60; // Adjust this value as needed to fit all headers

  // Draw the table headers
  doc.fontSize(6).font("Helvetica-Bold");
  table.headers.forEach((header, i) => {
    doc.text(header, startX + i * columnWidth, startY, {
      width: columnWidth,
      align: "center",
    });
  });

  // Draw the table rows
  doc.font("Helvetica");
  table.rows.forEach((row, rowIndex) => {
    row.forEach((cell, i) => {
      doc.text(cell, startX + i * columnWidth, startY + rowHeight * (rowIndex + 1), { width: columnWidth, align: "center" });
    });
  });

  doc.end();
}

// const resultOfSearch = (req,res) => {

//     try {

//         res.render('/admin/searched')

//     } catch (error) {
//         console.log(error);
//     }
// }

module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  loadCustomerList,
  blockUser,
  UnBlockUser,
  deleteUser,
  logout,
  loadAddCategoryOffer,
  submitCategoryOffer,
  loadEditCategoryOffer,
  submitEditCategoryOffer,
  loadDeleteCategoryOffer,
  loadSalesReport,
  // resultOfSearch
};
