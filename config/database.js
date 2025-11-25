import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config;

export const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("Database connected", conn);
  } catch (error) {
    console.log(error);
    process.exit();
  }
};
