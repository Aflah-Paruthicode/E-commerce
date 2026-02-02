const Banner = require("../../models/bannerModel");
const path = require("path");
const fs = require("fs");

const loadBanners = async (req, res) => {
  try {
    let slideBanners = await Banner.find({ description: "Banner for home page slide" });
    return res.render("listBanners", { slideBanners });
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

const loadUpdateBanner = async (req, res) => {
  try {
    let banner = await Banner.findById({ _id: req.query.bannerId });
    let startDate = new Date(banner.startDate);
    let endDate = new Date(banner.endDate);

    if(req.query.err) return res.render("editBanner", { emessage : 'Fields cannot be empty',banner, startDate, endDate });

    return res.render("editBanner", { banner, startDate, endDate });
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

const updateBanner = async (req, res) => {
  try {
    const { id, url, startDate, endDate } = req.body;
    let updateFields = { url, startDate, endDate };
    let banner = await Banner.findById({ _id: req.body.id });

    if (Object.values(updateFields).some((field) => field.trim() == "")) return res.redirect("/admin/loadUpdateBanner?bannerId=" + id + "&err=" + true);

    if (req.file) {
      if (banner && banner.image) {
        const fullPath = path.join(__dirname, `../public/banners/${banner.image}`);
        if (fs.existsSync(fullPath)) fs.unlink(fullPath);
      }

      updateFields.image = req.file.filename;
    }

    await Banner.findByIdAndUpdate(id, { $set: updateFields });
    return res.redirect("/admin/banner");
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

const loadAddBannerToSlide = async (req, res) => {
  try {
    let today = new Date();
    return res.render("addBanner", { today });
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

const addBannerToSlide = async (req, res) => {
  try {
    let { startDate, endDate, url } = req.body;
    let today = new Date();
    let emessage = null;

    if ([startDate, endDate, url].some((field) => field.trim() == "")) emessage = "Fields cannot be empty";
    if (emessage) return res.render("addBanner", { emessage, today });

    const saveNewBanner = new Banner({
      description: "Banner for home page slide",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      url: url,
      image: req.file.filename,
    });

    await saveNewBanner.save();
    return res.redirect("/admin/banner");
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

const deleteBanner = async (req, res) => {
  try {
    let id = req.params.id;

    await Banner.findOneAndDelete({ _id: id });
    return res.redirect("/admin/banner");
  } catch (error) {
    return res.status(500).send("internal error");
  }
};

module.exports = {
  loadBanners,
  loadUpdateBanner,
  deleteBanner,
  updateBanner,
  loadAddBannerToSlide,
  addBannerToSlide,
};
