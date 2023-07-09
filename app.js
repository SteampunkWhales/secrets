require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// depricated model
// const findOrCreate = require('mongoose-find-or-create')
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    username: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ],
    state: true
  },
    async function (accessToken, refreshToken, profile, cb) {
        const foundOne = await User.findOne({username: profile.emails[0].value});
        if (foundOne === null) {
            console.log("creating new profile...")
            // console.log(profile)
            
            // Registers a new user if the email is not found in the database
            User.register({username: profile.emails[0].value}, profile.id, function(err, user){
                if (err) {console.log(err);}
            });
            
            // searches the database for the _id so it can be accessed with req.user.id
            // this allows dual use for the code for users that used Oauth and standard users
            const dbId = await User.findOne({username: profile.emails[0].value});

            var user = {
                id: dbId.id,
                username: profile.emails[0].value}
            return cb(null, user);

        } else {
            const dbId = await User.findOne({username: profile.emails[0].value});
            var user = {
                id: dbId.id,
                username: profile.emails[0].value}
            return cb(null, user);
        }
    }
));

app.get("/purge", async function(req, res){
    // PURGE USER DATABASE
    await User.deleteMany({});
    console.log('purge compleated')
    res.send(":)")
})

app.get("/test", async function(req, res){
    console.log(req.user);
    const uuu = await User.findOne({username: req.user.username})
    console.log(uuu.id);
    res.redirect("/");
})

app.get("/", function(req, res){
    res.render("home");
});

app.route("/register")

.get(function(req, res) {
    res.render("register");
})

.post(async function(req, res){
    
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets")
            })
        }
    })
});

app.route("/login")

.get(function(req, res){
    res.render("login");
})

.post(async function(req, res){
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.get("/logout", function(req, res){
    req.logout(function(err){
        if (err) {return next(err); }
        res.redirect("/");
    })
});


app.route("/secrets")

.get(async function (req, res) {
    const foundUsers = await User.find({"secret": {$ne: null}});
    console.log(foundUsers);
    res.render("secrets", {usersWithSecrets: foundUsers});
});

app.route("/submit")

.get(function(req, res){
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

.post(async function(req, res){
    const submittedSecret = req.body.secret;


    const foundSecret = await User.findById(req.user.id);
    foundSecret.secret = submittedSecret;
    await foundSecret.save();
    res.redirect("/secrets");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }
  ));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.listen(3000, function() {
    console.log("Server started on port 3000 :3")
})

// TODO
// compleated

// DONE
// - make my own find or create module using await and new mongoose
//because the old package uses callback methods with Mongoose
// ----

// Module does find or create the user entry and returns the cb [verified]
// object but the code doesn't do anything with that once the function is done executing
// make it do something / continue watching after the video 361.Level 6 at 25:48
// 
// Module now correctly formats and encrypts google Oauth accounts created