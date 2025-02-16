const mongoose = require("mongoose");

const WaitingListSchema = new mongoose.Schema(
    {
       status:{
        type:String,
        enum:["pending","confirmed","cancelled"],
        default:"pending"
       },
       user:{
        type:mongoose.Schema.Types.ObjectId,ref:"User"
       }
    },
    { timestamps: true }
);

const WaitingList = mongoose.model("WaitingList", WaitingListSchema);
module.exports = WaitingList;
