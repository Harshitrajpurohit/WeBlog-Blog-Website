const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
    title : {
        type: String
    },
    description : String,
    image:{
        type:String,
        set:(v) => v === ""? "https://images.unsplash.com/photo-1721297015479-452516dfba1d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" :v,
        default:"https://images.unsplash.com/photo-1721297015479-452516dfba1d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    time: { type:String,
        default : `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`
    },
    uid:String,
})


const Listing = mongoose.model("Listing",listingSchema);

module.exports = Listing;