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
    return res.status(500).send("internal error");
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const category = await CAtegory.find();
    return res.render("addProduct", { category });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
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
    return res.status(500).send("internal error");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const isProductDeleted = await Product.deleteOne({ _id: id });
    if (isProductDeleted) {
      return res.redirect("/admin/product");
    } else {
      return res.render("listProducts", { emessage: "failed to delete" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id });
    console.log('got it',req.query)
    const category = await CAtegory.find();
    const emessage = req?.query?.emessage;
    if (productData) {
      return res.render("productEdit", { product: productData, category, emessage });
    } 
      return res.redirect("/admin/home");
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
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
    console.log("dkfhjd",req.body.id);
    const product = await Product.findById({ _id: req.body.id });
    console.log('body : ',req.query.id)
    const imgInd = req.query.id;
    await Product.findByIdAndUpdate({ _id: req.body.id }, { $set: { [`images.${imgInd}`]: req.file.filename } });
    const fullPath = path.join(__dirname, `../../public/productImages/${product.images[imgInd]}`);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    console.log('is the call reached here?')
    return res.redirect(`/admin/EditProduct/?id=${req.body.id}`);
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const handleSubmitEditProduct = async (req, res) => {
  try {
    const { id } = req.query;
    const { name, company, product_desc, price, original_price, quantity, category } = req.body;

    let categories = await CAtegory.find();
    const productData = { _id: id, name, company, product_desc, price, og_price: original_price, quantity, category };

    let emessage = null;

    if ([name, product_desc, company, price, original_price, quantity].some((field) => field.trim() == "")) {
      emessage = "Fields cant be empty";
    } else if (price < 1 || original_price < 1) {
      emessage = "Price and Og Price should be more than 1";
    } else if (quantity < 0) {
      emessage = "Quantity should be more than 1";
    } else if (Number(price) >= Number(original_price)) {
      emessage = "Og price should be grater than price";
    }

    if (emessage) {
      return res.render("productEdit", {
        emessage,
        category: categories,
        produt: productData,
      });
    }

    const updateData = {
      name,
      category,
      company,
      product_desc,
      price: Number(price),
      og_price: Number(original_price),
      quantity: Number(quantity),
    };

    if (req.file) await Product.findByIdAndUpdate(id, { $set: updateData, $push: { images: req.file.filename } });
    else await Product.findByIdAndUpdate(id, { $set: updateData });
     return res.redirect('/admin/product/?edited='+true);
  } catch (error) {
    console.log(error.message);
     return res.status(500).send("internal server error");
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
