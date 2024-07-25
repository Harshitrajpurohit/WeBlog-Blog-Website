if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const Listing = require("./models/listing.js")
const User = require("./models/user.js")
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require('connect-flash');
const port = 3000;

app.engine("ejs",ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended : true}));
app.use(methodOverride("_method"))
app.use(express.static(path.join(__dirname,"/public")))

app.use(session({
    secret: process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 1 * 24 * 60 * 60 * 1000,
        maxAge : 1 * 24 * 60 * 60 * 1000,
    }
}));
app.use(flash());

const dbURL = process.env.ATLASDB_URL;

async function main(){
    await mongoose.connect(dbURL)
}

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
})

let userData = "";

app.get("/", async(req,res)=>{
        let listings = await Listing.find({}).limit(3);
        res.render("index.ejs",{listings,userData,msg : req.flash("loggedin")});
})

app.get("/blog",async(req,res)=>{
    const allListings = await Listing.find({});
    res.render("blog.ejs",{allListings});
})

app.get("/blog/:id", async(req,res)=>{
    const {id} = req.params;
    let listing = await Listing.findById(id);
    let uid = listing.uid;
    let user = await User.findById(uid);
    res.render("show.ejs",{listing,user});
})

app.get("/creator",async(req,res)=>{
    if(userData==""){
        res.redirect("/login");
    }else{
        let {id} = userData;
        let user = await User.findById(id);
        const allListings = await Listing.find({uid:id});
        res.render("creator/dashboard.ejs",{allListings,user});
    }

})

app.get("/creator/:id/new",async(req,res)=>{
    let U_Id = req.params.id;
    res.render("creator/new.ejs",{U_Id})
})

app.post("/creator/:id",async(req,res)=>{
    let uid = req.params.id;
    let {title,description, image} = req.body;
    const newListing = new Listing({title,description,image,uid});
    await newListing.save();
    res.redirect("/creator");
})

app.get("/creator/:id/edit", async(req,res)=>{
    let id = req.params.id;
    let listing = await Listing.findById(id);
    res.render("creator/edit.ejs",{listing});
})

app.patch("/creator/:id",async(req,res)=>{
    let id = req.params.id;
    let {title,description} = req.body;
    await Listing.findByIdAndUpdate(id,{title,description});
    res.redirect("/creator");
})

app.delete("/creator/:id",async(req,res)=>{
    let id = req.params.id;
    await Listing.findByIdAndDelete(id);
    res.redirect("/creator");
})

app.get("/login",(req,res)=>{
    res.render("authentication/login.ejs",{msg : req.flash("userRegistered")});
})

app.post("/register",async(req,res)=>{
    let {username,email,password,confirmPassword} = req.body;

    if(password!=confirmPassword){
        return res.send('Passwords do not match. Please try again.');
    }

    try{
        const existingUsername = await User.findOne({username});
        if(existingUsername){
            return res.send("Username already Taken.")
        }
        const existingeMail = await User.findOne({email});
        if(existingeMail){
            return res.send("User already exists. Please login.")
        }
        const user = new User({username,email,password});
        await user.save();
        req.flash('userRegistered', "SuccessFully registered, Please Login");
        res.redirect("/login");
    }catch(err){
        res.status(500).send("Internal server error");
    }
})

app.post("/login",async(req,res)=>{
    const {email,password} = req.body;
    try{
        const user = await User.findOne({email});
        if(!user){
            return res.send('Invalid email.');
        }
        if(!(password===user.password)){
            req.send('Invalid password.')
        }
        userData = user; 
        req.flash('loggedin', "SuccessFully Logged-in");
        res.redirect("/");
    }catch(err){
        return res.status(500).send('Internal server error' );
    }
})


app.listen(port,()=>{
    console.log("connected...");
})


