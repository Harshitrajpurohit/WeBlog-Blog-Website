const mongoose = require("mongoose");
const inituserdata = require("./data.js");
const User = require("../models/user.js")



async function main(){
    await mongoose.connect("mongodb://localhost:27017/WeBlog")
}

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
})


const initDB = async()=>{
    await User.insertMany(inituserdata.data);
    console.log("data added");
}

initDB();