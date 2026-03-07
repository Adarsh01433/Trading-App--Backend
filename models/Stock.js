import mongoose from "mongoose";

const StockSchema = new mongoose.Schema({
    symbol: {
        type : String,
       required : true,
       unique : true,
    },
    companyName : {
        type : String,
        required : true,
    },
    iconUrl : {
        type : String,
        required : true,
    },
    lastDayTradedPrice : {
        type : Number,
        required : true,
    },
    currentPrice : {
        type : Number,
        required : true
    },

    dayTimeSeries : {
        type : [Object],
        default : [],
    },

    tenMinTimeSeries : {
        type : [Object],
        default : [],
    },

});

export const Stock = mongoose.model("Stock", StockSchema);
export default Stock