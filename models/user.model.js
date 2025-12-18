import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: [true, "The username is required"],
      uppercase: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      require: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "cashier"],
      default: "cashier",
    },
    pointOfSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PointOfSale",
      required: function () {
        return this.role === "cashier";
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
