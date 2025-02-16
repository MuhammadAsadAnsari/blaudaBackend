const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema(
    {
        vacancy:{
            type:mongoose.Schema.Types.ObjectId,ref:"Vacancy"
        },
        questionaire:{
            type:mongoose.Schema.Types.ObjectId,ref:"Questionaire"
        }
    },
    { timestamps: true }
);

const Result = mongoose.model("Result", ResultSchema);
module.exports = Result;
