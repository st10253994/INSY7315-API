const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const connString = process.env.MONGO_URI;
const client = new MongoClient(connString);

async function connectMongo(){
    try{
        await client.connect();
        console.log("Connected to MongoDB Successfully");
    }catch(err){
        console.error("MongoDB connection failed", err);
    }
}

module.exports = { connectMongo, client };