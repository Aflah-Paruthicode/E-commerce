// require('dotenv').config();
require('dotenv').config();
const CLIENT_ID = process.env.passportClient_ID
const CLIENT_SECRET = "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"

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;


passport.serializeUser((user,done) => {
    done(null,user);
})

passport.deserializeUser(function(user, done) {
    done(null, user);
})

passport.use(new GoogleStrategy({
    clientID:CLIENT_ID,
    clientSecret:CLIENT_SECRET,
    callbackURL:"http://localhost:8080/auth/google/callback",
    passReqToCallback:true
},
function(request, accessToken, refreshToken, profile, done) {
    return done(null, profile);
}
))