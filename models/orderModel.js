import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
      },
    ],

    amount: Number,
    tax: Number,
    shipping: Number,
    currency: { type: String, default: "INR" },

    status: { type: String, default: "Pending" },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);