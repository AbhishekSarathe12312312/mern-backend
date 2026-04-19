import razorpayInstance from "../config/razorpay.js";
import { Cart } from "../models/cartModel.js"; // ✅ Missing Import Fixed
import { Order } from "../models/orderModel.js";
import { User } from "../models/userModel.js";
import { Product } from "../models/productModel.js";
import crypto from "crypto";

// ================= CREATE ORDER =================
export const createOrder = async (req, res) => {
  try {
    const { products, amount, tax, shipping, currency } = req.body;

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    const newOrder = new Order({
      user: req.user._id,
      products,
      amount,
      tax,
      shipping,
      currency,
      status: "Pending",
      razorpayOrderId: razorpayOrder.id,
    });

    await newOrder.save();

    res.json({
      success: true,
      order: razorpayOrder,
      dbOrder: newOrder,
    });
  } catch (error) {
    console.error("❌ Error in create Order: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= VERIFY PAYMENT =================
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const body = razorpayOrderId + "|" + razorpayPaymentId;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const order = await Order.findOneAndUpdate(
      { razorpayOrderId },
      {
        status: "Paid",
        razorpayPaymentId,
        razorpaySignature,
      },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    await Cart.findOneAndDelete({ userId: req.user._id });

    res.json({ success: true, order });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET MY ORDERS =================
export const getMyOrder = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("products.productId")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ADMIN: GET ALL ORDERS =================
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "firstName lastName email")
      .populate("products.productId")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ADMIN: GET USER ORDERS =================
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user: userId }).populate("products.productId");
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= SALES DATA =================
export const getSalesData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({ status: "Paid" });

    const totalSaleAgg = await Order.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalSales = totalSaleAgg[0]?.total || 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesByDate = await Order.aggregate([
      {
        $match: {
          status: "Paid",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formattedSales = salesByDate.map((item) => ({
      date: item._id,
      amount: item.amount,
    }));

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalSales,
      },
      salesData: formattedSales,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};