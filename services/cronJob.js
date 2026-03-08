import cron from "node-cron";
import Stock from "../models/Stock.js";
import {store10Min, generateSocketData} from "./stockUtils.js"


const holidays = ["2026-04-8", "2026-04-14"];


const isTradingHour = ()=> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekDay = dayOfWeek >0 && dayOfWeek < 6;
    const isTradingTime = 
    (now.getHours() === 9 && now.getMinutes() >=30) ||
    (now.getHours() > 9 && now.getHours() < 15) ||
    (now.getHours() === 15 && now.getMinutes() <=30);
    // 9:30AM to 3:30PM

    const today = new Date().toISOString().slice(0,10)
    return isWeekDay && isTradingTime && !holidays.includes(today);
};

const isNewTradeDay = ()=> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekDay = dayOfWeek> 0 && dayOfWeek < 6;
    const today = new Date().toISOString().slice(0,10);
    return isWeekDay && !holidays.includes(today)
};

const scheduleDayReset = ()=> {
    cron.schedule("15 9 * * 1-5", async()=> {
        if(isNewTradeDay()){
            await Stock.updateMany({}, [
                {
                    $set:{
                        dayTimeSeries: [],
                        tenMinTimeSeries : [],
                        lastDayTradedPrice : "$currentPrice"
                    },
                },
                {
                    $set:{__v:0},
                },
            ]);
            console.log("Day reset completed ad 9:15 AM");
            
        }
    })
};

const update10minCandle = ()=> {
    cron.schedule("*/10 * * * *", async()=> {
        if(isTradingHour()){
            const stock= await Stock.find();
            stock.forEach(async(s)=> {
                await store10Min(s.symbol)
            })
        }
    })
};


const generateRandomDateEvery5Second = ()=> {
    cron.schedule("*/5 * * * * *", async()=> {
        if(isTradingHour()){
            const stock = await Stock.find();
            stock.forEach(async(s)=> {
                await generateSocketData(s.symbol)
            })
            
        }
    })
}

export {scheduleDayReset, update10minCandle, generateRandomDateEvery5Second}

