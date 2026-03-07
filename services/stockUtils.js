
import { NotFoundError } from "../errors/index.js";
import Stock from "../models/Stock.js";


const roundToTwoDecimals = ()=> {
    return Math.round((num + Number.EPSILON) * 100)/100;
}

const generateSocketData = async(symbol)=> {
 const stock = await Stock.findOne({symbol});
 if(!stock){
    throw new NotFoundError(`Stock with symbol ${symbol} not found`);
 }

 const now = new Date();
 const minchange =-0.02;
 const maxChange = 0.02;
 const trendChange = 0.005;
 const currentPrice = stock.currentPrice;

 const trendType = Math.random();
 let trendModifier = 0;

 if(trendType < 0.33){
    // Sideways trend : np additional change
    trendModifier =0;
 } else if (trendType < 0.66){
    // Uptrend: positive bias
    trendModifier = trendChange;
 }else {
    // DownTrend: negative bias
    trendModifier = -trendChange
 }
 const changePercentage = 
 Math.random() * (maxChange - minchange) + minchange + trendModifier

 const close = roundToTwoDecimals(currentPrice * (1+changePercentage));

 const patternType = Math.random();

 let high, low;

 if(patternType < 0.15){
    //Marubozu Pattern
    high = Math.max(currentPrice , close)
    low = Math.min(currentPrice , close)-Math.random() * 2;
 } else if (patternType < 0.3){
    high = Math.max(currentPrice, close);
    low = Math.min(currentPrice, close);

 } else if(patternType < 0.45){
    // Inverted Hammer pattern
    high = Math.max(currentPrice, close) + Math.random() *2;
    low = Math.min(currentPrice, close);
 }else if (patternType < 0.6){
    // shotting Star pattern
    high = Math.max(currentPrice, close) + Math.random() * 2;
    low =Math.min(currentPrice, close);
 } else {
    if(Math.random() < 0.5){
        high = close + Math.random() * 4;
        low = close - Math.random() * 2;
    } else {
        high = close + Math.random() * 2;
        low = close -Math.random() * 4 ;
    }
 }
 high = roundToTwoDecimals(high);
 low = roundToTwoDecimals(low);

 const timeStamp = now.toISOString();
 const time = now.getTime() / 1000;
 const lastItem = stock.dayTimeSeries[stock.dayTimeSeries.length -1];

 if(!lastItem || now-new Date(lastItem.timeStamp) > 1*60*1000){
    stock.dayTimeSeries.push({timeStamp,
         time, 
         _internal_originalTime : time,
         open :roundToTwoDecimals(currentPrice), high, low, close});
 }else {
    const updateHigh = Math.max(lastItem.high, close+ Math.random() * 1);
    const updateLow = Math.min(lastItem.low, close - Math.random() * 1);

    const updateCandle = {
        high : roundToTwoDecimals(updateHigh),
        low : roundToTwoDecimals(updateLow),
        close : roundToTwoDecimals(close),
        open : lastItem.open,
        timeStamp: lastItem.timeStamp,
        time : lastItem.time,
        _internal_originalTime: lastItem._internal_originaltime,
    };

    stock.dayTimeSeries[stock.dayTimeSeries.length -1]= updateCandle;
 }

 stock.dayTimeSeries = stock.dayTimeSeries.slice(-90);

 stock.currentPrice = close;

 try {
    await stock.save();
 } catch (error) {
    console.log("Skipping Conflicts");
    
 }

}


const store10Min = async()=> {
    const stock = await Stock.findOne({symbol});
    if(!stock){
        throw new NotFoundError("Stock not found");
    }
    const now = new Date();
    const currentPrice = stock.currentPrice;
    const latestItem = stock.dayTimeSeries[stock.dayTimeSeries.length -1];

    const timestamp = now .toISOString();
    
    const time = now.getTime()/1000; 

    stock.tenMinTimeSeries.push({
        timestamp,
        time,
        _internal_originalTime: time,
        open : roundToTwoDecimals(currentPrice),
        close : roundToTwoDecimals(latestItem.high),
        low : roundToTwoDecimals(latestItem.low),
        close : roundToTwoDecimals(latestItem.close),
    })
    try {
        await stock.save()
    } catch (error) {
        console.log("Skipping Conflitcs");
        
    }

};

export {generateSocketData, store10Min}