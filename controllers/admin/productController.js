const Product = require("../../models/productModel");
const CAtegory = require("../../models/categoryModel");
const path = require("path");
const fs = require("fs");

const loadProducts = async (req, res) => {
  try {
    let proDucts;
    let message;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    let i = skip + 1;
    let queryFilters = {};
    let totalProducts = await Product.countDocuments();

    if (req.query.searchData) queryFilters.name = { $regex: `.*${req.query.searchData}.*`, $options: "i" };
    totalProducts = await Product.countDocuments(queryFilters);
    proDucts = await Product.find(queryFilters).sort({ _id: -1 }).skip(skip).limit(limit);

    let totalPages = Math.ceil(totalProducts / limit);
    const queryString = Object.keys(req.query)
      .filter((key) => key !== "page" && key !== "limit")
      .map((key) => `&${key}=${req.query[key]}`)
      .join("");

    if (req.query.newProduct) {
      message = "Product Successfully Added.";
    } else if (req.query.edited) {
      message = "Product Edited Was Successfully.";
    }
    return res.render("listProducts", {
      message: message ? message : null,
      products: proDucts,
      pagination: { totalProducts, totalPages, currentPage: page, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
      i,
      searchData: req.query.searchData,
      queryString,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const category = await CAtegory.find();
    res.render("addProduct", { category });
  } catch (error) {
    console.log(error.message);
  }
};

const submitNewProduct = async (req, res) => {
  try {
    const GotProducts = await CAtegory.find();
    const { name, company, price, original_price, quantity, category, product_desc } = req.body;
    const newProductDetails = { name, company, price, original_price, quantity, category, product_desc };
    let emessage = null;

    if (!req.files) {
      emessage = "Please add an image";
    } else if (Object.values(newProductDetails).some((field) => !field || field.trim() == "")) {
      emessage = "Fields cant be empty";
    } else if (req.files.length < 3) {
      emessage = "Please add minimum 3 pictures.";
    } else if (Number(price) < 1 || Number(original_price) < 1) {
      emessage = "Price and Og price should be at least 1";
    } else if (Number(price) >= Number(original_price)) {
      emessage = "Original Price amount should be greater than price amount";
    } else if (Number(quantity) < 1) {
      emessage = "Quantity should be at least 1";
    }
    if (emessage) {
      return res.render("addProduct", {
        emessage,
        category: GotProducts,
        details: newProductDetails,
      });
    }

    let imageArray = req.files.map((img) => img.filename);
    const product = new Product({
      name,
      company: company.toUpperCase(),
      price: parseFloat(price),
      og_price: parseFloat(original_price),
      quantity: Number(quantity),
      category,
      product_desc,
      images: imageArray,
    });

    saveProduct = await product.save();
    console.log("yeaah bruh damn it2");
    return res.redirect("/admin/product/?newProduct=true");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const isProductDeleted = await Product.deleteOne({ _id: id });
    if (isProductDeleted) {
      res.redirect("/admin/product");
    } else {
      res.render("listProducts", { emessage: "failed to delete" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id });
    const category = await CAtegory.find();
    const emessage = req?.query?.emessage;
    if (productData) {
      res.render("productEdit", { product: productData, category, emessage });
    } else {
      res.redirect("/admin/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteProductIMG = async (req, res) => {
  try {
    let { position, id } = req.params;
    let product = await Product.findById({ _id: id });
    if (product.images.length <= 3) return res.redirect(`/admin/EditProduct/?id=${id}&emessage=You have to keep minimum 3 pictures`);
    const imageToDelete = product.images[position];
    if (imageToDelete) {
      product.images.splice(position, 1);
      await product.save();

      const fullPath = path.join(__dirname, "../../public/productImages/", imageToDelete);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    return res.redirect(`/admin/EditProduct/?id=${id}`);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editProductIMG = async (req, res) => {
  try {
    const product = await Product.findById({ _id: req.body.id });
    const imgInd = req.query.id;
    const changeIMG = await Product.findByIdAndUpdate({ _id: req.body.id }, { $set: { [`images.${imgInd}`]: req.file.filename } });
    const fullPath = path.join(__dirname, `../../public/productImages/${product.images[imgInd]}`);
    if (fullPath) fs.unlink(fullPath);

    res.redirect(`/admin/EditProduct/?id=${req.body.id}`);
  } catch (error) {
    console.log(error.message);
  }
};

const handleSubmitEditProduct = async (req, res) => {
  try {
    const { id } = req.query;

    if (req.file) {
      const updateIMG = await Product.findByIdAndUpdate({ _id: id }, { $push: { images: req.file.filename } });
    }
    const { name, company, product_desc, price, original_price, quantity, category } = req.body;
    const productData = await Product.findById({ _id: id });
    let categorys = await CAtegory.find();

    if (name.trim() == "" || product_desc.trim() == "" || company.trim() == "" || price.trim() == "" || original_price.trim() == "" || quantity.trim() == "") {
      res.render("productEdit", {
        emessage: "fields cant be empty",
        category: categorys,
        product: productData,
      });
    } else if (price < 1 || original_price < 1) {
      res.render("productEdit", {
        emessage: "Price and Og Price should be more than 1",
        category: categorys,
        product: productData,
      });
    } else if (quantity < 0) {
      res.render("productEdit", {
        emessage: "Quantity should be more than 1",
        category: categorys,
        product: productData,
      });
    } else if (parseFloat(price) >= parseFloat(original_price)) {
      res.render("productEdit", {
        emessage: "Og price should be grater than price",
        category: categorys,
        product: productData,
      });
    } else {
      const update = await Product.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            name: name,
            category: category,
            company: company,
            product_desc: product_desc,
            price: price,
            og_price: original_price,
            quantity: quantity,
          },
        }
      );
      if (update) {
        res.redirect("/admin/product/?edited=true");
      } else {
        res.render("productEdit", {
          emessage: "Updation failed",
          category: categorys,
          product: productData,
        });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadProducts,
  loadAddProduct,
  submitNewProduct,
  deleteProduct,
  loadEditProduct,
  deleteProductIMG,
  editProductIMG,
  handleSubmitEditProduct,
};
