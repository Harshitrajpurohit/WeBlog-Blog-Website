const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js")



async function main(){
    await mongoose.connect("mongodb://localhost:27017/WeBlog")
}

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
})


const initDB = async()=>{
    await Listing.insertMany(initdata.data);
    console.log("data added");
}

initDB();