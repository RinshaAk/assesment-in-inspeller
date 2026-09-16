import mongoose from "mongoose";

const serialize = {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }
  },
  { timestamps: true, toJSON: serialize, toObject: serialize }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    image: { type: String, required: true, trim: true }
  },
  { timestamps: true, toJSON: serialize, toObject: serialize }
);

const cartItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { timestamps: true, toJSON: serialize, toObject: serialize }
);

cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);
export const Product = mongoose.model("Product", productSchema);
export const CartItem = mongoose.model("CartItem", cartItemSchema);
