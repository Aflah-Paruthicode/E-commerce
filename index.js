require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const bodyParser = require('body-parser');


const PORT = process.env.PORT
const SecretKey = process.env.SessionSecretKey
const express = require('express');
const app = express();
const nocache = require('nocache');

// for session management.
const session = require('express-session');
app.use(session({
    secret: SecretKey || "default_fallback_key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 50000000000 },
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(nocache());

app.use(express.static(__dirname + '/public'));

// for admins
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

// for users 
const userRoute = require('./routes/userRoute');
app.use('/',userRoute); 



// for category
// const categoryRoute = require('./routes/categoryRoute');
// app.use('/category',categoryRoute);

app.listen(PORT,function() {
    console.log('server is running...'); 
})