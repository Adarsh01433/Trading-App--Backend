import 'express-async-errors';
import express from 'express';
import dotenv from 'dotenv';
import {createServer} from 'http';
import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import notFoundMiddleware from "./middleware/not-found.js";
import errorHandlerMiddleware from './middleware/error-handling.js';
import cors from 'cors'; 
import connectDB  from './config/connect.js';
import authRouter from './routes/auth.js';
import stockRouter from "./routes/stocks.js"
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authenticateSocketUser from "./middleware/socketAuth.js"

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

dotenv.config();

const app = express();

app.use(express.json());

const httpServer = createServer(app);

app.get("/",(req, res)=> {
    res.send(`<h1> Trading API</h1><a href = "/api-docs">Documentation </a>`);
});

// Swagger API DOCs

const swaggerDocument = YAML.load(join(_dirname,'./docs/swagger.yaml'));
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// ROutes

app.use('/auth', authRouter);
app.use("/stocks", authenticateSocketUser, stockRouter)

// MIDDLEWARE
app.use(cors());
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);


// Start SERVER

const start = async()=> {
    try {
       await connectDB(process.env.MONGO_URI);
       const PORT = process.env.PORT || 3000;
       httpServer.listen(PORT, ()=> 
        console.log(`Server is running on port ${PORT}...`)
        
    )  
    } catch (error) {
         console.log(error);
         
    }
}
start();
