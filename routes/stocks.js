import express from "express";

import { getAllStocks, getStockBySymbol, registerStock } from "../controller/stock/stock.js";
import { getOrder } from "../controller/stock/order.js";
import { buyStock, getAllHoldings, sellStock } from "../controller/stock/holding.js";


const router = express.Router();
router.get("/stock", getStockBySymbol);
router.post("/register", registerStock);
router.get("", getAllStocks);
router.post("/buy", buyStock);
router.post("/sell", sellStock);
router.get("/order", getOrder);
router.get("/holding", getAllHoldings);

export default router;