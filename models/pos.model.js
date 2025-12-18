import mongoose from "mongoose";

const posSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mikrotikConfig: {
      host: {
        type: String,
        required: true,
      },
      user: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      port: {
        type: Number,
        default: 8728,
      },
    },
  },
  {
    timestamps: true,
  }
);

const PointOfSale = mongoose.model("PointOfSale", posSchema);

export default PointOfSale;
