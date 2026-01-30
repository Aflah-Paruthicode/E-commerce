 const Product = require('../../models/productModel');

 const loadOfferManagement = async (req, res) => {
  try {
    const productWIthCategoryOffers = await Product.aggregate([
      {
        $match: {
          category_OfferDetails: { $exists: true },
        },
      },
      {
        $group: {
          _id: "$category",
          categoryOfferDetails: {
            $first: {
              discountPercentage: "$category_OfferDetails.discountPercentage",
              offerName: "$category_OfferDetails.offerName",
              offerStartDate: "$category_OfferDetails.offerStartDate",
              offerEndDate: "$category_OfferDetails.offerEndDate",
            },
          },
        },
      },
    ]);

    const productsWithOffers = await Product.find({
      product_OfferDetails: { $exists: true },
    });

    console.log(productWIthCategoryOffers);
    res.render("offerManagement", {
      productsWithOffers,
      productWIthCategoryOffers,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddProductOffer = async (req, res) => {
  try {
    let products = await Product.find();

    if (req.query.err) {
      res.render("addOffer", { products, emessage: req.query.err });
    } else {
      res.render("addOffer", { products });
    }
  } catch (error) {
    console.log(error.message);
  }
};


const submitProductOffer = async (req, res) => {
  try {
    console.log(req.body);

    let { product_Id, offerName, DiscountPercentage, offerStartDate, offerEndDate } = req.body;
    let today = new Date();
    let offerStartingInDate = new Date(offerStartDate);
    let offerEndingInDate = new Date(offerEndDate);
    offerStartingInDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    console.log(today);

    if (offerStartingInDate >= offerEndingInDate) {
      res.redirect("/admin/addProductOffer/?err=Offer end date need to be greater than start date");
    } else {
      if (product_Id.trim() == "" || offerName.trim() == "" || DiscountPercentage.trim() == "" || offerStartDate.trim() == "" || offerEndDate.trim() == "") {
        res.redirect("/admin/addProductOffer/?err=Type every details properly");
      } else if (offerStartingInDate < today) {
        res.redirect("/admin/addProductOffer/?err=Start date need to set greater than today");
      } else {
        let isAlreadyOfferApplied = await Product.findOne({ _id: product_Id });

        if (isAlreadyOfferApplied.product_OfferDetails) {
          res.redirect("/admin/addProductOffer/?err=Selected product already have an Offer");
        } else if (DiscountPercentage > 99) {
          res.redirect("/admin/addProductOffer/?err=Put discount properly");
        } else {
          let isAlreadyHaveACategoryOffer = await Product.findOne({
            _id: product_Id,
            category_OfferDetails: { $exists: true },
          });

          if (isAlreadyHaveACategoryOffer) {
            if (isAlreadyHaveACategoryOffer.category_OfferDetails.discountPercentage < DiscountPercentage) {
              let changeTheOfferToProduct = await Product.findOneAndUpdate(
                { _id: product_Id },
                {
                  $unset: { category_OfferDetails: "" },
                  $set: {
                    "product_OfferDetails.discountPercentage": DiscountPercentage,
                    "product_OfferDetails.offerName": offerName,
                    "product_OfferDetails.offerStartDate": offerStartDate,
                    "product_OfferDetails.offerEndDate": offerEndDate,
                  },
                }
              );

              res.redirect("/admin/offerManagement");
            } else {
              res.redirect("/admin/addProductOffer/?err=This product have a category offer greater than this offer");
            }
          } else {
            let productAddOffer = await Product.findOneAndUpdate(
              { _id: product_Id },
              {
                $set: {
                  "product_OfferDetails.discountPercentage": DiscountPercentage,
                  "product_OfferDetails.offerName": offerName,
                  "product_OfferDetails.offerStartDate": offerStartDate,
                  "product_OfferDetails.offerEndDate": offerEndDate,
                },
              }
            );
            res.redirect("/admin/offerManagement");
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditProductOffer = async (req, res) => {
  try {
    console.log(req.query);

    let product = await Product.findOne({ _id: req.query.id });

    if (req.query.err) {
      res.render("editOffer", { product, emessage: req.query.err });
    } else {
      res.render("editOffer", { product });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const submitEditProductOffer = async (req, res) => {
  try {
    console.log(req.body);

    let { offerName, id, DiscountPercentage, offerStartDate, offerEndDate } = req.body;

    let today = new Date();
    let offerStartingInDate = new Date(offerStartDate);
    let offerEndingInDate = new Date(offerEndDate);
    offerStartingInDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (offerStartingInDate >= offerEndingInDate) {
      res.redirect("/admin/editProductOffer/?err=Offer end date need to be greater than start date&id=" + id);
    } else {
      if (offerName.trim() == "" || DiscountPercentage.trim() == "" || offerStartDate.trim() == "" || offerEndDate.trim() == "") {
        res.redirect("/admin/editProductOffer/?err=Type every details properly&id=" + id);
      } else if (offerStartingInDate < today) {
        res.redirect("/admin/editProductOffer/?err=Start date need to set today or greater than today&id=" + id);
      } else {
        if (DiscountPercentage > 99) {
          res.redirect("/admin/editProductOffer/?err=Put discount properly&id=" + id);
        } else {
          let updateOffer = await Product.findByIdAndUpdate(
            { _id: id },
            {
              $set: {
                "product_OfferDetails.discountPercentage": DiscountPercentage,
                "product_OfferDetails.offerName": offerName,
                "product_OfferDetails.offerStartDate": offerStartDate,
                "product_OfferDetails.offerEndDate": offerEndDate,
              },
            }
          );

          res.redirect("/admin/offerManagement");
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDeleteProductOffer = async (req, res) => {
  try {
    let id = req.params.id;
    let deleteProdOffer = await Product.findOneAndUpdate({ _id: id }, { $unset: { product_OfferDetails: "" } });
    res.redirect("/admin/offerManagement");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadOfferManagement,
  loadAddProductOffer,
  submitProductOffer,
  loadEditProductOffer,
  submitEditProductOffer,
  loadDeleteProductOffer
};
