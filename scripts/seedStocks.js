import dotenv from "dotenv";
import connectDB from "../config/connect.js";
import Stock from "../models/Stock.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import mongoose from "mongoose";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const seedStocks = async () => {
  try {
    // Connect to database
    console.log("🔌 Connecting to database...");
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Connected to database successfully!");

    // Read the stocks data from JSON file
    const stocksDataPath = path.join(__dirname, "../data/stocks.json");
    const stocksData = JSON.parse(fs.readFileSync(stocksDataPath, "utf8"));
    
    console.log(`📊 Found ${stocksData.length} stocks to seed`);

    // Clear existing stocks (optional - comment out if you want to keep existing data)
    console.log("🧹 Clearing existing stocks...");
    await Stock.deleteMany({});
    console.log("✅ Existing stocks cleared");

    // Insert new stocks
    console.log("🌱 Seeding stocks into database...");
    const result = await Stock.insertMany(stocksData);
    
    console.log(`✅ Successfully seeded ${result.length} stocks!`);
    
    // Display the seeded stocks
    console.log("\n📋 Seeded Stocks:");
    result.forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.symbol} - ${stock.companyName} ($${stock.currentPrice})`);
    });

    console.log("\n🎉 Database seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run the seed function
seedStocks();
