import { ApiError } from "./errors.js";

const isText = (value, min = 1) => typeof value === "string" && value.trim().length >= min;
const numberFrom = (value) => (value === "" || value === undefined ? undefined : Number(value));

export function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === "");
  if (missing.length) throw new ApiError(400, "Missing required fields", missing);
}

export function validateRegister(body) {
  requireFields(body, ["name", "email", "password"]);
  if (!isText(body.name, 2)) throw new ApiError(400, "Name must be at least 2 characters");
  if (!/^\S+@\S+\.\S+$/.test(body.email)) throw new ApiError(400, "Email is invalid");
  if (!isText(body.password, 8)) throw new ApiError(400, "Password must be at least 8 characters");
}

export function validateLogin(body) {
  requireFields(body, ["email", "password"]);
}

export function validateProduct(body, partial = false) {
  if (!partial) requireFields(body, ["name", "category", "price", "stock", "image"]);
  const allowed = ["name", "category", "price", "stock", "image"];
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) throw new ApiError(400, `Unknown product field: ${key}`);
  }
  if (body.name !== undefined && !isText(body.name, 2)) throw new ApiError(400, "Product name is required");
  if (body.category !== undefined && !isText(body.category, 2)) throw new ApiError(400, "Category is required");
  if (body.image !== undefined && !isText(body.image, 8)) throw new ApiError(400, "Image URL is required");
  if (body.price !== undefined && (!Number.isFinite(numberFrom(body.price)) || numberFrom(body.price) < 0)) {
    throw new ApiError(400, "Price must be a positive number");
  }
  if (body.stock !== undefined && (!Number.isInteger(numberFrom(body.stock)) || numberFrom(body.stock) < 0)) {
    throw new ApiError(400, "Stock must be a non-negative integer");
  }
}

export function validateProductQuery(query) {
  const allowed = ["search", "minPrice", "maxPrice", "sort"];
  for (const key of Object.keys(query)) {
    if (!allowed.includes(key)) throw new ApiError(400, `Unknown product query: ${key}`);
  }

  const minPrice = numberFrom(query.minPrice);
  const maxPrice = numberFrom(query.maxPrice);
  if (query.minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) {
    throw new ApiError(400, "minPrice must be a non-negative number");
  }
  if (query.maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
    throw new ApiError(400, "maxPrice must be a non-negative number");
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new ApiError(400, "minPrice cannot be greater than maxPrice");
  }
  if (query.sort !== undefined && query.sort !== "" && !["price-asc", "price-desc", "name"].includes(query.sort)) {
    throw new ApiError(400, "sort must be one of price-asc, price-desc, or name");
  }

  return { minPrice, maxPrice, sort: query.sort || undefined, search: query.search };
}

export function validateQuantity(quantity) {
  const parsed = numberFrom(quantity);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new ApiError(400, "Quantity must be a positive integer");
  return parsed;
}
