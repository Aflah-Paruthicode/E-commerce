require("dotenv").config();
const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer")

let otp;

const sendVerifyMail = async (name, email, fromForgot = null) => {
  try {
    if (!fromForgot) otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      requireTLS: true,
      auth: {
        user: process.env.Smtp_authMail,
        pass: process.env.Smtp_authPass,
      },
    });

    const mailOptions = {
      from: "aflutech2@gmail.com",
      to: email,
      subject: "For otp verification email",
      html: fromForgot
        ? `<p>Hi <span style="font-weight:bold">  ${name}
          </span> please click here to <a style="font-weight:bold;text-decoration:none" href="http://localhost:5008/change?id= ${fromForgot} 
           > Change </a> youre password.</p> `
        : `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
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
            </div>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:- ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getHashedPass = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const successGoogleLogin = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/failure");

    const { email, displayName, id } = req.user;
    let userData = await User.findOne({ email });

    if (!userData) {
      const hashed_pass = await getHashedPass(id);

      const newUser = new User({
        name: displayName,
        mobile: 0,
        email: email,
        password: hashed_pass,
        is_verified: 1,
      });

      userData = await newUser.save();

      let newWallet = new Wallet({ user_id: userData._id });
      await newWallet.save();
    }

    req.session.user_id = userData._id;
    return res.redirect("/");
  } catch (error) {
    console.error("Google login error - ", error.message);
    return res.status(500).send("Authentication failed");
  }
};

const failureGoogleLogin = async (req, res) => {
  try {
    return res.redirect("/");
  } catch (error) {
    console.log("Google login error - ", error.message);
    return res.status(500).send("Authentication failed");
  }
};

const handleSignup = async (req, res) => {
  try {
    const { name, mno, email, password } = req.body;
    const formData = { name, email, mno };
    const existingUser = await User.findOne({ email });
    let emessage = null;

    if (existingUser) {
      emessage = "Entered mail already registered,";
    } else if (mno.length !== 10) {
      emessage = "Please enter a valid 10-digit mobile number";
    } else if (!name || name.trim().length < 3) {
      emessage = "Name must be atleast 3 characters";
    } else if (password.length < 5) {
      emessage = "Password must be atleast 5 characters";
    }

    if (emessage) return res.render("registration", { emessage, formData });
    const hashed_pass = await getHashedPass(password);

    const newUser = new User({
      name,
      mobile: mno,
      email,
      password: hashed_pass,
      is_verified: 0,
    });

    const userData = await newUser.save();
    new Wallet({ user_id: userData._id }).save();

    return res.redirect(`/loadRegisterOtpVerification/?id=${userData._id}`);
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("An internal error occurred.");
  }
};

const loadSignup = async (req, res) => {
  try {
    return res.render("registration");
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const loadLogin = async (req, res) => {
  try {
    let NPassword = req.query.NPassword;
    let message = null;

    if (NPassword) message = "Password has been changed";
    return res.render("login", { message });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });
    let emessage = null;

    if (!userData) emessage = "Account not found, please signup first.";
    else if (userData.block == true) emessage = "Your account has been suspended";

    if (emessage) return res.render("login", { emessage });

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) return res.render("login", { emessage: "Invalid email or password" });

    if (userData.is_verified === 0) {
      await sendVerifyMail(userData.name, userData.email);
      return res.render("otpVerification", { message: "please check youre email, and verify OTP", user: userData });
    }

    req.session.user_id = userData._id;
    return res.redirect("/");
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const userLogout = async (req, res) => {
  try {
    delete req.session.user_id;
    return res.redirect("/login");
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const loadRegisterOtpVerification = async (req, res) => {
  try {
    let user = await User.findById({ _id: req.query.id });
    await sendVerifyMail(user.name, user.email);

    return res.render("otpVerification", { SuccessMessage: `Please check youre mail for OTP`, user: user });   
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const verifyRegisterOtp = async (req, res) => {
  try {
    const { id } = req.query;
    const { hiddenOtp } = req.body;
    console.log(otp, hiddenOtp)
    if (hiddenOtp != Number(otp)) return res.json({ success: false, emessage: "Entered otp is invalid" });
    const updatedUser = await User.findByIdAndDelete(id, { $set: { is_verified: 1 } }, { new: true });
    if (!updatedUser) return res.json({ success: false, emessage: "User not found" });

    req.session.user_id = updatedUser._id;

    return res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, emessage: "Server error during verification" });
  }
};

const forget = (req, res) => {
  try {
    return res.render("forgetP");
  } catch (error) {
    console.log(error);
    return res.status(500).send("internal error");
  }
};

let loadForgetPassOTPPage = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.render("forgetP", { emessage: "This email is not registered." });

    await sendVerifyMail(user.name, user.email);
    return res.render("forgtP-sub", { message: "An OTP has been sent to your email. Please verify it to continue.", id: user._id });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const otpValidation = async (req, res) => {
  try {
    let id = req.query.id;
    if (req.body.hiddenOtp == otp) {
      return res.json({ success: true });
    } else {
      return res.json({ success: false, emessage: "Entered OTP is Invalid" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, emessage: "Internal Server Error" });
  }
};

const loadSetNewPass = async (req, res) => {
  try {
    let id = req.query.id;
    return res.render("forgtP-Npswd", { id });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

const changePassword = async (req, res) => {
  try {
    const _id = req.query.id;
    const { password, cpassword } = req.body;
    const userData = await User.findOne({ _id });
    let emessage = null;

    if (password.length < 5 || password.trim() == "") {
      emessage = "Pleese Enter Atleast 5 Characters";
    } else if (password !== cpassword) {
      emessage = "Please Enter Equel Passwords";
    }

    if (emessage) return res.render("forgtP-Npswd", { emessage: "Pleese Enter Equel Passwords", id: userData._id });
    const hashedPassword = await getHashedPass(password);

    await User.updateOne({ _id }, { $set: { password: hashedPassword } });
    return res.redirect("/login/?NPassword=true");
  } catch (error) {
    console.log(error);
    return res.status(500).send("internal error");
  }
};

const forgetAction = async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await User.findOne({ email });

    if (userData) {
      await sendVerifyMail(userData.name, email, userData._id);
      return res.render("forgetP", { message: "Please check you're email" });
    }
    return res.render("forgetP", { emessage: "Invalid Email Adress" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("internal error");
  }
};

module.exports = {
  successGoogleLogin,
  failureGoogleLogin,
  handleSignup,
  loadSignup,
  loadLogin,
  handleLogin,
  userLogout,
  loadRegisterOtpVerification,
  verifyRegisterOtp,
  forget,
  loadForgetPassOTPPage,
  otpValidation,
  loadSetNewPass,
  changePassword,
  forgetAction,
};
