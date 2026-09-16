import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ApiError, asyncHandler } from "./errors.js";
import { authenticate, requireAdmin, signToken } from "./auth.js";
import { buildCart } from "./cart.js";
import { CartItem, Product, User } from "./models.js";
import { validateLogin, validateProduct, validateProductQuery, validateQuantity, validateRegister } from "./validators.js";

export const router = express.Router();

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

router.post("/auth/register", asyncHandler(async (req, res) => {
  validateRegister(req.body);
  const email = req.body.email.trim().toLowerCase();
  if (await User.exists({ email })) throw new ApiError(409, "Email is already registered");
  const user = await User.create({
    name: req.body.name.trim(),
    email,
    passwordHash: await bcrypt.hash(req.body.password, 12),
    role: "user"
  });
  res.status(201).json({ user: publicUser(user), token: signToken(user) });
}));

router.post("/auth/login", asyncHandler(async (req, res) => {
  validateLogin(req.body);
  const user = await User.findOne({ email: String(req.body.email).trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }
  res.json({ user: publicUser(user), token: signToken(user) });
}));

router.get("/products", asyncHandler(async (req, res) => {
  const { search, minPrice, maxPrice, sort } = validateProductQuery(req.query);
  const query = {};
  if (search) query.name = { $regex: String(search), $options: "i" };
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = minPrice;
    if (maxPrice !== undefined) query.price.$lte = maxPrice;
  }
  const sortMap = {
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    name: { name: 1 }
  };
  const products = await Product.find(query).sort(sortMap[sort] || { createdAt: 1 });
  res.json({ products });
}));

router.post("/products", authenticate, requireAdmin, asyncHandler(async (req, res) => {
  validateProduct(req.body);
  const product = await Product.create({
    name: req.body.name.trim(),
    category: req.body.category.trim(),
    price: Number(req.body.price),
    stock: Number(req.body.stock),
    image: req.body.image.trim()
  });
  res.status(201).json({ product });
}));

router.patch("/products/:id", authenticate, requireAdmin, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, "Product not found");
  validateProduct(req.body, true);
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  for (const key of ["name", "category", "image"]) {
    if (req.body[key] !== undefined) product[key] = req.body[key].trim();
  }
  if (req.body.price !== undefined) product.price = Number(req.body.price);
  if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
  await product.save();
  res.json({ product });
}));

router.delete("/products/:id", authenticate, requireAdmin, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, "Product not found");
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  await CartItem.deleteMany({ productId: req.params.id });
  res.status(204).send();
}));

router.get("/cart", authenticate, asyncHandler(async (req, res) => {
  const items = await CartItem.find({ userId: req.user.id }).populate("productId");
  res.json(await buildCart(items));
}));

router.post("/cart", authenticate, asyncHandler(async (req, res) => {
  const quantity = validateQuantity(req.body.quantity ?? 1);
  if (!mongoose.isValidObjectId(req.body.productId)) throw new ApiError(404, "Product not found");
  const product = await Product.findById(req.body.productId);
  if (!product) throw new ApiError(404, "Product not found");
  if (product.stock === 0) throw new ApiError(400, "Product is out of stock");
  const existing = await CartItem.findOne({ userId: req.user.id, productId: product.id });
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > product.stock) throw new ApiError(400, "Requested quantity exceeds available stock");
  if (existing) existing.quantity = nextQuantity;
  else await CartItem.create({ userId: req.user.id, productId: product.id, quantity });
  if (existing) await existing.save();
  const items = await CartItem.find({ userId: req.user.id }).populate("productId");
  res.status(201).json(await buildCart(items));
}));

router.patch("/cart/:id", authenticate, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, "Cart item not found");
  const quantity = validateQuantity(req.body.quantity);
  const item = await CartItem.findOne({ _id: req.params.id, userId: req.user.id }).populate("productId");
  if (!item) throw new ApiError(404, "Cart item not found");
  if (!item.productId) throw new ApiError(404, "Product not found");
  if (quantity > item.productId.stock) throw new ApiError(400, "Requested quantity exceeds available stock");
  item.quantity = quantity;
  await item.save();
  const items = await CartItem.find({ userId: req.user.id }).populate("productId");
  res.json(await buildCart(items));
}));

router.delete("/cart/:id", authenticate, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, "Cart item not found");
  const item = await CartItem.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!item) throw new ApiError(404, "Cart item not found");
  res.status(204).send();
}));
