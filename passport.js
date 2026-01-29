// require('dotenv').config();
require("dotenv").config();
const CLIENT_ID = process.env.passportClient_ID;
// const CLIENT_SECRET = ""

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

// passport.use(new GoogleStrategy({
//     clientID:CLIENT_ID,
//     clientSecret:CLIENT_SECRET,
//     callbackURL:"https://kdjfnk.shop/auth/google/callback",
//     passReqToCallback:true
// },

// function(request, accessToken, refreshToken, profile, done) {
//     return done(null, profile);
// }
// ))
