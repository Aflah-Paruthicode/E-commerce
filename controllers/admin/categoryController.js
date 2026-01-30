const CAtegory = require("../../models/categoryModel");

const addCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    let i = skip + 1;
    const totalCate = await CAtegory.countDocuments();
    const totalPages = Math.ceil(totalCate / limit);
    const categorys = await CAtegory.find().sort({ _id: -1 }).skip(skip).limit(limit);

    let emessage = req.query.emessage;
    let message = req.query.message;

    res.render("addCategory", {
      categorys,
      pagination: {
        totalCate,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      i,
      emessage,
      message,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const submitNewCategory = async (req, res) => {   
  try {
    const { category } = req.body;
    let checker = category.toUpperCase().trim();
    const isAvailable = await CAtegory.findOne({ category: checker });
    let emessage = null

    if (isAvailable) emessage = "Already available";
    else if (category.trim() == "") emessage = "Please add a valid category";

    if(emessage) return res.redirect("/admin/category/?emessage="+true);

        let addingCate = category.toUpperCase().trim();
        const categorY = new CAtegory({
          category: addingCate,
        });

        await categorY.save();
        return res.redirect("/admin/category/?message=Category created successfull");
    
  } catch (error) {
    console.log(error.message);
  }
};

const toUnlistCategory = async (req, res) => {
  try {
    let setCategoryToUnlisted = await CAtegory.findByIdAndUpdate({ _id: req.query.id }, { $set: { isListed: false } });
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};

const toListCategory = async (req, res) => {
  try {
    let setCategoryToUnlisted = await CAtegory.findByIdAndUpdate({ _id: req.query.id }, { $set: { isListed: true } });
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const isCategoryDelted = await CAtegory.deleteOne({ _id: id });
    if (isCategoryDelted) res.redirect("/admin/category");
    else res.render("addCategory", { emessage: "failed to delete" });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  addCategory,
  submitNewCategory,
  toUnlistCategory,
  toListCategory,
  deleteCategory,
};
