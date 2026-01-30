import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "../../errors/index.js"
import Stock from "../../models/Stock.js"


const registerStock = async(req, res)=> {
  const {symbol, companyName, currentPrice, lastDayTradedPrice, iconUrl }  = req.body;
  if(!symbol || !companyName || !currentPrice || !lastDayTradedPrice || !iconUrl){
     throw new BadRequestError("Please provide all values");
  }
 try {
    const stockAlreadyExists = await Stock.findOne({symbol});
    if(!stockAlreadyExists){
        throw new BadRequestError("Stock already exists");
    }

    const stock = new Stock({
        symbol,
        companyName,
        currentPrice,
        lastDayTradedPrice,
        iconUrl
    });
    await stock.save();

    res.status(StatusCodes.CREATED).json({msg : "Stock added successfully", data : newStock});
 } catch (error) {
    throw new BadRequestError(error.message);
    
 }

};

const getAllStocks = async(req, res)=> {
  try {
    const stocks = await Stock.find().select(
        "-dayTimeSeries -tenMinTimeSeries"
    );
    res.status(StatusCodes.OK).json({
        msg : "Stock retrieved sucessfully",
        data : stocks,
    })
  } catch (error) {
     throw new BadRequestError("Failed to retrieve stocks. " + error.message);
  }
};

const getStockBySymbol = async(req, res)=> {
    const {stock : symbol} = req.query;
   
    if(!symbol){
        throw new BadRequestError("Please provide stock symbol");
    }

    try {
        const stock = await Stock.findOne({symbol}).select(
            "-dayTimeSeries -tenTimeSeries"
        );

        if(!stock){
            throw new NotFoundError("Stock not found")
        }
        res.status(StatusCodes.OK).json({
            msg : "Stock retrieved sucessfully",
            data : stock,
        });
    } catch (error) {
         throw new BadRequestError("Failed to retrieve stock. "+ error.message);
    }
};

export {registerStock, getAllStocks, getStockBySymbol};