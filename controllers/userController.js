const User = require('../models/userModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Whishlist = require('../models/whishlistModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Product = require('../models/productModel');
const Wallet = require('../models/walletModel');
const Banner = require('../models/bannerModel');
const Category = require('../models/categoryModel');
require('dotenv').config();

let Otp = require('../models/otpModel');
const addressModel = require('../models/addressModel');

let idOfCHangePass;
let otp;

const Razorpay = require('razorpay');
const walletTransactionModel = require('../models/walletTransactionModel');
const categoryModel = require('../models/categoryModel');
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY;

const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_SECRET_KEY
});






// hashing password
const securePassword = async (password) => {
    try {

        const hashedPassword = await bcrypt.hash(password, 10);
        return hashedPassword;

    } catch (error) {
        console.log(error.message);
    }
}

// sending verify mail
const sendVerifyMail = async (name, email) => {

    try {

        otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: process.env.Smtp_authMail,
                pass: process.env.Smtp_authPass
                // need to change
            }
        });

        const mailOptions = {
            from: 'aflutech2@gmail.com',
            to: email,
            subject: 'For otp verification email',
            html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">DASH FOOTWARES</a>
              </div>
              <p style="font-size:1.1em">Hi, ${name}</p>
              <p>Thank you for choosing Dash Footwares. Use the following OTP to complete your Sign Up procedures. OTP is valid for 2 minutes</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
              <p style="font-size:0.9em;">Regards,<br />Dash Footwares</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Dash Footwares Inc</p>
                <p>Malappuram Kerala</p>
                <p>India</p>
              </div>
            </div>
          </div>`

        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email has been sent:- ", info.response);
            }
        })




    } catch (error) {
        console.log(error.message);
    }
}


const loadRegister = async (req, res) => {

    try {

        res.render('registration', { message: undefined });

    } catch (error) {
        console.log(error.message);
    }
}

const successGoogleLogin = async (req, res) => {

    try {


        console.log('user ;;;; ',req.user)
        if (!req.user) {
    
            res.redirect('/failure');
        } else {
        const { email } = req.body;
        console.log(req.user);
        let useR = await User.findOne({ email: req.user.email });
    
        if(!useR) {
            const hashed_pass = await securePassword(req.user.id);
    
            const user = new User({
                name: req.user.displayName,
                mobile: 1010101010,
                email: req.user.email,
                password: hashed_pass,
                is_verified: 0,
                
            })
            let userSaved = await user.save()
            useR = await User.findOne({ email: req.user.email })
    
            let newWallet = new Wallet({
                user_id: useR._id
                
            })
            let walletSave = await newWallet.save();
            
        }
    
        console.log('hahaa : ', req.body._id)
        req.session.user_id = useR._id;
        console.log(req.body._id)
        res.redirect('/')

    }

 
    } catch (error) {
        console.log(error.message);
    }
   
}

const failureGoogleLogin = async (req, res) => {

    try {
        res.redirect('/')

    } catch (error) {
        console.log(error.message)
    }
}


const insertUser = async (req, res) => {

    try {
        const { name, mno, email, password } = req.body;

        const useR = await User.findOne({ email: email });
        if (useR) {
            res.render('registration', { emessage: "Entered mail already registered," });
        } else if (mno.length < 10 || mno.length > 10) {
            res.render('registration', { emessage: "Please enter proper mobile number" });

        } else if (name.trim() == "" || name.length < 3) {

            res.render('registration', { emessage: 'Please enter name properly' });

        } else if (password.length < 5) {

            res.render('registration', { emessage: 'Please enter a password properly' });


        } else {
            const hashed_pass = await securePassword(password);


            const user = new User({
                name: name,
                mobile: mno,
                email: email,
                password: hashed_pass,
                is_verified: 0,
                is_admin: 0
            })

            


            const userData = await user.save();
            if (userData) {
                let userWallet = new Wallet({
                    user_id: userData._id,
                    
                })
                const userWalletSaved = await userWallet.save();

                res.redirect(`/loadRegisterOtpVerification/?id=${userData._id}`);
            } else {
                res.render('registration', { message: `you're registration has been failed` });
            }

        }


    } catch (error) {
        console.log(error.message);
    }
}


const loadRegisterOtpVerification = async (req,res) => {

    try {

        let user = await User.findById({ _id: req.query.id });
        sendVerifyMail(user.name, user.email);

        res.render('otpVerification', { SuccessMessage: `Please check youre mail for OTP`, user: user });


    } catch (error) {
        console.log(error.message);
    }
}



const isOtp = async (req, res) => {

    try {

        console.log('uuussseeerrr : ', req.query);

        let user = await User.findById({ _id: req.query.id });
        console.log('uuussseeerrr : ', user);
        let update = await User.findOneAndUpdate({ _id: req.query.id }, { $set: { is_verified: 1 } });


        if (req.body.hiddenOtp == otp) {
            console.log(req.query);

                console.log('otp success aaaan')
                req.session.user_id = user._id
                // res.render('forgtP-Npswd', { message: 'Please set a new Password', id: user._id });
                res.json({ success: true });
    
            } else {
    
                console.log('otp failed aaannnotp : ',otp," but the body : ",req.body.hiddenOtp)
                res.json({ success: false, emessage: 'Entered OTP is Invalid' });
            }


    } catch (error) {
        console.log(error.message);
    }
}

// email verification starts here.

const verifyMail = async (req, res) => {
    try {

        const updateInfo = await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
        req.session.user_id = req.query.id;

        res.render("home");

    } catch (error) {
        console.log(error.message);
    }
}





const loadSetNewPass = async (req, res) => {

    try {

        let id = req.query.id
        res.render('forgtP-Npswd', { id });

    } catch (error) {
        console.log(error.message)
    }

}


// getting the password change page.

const otpValidation = async (req, res) => {
    try {
        console.log(req.body, " sec is here");

        let id = req.query.id;
        if (req.body.hiddenOtp == otp) {
            console.log('otp success aaaan')
            // res.render('forgtP-Npswd', { message: 'Please set a new Password', id: user._id });
            res.json({ success: true });

        } else {

            console.log('otp failed aaan')
            res.json({ success: false, emessage: 'Entered OTP is Invalid' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, emessage: 'Internal Server Error' });
    }
}






// new password creating post request.
const changePassword = async (req, res) => {

    try {

        let id = req.query.id;
        let user = await User.findOne({ _id: id });

        if (req.body.password.length < 5 || req.body.password.trim() == "") {

            res.render('forgtP-Npswd', { emessage: 'Pleese Enter Atleast 5 Characters', id: user._id });

        } else if (req.body.password !== req.body.cpassword) {

            console.log('first one : ', req.body.password, 'seccond one is : ', req.body.cpassword)

            res.render('forgtP-Npswd', { emessage: 'Pleese Enter Equel Passwords', id: user._id });

        } else {

            // const useR = await User.findOne({})
            console.log("quriiii", idOfCHangePass);

            const passwordHash = await bcrypt.hash(req.body.password, 10);

            console.log(passwordHash);

            const updateInfo = await User.updateOne({ _id: id }, { $set: { password: passwordHash } });
            const data = await User.findOne({ _id: id });

            // updateInfo.save()
            console.log('product details : ', data);

            console.log('product saved : ', updateInfo);

            res.redirect('/login/?NPassword=true')
        }
    } catch (error) {
        console.log(error);
    }

}



const loadLogin = async (req, res) => {

    try {
        let NPassword = req.query.NPassword;

        if(NPassword) {
            res.render('login',{message:'Password has been changed'});

        } else {

            res.render('login');
        }
        
    } catch (error) {
        console.log(error.message);
    }

}

const loginSubmit = async (req, res) => {

    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email })

        if (userData) {

            if (userData.block == 1) {

                res.render('login', { emessage: 'something went wrong' })

            } else {



                const passwordMatch = await bcrypt.compare(password, userData.password);
                if (passwordMatch) {

                    if (userData.is_verified === 0) {
                        let user = await User.findOne({ email: email });
                        sendVerifyMail(user.name, user.email);
                        res.render('otpVerification', { message: 'please check youre email, and verify OTP', user: user });
                    } else {
                        req.session.user_id = userData._id;
                        res.redirect('/?fromLogin=true');
                    }
                } else {
                    res.render('login', { emessage: 'email or password is incorrect.' });
                }
            }

        } else {
            res.render('login', { emessage: 'please signup first!.' });
        }

    } catch (error) {
        console.log(error.message);
    }
}

// otp verification here.

// const otpVerification = async (req, res) => {
//     try {

//         res.render('otpVerification');

//     } catch (error) {
//         console.log(error.message);
//     }
// }


const loadHome = async (req, res) => {
    try {

        const topProducts = await Order.aggregate([{$addFields: {productIdObjectId: { $toObjectId: '$product' }}},{$group: {_id: "$productIdObjectId",totalQuantity: { $sum: "$quantity" }}},{ $sort: { totalQuantity: -1 } },{ $limit: 8 },{$lookup: {from: "products",localField: "_id",foreignField: "_id",as: "productDetails"}},{$unwind: "$productDetails"},
        {$project: {_id: "$_id",name: "$productDetails.name",
        price: "$productDetails.price",
        images:"$productDetails.images",
        product_desc:"$productDetails.product_desc",
        company:"$productDetails.company",
        quantity:"$productDetails.quantity",
        og_price:"$productDetails.og_price"}}]);

        const producTs = await Product.find();
        const categoryForListUnList = await Category.find({isListed:true});

        const productss = await Product.aggregate([
            {
              $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: 'category',
                as: 'categoryDetails'
              }
            },
            {
              $unwind: '$categoryDetails'
            },
            {
              $match: {
                'categoryDetails.isListed': true
              }
            },
            {
              $project: {
                name: 1,
                price: 1,
                images:1,
                product_desc:1,
                company:1,
                quantity:1,
                og_price:1,
                // Include other fields you want to retrieve from the product document
                category: '$categoryDetails.name'
              }
            },{$limit:8}
          ]);

          let products = productss.reverse()

        const whishlist = await Whishlist.find();
        const SlideBanners = await Banner.find({description:'Banner for home page slide'})
        const ThankBanner = await Banner.findOne({description:'Banner for home page thankyou'})
        let user = await User.findById({_id:req.session.user_id});
        let fromLogin = req.query.fromLogin;

        if (fromLogin) {

            res.render('home', { products, whishlist,message:'Welcome '+user.name,SlideBanners,ThankBanner,topProducts});
        } else {

            res.render('home', { products, whishlist,SlideBanners,ThankBanner,topProducts});
        }



    } catch (error) {
        console.log(error.message);
    }
}


const viewAllBestProducts = async (req, res) => {
    try {
        console.log('query here from view all page : ', req.query);

        let { page = 1, limit = 5, sorted, filtered, Pricefiltered, searchData } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const sortOptions = {
            'Price Low To High': { price: 1 },
            'Price High To Low': { price: -1 },
            'A to Z': { name: 1 },
            'Z to A': { name: -1 }
        };
        const priceOptions = {
            'under rs 999': { price: { $lte: 999 } },
            'rs 1000 to rs 2999': { $and: [{ price: { $gte: 1000 } }, { price: { $lte: 2999 } }] },
            'rs 3000 to rs 5000': { $and: [{ price: { $gte: 3000 } }, { price: { $lte: 5000 } }] },
            'rs 5000 to rs 10000': { $and: [{ price: { $gte: 5000 } }, { price: { $lte: 10000 } }] },
            'rs 10000 to rs 20000': { $and: [{ price: { $gte: 10000 } }, { price: { $lte: 20000 } }] }
        };

        let products = [];
        let totalProducts = 0;
        let sortedAs, filteredAs, pricefilteredAs;

        if (searchData && Pricefiltered && sorted && filtered) {


            let { price } = priceOptions[Pricefiltered];
            let {$and } = priceOptions[Pricefiltered];

            if(Pricefiltered == 'under rs 999') {


                if(filtered === 'all') {

                    products = await Product.aggregate([{$match: {price,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {price,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                } else {

                    products = await Product.aggregate([{$match: {price,company: filtered.toUpperCase(),"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {price,company: filtered.toUpperCase(),"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                }
            } else {

                if(filtered === 'all') {

                    products = await Product.aggregate([{$match: {$and,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {$and,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                } else {

                    products = await Product.aggregate([{$match: {$and,company: filtered.toUpperCase(),"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {$and,company: filtered.toUpperCase(),"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                }

              

            }
            console.log('here it is broh naalum verna case : ',price,$and)


            
            filteredAs = filtered;
            pricefilteredAs = Pricefiltered;
            sortedAs = sorted;


        } else if  (sorted && searchData && filtered) {

            if(filtered === 'all') {

                products = await Product.aggregate([{$match: {"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                totalProducts = await Product.aggregate([{$match: {"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
       
            } else {

                products = await Product.aggregate([{$match: {company: filtered.toUpperCase(),"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                totalProducts = await Product.aggregate([{$match: {company: filtered.toUpperCase(),"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
       
            }

            filteredAs = filtered;
            sortedAs = sorted;



        } else if (sorted && Pricefiltered && filtered) {

            let { price } = priceOptions[Pricefiltered];
            let {$and } = priceOptions[Pricefiltered];

            if(Pricefiltered == 'under rs 999') {


                if(filtered === 'all') {

                    products = await Product.aggregate([{$match: {price}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {price}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                } else {

                    products = await Product.aggregate([{$match: {price,company: filtered.toUpperCase()}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {price,company: filtered.toUpperCase()}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                }
            } else {

                if(filtered === 'all') {

                    products = await Product.aggregate([{$match: {$and}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {$and}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                } else {

                    products = await Product.aggregate([{$match: {$and,company: filtered.toUpperCase()}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {$and,company: filtered.toUpperCase()}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                }

              

            }
            console.log('here it is broh : ',price,$and)


            
            filteredAs = filtered;
            pricefilteredAs = Pricefiltered;
            sortedAs = sorted;

        } else if (searchData && Pricefiltered && filtered) {

            let { price } = priceOptions[Pricefiltered];
            let {$and } = priceOptions[Pricefiltered];

            if(Pricefiltered == 'under rs 999') {


                if(filtered === 'all') {

                    products = await Product.aggregate([{$match: {price,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {price,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                } else {

                    products = await Product.aggregate([{$match: {price,company: filtered.toUpperCase(),"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {price,company: filtered.toUpperCase(),"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                }
            } else {

                if(filtered === 'all') {

                    products = await Product.aggregate([{$match: {$and,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {$and,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                } else {

                    products = await Product.aggregate([{$match: {$and,company: filtered.toUpperCase(),"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {$and,company: filtered.toUpperCase(),"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                }

              

            }
            console.log('here it is broh : ',price,$and)


            
            filteredAs = filtered;
            pricefilteredAs = Pricefiltered;

        } else if (searchData && Pricefiltered && sorted) {

            let { price } = priceOptions[Pricefiltered];
            let {$and } = priceOptions[Pricefiltered];

            if(Pricefiltered == 'under rs 999') {

                    products = await Product.aggregate([{$match: {price,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {price,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
                } else {

                    products = await Product.aggregate([{$match: {$and,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {$and,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
           
            }

            pricefilteredAs = Pricefiltered;
            sortedAs = sorted;

        } else if (sorted && searchData) {

            products = await Product.aggregate([{$match: { "name": { $regex: `.*${searchData}.*`, $options: 'i' } }},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
            totalProducts = await Product.aggregate([{$match: { "name": { $regex: `.*${searchData}.*`, $options: 'i' } }},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))

            sortedAs = sorted;
        } else if (sorted && filtered) {

            if (filtered === 'all') {

                products = await Product.aggregate([{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                totalProducts = await Product.aggregate([{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))


            } else {
                let capitaledCompany = filtered.toUpperCase();

                products = await Product.aggregate([{$match: { company: capitaledCompany }},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
                totalProducts = await Product.aggregate([{$match: { company: capitaledCompany }},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))

            }

            filteredAs = filtered;
            sortedAs = sorted;
        } else if (sorted && Pricefiltered) {

            products = await Product.aggregate([{$match: priceOptions[Pricefiltered]},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$sort: sortOptions[sorted]},{ $skip: skip },{ $limit: limit }])
            totalProducts = await Product.aggregate([{$match: priceOptions[Pricefiltered]},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))


            pricefilteredAs = Pricefiltered;
            sortedAs = sorted;

        } else if (filtered && searchData) {

            if(filtered === 'all') {

                products = await Product.aggregate([{$match: { "name": { $regex: `.*${searchData}.*`, $options: 'i' } }},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                totalProducts = await Product.aggregate([{$match: { "name": { $regex: `.*${searchData}.*`, $options: 'i' } }},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))


            } else {

                products = await Product.aggregate([{$match: { "name": { $regex: `.*${searchData}.*`, $options: 'i' }, company: filtered.toUpperCase()  }},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                totalProducts = await Product.aggregate([{$match: { "name": { $regex: `.*${searchData}.*`, $options: 'i' }, company: filtered.toUpperCase()  }},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))


            }

            filteredAs = filtered;


        } else if (filtered && Pricefiltered) {


            let { price } = priceOptions[Pricefiltered];
            let {$and } = priceOptions[Pricefiltered];

            if(Pricefiltered == 'under rs 999') {


                if(filtered === 'all') {

                    products = await Product.aggregate([{$match: {price}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {price}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))

                } else {

                    products = await Product.aggregate([{$match: {price,company: filtered.toUpperCase()}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {price,company: filtered.toUpperCase()}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))

                }
            } else {

                if(filtered === 'all') {

                    products = await Product.aggregate([{$match: {$and}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {$and}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))

                } else {

                    products = await Product.aggregate([{$match: {$and,company: filtered.toUpperCase()}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {$and,company: filtered.toUpperCase()}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
                }

              

            }
            console.log('here it is broh : ',price,$and)


            
            filteredAs = filtered;
            pricefilteredAs = Pricefiltered;


        } else if (Pricefiltered && searchData) {

            let { price } = priceOptions[Pricefiltered];
            let {$and } = priceOptions[Pricefiltered];

            if(Pricefiltered == 'under rs 999') {

                    products = await Product.aggregate([{$match: {price,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                    totalProducts = await Product.aggregate([{$match: {price,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))

            } else {

                products = await Product.aggregate([{$match: {$and,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
                totalProducts = await Product.aggregate([{$match: {$and,"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))

            }

            pricefilteredAs = Pricefiltered;


        } else if (sorted) {
            products = await handleSorting(sorted, skip, limit);
            totalProducts = await Product.aggregate([{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
            sortedAs = sorted;
        } else if (filtered) {

            if( filtered !== 'all') {

                products = await handleCompanyFiltering(filtered, skip, limit);
                totalProducts = await Product.aggregate([{$match:{company: filtered.toUpperCase() }},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
            } else {
                products = await handleCompanyFiltering(filtered, skip, limit);
                totalProducts = await Product.aggregate([{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
            }

            filteredAs = filtered;
        } else if (Pricefiltered) {
            products = await handlePriceFiltering(Pricefiltered, skip, limit);
            totalProducts = await Product.aggregate([{$match:priceOptions[Pricefiltered] },{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))

            pricefilteredAs = Pricefiltered;
        } else if (searchData) {
            products = await handleSearch(searchData, skip, limit);
            totalProducts = await Product.aggregate([{$match: {"name": { $regex: `.*${searchData}.*`, $options: 'i' }}},{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))

        } else {
            products = await Product.aggregate([{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{ $skip: skip },{ $limit: limit }])
            totalProducts = await Product.aggregate([{$lookup: { from: 'categories',localField: 'category',foreignField: 'category',as: 'categoryDetails'}},{ $unwind: '$categoryDetails' },{$match: {'categoryDetails.isListed': true}},{$count: 'total'}]).then(result => (result[0] ? result[0].total : 0))
        }

        const totalPages = Math.ceil(totalProducts / limit);

        const queryString = Object.keys(req.query)
            .filter(key => key !== 'page' && key !== 'limit')
            .map(key => `&${key}=${req.query[key]}`)
            .join('');
        console.log(queryString)
        console.log('yeah products : ',products)
        res.render('viewAllProducts', {
            products,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit
            },
            queryString,
            searchData,
            i: 1,
            sortedAs,
            filteredAs,
            pricefilteredAs
        });
        

    } catch (error) {
        console.log(error.message);
    }
};




const handleSearch = async (searchData,skip,limit) => {
    return await Product.aggregate([

        {
            $match: {
                "name": { $regex: `.*${searchData}.*`, $options: 'i' }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: 'category',
                as: 'categoryDetails'
            }
        },
        { $unwind: '$categoryDetails' },
        {
            $match: {
                'categoryDetails.isListed': true
            }
        },
        { $skip: skip },
        { $limit: limit }
    ]);
       

};


const handlePriceFiltering = async (priceRange, skip, limit) => {
    const priceOptions = {
        'under rs 999': { price: { $lte: 999 } },
        'rs 1000 to rs 2999': { $and: [{ price: { $gte: 1000 } }, { price: { $lte: 2999 } }] },
        'rs 3000 to rs 5000': { $and: [{ price: { $gte: 3000 } }, { price: { $lte: 5000 } }] },
        'rs 5000 to rs 10000': { $and: [{ price: { $gte: 5000 } }, { price: { $lte: 10000 } }] },
        'rs 10000 to rs 20000': { $and: [{ price: { $gte: 10000 } }, { price: { $lte: 20000 } }] }
    };
    return await Product.aggregate([

        {
            $match: priceOptions[priceRange]
            
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: 'category',
                as: 'categoryDetails'
            }
        },
        { $unwind: '$categoryDetails' },
        {
            $match: {
                'categoryDetails.isListed': true
            }
        },
        { $skip: skip },
        { $limit: limit }
    ]);
};

const handleCompanyFiltering = async (company, skip, limit) => {
    if (company === 'all') {
        return await Product.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: 'category',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $match: {
                    'categoryDetails.isListed': true
                }
            },
            { $skip: skip },
            { $limit: limit }
        ]);
    } else {
        let capitaledCompany = company.toUpperCase();
        return await Product.aggregate([

            {
                $match: {
                    "company": capitaledCompany
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: 'category',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $match: {
                    'categoryDetails.isListed': true
                }
            },
            { $skip: skip },
            { $limit: limit }
        ]);
    }
};


const handleSorting = async (sortQuery, skip, limit) => {
    const sortOptions = {
        'Price Low To High': { price: 1 },
        'Price High To Low': { price: -1 },
        'A to Z': { name: 1 },
        'Z to A': { name: -1 }
    };
    return await Product.aggregate([
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: 'category',
                as: 'categoryDetails'
            }
        },
        { $unwind: '$categoryDetails' },
        {
            $match: {
                'categoryDetails.isListed': true
            }
        },
        {
            $sort: sortOptions[sortQuery]
        },
        { $skip: skip },
        { $limit: limit }
    ]);
};






const userLogout = async (req, res) => {

    try {
        delete req.session.user_id;
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }
}


const forget = (req, res) => {
    try {


        res.render('forgetP');

    } catch (error) {

        console.log(error);

    }
}


let loadForgetPassOTPPage = async (req, res) => {
    try {

        let { email, otp } = req.body;

        let user = await User.findOne({ email: email });

        if (user) {

            sendVerifyMail(user.name, user.email);

            res.render('forgtP-sub', { message: 'Check youre email, then verify OTP', id: user._id });
        } else {
            res.render('forgetP', { emessage: 'Email has not registered' })
        }




    } catch (error) {

        console.log(error.message);
    }
}



const forgetAction = async (req, res) => {

    try {

        const { email } = req.body
        // console.log(req.body);

        const userData = await User.findOne({ email: email });
        let name = userData?.name;
        let _id = userData?._id;

        console.log(userData)
        console.log(email);

        if (userData) {



            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                requireTLS: true,
                auth: {
                    user: 'aflutech2@gmail.com',
                    pass: 'alcnnusvusvbqpxi'
                }
            });

            const mailOptions = {
                from: 'aflutech2@gmail.com',
                to: email,
                subject: 'For verification email',
                html: '<p>Hi <span style="font-weight:bold"> ' + name + '</span> please click here to <a style="font-weight:bold;text-decoration:none" href="http://localhost:5008/change?id=' + _id + '" > Change </a> youre password.</p>  '

            }
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("Email has been sent:- ", info.response);
                }
            })

            res.render('forgetP', { message: "Please check you're email" });

        } else {
            res.render('forgetP', { emessage: "Invalid Email Adress" })
        }

    } catch (error) {
        console.log(error.message);
    }

}


const loadProfile = async (req, res) => {
    try {
        console.log('ithaa vaz : ', req.session.user_id)
        let user = await User.findOne({ _id: req.session.user_id });

        let ordersCount = await Order.find({user:req.session.user_id}).count()
        let wishCount = await Whishlist.find({user_id:req.session.user_id}).count()

        let wallet = await Wallet.findOne({user_id:req.session.user_id})

        console.log('money here : ',wallet)

        if(req.query.edited) {

            res.render('user-profile', { uSER: user,ordersCount,wallet,wishCount,message:'user edited was successfully' });

        } else {

            res.render('user-profile', { uSER: user,ordersCount,wallet,wishCount });
        }

    } catch (error) {
        console.log(error);
    }
}


const editUser = async(req,res) => {

    try {

        let user = await User.findOne({_id:req.session.user_id})

        console.log('yeah eththththi')
        if(req.query.wrong) {

            res.render('user-proffileEdit',{user,emessage:'enter details properly',user});


        } else {

            res.render('user-proffileEdit',{user})
        }

    } catch (error) {
        console.log(error.message);
    }
}


const submitEditUser = async(req,res) => {

    try {

        let {name,id,email,mobile} = req.body;

        console.log('yeah bruh body here : ',req.body)


        if(name.trim() == '' || email.trim() == '' || mobile.trim() == '') {

            res.redirect('/editUser/?wrong=true')

        } else {

            let updateUser = await User.findByIdAndUpdate({_id:id},{$set:{name:name.trim(),email:email.trim(),mobile:mobile.trim()}});
    
            res.redirect('/profile/?edited=true')
        }


    } catch (error) {
        console.log(error.message);
    }
}


const loadManageAddress = async (req, res) => {

    try {


        let address = await Address.find({ user_id: req.session.user_id });
        let user = await User.findById({_id:req.session.user_id});
        let from = req.query.from        

        console.log('yeah thi is saanam : ', from)
        res.render('user-manageAdd', { address, from, user });


    } catch (error) {

        console.log(error.message);
    }
}


const loadAddAddress = async (req, res) => {

    try {
        let user = await User.findById({_id:req.session.user_id});

        res.render('user-addAddress',{user})

    } catch (error) {

        console.log(error.message)

    }
}


const loadmyOrders = async (req, res) => {

    try {
        const retrySuccess = req.query.retrySuccess
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 10 items per page

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;


        //  products and orders here
        console.log('ee baath etthii ')

        let orderdb = await Order.find({ user: req.session.user_id }).sort({_id:-1}).skip(skip).limit(limit)
        let productsdb = []

         // Get total number of products for pagination information
         const totalOrders = await Order.countDocuments();

         // Calculate total number of pages
         const totalPages = Math.ceil(totalOrders / limit);

        for (let i = 0; i < orderdb.length; i++) {

            console.log('  ithil saanam indooo : ', orderdb[i].product);


            let product = await Product.findOne({ _id: orderdb[i].product })
            productsdb.push(product)
            console.log('ordered items here : ', product);

        }


        let products = productsdb;
        let order = orderdb;


        console.log('products array : ', products)

        let user = await User.findById({_id:req.session.user_id})

        if(retrySuccess) {

            res.render('user-orders', { products,message:'Order Placed', order, user,pagination: {
                totalOrders,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            } });

        } else {

            res.render('user-orders', { products, order, user,pagination: {
                totalOrders,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            } });
        }







        

    } catch (error) {

        console.log(error.message);
    }
}


const orderDetails = async (req,res) => {

    try {
            let orderId = req.query.orderId;
        let order = await Order.findById({_id:orderId});
        let user = await User.findById({_id:req.session.user_id});
        let product = await Product.findById({_id:order.product});
        let coupon = await Coupon.findOne({code:order.coupon_applied});
        // for delivery date
        let dateParts = order.date.split('/');
        let dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);

        // Calculate the date 7 days ago
        let date7DaysLater = new Date();
        date7DaysLater.setDate(dateObject.getDate() + 7);


        if(coupon !== null) {
            
            console.log('this is discount : ',coupon)
            res.render('user-orderDetails',{user,product,order,delivery:date7DaysLater.toDateString(),coupon});
        } else {

            res.render('user-orderDetails',{user,product,order,delivery:date7DaysLater.toDateString(),coupon:'no'});

        }


    } catch (error) {
        console.log(error.message)
    }
}


const cancelOrder = async (req, res) => {

    try {



        let id = req.query.id;
        let FindProductForRestoreQuantity = await Order.findOne({_id:id});
        let restoreQuantity = await Product.findOneAndUpdate({_id:FindProductForRestoreQuantity.product},{ $inc: { quantity: req.query.quantity } })
        let updateOrderStatus = await Order.findOneAndUpdate({ _id: id }, { $set: { status: 'Cancelled' } });

        if(updateOrderStatus.paymentMethod !== 'Cash On Delivery') {
            let reducePoinValue = Math.floor(updateOrderStatus.totelAmmount)
            let walletUpdate = await Wallet.findOneAndUpdate({user_id:req.session.user_id},{$inc: {Money:reducePoinValue}});

            const newTransaction = new walletTransactionModel({
                user:req.session.user_id,
                product_name: restoreQuantity.name,
                money: FindProductForRestoreQuantity.totelAmmount,
                quantity: FindProductForRestoreQuantity.quantity,
                type: false,
                paymentMethod: FindProductForRestoreQuantity.paymentMethod
                })
    
    
            const saveTransaction = await newTransaction.save();

        }

        res.redirect('/myOrders');



    } catch (error) {

        console.log(error.message);
    }
}



const loadWallet = async (req,res) => {

    try {

        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 10 items per page

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;
        let i = skip+1

        let wallet = await Wallet.findOne({user_id:req.session.user_id});
        let walletHistory = await walletTransactionModel.find({user:req.session.user_id}).sort({_id:-1}).skip(skip).limit(limit)
        const totalTransactions = await walletTransactionModel.countDocuments({user:req.session.user_id});
        let user = await User.findById({_id:req.session.user_id})
        // let reversedHistory = walletHistory.reverse()
        console.log(wallet)
        const totalPages = Math.ceil(totalTransactions / limit);


        if(req.query.empty) {

            res.render('user-wallet',{wallet,walletHistory:walletHistory, user,emessage:'Ammount not enough in wallet',pagination: {
                totalTransactions,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i})

        } else {

            res.render('user-wallet',{wallet,walletHistory:walletHistory, user,pagination: {
                totalTransactions,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i})
        }


    } catch (error) {

        console.log(error.message);
    }
}



const addANewAddress = async (req, res) => {

    try {
        let user = await User.findById({_id:req.session.user_id});
        console.log('aahda ivde etthiin : ', req.session.user_id);


        let { country, state, district, pincode, city, street, houseNo } = req.body;


        if (country.trim() == "" || state.trim() == "" || district.trim() == "" || pincode.trim() == "" || city.trim() == "" || street.trim() == "" || houseNo.trim() == "") {

            console.log('yup got an err,...,,,,..')
            res.render('user-addAddress', { emessage: "fields can't be empty",user });
        }



        const ADdress = new Address({
            user_id: req.session.user_id,
            country: country,
            state: state,
            district: district,
            pincode: pincode,
            city: city,
            street: street,
            houseNo: houseNo
        })


        const aDDress = await ADdress.save();
        let address = await Address.find({ user_id: req.session.user_id });
        console.log(address)
        if (aDDress) {
            res.render('user-manageAdd', { message: `address added`, address,user });
        } else {
            res.render('user-manageAdd', { message: `address adding failed`, address,user });
        }




    } catch (error) {
        console.log(error.message);
    }
}


const EditAddress = async (req, res) => {

    try {

        let user = await User.findById({_id:req.session.user_id});

        console.log('ithaakkkn address body : ', req.query)

        const id = req.query.id;
        const user_id = req.session.user_id
        const addressData = await Address.findById({ _id: id, user_id: user_id });

        if (addressData) {
            res.render('user-editAdd', { address: addressData,user });
        } else {
            res.redirect('/')
        }

    } catch (error) {

        console.log(error.message);
    }
}



const submitEditAddress = async (req, res) => {

    try {


        const { id } = req.query;
        let USer = await User.findById({ _id: req.session.user_id });


        console.log('query set aan :  ', id)
        console.log('ellam here mwoneee : ', req.body);
        const { country, state, district, pincode, city, street, houseNo } = req.body;

        if (country.trim() == "" || state.trim() == "" || district.trim() == "" || pincode.trim() == "" || city.trim() == "" || street.trim() == "" || houseNo.trim() == "") {
            const addressData = await Address.findById({ _id: id });
            console.log('yup got an err,...,,,,..')
            res.render('user-editAdd', { emessage: "fields can't be empty", address: addressData,user:USer });

        } else {



            const update = await Address.findByIdAndUpdate({ _id: id }, { $set: { country: country, state: state, district: district, pincode: pincode, city: city, street: street, houseNo: houseNo } });
            console.log(update);
            if (update) {


                if (req.query.from == 'checkout') {




                    let array = []
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
                    console.log(array);

                    let updateUserAddress = await User.findOneAndUpdate({ _id: user._id }, { $set: { address: array } });
                    console.log(updateUserAddress);
                    console.log('in checkout editing seuccess daaa');

                    res.redirect('/cartCheckout')





                } else {

                    console.log('success kuttaaaa')
                    res.redirect('/manageAddress');
                }



            } else {
                res.render('user-editAdd', { emessage: "Updation failed" });
            }
        }


    } catch (error) {


        console.log(error, message);

    }
}


const deleteAddress = async (req, res) => {

    try {

        console.log('ivde etthunnund')

        const { id } = req.params
        const deleteAddress = await Address.deleteOne({ _id: id })
        if (deleteAddress) {
            res.redirect('/manageAddress');
        } else {
            res.render('user-editAdd', { emessage: 'failed to delete' })
        }


    } catch (error) {

        console.log(error.message);
    }
}


const selectAddresss = async (req, res) => {

    try {

        let array = []
        let user = await User.findById({ _id: req.session.user_id });
        let id = req.query.id;
        let addresS = await Address.findById({ _id: id });
        let address = await Address.find({ user_id: req.session.user_id })
        console.log('ithaaan ath ath ithaan : ', req.query)


        array.push(addresS.houseNo);
        array.push(addresS.street);
        array.push(addresS.city);
        array.push(addresS.district);
        array.push(addresS.state);
        array.push(addresS.country);
        array.push(addresS.pincode);
        console.log(array);

        let updateUserAddress = await User.findOneAndUpdate({ _id: user._id }, { $set: { address: array } });
        let allAddSetToFalse = await Address.updateMany({},{$set:{isSelected:false}});
        let addresSelected = await Address.findOneAndUpdate({ _id: id },{$set:{isSelected:true}});

        console.log(updateUserAddress);
        console.log('ith aaylla');

        if (req.query.from ) {
            res.render('user-manageAdd', { address,user:updateUserAddress, message: 'address selected' })
        } else {
            res.redirect('/cart')
        }



    } catch (error) {

        console.log(error);
    }
}





const loadAboutUs = async (req, res) => {
    try {
        res.render('about-us')
    } catch (error) {
        console.log(error);
    }
}


const loadContactUs = async (req, res) => {
    try {
        res.render('contactUs')
    } catch (error) {
        console.log(error);
    }
}


const loadViewProduct = async (req, res) => {
    try {

        console.log('jygfyfghfghh')

        const id = req.query.id;
        const whishlist = await Whishlist.find({ product_id: id, user_id: req.session.user_id })
        console.log('iyaalde whishlist ithaan : ', whishlist);
        const productDetail = await Product.findById({ _id: id });
        const producTs = await Product.find({category:productDetail.category}).limit(4);

        if (whishlist.length > 0) {

            res.render('viewProduct', { produCt: productDetail, products: producTs, thisIsWhish: true });
        } else {
            res.render('viewProduct', { produCt: productDetail, products: producTs, thisIsWhish: false });

        }
    } catch (error) {
        console.log(error);
    }
}


const ChangeImageInViewProduct = async (req,res) => {

    try {
        

        

        console.log('haa query from view image done',req.query);
        res.status(200).json({ message: 'got it', });


    } catch (error) {

        console.log(error.message)
    }
}



const loadCart = async (req, res) => {

    try {

        let user = req.session.user_id;
        let ThisFrom = req.query.ThisFrom;
        let isError = req.query.qMessage;


        let cartProducts = await Cart.aggregate([
            { $match: { user_id: user } },
            { $unwind: '$products_id' },
            {
              $addFields: {
                products_id: { $toObjectId: '$products_id' } // Convert products_id to ObjectId
              }
            },
            {
              $lookup: {
                from: 'products',
                localField: 'products_id',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            { $unwind: '$productDetails' },
            {
              $lookup: {
                from: 'categories',
                localField: 'productDetails.category', // Assuming product schema has a category field
                foreignField: 'category',
                as: 'categoryDetails'
              }
            },
            { $unwind: '$categoryDetails' },
            {
              $match: {
                'categoryDetails.isListed': true
              }
            },
            {
              $project: {
                productDetails: 1
              }
            }
          ]);

          let array = cartProducts.map(item => item.productDetails);


          console.log('here is cart : ',array)

        if (array.length > 0) {

            

            let sumOfProducts = array.reduce((accumulator, element) => {
                accumulator += element.price;
                return accumulator;
            }, 0);




            console.log('sum is here : ', sumOfProducts)

            if(isError) {
                res.render('cart', { products: array, sum: sumOfProducts,emessage:req.query.qMessage });
            } else {

                if (ThisFrom) {
    
                   
    
                        console.log('monee cart letthi if 1 : ', array);
                        res.render('cart', { products: array, sum: sumOfProducts, emessage: 'select an address first' });
                    
    
                } else {
    
                   
    
                        console.log('monee cart letthi if 2 : ', array);
                        console.log('yeeah got it hereeee;',req.query.qMessage)
                        if(req.query.quantityOf1) {
                            res.render('cart', { products: array, sum: sumOfProducts,emessage:req.query.qMessage,theK:req.query });
    
                        } else {
    
                            res.render('cart', { products: array, sum: sumOfProducts,emessage:req.query.qMessage });
                        }
                                
    
                }

            }

        } else {

            console.log('monee cart letthi else : ');
            res.render('cart-empty');
        }




    } catch (error) {

        console.log(error.message);
    }
}


const updateCartQuantity = async (req,res) => {

    try {

        
        let coupons = await Coupon.find()

        let array = []
        let user = req.session.user_id;
        let productQuantitys = []
        let bodyValues = Object.values(req.body)
        productQuantitys.push(...bodyValues)


        let findcartProducts = await Cart.find({ user_id: user })

        console.log('body quantitys : ',productQuantitys)
        console.log('cart products : ', findcartProducts.length)

        if (findcartProducts.length > 0) {

            for (let i = 0; i < findcartProducts.length; i++) {

                array.push(await Product.findOne({ _id: findcartProducts[i].products_id }))
                console.log('each quantity : ',findcartProducts[i])
            }

        }

        console.log('products here from cart : ',array)
            let sumOfProducts = array.reduce((accumulator, element) => {
                accumulator += element.price;
                return accumulator;
            }, 0);


            let Qchecker = 0
            let positionForQcheck = 0
            for(let i = 0; i < productQuantitys.length; i++) {

                if(productQuantitys[i] > 1) {
                


                    if(array[i].quantity - productQuantitys[i] < 0) {
                        productQuantitys[i] = productQuantitys[i] -1
                        sumOfProducts = sumOfProducts - array[i].price + array[i].price * productQuantitys[i]

                        Qchecker ++
                        positionForQcheck = i
                    } else {
                        sumOfProducts = sumOfProducts - array[i].price + array[i].price * productQuantitys[i]

                    }

                    


                }
            }

            
    
        console.log('body here',req.body)
        console.log('sum of product price : ',sumOfProducts)
        console.log('heeeellllloooooo')

        if(Qchecker > 0) {
            // let slisedName = array[positionForQcheck].name.slice(0,20)
            res.render('cart', { products: array, sum: sumOfProducts, coupons,emessage:` Quantity is not have that much`,productQuantitys });

        } else {

            res.render('cart', { products: array, sum: sumOfProducts, coupons,emessage:req.query.qMessage,productQuantitys });
        }

    } catch (error) {
        console.log(error.message);
    }
}



const updatePriceOnCart = async (req,res) => {

    try {

        console.log('yeeah the cart body is here now : ',req.body);
        res.redirect(`/cart/?quantity=${req.body}`);

    } catch (error) {

        console.log(error.message)
    }
}



const LoadWhishlist = async (req, res) => {

    try {


        let array = []
        let user = req.session.user_id;



        let findwhishProducts = await Whishlist.find({ user_id: user })


        console.log('sherikk 0 aan verndath : ', findwhishProducts.length)

        console.log('zeroyil ulla product_id : ', findwhishProducts)

        if (findwhishProducts.length > 0) {

            for (let i = 0; i < findwhishProducts.length; i++) {

                array.push(await Product.findOne({ _id: findwhishProducts[i].product_id }))
            }


            // let sumOfProducts = array.reduce((accumulator, element) => {
            //     accumulator += element.price;
            //     return accumulator;
            // }, 0);




            // console.log('sum is here : ', sumOfProducts)



            console.log('monee cart letthi if  : ', array);
            res.render('whishlist', { whishlist: array, wishes: findwhishProducts });
        } else {

            console.log('monee cart letthi else : ');
            res.render('empty-whishlist');
        }




    } catch (error) {

        console.log(error.message);
    }
}



const addToWhishlist = async (req, res) => {

    try {

        let whereFrom = req.query.from;
        // Whishlist date settings here 
        const currentDate = new Date();

        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = currentDate.getFullYear();

        const formattedDate = `${day}/${month}/${year}`;

        console.log('date of Whish : ', formattedDate);

        // Whishlist date settings ends here 



        let product_id = req.query.id
        let user_id = req.session.user_id
        console.log('whishlistlekk ethhhiii ', product_id, ' ithaan user : ', user_id);

        let ifAlreadyAdded = await Whishlist.findOne({ user_id: user_id, product_id: product_id })
        if (ifAlreadyAdded) {
            res.redirect('/');

        } else {



            const whishlist = new Whishlist({
                user_id: user_id,
                product_id: product_id,
                added_on: formattedDate,
                is_wish: 'true'


            })



            const addedTOWhishlist = await whishlist.save();
            if (addedTOWhishlist) {

                console.log('ith wish l ethi monee , from saved')

                if (whereFrom == 'view') {
                    console.log('ith wish l ethi monee , from this got is from view')

                    res.redirect(`/viewProduct/?id=${product_id}`);

                } else {

                    res.redirect('/');
                }

            }

        }




    } catch (error) {

        console.log(error.message);

    }
}





const addToCart = async (req, res) => {

    try {

        let isWish = req.query.from
        let id = req.query.id
        let iid = req.session.user_id

        if (isWish) {
            let deleteWhishOne = await Whishlist.deleteOne({ user_id: iid, product_id: id });

            console.log('aahda delete aayn whish :', deleteWhishOne)
        }

        console.log('yeah ethee: ', isWish);

        console.log('cartilekk', id, 'ithaan user : ', iid);
        let ifAlreadyAdded = await Cart.findOne({ user_id: iid, products_id: id })
        if (ifAlreadyAdded) {
            res.redirect('/cart');

        } else {



            const cart = new Cart({
                user_id: iid,
                products_id: id,

            })


            const addedTOCart = await cart.save();
            if (addedTOCart) {

                res.redirect('/');
            }

        }
    } catch (error) {

        console.log(error.message);
    }
}



const RemovePdtFrmCart = async (req, res) => {

    try {

        console.log('ivde ettththhhhiiiiiiinnnnnnnn')

        const { id } = req.params
        const usr = req.session.user_id
        const removeFromCart = await Cart.deleteOne({ products_id: id, user_id: usr });
        if (removeFromCart) {
            res.redirect('/cart');
        } else {

            console.log('from else case cart, not removed');
            res.redirect('/cart');

        }

    } catch (error) {

        console.log(error.message);
    }
}

const couponAdding = async (req, res) => {

    try {

        console.log('coupon here : ',req.query);

        if (req.query.code.trim() == '') {

            res.redirect(`/cartCheckout/?couponAdded=wrong&quantity=${req.query.quantity}`);


        } else {



            let coupons = await Coupon.find({code:req.query.code.toUpperCase()})
            console.log(coupons)

            if(coupons.length>0){
                res.redirect(`/cartCheckout/?couponAdded=${coupons[0].code}&quantity=${req.query.quantity}`);

            } else {
                res.redirect(`/cartCheckout/?couponAdded=wrong&quantity=${req.query.quantity}`);

            }

        }



    } catch (error) {

        console.log(error.message);
    }
}


const RemovePdtFrmWhishlist = async (req, res) => {

    try {



        const id = req.params.id
        const usr = req.session.user_id
        console.log('ivde ettththhhhiiiiiiinnnnnnnn evde? whish list delete', id, 'user id : ', usr);
        const removeFromWish = await Whishlist.deleteOne({ product_id: id, user_id: usr });
        console.log('ssaanam kittyyyyyy', removeFromWish)
        if (removeFromWish) {
            if (req.params.from == 'home') {

                const product = await Product.findOneAndUpdate({ _id: id }, { $set: { is_wish: 'false' } })


                res.redirect('/');

            } else if (req.params.from == 'view') {

                const product = await Product.findOneAndUpdate({ _id: id }, { $set: { is_wish: 'false' } })


                res.redirect('/viewProduct/?id=' + id);

            } else {

                const product = await Product.findOneAndUpdate({ _id: id }, { $set: { is_wish: 'false' } })


                res.redirect('/whishlist');
            }
        } else {

            console.log('from else case cart, not removed');
            res.redirect('/whishlist');

        }



    } catch (error) {

        console.log(error.message);
    }
}


const cartCheckQSetup = async(req,res) => {

    try {


        let quantity = []
        let lengthOfReqBody = Object.keys(req.body);
        for(let i = 0;i<lengthOfReqBody.length;i++) {
            let nameStr = 'quantityOf'+(i+1);

            if (req.body.hasOwnProperty(nameStr)) { // Check if the property exists in req.body
                quantity.push(req.body[nameStr]); // Push the value of the property to the array
            }
        }

        console.log('need to do this urgent : ',quantity)
        res.redirect(`/cartCheckout/?quantity=${quantity}`)



    } catch (error) {

        console.log(error.message);
    }
}



const loadCartCheckout = async (req, res) => {

    try {

        console.log('reeq dot boody heere from checkout page : ',req.query.length);
        console.log('reeq dot boody heere from checkout page : ',req.query);


        let array = []
        let user = req.session.user_id;
        let quantity = req.query.quantity.split(',')

        console.log('this is new quantity array i guess : ',quantity)

        let findcartProducts = await Cart.find({ user_id: user })
        let USEr = await User.findById({ _id: user })
        let address = await Address.find({ user_id: user })

        if (USEr.address.length !== 0) {



            console.log('ithaaakkknu query : ', req.query.quantities)

            console.log('ithaaan quaantity from caart : ',req.query.quantities);

            console.log('addresses : ', address)
            let resAddress = address.filter((element) => {

                if (element.houseNo == USEr.address[0] && element.street == USEr.address[1] && element.city == USEr.address[2] && element.district == USEr.address[3] && element.state == USEr.address[4] && element.country == USEr.address[5] && element.pincode == USEr.address[6]) {
                    return element
                }

            })

            console.log('athaaan ith ee add : ', resAddress)
            console.log('athaaan ith re.body : ')


            if (findcartProducts.length > 0) {

                for (let i = 0; i < findcartProducts.length; i++) {

                    array.push(await Product.findOne({ _id: findcartProducts[i].products_id }))
                }

                console.log('ithaakkn ellaaa addressum : ', address)
                let sumOfProducts = array.reduce((accumulator, element) => {
                    accumulator += element.price;
                    return accumulator;
                }, 0);

                console.log('sum is here from checkout : ', sumOfProducts)


                if (req.query.recome) {


                            console.log('monee cart letthi if from checkout : ', array, USEr);
                            console.log('yaahaa putheeth : ',req.query.quantities) ;

                            if (req.query.howMuch) {
    
                                res.render('cart-checkout', { emessage: req.query.howMuch + ' product is out of stock', products: array, sum: sumOfProducts, USEr, resAddress });
                            } else {
                                res.render('cart-checkout', { emessage: 'product is out of stock', products: array, sum: sumOfProducts, USEr, resAddress });
    
                            }


                    
                } else {

                   

                        console.log('monee cart letthi if from checkout 3 : ', array, USEr);
                        console.log('yaahaa putheeth : ',req.query.quantities) ;
                        
                        // 
                        let count = 0;
                        let k
                        let Qchecker = 0;
                        for(let i = 0;i<array.length;i++) {
                            let integerQty = parseInt(quantity[i])
                            if(quantity[i] !== '1') {
                                console.log('first price',sumOfProducts);

                                sumOfProducts = sumOfProducts - array[i].price
                                console.log('minesed',sumOfProducts);

                                sumOfProducts += array[i].price*integerQty;
                                console.log('quantity plused money',sumOfProducts);

                            }
                                console.log('this is checking : ',array[i].quantity - integerQty);
                                let calc = array[i].quantity - integerQty
                                if(calc < 0) {
                                console.log('succeed')
                                count ++
                                k = i;
                            }

                            if(array[i].quantity == 0) {
                                Qchecker ++
                            }
                        }
                        // 

                        if(Qchecker > 0) {
                            res.redirect(`/cart/?qMessage=  Remove Unavailable Produt First `);

                        } else {

                         

                            if(count == 0) {
                                console.log('yeeahp')

                                if(req.query.couponAdded) {

                                    if(req.query.couponAdded !== 'wrong') {

                                        let couponCode = req.query.couponAdded
                                        console.log('this is of zero : ',couponCode )
                                        let coupon = await Coupon.findOne({code:couponCode})
                                        console.log('the queryryryryyryr : ',coupon)
                                        res.render('cart-checkout', { products: array, sum: sumOfProducts, USEr, resAddress,quantity, coupon});
                                    } else{
                                        res.render('cart-checkout', { products: array, sum: sumOfProducts, USEr, resAddress,quantity,couponEmessage:'The entered coupon is wrong' });

                                    }



                                } else {

                                    res.render('cart-checkout', { products: array, sum: sumOfProducts, USEr, resAddress,quantity });
                                }
                            } else {

                                if(k == 0) {
                                    res.redirect(`cart/?qMessage=  First product's quantity not available that much `);

                                } else if (k == 1) {
                                    res.redirect(`cart/?qMessage=  Second product's Quantity not available that much `);

                                } else if (k == 2) {
                                    res.redirect(`cart/?qMessage= Third product's Quantity not available that much `);

                                } else {

                                    res.redirect(`cart/?qMessage=  ${k+1}th product's quantity not available that much `);
                                }
                            }
                        }
                    


                }
            } else {


                res.render('cart-checkout', { emessage: 'product is out of stock', products: array, sum: sumOfProducts });

            } 




        } else {
            console.log('yeaahaa :',req.query.quantities)
            console.log('yeah ith sett address illah')

            res.redirect('/cart?ThisFrom=nonAd')

        }
    } catch (error) {

        console.log(error.message);
    }
}



const placeOrder = async (req, res) => {

    try {

        // ordered date settings here 
        const currentDate = new Date();

        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = currentDate.getFullYear();

        const formattedDate = `${day}/${month}/${year}`;

        console.log('date of order : ', formattedDate);

        // ordered date settings ends here 




        console.log('place order nte body : ', req.body)

        // ithil ind ellaaa product idsum
        let ids = typeof req.body.product__Id
        console.log('ithaan ideees nte single type :', ids)


        if (typeof req.body.product__Id == 'string') {





            let user_id = req.session.user_id;
            let payment_method = req.body.method;
            let product_id = req.body.product__Id;
            console.log('ivde etheeeneee')
            let findProdcut = await Product.findById({ _id: product_id });
            console.log('ivdeyum etheeeneee')
            let quantity = parseInt(req.body.Quantity[0]);
            let deliveryCarge = 50;
            let totelAmmount = parseFloat(req.body.sumofAmmount.replace(/[^0-9.-]+/g,""));

            console.log('this is the totel ammount thing. need to edit :',totelAmmount)

            let date = formattedDate;




            if (findProdcut.quantity < 1) {

                res.redirect('/cartCheckout/?recome=true')


            } else {


                let order
                
                
                if(req.body.coupon) {

                     order = new Order({
                        product: product_id,
                        paymentMethod: payment_method,
                        quantity: quantity,
                        deliveryChaerge: deliveryCarge,
                        totelAmmount: totelAmmount,
                        user: user_id,
                        coupon_applied:req.body.coupon,
                        date: date,
                        status: 'Order Placed'
                    })

                } else {

                


                        order = new Order({
                            product: product_id,
                            paymentMethod: payment_method,
                            quantity: quantity,
                            deliveryChaerge: deliveryCarge,
                            totelAmmount: totelAmmount,
                            user: user_id,
                            date: date,
                            status: 'Order Placed'
                        })
                }

                if (req.body.method == 'Wallet') {


                    let wallet = await Wallet.findOne({user_id:req.session.user_id});
                    let money = wallet.Money - (totelAmmount + 50 + totelAmmount/10 )
                    console.log('money in wallet is ',money)
                    if(money < 0 ) {
                        console.log('yeaah less thsn 0 in wallet')
                        res.redirect('/wallet/?empty=true')


                    } else {

                        console.log('yes ordered using wallet')
                        
                        console.log('purchased ammount : ',totelAmmount)

                        let MoneyCHangeFromWALLET = await Wallet.findOneAndUpdate({user_id:req.session.user_id},{$inc:{Money: -totelAmmount}})
                        console.log(MoneyCHangeFromWALLET)
                        const orderSaved = await order.save();
                        
                        console.log('saved : ')
                        let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -parseInt(req.body.Quantity) } });
                        
                        const removeFromCart = await Cart.deleteOne({ products_id: product_id, user_id: user_id });

                        if (orderSaved) {
                            console.log('saved : ');



                            const newTransaction = new walletTransactionModel({
                                user:req.session.user_id,
                                product_name: findProdcut.name,
                                money: totelAmmount,
                                quantity: quantity,
                                type: true,
                                paymentMethod: payment_method
                                })
                    
                    
                            const saveTransaction = await newTransaction.save();




                            let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -parseInt(req.body.Quantity) } });
                        
                            const removeFromCart = await Cart.deleteOne({ products_id: product_id, user_id: user_id });

                            res.redirect('/loadOrderSuccess')
                        }

                    }

                } else {

                    if(totelAmmount > 1000) {

                        console.log('its greaterthan 1000 to nop : ',totelAmmount)

                        res.redirect("/cart/?qMessage=Can`t buy products greater than 1000rs using `Cash On Delivery`")
                        
                    } else {
                        
                        
                        
                    console.log('yeah its okay with cod : ',totelAmmount)
                    const orderSaved = await order.save();
    
                    if (orderSaved) {
                        console.log('saved : ');
                        let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -parseInt(req.body.Quantity) } });
    
                        const removeFromCart = await Cart.deleteOne({ products_id: product_id, user_id: user_id });
                        res.redirect('/loadOrderSuccess')
                    }
                }
                    }


            }




        } else {

            let count = 0


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
             const obj = { quantity: '1,2' };

                // Extract the quantity string
            const quantityString = req.body.Quantity;

            // Split the string by commas to get an array of strings
            const quantityArray = quantityString.split(',');

            // Convert the array of strings to an array of numbers
            const quantityNumbers = quantityArray.map(Number);

            // Output the resulting array
            console.log(quantityNumbers); // Output: [1, 2]
            let wallet = await Wallet.findOne({user_id:req.session.user_id});
                let thenWalletMoney = wallet.Money;

            for(let k = 0;k< req.body.product__Id.length; k++) {

                        // let money = wallet.Money - (totelAmmount + 50 + totelAmmount/10 )

                            let findProd = await Product.findById({ _id: req.body.product__Id[k]});
                            thenWalletMoney = thenWalletMoney - (findProd.price*quantityNumbers[k] + findProd.price/10 + 50);
                            console.log('the wallet money here : ',thenWalletMoney)
                            console.log('each product quantity here : ',findProd.price*quantityNumbers[k]);
                            console.log('this is each tax : ',findProd.price/10)

            }

            console.log('the wallet money here : ',thenWalletMoney)

                for (let i = 0; i < req.body.product__Id.length; i++) {


                    let user_id = req.session.user_id;
                    let payment_method = req.body.method;
                    let product_id = req.body.product__Id[i];

                    let findProdcut = await Product.findById({ _id: product_id });
            

                    let quantity = quantityNumbers[i];
                    console.log('ith checking array value ;;',quantity)
                    let deliveryCarge = 50; 
                    let totelAmmount = findProdcut.price *quantity + 50;
                    let date = formattedDate;





                    let order
                
                
                    if(req.body.coupon) {
    
                         order = new Order({
                            product: product_id,
                            paymentMethod: payment_method,
                            quantity: quantity,
                            deliveryChaerge: deliveryCarge,
                            totelAmmount: Math.floor(totelAmmount + (findProdcut.price*quantity/10)),
                            user: user_id,
                            coupon_applied:req.body.coupon,
                            date: date,
                            status: 'Order Placed'
                        })

                      
                    } else {
    
                    
    
    
                         order = new Order({
                            product: product_id,
                            paymentMethod: payment_method,
                            quantity: quantity,
                            deliveryChaerge: deliveryCarge,
                            totelAmmount: Math.floor(totelAmmount + (findProdcut.price*quantity/10)),
                            user: user_id,
                            date: date,
                            status: 'Order Placed'
                        })
                    }




                    // 
                    if (req.body.method == 'Wallet') {

                        


                        console.log('money in wallet is ',thenWalletMoney)
                        if(thenWalletMoney < 0 ) {
                            
                            res.redirect('/wallet/?empty=true')
    
                        } else {
    
                            console.log('yes ordered using wallet')
                            
                            console.log('purchased ammount : ',totelAmmount)
    
                            let MoneyCHangeFromWALLET = await Wallet.findOneAndUpdate({user_id:req.session.user_id},{$inc:{ Money: -Math.floor(totelAmmount + (findProdcut.price*quantity/10))}})
                            console.log(MoneyCHangeFromWALLET)
                            const orderSaved = await order.save();
                            
                            console.log('saved : ')
                            
                            if (orderSaved) {
                                console.log('saved : ');
    
    
    
                                const newTransaction = new walletTransactionModel({
                                    user:req.session.user_id,
                                    product_name: findProdcut.name,
                                    money: Math.floor(totelAmmount + (findProdcut.price*quantity/10)),
                                    quantity: quantity,
                                    type: true,
                                    paymentMethod: payment_method
                                    })
                        
                        
                                const saveTransaction = await newTransaction.save();
    
    
    
    
                                let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -quantityNumbers[i] } });
                            
                                const removeFromCart = await Cart.deleteOne({ products_id: product_id, user_id: user_id });
    
                            }
    
                        }
    
                    } else {
                        let parsedSum = parseFloat(req.body.sumofAmmount.replace(/[^0-9.-]+/g,""));

                        if(parsedSum > 1000) {

                            console.log('its greaterthan 1000 to nop : ',parsedSum)
                            res.redirect("/cart/?qMessage=Can`t buy products greater than 1000rs using `Cash On Delivery`")
                            
                        } else {

                            const orderSaved = await order.save();
            
                            if (orderSaved) {
                                console.log('saved : ');
                                let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -quantityNumbers[i] } });
            
                                const removeFromCart = await Cart.deleteOne({ products_id: product_id, user_id: user_id });
                            }
                        }
    
                    }
                    // 









                    // const orderSaved = await order.save();

                    // if (orderSaved) {
                    //     console.log('saved : ', i + 1)

                    //     let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -quantityNumbers[i] } });


                    //     const removeFromCart = await Cart.deleteOne({ products_id: product_id, user_id: user_id });

                    //     console.log('saved')


                    // }

                }



                res.redirect('/loadOrderSuccess')



            }



        }







    } catch (error) {

        console.log(error.message);
    }
}

const loadOrderSuccess = async (req, res) => {

    try {


        res.render('orderSuccess')

    } catch (error) {

        console.log(error.message);

    }
}




const onlinePaymentController = async (req,res) => {

    try {

        let isFailed = req.query.failed;

        // ordered date settings here 
        const currentDate = new Date();

        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = currentDate.getFullYear();

        const formattedDate = `${day}/${month}/${year}`;

        console.log('date of order : ', formattedDate);



            console.log('yeaah its body : ',req.body);

        if (typeof req.body.product__Id == 'string') {





            let user_id = req.session.user_id;
            let payment_method = req.body.method;
            let product_id = req.body.product__Id;
            console.log('ivde etheeeneee')
            let findProdcut = await Product.findById({ _id: product_id });
            console.log('ivdeyum etheeeneee')
            let quantity = parseInt(req.body.Quantity[0]);
            let deliveryCarge = 50;

            // Remove the currency symbol and any non-numeric characters
            let totelAmmount = parseFloat(req.body.sumofAmmount.replace(/[^0-9.-]+/g,""));
            let date = formattedDate;




            if (findProdcut.quantity < 1) {

                res.redirect('/cartCheckout/?recome=true')


            } else {

                let order;

                if(isFailed) {

                    order = new Order({
                        product: product_id,
                        paymentMethod: payment_method,
                        quantity: quantity,
                        deliveryChaerge: deliveryCarge,
                        totelAmmount: totelAmmount,
                        user: user_id,
                        date: date,
                        status: 'Pending'
                    })
    

                } else {

                    order = new Order({
                        product: product_id,
                        paymentMethod: payment_method,
                        quantity: quantity,
                        deliveryChaerge: deliveryCarge,
                        totelAmmount: totelAmmount,
                        user: user_id,
                        date: date,
                        status: 'Order Placed'
                    })
    

                }

                const orderSaved = await order.save();

                if (orderSaved) {
                    console.log('saved : ')
                    let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -parseInt(req.body.Quantity) } });

                    const removeFromCart = await Cart.deleteOne({ products_id: product_id, user_id: user_id });

                    if(isFailed) {
                        res.redirect('/myOrders')

                    } else {

                        res.redirect('/loadOrderSuccess')
                    }
                }


            }




        }  else {

            let count = 0


            for (let i = 0; i < req.body.product__Id.length; i++) {

                let product_id = req.body.product__Id[i];

                let findProdcut = await Product.findById({ _id: product_id });

                if (findProdcut.quantity < 1) {

                    count++;

                }

            }

            if (count > 0) {

                res.redirect('/cartCheckout/?recome=true&howMuch=' + count);


            } else {

                // Your object
             const obj = { quantity: '1,2' };

                // Extract the quantity string
            const quantityString = req.body.Quantity;

            // Split the string by commas to get an array of strings
            const quantityArray = quantityString.split(',');

            // Convert the array of strings to an array of numbers
            const quantityNumbers = quantityArray.map(Number);

            // Output the resulting array
            console.log(quantityNumbers); // Output: [1, 2]




                for (let i = 0; i < req.body.product__Id.length; i++) {


                    let user_id = req.session.user_id;
                    let payment_method = req.body.method;
                    let product_id = req.body.product__Id[i];

                    let findProdcut = await Product.findById({ _id: product_id });
            

                    let quantity = quantityNumbers[i];
                    console.log('ith checking array value ;;',quantity)
                    let deliveryCarge = 50; 
                    let totelAmmount = findProdcut.price *quantity;
                    let date = formattedDate;


                        let order;


                        if(isFailed) {

                            order = new Order({
                                product: product_id,
                                paymentMethod: payment_method,
                                quantity: quantity,
                                deliveryChaerge: deliveryCarge,
                                totelAmmount: totelAmmount + (totelAmmount/10) + 50,
                                user: user_id,
                                date: date,
                                status: 'Pending'
                            })

                        } else {

                            order = new Order({
                                product: product_id,
                                paymentMethod: payment_method,
                                quantity: quantity,
                                deliveryChaerge: deliveryCarge,
                                totelAmmount: totelAmmount + (totelAmmount/10) + 50,
                                user: user_id,
                                date: date,
                                status: 'Order Placed'
                            })

                        }


                    


                    const orderSaved = await order.save();

                    if (orderSaved) {
                        console.log('saved : ', i + 1)

                        let updateProductQuantity = await Product.findOneAndUpdate({ _id: product_id }, { $inc: { quantity: -quantityNumbers[i] } });


                        const removeFromCart = await Cart.deleteOne({ products_id: product_id, user_id: user_id });

                        console.log('saved')


                    }

                }




                console.log('yeeah ivde etheettan poyath')
                if(isFailed) {
                    res.redirect('/myOrders')

                } else {

                    res.redirect('/loadOrderSuccess')
                }

            }



        }

        
    } catch (error) {


        console.log(error.message);
    }
}

 
const downloadOrderInvoice = async(req,res) => {

    try {
        const easyinvoice = require('easyinvoice');
        const fs = require('fs');
 

        console.log('query is here now : ',req.query)
        let order = await Order.findById({_id:req.query.orderId});
        let product = await Product.findById({_id:order.product});
        let user = await User.findById({_id:req.session.user_id});
         // for delivery date
         let dateParts = order.date.split('/');
         let dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
 
         // Calculate the date 7 days ago
         let date7DaysLater = new Date();
         date7DaysLater.setDate(dateObject.getDate() + 7);


        
          // Define your invoice data
    let data = {

        'translate' : {
            "invoice": "Order Invoice",  // Default to 'INVOICE'
            "taxNotation": "GST", // or GST
            'number': "Id", // Defaults to 'Number'
            'date': "Order", // Default to 'Date'
            'dueDate': "Delivery", // Defaults to 'Due Date'
            'subtotal': "Totel", // Defaults to 'Subtotal'
            'products': "Product", // Defaults to 'Products'
            'quantity': "Quantity", // Default to 'Quantity'
            'price': "Unit Price", // Defaults to 'Price'
            'productTotal': "Totel", // Defaults to 'Total'
            'total': `Ammount (including GST)

            * Delivery 50₹ will be adedd`, // Defaults to 'Total'
        },

        'settings' : {

            "documentTitle": "Order Invoice", // Defaults to INVOICE
            "currency": "INR",
            "marginTop": 25,
            "marginRight": 25,
            "marginLeft": 25,
            "marginBottom": 25,
        },
        'images': {
            // The logo on top of your invoice
            'logo': "https://public.budgetinvoice.com/img/logo_en_original.png",
        },
        "sender": {
            "company": "DASH FOOTWARES",
            "address": "Malappuram, Kerala",
            "zip": "675636",
            "city": "Malappuram",
            "country": "India"
        },
        "client": {
            "company": `${user.name}`,
            "address": `${user.address}`
            
        },
        'information': {
            // Invoice number
            'number': `${order._id}`,
            // Invoice data
            'date': `${dateObject.toDateString()}`,
            // Invoice due date
            'dueDate': `${date7DaysLater.toDateString()}`
        },
        "products": [
            {
                'quantity': `${order.quantity}`,
                'description': `${product.name}`,
                'taxRate': 10,
                'price': `${product.price}`,

            },
            
        ],
        "deliveryCharge": {
                "description": "Delivery Charge",
                "price": '15.00' // Example delivery charge amount
            },
        "bottomNotice": "Thank you for choosing DASH FOOTWARES."
    };

    try {
        // Create the invoice
        const result = await easyinvoice.createInvoice(data);

        // Save the invoice to a file
        fs.writeFileSync("invoice.pdf", result.pdf, 'base64');

        // Send the invoice as a download
        res.download('invoice.pdf', 'invoice.pdf', (err) => {
            if (err) {
                console.log(err);
            }

            // Optionally, delete the file after sending
            fs.unlinkSync('invoice.pdf');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to create invoice.");
    }



        

    } catch (error) {

        console.log(error.message);
    }
}



const isNotCOD = async (req, res, next) => {
    try {
        console.log('Request received for non-COD payment', req.body.sumofAmmount);



        function cleanCurrencyString(str) {
            let cleanedStr = str.slice(2); // Remove '₹ ' from the start
            cleanedStr = cleanedStr.slice(0, -3); // Remove '.00' from the end
            return Number(cleanedStr);
        }

        let number = cleanCurrencyString(req.body.sumofAmmount);
        console.log(number); // Output: 1173


        let ammouunt = number




        if (req.body.method !== 'Cash On Delivery' && req.body.method !== 'Wallet') {
            let product_id = req.body.product__Id;
            let product = await Product.findOne({ _id: product_id });
            const options = {
                amount: ammouunt*100, // Convert amount to paise
                currency: 'INR',
                receipt: 'receipt#' + Math.random().toString(36).substring(7) // Generate a random receipt number
            };

            razorpayInstance.orders.create(options, (error, order) => {
                if (!error) {
                    console.log('Order created successfully:', order);

                    res.status(200).json({
                        success: true,
                        msg: 'Order Created',
                        order_id: order.id,
                        amount: ammouunt*100,
                        key_id: RAZORPAY_KEY_ID,
                        product_name: product.name,
                        description: product.description,
                        contact: '208320932',
                        name: 'aflu',
                        email: 'aflutech2@gmail.com'
                    });
                } else {
                    console.error('Error creating order:', error);
                    res.status(400).send({ success: false, msg: 'Something went wrong!' });
                }
            });
        } else {
            console.log('yeah here it is gd')
            next();
        }
    } catch (error) {
        console.error('Error in isNotCOD:', error.message);
        res.status(500).send({ success: false, msg: 'Internal server error' });
    }
};



const confirmRetryOrder = async(req,res) => {

    try {

        console.log('thats the spirit')

        const orderId = req.body.orderId;
        console.log('Received orderId:', req.body);
        // Fetch order details from your database
        const order = await Order.findById({_id:req.body.id});
        const product = await Product.findById({_id:order.product})
        const user = await User.findById({_id:req.session.user_id})
        
        
        console.log('order is here : ',order)
        
        const options = {
            amount: order.totelAmmount * 100, // Amount in paise
            currency: "INR",
            receipt:  'receipt#' + Math.random().toString(36).substring(7)
        };
        
        razorpayInstance.orders.create(options, (error, order) => {
            if (!error) {
                console.log('Order created successfully:', order);
                
                res.status(200).json({
                    success: true,
                    msg: 'Order Created',
                    order_id: order.id,
                    amount: options.amount,
                    key_id: RAZORPAY_KEY_ID,
                    product_name: product.name,
                    description: product.description,
                    contact: user.mobile,
                    name: user.name,
                    email: user.email
                });
            } else {
                console.error('Error creating order:', error);
                res.status(400).send({ success: false, msg: 'Something went wrong!' });
            }
        });

    } catch (error) {

        console.log('Received orderId:');

        res.status(500).send({ success: false, msg: 'Internal server error' });
    }
}

const updateOrderInDb = async(req,res) => {

    try {
        console.log('query here : ',req.query)
        let updateOrder = await Order.findByIdAndUpdate({_id:req.query.id},{$set:{status:'Order Placed'}})
        res.redirect('/myOrders/?retrySuccess=true')
    } catch (error) {
        console.log(error.message);
    }
}




const search = async(req,res) => {

    try {

        console.log('reeq.body : ',req.query)
        res.redirect('/viewAllBestProducts/?searchData='+req.body.search);


    } catch (error) {



        console.log(error.message);

    }
}




// const verifyMail = async(req,res) => {

//     try {

//         const updateInfo = await User.updateOne({_id:})

//     } catch (error) {
//         console.log(error.message);
//     }

// }

module.exports = {
    loadRegister,
    successGoogleLogin,
    failureGoogleLogin,
    insertUser,
    verifyMail,
    loadLogin,
    loginSubmit,
    // otpVerification,
    isOtp,
    loadRegisterOtpVerification,
    loadForgetPassOTPPage,
    loadHome,
    viewAllBestProducts,
    userLogout,
    forget,
    forgetAction,
    loadSetNewPass,
    otpValidation,
    changePassword,
    loadProfile,
    loadmyOrders,
    orderDetails,
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

}
