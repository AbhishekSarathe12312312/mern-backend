// backend/controllers/productController.js
import { Product } from "../models/productModel.js";
import imagekit from "../utils/imagekit.js";

// ADD PRODUCT
export const addProduct = async (req, res) => {
  try {
    const { productName, productDesc, productPrice, category, brand } = req.body;

    let images = [];

    if (req.files?.file) {
      const file = req.files.file[0];

      const upload = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: file.originalname,
      });

      images.push({ url: upload.url, public_id: upload.fileId });
    }

    if (req.files?.files) {
      for (let file of req.files.files) {
        const upload = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
        });

        images.push({ url: upload.url, public_id: upload.fileId });
      }
    }

    const product = await Product.create({
      productName,
      productDesc,
      productPrice,
      category,
      brand,
      productImg: images,
      userId: req.user._id,
    });

    res.json({ success: true, product });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL PRODUCTS
export const getAllProduct = async (req, res) => {
  try {
    const products = await Product.find();
    if (!products) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No product available",
          products: [],
        });
    }
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    if (product.productImg?.length) {
      for (let img of product.productImg) {
        try {
          await imagekit.deleteFile(img.public_id);
        } catch (err) {
          console.warn("ImageKit delete error:", err.message);
        }
      }
    }

    await Product.findByIdAndDelete(productId);
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      productName,
      productDesc,
      productPrice,
      category,
      brand,
      existingImages,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    let updatedImages = [];

    if (existingImages) {
      const keepIds = JSON.parse(existingImages);
      updatedImages = product.productImg.filter((img) =>
        keepIds.includes(img.public_id),
      );

      const removedImages = product.productImg.filter(
        (img) => !keepIds.includes(img.public_id),
      );
      for (let img of removedImages) {
        try {
          await imagekit.deleteFile(img.public_id);
        } catch (err) {
          console.warn("ImageKit delete error:", err.message);
        }
      }
    } else {
      updatedImages = product.productImg;
    }

    if (req.files?.file) {
      for (let file of req.files.file) {
        const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        const uploadResult = await imagekit.upload({
          file: dataUrl,
          fileName: file.originalname,
          folder: "mern_products",
        });
        updatedImages.push({
          url: uploadResult.url,
          public_id: uploadResult.fileId,
        });
      }
    }
    if (req.files?.files) {
      for (let file of req.files.files) {
        const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        const uploadResult = await imagekit.upload({
          file: dataUrl,
          fileName: file.originalname,
          folder: "mern_products",
        });
        updatedImages.push({
          url: uploadResult.url,
          public_id: uploadResult.fileId,
        });
      }
    }

    product.productName = productName || product.productName;
    product.productDesc = productDesc || product.productDesc;
    product.productPrice = productPrice || product.productPrice;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.productImg = updatedImages;

    await product.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Product updated successfully",
        product,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
