import mongoose from "mongoose";
import dotenv from "dotenv";
import Quote from "../models/Quote";
dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI!);
  const res = await Quote.updateMany(
    { vendor_id: { $exists: false } },
    { $set: { vendor_id: "UNKNOWN" } }
  );
  console.log("Migrados:", res.modifiedCount);
  await mongoose.disconnect();
})();
