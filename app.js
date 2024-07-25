
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const Listing = require("./models/listing.js");
const User = require("./models/user.js");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require('connect-flash');
const passport = require("passport");
const LocalStrategy = require("passport-local");

// Config
const port = 3000;
const dbURL = process.env.ATLASDB_URL;
const secret = process.env.SECRET || 'a very secret key';

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1 * 24 * 60 * 60 * 1000,
        maxAge: 1 * 24 * 60 * 60 * 1000,
    }
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));  
passport.serializeUser(User.serializeUser());  
passport.deserializeUser(User.deserializeUser()); 


async function main() {
    await mongoose.connect(dbURL);
}

main().then(() => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log(err);
});

let userData = "";
// Routes
app.get("/", async (req, res) => {
    let listings = await Listing.find({}).limit(3);
    res.render("index.ejs", { listings,userData ,msg: req.flash("loggedin") });
});

app.get("/blog", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("blog.ejs", { allListings,userData });
});

app.get("/blog/:id", async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
    let uid = listing.uid;
    let user = await User.findById(uid);
    res.render("show.ejs", { listing, user,userData });
});

app.get("/creator", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    } else {
        let { id } = req.user;
        let user = await User.findById(id);
        const allListings = await Listing.find({ uid: id });
        res.render("creator/dashboard.ejs", { allListings, user,userData });
    }
});

app.get("/creator/:id/new", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    let U_Id = req.params.id;
    res.render("creator/new.ejs", { U_Id,userData });
});

app.post("/creator/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    let uid = req.params.id;
    let { title, description, image } = req.body;
    const newListing = new Listing({ title, description, image, uid });
    await newListing.save();
    res.redirect("/creator");
});

app.get("/creator/:id/edit", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    let id = req.params.id;
    let listing = await Listing.findById(id);
    res.render("creator/edit.ejs", { listing,userData });
});

app.patch("/creator/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    let id = req.params.id;
    let { title, description } = req.body;
    await Listing.findByIdAndUpdate(id, { title, description });
    res.redirect("/creator");
});

app.delete("/creator/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    let id = req.params.id;
    await Listing.findByIdAndDelete(id);
    res.redirect("/creator");
});

app.get("/login", (req, res) => {
    res.render("authentication/login.ejs", { msg: req.flash("userRegistered"),userData });
});

app.post("/register", async (req, res) => {
    let { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.send('Passwords do not match. Please try again.');
    }

    try {
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.send("Username already taken.");
        }
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.send("User already exists. Please login.");
        }
        const user = new User({ username, email });
        await User.register(user, password);
        req.flash('userRegistered', "Successfully registered, Please Login");
        res.redirect("/login");
    } catch (err) {
        res.status(500).send("Internal server error");
    }
});

app.post("/login", async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        console.log("Retrieved user:", user);

        if (!user) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        console.log("Provided password:", password);
        console.log("Stored password:", user.password);

        if (password !== user.password) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }

            userData = user; 
            req.flash('loggedin', "Successfully Logged-in");
            return res.redirect("/");
        });

    } catch (err) {
        console.error("Error during login:", err);
        return res.status(500).send('Internal server error');
    }
});



app.get("/logout", (req, res, next) => {
    req.logout((err) => {  
        if (err) {
            return next(err);
        }
        req.flash("loggedin", "Successfully Logged-out");
        res.redirect("/");
    });
});

app.listen(port, () => {
    console.log("Server is running on port", port);
});
