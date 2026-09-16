import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { ApiError } from "./errors.js";
import { User } from "./models.js";

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: "2h" });
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) throw new ApiError(401, "Authentication required");
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, "Authentication required");
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Authentication required"));
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return next(new ApiError(403, "Admin access required"));
  next();
}
