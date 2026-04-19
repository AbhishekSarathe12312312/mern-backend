import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    productName: String,
    productDesc: String,

    productImg: [
      {
        url: String,
        public_id: String,
      },
    ],

    productPrice: Number,
    category: String,
    brand: String,
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);