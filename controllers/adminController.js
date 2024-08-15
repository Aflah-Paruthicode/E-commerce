const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const admin_routes = require("../routes/adminRoute");
const CAtegory = require('../models/categoryModel');
const Coupon = require('../models/couponModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel')
const Admin = require("../models/adminModel");
const Banner = require("../models/bannerModel")
const WalletTransaction = require('../models/walletTransactionModel')
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const categoryModel = require("../models/categoryModel");



const loadLogin = async (req, res) => {

    try {

        res.render('login');

    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {

    try {
        const { email, password } = req.body;

        const adminData = await Admin.findOne({ email: email });
        if (adminData) {
            if (adminData.password == password) {
                req.session.admin_id = adminData._id;
                res.redirect("/admin/home");
            } else {
                res.render('login', { emessage: 'Email or password is incorrect' });
            }
        } else {
            res.render('login', { emessage: 'User not valid' });
        }
    } catch (error) {
        console.log(error.message);
    }
}


const loadDashboard = async (req, res) => {

    try {
        const userData = await User.find()

        const topProducts = await Order.aggregate([{$addFields: {productIdObjectId: { $toObjectId: '$product' }}},{$group: {_id: "$productIdObjectId",totalQuantity: { $sum: "$quantity" }}},{ $sort: { totalQuantity: -1 } },{ $limit: 5 },{$lookup: {from: "products",localField: "_id",foreignField: "_id",as: "productDetails"}},{$unwind: "$productDetails"},{$project: {_id: 0,productId: "$_id",productName: "$productDetails.name",totalQuantity: 1}}]);

        const totelOrders = await Order.find().count()
        const visitors = await User.find().count()
        const productCount = await Product.find().count()
        const categoryCount = await CAtegory.find().count()
        let result = await Order.aggregate([

            {  $match : {
                status:'Delivered'
            }

            },
           
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totelAmmount" }
                }
            }
        ]);

        const totalAmmount = result.length > 0 ? result[0].totalAmount : 0;


        const topCategories = await Order.aggregate([
            {
                $addFields: {
                    productIdObjectId: { $toObjectId: '$product' } // Convert productId to ObjectId
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productIdObjectId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $group: {
                    _id: "$productDetails.category",
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    totalQuantity: 1
                }
            }
        ]);



        const topBrands = await Order.aggregate([
            {
                $addFields: {
                    productIdObjectId: { $toObjectId: '$product' } // Convert productId to ObjectId
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productIdObjectId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $group: {
                    _id: "$productDetails.company",
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    brand: "$_id",
                    totalQuantity: 1
                }
            }
        ]);






        const filter = req.query.filter;
    let salesData;
        if(filter) {
        
    if (filter === 'yearly') {
        const { startDate, endDate } = getDateRange(filter);


        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365); // Calculate the date 365 days ago
        
        salesData = await Order.aggregate([
          {
            $match: {
              status: 'Delivered'
            }
          },
          {
            // Step 1: Convert the 'date' field from 'DD/MM/YYYY' to a Date object
            $addFields: {
              orderDate: {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y"
                }
              }
            }
          },
          {
            // Step 2: Match documents where 'orderDate' is within the last 365 days
            $match: {
              orderDate: {
                $gte: oneYearAgo, // Only include dates from one year ago to now
                $lte: new Date()  // Up to the current date
              }
            }
          },
          {
            // Step 3: Group the results by year and calculate total sales
            $group: {
              _id: { $year: "$orderDate" }, // Group by year
              totalSales: { $sum: "$totelAmmount" }
            }
          }
        ]);
        



        res.json(salesData);
    } else if (filter === 'monthly') {
        const { startDate, endDate } = getDateRange(filter);



        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 30); // Calculate the date 365 days ago
        
        salesData = await Order.aggregate([
          {
            $match: {
              status: 'Delivered'
            }
          },
          {
            // Step 1: Convert the 'date' field from 'DD/MM/YYYY' to a Date object
            $addFields: {
              orderDate: {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y"
                }
              }
            }
          },
          {
            // Step 2: Match documents where 'orderDate' is within the last 365 days
            $match: {
              orderDate: {
                $gte: oneYearAgo, // Only include dates from one year ago to now
                $lte: new Date()  // Up to the current date
              }
            }
          },
          {
            // Step 3: Group the results by year and calculate total sales
            $group: {
              _id: { $year: "$orderDate" }, // Group by year
              totalSales: { $sum: "$totelAmmount" }
            }
          }
        ]);


        res.json(salesData);
    } else if (filter === 'weekly') {
        const { startDate, endDate } = getDateRange(filter);


        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 7); // Calculate the date 365 days ago
        
        salesData = await Order.aggregate([
          {
            $match: {
              status: 'Delivered'
            }
          },
          {
            // Step 1: Convert the 'date' field from 'DD/MM/YYYY' to a Date object
            $addFields: {
              orderDate: {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y"
                }
              }
            }
          },
          {
            // Step 2: Match documents where 'orderDate' is within the last 365 days
            $match: {
              orderDate: {
                $gte: oneYearAgo, // Only include dates from one year ago to now
                $lte: new Date()  // Up to the current date
              }
            }
          },
          {
            // Step 3: Group the results by year and calculate total sales
            $group: {
              _id: { $year: "$orderDate" }, // Group by year
              totalSales: { $sum: "$totelAmmount" }
            }
          }
        ]);


        res.json(salesData);
    } else if (filter === 'daily') { 



        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 1);
        
        salesData = await Order.aggregate([
          {
            $match: {
              status: 'Delivered'
            }
          },
          {
            $addFields: {
              orderDate: {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y"
                }
              }
            }
          },
          {
            $match: {
              orderDate: {
                $gte: oneYearAgo, // Only include dates from one year ago to now
                $lte: new Date()  // Up to the current date
              }
            }
          },
          {
            // Step 3: Group the results by year and calculate total sales
            $group: {
              _id: { $year: "$orderDate" }, // Group by year
              totalSales: { $sum: "$totelAmmount" }
            }
          }
        ]);

        
        res.json(salesData);

    }

        
    } else {
    res.render('home', { userData,topProducts,topCategories,topBrands,totelOrders,visitors,totalAmmount,productCount,categoryCount });

}

    


    } catch (error) {
        console.log(error.message);
    }
}




const getDateRange = (filter) => {
    let startDate, endDate;
    const today = new Date();
    
    switch (filter) {
        case 'yearly':
            startDate = new Date(today.getFullYear(), 0, 1); // January 1st of the current year
            endDate = new Date(today.getFullYear() + 1, 0, 0); // December 31st of the current year
            break;
        case 'monthly':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the current month
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the current month
            break;
        case 'weekly':
            const firstDayOfWeek = today.getDate() - today.getDay(); // Assuming Sunday is the first day of the week
            startDate = new Date(today.setDate(firstDayOfWeek));
            endDate = new Date(today.setDate(firstDayOfWeek + 6)); // Last day of the week
            break;
        case 'daily':
            startDate = new Date(today.setHours(0, 0, 0, 0)); // Start of the day
            endDate = new Date(today.setHours(23, 59, 59, 999)); // End of the day
            break;
        default:
            throw new Error('Invalid filter');
    }

    // Reset time for consistency
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
};




const loadCustomerList = async (req,res) => {
    try {

        let totalUsers
        let totalPages
        let useR

        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
        let userDeleted = req.query.userDeleted;
        let userblockUnblock = req.query.userblockUnblock;
        // Calculate the number of items to skip
        const skip = (page - 1) * limit;
        let i = skip+1
        // Get total number of products for pagination information
        totalUsers = await User.countDocuments();

        // Calculate total number of pages
        totalPages = Math.ceil(totalUsers / limit);






            if(req.query.searchData) {
                useR = await User.find({"email": { $regex: `.*${req.query.searchData}.*`, $options: 'i' }}).sort({_id:-1}).skip(skip).limit(limit)
                totalUsers = await User.countDocuments({"email": { $regex: `.*${req.query.searchData}.*`, $options: 'i' }})
            } else {
                
                useR = await User.find().sort({_id:-1}).skip(skip).limit(limit)
            }
            
            totalPages = Math.ceil(totalUsers / limit);
    
            const queryString = Object.keys(req.query)
                .filter(key => key !== 'page' && key !== 'limit')
                .map(key => `&${key}=${req.query[key]}`)
                .join('');






            if(userDeleted) {

                res.render('listCustomers', { customers:useR, message:userDeleted,pagination: {
                    totalUsers,
                    totalPages,
                    currentPage: page,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },i,searchData:req.query.searchData,queryString });
            
            } else if (userblockUnblock) {

                res.render('listCustomers', { customers:useR, message:userblockUnblock,pagination: {
                    totalUsers,
                    totalPages,
                    currentPage: page,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },i,searchData:req.query.searchData,queryString });

            } else {

                res.render('listCustomers', { customers:useR,pagination: {
                    totalUsers,
                    totalPages,
                    currentPage: page,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },i,searchData:req.query.searchData,queryString });
            }
        

    } catch (error) {
        console.log(error.message);
    }
}

const loadProductList = async (req,res) => {
    try {

        let proDucts



        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 10 items per page

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;
        let i = skip+1
        // Get total number of products for pagination information
        let totalProducts = await Product.countDocuments();
        
        // Calculate total number of pages
        
        if(req.query.searchData) {
            proDucts = await Product.find({"name": { $regex: `.*${req.query.searchData}.*`, $options: 'i' }}).sort({_id:-1}).skip(skip).limit(limit)
            totalProducts = await Product.countDocuments({"name": { $regex: `.*${req.query.searchData}.*`, $options: 'i' }})
        } else {
            
            proDucts = await Product.find().sort({_id:-1}).skip(skip).limit(limit)
        }
        
        let totalPages = Math.ceil(totalProducts / limit);

        const queryString = Object.keys(req.query)
            .filter(key => key !== 'page' && key !== 'limit')
            .map(key => `&${key}=${req.query[key]}`)
            .join('');



        if(req.query.newProduct) {

            res.render('listProducts',{ message:'Product Successfully Added.',products:proDucts,pagination: {
                totalProducts,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i,searchData:req.query.searchData,queryString });

        } else if (req.query.edited) {

            res.render('listProducts',{ message:'Product Edited Was Successfully.',products:proDucts,pagination: {
                totalProducts,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i,searchData:req.query.searchData,queryString });

        } else {

            res.render('listProducts',{ products:proDucts,pagination: {
                totalProducts,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i,searchData:req.query.searchData,queryString });
        }

    } catch (error) {
        console.log(error.message);
    }
}





const loadOrders = async(req,res) => {

    try {

        let orders
        let totalPages
        let totalOrders
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;
        let i = skip+1
        // Get total number of products for pagination information
         totalOrders = await Order.countDocuments();

        // Calculate total number of pages

        
        
        
        if(req.query.searchData) {
            orders = await Order.find({"paymentMethod": { $regex: `.*${req.query.searchData}.*`, $options: 'i' }}).sort({_id:-1}).skip(skip).limit(limit)
            totalOrders = await Order.countDocuments({"paymentMethod": { $regex: `.*${req.query.searchData}.*`, $options: 'i' }})
        } else {
            
            orders = await Order.find({}).sort({_id:-1}).skip(skip).limit(limit)
        }
        
        totalPages = Math.ceil(totalOrders / limit);

        const queryString = Object.keys(req.query)
            .filter(key => key !== 'page' && key !== 'limit')
            .map(key => `&${key}=${req.query[key]}`)
            .join('');







        if(req.query.orderChanged) {
            res.render('listOrders', { orders,pagination: {
                totalOrders,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i,message:'Order Status Has Been Changed',searchData:req.query.searchData,queryString });

        } else {

            res.render('listOrders', { orders,pagination: {
                totalOrders,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i,searchData:req.query.searchData,queryString });
        }
        

    } catch (error) {

        console.log(error.message);
    }
}


const loadEditOrder = async(req,res) => {

    try {


        let order_id = req.query.id;
        let product_id = req.query.product_id;

        let product = await Product.findOne({_id:product_id});
        let order = await Order.findOne({_id:order_id});
        let user = await User.findOne({_id:order.user})







        res.render('orderEdit',{product,order,user});


    } catch (error) {

        console.log(error.message);
    }
}


const updateOrder = async(req,res) => {

    try {

        let status = req.body.status;
        let id = req.query.order_id;

        let updateOrderStatus = await Order.findOneAndUpdate({_id:id},{$set:{status:status}})


        res.redirect('/admin/orders/?orderChanged=true');





    } catch (error) {

        console.log(error.message);
    }
}


const loadBanners = async(req,res) => {

    try {
        let slideBanners = await Banner.find({description:'Banner for home page slide'})
        let otherBanners = await Banner.find({description:{$ne:'Banner for home page slide'}})

        res.render('listBanners',{slideBanners,otherBanners});

    } catch (error) {
        console.log(error.message);
    }
}

const changeCurrentBanner = async(req,res) => {

    try {

        let banner = await Banner.findById({_id:req.query.bannerId})
        let startDate = new Date(banner.startDate).toLocaleDateString()
        let endDate = new Date(banner.endDate).toLocaleDateString()

        res.render('editBanner',{banner,startDate,endDate});

    } catch (error) {
        console.log(error.message);
    }
}



 const loadDeleteBanner = async(req,res) => {

    try {
        let id = req.params.id;
        let deleteBanner = await Banner.findOneAndDelete({_id:id});

        res.redirect('/admin/banner')


    } catch (error) {
        console.log(error.message);
    }
 }



const updateBanner = async(req,res) => {

    try {

        let path = require('path');
        let fs = require('fs');

       

        let banner = await Banner.findOne({_id:req.body.id})

        let {url,startDate,endDate} = req.body;
        
        if(req.file) {

            const fullPath = path.join(__dirname, `../public/banners/${banner.image}`);
                fs.unlink(fullPath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }
            });

            let updateBanner = await Banner.findByIdAndUpdate({_id:req.body.id},{$set:{url:url,startDate:startDate,endDate:endDate,image:req.file.filename}})


        } else {

            let updateBanner = await Banner.findByIdAndUpdate({_id:req.body.id},{$set:{url:url,startDate:startDate,endDate:endDate}})
        }

            res.redirect('/admin/banner')


    } catch (error) {
        console.log(error.message)
    }
}
 
const loadAddBannerToSlide = async(req,res) => {

    try {
            let today = new Date().toLocaleDateString(  )
            res.render('addBanner',{today})

    } catch (error) {
        console.log(error.message);
    }
}

const addBannerToSlide = async(req,res) => {

    try {

    

        let {startDate,endDate,url} = req.body

        const banner = new Banner ({
            description:'Banner for home page slide',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            url:url,
            image:req.file.filename,
            })

        const bannersaved = await banner.save();

        if(bannersaved) {
            res.redirect('/admin/banner')
        }



    } catch (error) {
        console.log(error.message);
    }
}


const addCategory = async (req, res) => {


    try {

        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 10 items per page
        let emessage = req.query.emessage
        let message = req.query.message

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;
        let i = skip+1
        // Get total number of products for pagination information
        const totalCate = await CAtegory.countDocuments();

        // Calculate total number of pages
        const totalPages = Math.ceil(totalCate / limit);


        const categorys = await CAtegory.find().sort({_id:-1}).skip(skip).limit(limit)


        res.render('addCategory', { categorys,pagination: {
            totalCate,
            totalPages,
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },i, emessage,message });
        

    } catch (error) {
        console.log(error.message);
    }

}

const submitNewCategory = async (req, res) => {
    try {

        const { category } = req.body;
        let checker = category.toUpperCase().trim()
        const categories = await CAtegory.find();
        const isAvailable = await CAtegory.findOne({category:checker});
        if(isAvailable) {
            res.redirect('/admin/category/?emessage=This category is already available',)

        } else {

            if (category.trim() == "") {
                res.redirect('/admin/category/?emessage=Something went wrong, Try again',)

            } else {
    
                let addingCate = category.toUpperCase().trim()
                const categorY = new CAtegory({
                    category: addingCate
                });
    
                const cat_data = await categorY.save();
                res.redirect('/admin/category/?message=Category was created')
    
            }

        }
        
    }
    catch (error) {
        console.log(error.message);

    }

}


const toUnlistCategory = async(req,res) => {

    try {

        let setCategoryToUnlisted = await CAtegory.findByIdAndUpdate({_id:req.query.id},{$set:{isListed:false}})

        res.redirect('/admin/category');

    } catch (error) {
        console.log(error.message);
    }
}

const toListCategory = async(req,res) => {

    try {

        let setCategoryToUnlisted = await CAtegory.findByIdAndUpdate({_id:req.query.id},{$set:{isListed:true}})

        res.redirect('/admin/category');

    } catch (error) {
        console.log(error.message);
    }
}

const loadProductEdit = async (req, res) => {

    try {
        const id = req.query.id;
        const productData = await Product.findById({ _id: id });
        const category = await CAtegory.find();
        const emessage = req.query.emessage;

        
        if (productData) {
            res.render('productEdit', { product: productData,category,emessage });
        } else {
            res.redirect('/admin/home');
        }

    } catch (error) {
        console.log(error.message);
    }

}

const productImageEdit = async (req,res) => {

    try {


        let path = require('path')
        let fs = require('fs')

        let {position,id} = req.params;



        let product = await Product.findOne({_id:id})
        if(product.images.length < 4) {

            res.redirect(`/admin/EditProduct/?id=${id}&emessage=This is the minimum count of pictures, you can change it, not delete.`)

        

    } else {

        for(let i = 0;i<product.images.length;i++) {

            if(position == i) {

                let removeIMG = await Product.findOneAndUpdate({_id:id},{$pull : {images:product.images[i]}})


                const fullPath = path.join(__dirname, `../public/productImages/${product.images[i]}`);
                fs.unlink(fullPath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }
            });



            }
        }

    }





        res.redirect(`/admin/EditProduct/?id=${id}`)

    } catch (error) {

        console.log(error.message);
    }
}


const productIMGChange = async (req,res) => {

    try {

        let path = require('path')
        let fs = require('fs')

        
        let product = await Product.findOne({_id:req.body.id})
        let i = req.query.id
        let changeIMG = await Product.findByIdAndUpdate({_id:req.body.id},{ $set: { [`images.${i}`] : req.file.filename}})
        const fullPath = path.join(__dirname, `../public/productImages/${product.images[i]}`);
                fs.unlink(fullPath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }
            });


        res.redirect(`/admin/EditProduct/?id=${req.body.id}`)


    } catch (error) {

        console.log(error.message);
    }
}

const submitEditedProduct = async (req, res) => {
    
    try {
        const { id } = req.query;

        if(req.file) {
            const updateIMG = await Product.findByIdAndUpdate({ _id: id }, { $push: { images:req.file.filename}});

        }
        const { name, company,product_desc,price,original_price,quantity,category } = req.body;
        const productData = await Product.findById({ _id: id });
        let categorys = await CAtegory.find()
        
        if (name.trim() == "" || product_desc.trim() == ""|| company.trim() =="" || price.trim() == "" || original_price.trim() == "" || quantity.trim() == "") {
            res.render('productEdit', { emessage: "fields cant be empty",category:categorys, product: productData });

        } else if (price <1 || original_price <1) {
            res.render('productEdit', { emessage: "Do not accept minus value on price and og price",category:categorys, product: productData });

        } else if (quantity <0) {
            res.render('productEdit', { emessage: "Do not accept minus value on quantity",category:categorys, product: productData });

        } else if (parseFloat(price)  >= parseFloat(original_price)) {
            res.render('productEdit', { emessage: "Please set the original price amount greater than price amount",category:categorys, product: productData });

        } else {
            
            const update = await Product.findByIdAndUpdate({ _id: id }, { $set: { name: name, category:category, company: company, product_desc:product_desc, price:price, og_price:original_price, quantity:quantity} });
            if (update) {
                res.redirect('/admin/product/?edited=true');
            } else {
            res.render('productEdit', { emessage: "Updation failed" ,category:categorys, product: productData });
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}




const blockUser = async (req, res) => {
    try {
        


        let id = req.query.id
        const block_User = await User.findByIdAndUpdate({ _id: id },{$set:{block:true}});
        res.redirect('/admin/customers/?userblockUnblock=User has been blocked'); 

            

    } catch (error) {
        console.log(error.message);
    }
}

const UnBlockUser = async(req, res) => {
    try {

        const { id } = req.query
        const unblock_User = await User.findByIdAndUpdate({ _id: id },{$set:{block:false}});
        
        res.redirect('/admin/customers/?userblockUnblock=User has been unblocked')
        

    } catch (error) {
        console.log(error.message);
    }
}


const deleteUser = async(req,res) => {

    try {

        let customer = await User.findOneAndDelete({_id:req.params.id})
        res.redirect('/admin/customers/?userDeleted=User has been deleted')


    } catch (error) {
        console.log(error.message);
    }
}



const logout = async (req, res) => {
    try {

        delete req.session.admin_id ;
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }
}

const loadAddProduct = async(req,res) => {

    try {

        const category = await CAtegory.find();
        res.render('addProduct',{category});

    } catch (error) {
        console.log(error.message);
    }

}


const submitNewProduct = async(req,res) => {

    try {


        const GotProducts = await CAtegory.find();


        if(req.files) {


            const {name,company,price,original_price,quantity,category,product_desc} = req.body;

        if(name.trim() == "" || company.trim() == "" || price.trim() == "" || original_price.trim() == "" || quantity.trim() == "" || category.trim() == "" || product_desc.trim() == "") {

            res.render('addProduct',{emessage:'Fields cant be empty',category:GotProducts,
            
                details:{
                    name,
                    company,
                    price,
                    original_price,
                    quantity,
                    category,
                    product_desc

                }
        });

        } else {

            if(req.files.length < 3) {

                res.render('addProduct',{emessage:'Minimum three pictures needed',category:GotProducts,
                details:{
                    name,
                    company,
                    price,
                    original_price,
                    quantity,
                    category,
                    product_desc

                }
            });


            } else if (price <1 || original_price <1) {

                res.render('addProduct',{emessage:'Do not accept minus value on price section',category:GotProducts,
                details:{
                    name,
                    company,
                    price,
                    original_price,
                    quantity,
                    category,
                    product_desc

                } });
 
            } else if (price >= original_price) {

                res.render('addProduct',{emessage:'Set the original price greater than price amount',category:GotProducts,
                details:{
                    name,
                    company,
                    price,
                    original_price,
                    quantity,
                    category,
                    product_desc

                } });

            } else if (quantity<1) {

                res.render('addProduct',{emessage:'Do not accept quantity less than 1',category:GotProducts,
                details:{
                    name,
                    company,
                    price,
                    original_price,
                    quantity,
                    category,
                    product_desc

                } });

            } else {

           
            let imageArray = []
            for(let i = 0;i<req.files.length;i++) {

                imageArray.push(req.files[i].filename);

            }

            const product = new Product ({
                name:name,
                company:company.toUpperCase(),
                price: parseFloat(price) ,
                og_price:parseFloat(original_price),
                quantity:quantity,
                category:category,
                product_desc:product_desc,
                images:imageArray
            })
    
            const proSaved = await product.save();
            if(proSaved) {

                res.redirect('/admin/product/?newProduct=true')
                    }

    }
        }} else {

            res.render('addProduct',{emessage:'Please add an image',category:GotProducts, 
            details:{
                name,
                company,
                price,
                original_price,
                quantity,
                category,
                product_desc

            }
        });

        }
  

    } catch (error) {
        console.log(error.message);
    }
}


const deleteProduct = async(req,res) => {
    try {

        const { id } = req.params
        const deleteProduct = await Product.deleteOne({ _id: id })
        if (deleteProduct) {
            res.redirect('/admin/product');
        } else {
            res.render('listProducts',{emessage:'failed to delete'})
        }

    } catch (error) {
        console.log(error.message);
    }
}

const deleteCategory = async(req,res) => {
    try {
        const { id } = req.params;
        const deleteCate = await CAtegory.deleteOne({ _id: id });
        if (deleteCate) {
            res.redirect('/admin/category');
        } else {
            res.render('addCategory',{emessage:'failed to delete'});
        }
        
    } catch (error) {
        console.log(error.message);
    }
}


const loadcouponManagement = async(req,res) => {

    try {


        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 3; // Default to 10 items per page

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;
        let i = skip+1
        // Get total number of products for pagination information
        const totalCoupons = await Coupon.countDocuments();

        // Calculate total number of pages
        const totalPages = Math.ceil(totalCoupons / limit);

        const coupons = await Coupon.find().sort({_id:-1}).skip(skip).limit(limit)


        if(req.query.err) {

            res.render('addCoupon', { coupons,emessage:req.query.err,pagination: {
                totalCoupons,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i });


        } else if (req.query.success) {

            res.render('addCoupon', { coupons, message:'Coupon added successful',pagination: {
                totalCoupons,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i });

        } else if (req.query.creation) {

            res.render('addCoupon', { coupons, message:'Coupon updated successful',pagination: {
                totalCoupons,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i });
            
        } else {

            res.render('addCoupon', { coupons,pagination: {
                totalCoupons,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },i });
        }

    } catch (error) {

        console.log(error.message)
    }
}



const addCoupon = async(req,res) => {

    try {

        let today = new Date();


        
        
        const { code, discount, expiry, amount } = req.body;
        let couponCapiteled = code.toUpperCase()
        const coupons = await Coupon.find({code:couponCapiteled});
        
        const gotExpiry = new Date(expiry)



        if(code.trim() == '' || discount.trim() == '' || expiry.trim() == '' || amount.trim() == '') {

            res.redirect('/admin/couponManagement/?err=Enter full details properly');


        } else if (gotExpiry < today) { 

            res.redirect('/admin/couponManagement/?err=please enter a proper expiry date(after today)');


        } else if (coupons.length >0) {

            res.redirect('/admin/couponManagement/?err=Use unique coupon id');


        } else if (parseInt(discount) >= parseInt(amount)) {

            res.redirect('/admin/couponManagement/?err=Please set the purchase amount greater than discount');


        } else {

       

        const coupon = new Coupon({
            code:code.toUpperCase(),
            discount:parseInt(discount),
            amount:parseInt(amount),
            expiry:expiry,
            
         });
        

         
         const couponSaved = await coupon.save();
         
        res.redirect('/admin/couponManagement/?success=true');

     
    }


    } catch (error) {

        console.log(error.message)
    }
}



const editCoupon = async (req,res) => {

    try {

        let coupon = await Coupon.findById({_id:req.query.id})
        if(req.query.err) {

            res.render('couponEdit',{coupon,emessage:req.query.err})


        } else {
            
            res.render('couponEdit',{coupon})
        }

    } catch (error) {
        console.log(error.message)
    }
}




const updateCoupon = async (req,res) => {

    try {

        let today = new Date();


        
        
        const { code, discount, expiry, amount,id } = req.body;
        const coupons = await Coupon.findOne({code:code.toUpperCase()});
        const currentCoupon = await Coupon.findById({_id:id});
        
        const gotExpiry = new Date(expiry)



        if(code.trim() == '' || discount.trim() == '' || expiry.trim() == '' || amount.trim() =='') {

            res.redirect(`/admin/editCoupon/?id=${id}&err=Enter full details properly`);


        } else if (gotExpiry < today) { 

            res.redirect(`/admin/editCoupon/?id=${id}&err=please enter a proper expiry date(after today)`);


        } else if (coupons&& coupons.code !== currentCoupon.code) {

            res.redirect(`/admin/editCoupon/?id=${id}&err=Use unique coupon id`);


        } else if (parseInt(discount) >= parseInt(amount)) {

            res.redirect(`/admin/editCoupon/?id=${id}&err=Please set the purchase amount greater than discount`);


        } else {

       
            const coupons = await Coupon.findByIdAndUpdate({_id:id},{$set:{code:code.toUpperCase(),discount:discount,expiry:expiry,amount:amount}});

         
        res.redirect('/admin/couponManagement/?creation=true');

     
    }

    } catch (error) {
        console.log(error.message)
    }
}

const deleteCoupon = async (req,res) => {

    try {

        let deleteCoupon = await Coupon.findOneAndDelete({_id:req.params.id})

        res.redirect('/admin/couponManagement')

    } catch (error) {
        console.log(error.message)
    }
}



const loadSalesReport = async(req,res) => {

    try {
        


        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
            
        // Calculate the number of items to skip
        const skip = (page - 1) * limit;
        // Get total number of products for pagination information
        let totalOrders = await Order.countDocuments({status:'Delivered'});
            
        // Calculate total number of pages
       
            
            
        let orders = await Order.find({status:'Delivered'}).sort({_id:-1}).skip(skip).limit(limit)
        
        if(req.query.period) {

            if (req.query.period !== 'day' && req.query.period !== 'week' && req.query.period !== 'month' && req.query.period !== 'year') {
                let wholeOrders = await Order.find({status:'Delivered'}).sort({_id:-1}).skip(skip).limit(limit)
                


 // User-provided date in YYYY/MM/DD format
const userDate = req.query.period;

// Convert the userDate to a Date object directly
const startDateObj = new Date(userDate); // This creates a Date object from the string

orders = await Order.aggregate([
  {
    // Step 1: Convert the 'date' field in the schema from 'DD/MM/YYYY' to a Date object
    $addFields: {
      dateObj: {
        $dateFromString: {
          dateString: "$date", // Converts the string date in the schema to Date object
          format: "%d/%m/%Y"   // Format of the date strings in your schema
        }
      }
    }
  },
  {
    // Step 2: Match documents where 'dateObj' is between 'startDateObj' and now
    $match: {
      dateObj: {
        $gte: startDateObj, // Use the Date object created from the user input
        $lte: new Date() // Compare with the current date
      }
    }
  },
  {
    // Step 3: Optionally remove the temporary 'dateObj' field
    $project: {
      dateObj: 0
    }
  }
]);


                  totalOrders = wholeOrders.length


            } else if (req.query.period == 'day') {
                let today = createDateString();
                orders = await Order.find({status:'Delivered',date:today}).sort({_id:-1}).skip(skip).limit(limit)
                totalOrders = orders.length


            } else if (req.query.period == 'week') {

                
                let wholeOrders = await Order.find({status:'Delivered'}).sort({_id:-1}).skip(skip).limit(limit)

                function parseDate(dateStr) {
                    const [day, month, year] = dateStr.split('/');
                    return new Date(`${year}-${month}-${day}`);
                  }
                  
                  // Get today's date
                  const today = new Date();
                  
                  
                  // Calculate the date 6 days ago
                  const sixDaysAgo = new Date(today);
                  sixDaysAgo.setDate(today.getDate() - 6);
                  
                  // Filter the documents based on the date range
                orders = wholeOrders.filter(doc => {
                    const docDate = parseDate(doc.date);
                    return docDate >= sixDaysAgo && docDate <= today;
                  });
                  totalOrders = wholeOrders.length



            } else if (req.query.period == 'month') {

                let wholeOrders = await Order.find({status:'Delivered'}).sort({_id:-1}).skip(skip).limit()

                function parseDateTODate(dateStr) {
                    const [day, month, year] = dateStr.split('/');
                    return new Date(`${year}-${month}-${day}`);
                  }
                  
                  // Get today's date
                  const today = new Date();
                  
                  
                  // Calculate the date 6 days ago
                  const thirtyDaysAgo = new Date(today);
                  thirtyDaysAgo.setDate(today.getDate() - 30);
                  
                  // Filter the documents based on the date range
                orders = wholeOrders.filter(doc => {
                    const docDate = parseDateTODate(doc.date);
                    return docDate >= thirtyDaysAgo && docDate <= today;
                  });
                  totalOrders = wholeOrders.length

            } else if (req.query.period == 'year') {

                let wholeOrders = await Order.find({status:'Delivered'}).sort({_id:-1}).skip(skip).limit()

                function parseDateTODate(dateStr) {
                    const [day, month, year] = dateStr.split('/');
                    return new Date(`${year}-${month}-${day}`);
                  }
                  
                  // Get today's date
                  const today = new Date();
                  
                  
                  const yearAgo = new Date(today);
                  yearAgo.setDate(today.getDate() - 365);
                  
                  // Filter the documents based on the date range
                orders = wholeOrders.filter(doc => {
                    const docDate = parseDateTODate(doc.date);
                    return docDate >= yearAgo && docDate <= today;
                  });
                  totalOrders = wholeOrders.length

            }


        }

        const totalPages = Math.ceil(totalOrders / limit);

        let FindordersSum = await Order.aggregate([{ $match: {status:'Delivered'}},
        {
            $group: {
                _id: null,
            totalAmount: { $sum: "$totelAmmount" }
          }
        }
      ])
      
      let orderTotel = FindordersSum[0].totalAmount
      
      
      let users = []
      let products = []
      let coupon = []

        for(let i = 0;i<orders.length;i++) {

            users.push( await User.findOne({_id:orders[i].user}))
           products.push( await Product.findOne({_id:orders[i].product}))
           if(orders[i].coupon_applied !== 'no') {

               coupon.push(await Coupon.findOne({code:orders[i].coupon_applied}))
           } else {
            coupon.push('no')

           }
        }

                

                if(req.query.format) {
                    let orders = await Order.find({status:'Delivered'})
                    let users = []
                    let products = []
            
                    for(let i = 0;i<orders.length;i++) {
            
                        users.push( await User.findOne({_id:orders[i].user}))
                       products.push( await Product.findOne({_id:orders[i].product}))
                    }


                    if(req.query.format == 'pdf') {

                        generatePDFReport(orders,users,products, res);
                    } else {
                        generateExcelReport(orders,users,products, res);

                    }
                



                } else {

                    
                    let i = skip

                    const queryString = Object.keys(req.query)
            .filter(key => key !== 'page' && key !== 'limit')
            .map(key => `&${key}=${req.query[key]}`)
            .join('');
                    
            
                    res.render('salesReport', { orders,coupon,users,products,orderTotel,pagination: {
                        totalOrders,
                        totalPages,
                        currentPage: page,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1,
                    },i,queryString });
                    





                }


    } catch (error) {

        console.log(error.message);

    }
}




function createDateString() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayString = `${day}/${month}/${year}`;
    return todayString;
  }


  function parseDateTOWeek(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
  }




function generateExcelReport(orders,users,products, res) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
        {header: 'No',key: 'no',width: 10},
        { header: 'Order ID', key: '_id', width: 30 },
        { header: 'Added On', key: 'date', width: 15 },
        { header: 'Buyer', key: 'buyer', width: 10 },
        { header: 'Product Name', key: 'productName', width: 45 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Product Price', key: 'productPrice', width: 20 },
        { header: 'GST', key: 'productGST', width: 10 },
        { header: 'Category', key: 'productCate', width: 15 },
        { header: 'Totel Ammount', key: 'totelAmmount', width: 20 },


        // Define other columns based on your order schema
    ];
    let index = 0;
    let i = 0;
    orders.forEach(order => {
        order.no = index + 1;

        order.buyer = users[i].name;
        order.productName = products[i].name;
        order.productPrice = products[i].price;
        order.productGST = products[i].price/10;
        order.productCate = products[i].category;

        worksheet.addRow(order);
        index ++
        i++
    });

    res.setHeader('Content-disposition', 'attachment; filename=report.xlsx');
    res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    workbook.xlsx.write(res).then(() => {
        res.end();
    });
}









function generatePDFReport(orders,users,products, res) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    let filename = 'report.pdf';
    filename = encodeURIComponent(filename);

    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(17).text('Sales Report', { align: 'center' });
    doc.fillColor('black')
    let i = 0



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
        headers: ['No', 'Order ID', 'Added On', 'Buyer', 'Product Name', 'Quantity', 'Product Price', 'GST Amount', 'Product Category', 'Total Amount'],
        rows: [
            
            // Add more rows as needed
        ]
    };

    for(let k = 0;k<orders.length;k++) {

        let array = []

        array.push(k+1)
        array.push(orders[k]._id)
        array.push(orders[k].date)

        array.push(users[k].name)
        let product_name = products[k].name.slice(0,32)
        array.push(product_name+'...')
        array.push(orders[k].quantity)
        array.push('RS '+products[k].price+'.00')
        array.push('RS '+products[k].price/10+'.00')
        array.push(products[k].category)
        array.push('RS'+orders[k].totelAmmount+'.00')



        table.rows.push(array)
    }


    const startX = 0;
    const startY = 100;
    const rowHeight = 20;
    const columnWidth = 60; // Adjust this value as needed to fit all headers

    // Draw the table headers
    doc.fontSize(6).font('Helvetica-Bold');
    table.headers.forEach((header, i) => {
        doc.text(header, startX + i * columnWidth, startY, { width: columnWidth, align: 'center' });
    });

    // Draw the table rows
    doc.font('Helvetica');
    table.rows.forEach((row, rowIndex) => {
        row.forEach((cell, i) => {
            doc.text(cell, startX + i * columnWidth, startY + rowHeight * (rowIndex + 1), { width: columnWidth, align: 'center' });
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
    loadProductList,
    loadOrders,
    loadEditOrder,
    updateOrder,
    deleteProduct,
    loadBanners,
    changeCurrentBanner,
    loadDeleteBanner,
    updateBanner,
    loadAddBannerToSlide,
    addBannerToSlide,
    addCategory,
    submitNewCategory,
    deleteCategory,
    loadAddProduct,
    submitNewProduct,
    submitEditedProduct,
    productIMGChange,
    productImageEdit,
    blockUser,
    UnBlockUser,
    deleteUser,
    toUnlistCategory,
    toListCategory,
    loadProductEdit,
    logout,
    addCoupon,
    editCoupon,
    updateCoupon,
    deleteCoupon,
    loadcouponManagement,
    loadSalesReport
    // resultOfSearch

}