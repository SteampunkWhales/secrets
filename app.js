require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose")
const encrypt = require("mongoose-encryption")

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});


userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema)

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login")
})

app.route("/register")

.get(function(req, res) {
    res.render("register");
})

.post(async function(req, res){
    const newUser = new User({
        email:req.body.username,
        password: req.body.password
    })

    await newUser.save();

    res.render("secrets")
});




app.route("/login")

.post(async function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    const user = await User.findOne({email: username})

    if (user.password === password){
        res.render("secrets")
    }
})


app.listen(3000, function() {
    console.log("Server started on port 3000 :3")
})