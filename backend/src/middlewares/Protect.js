import jwt from "jsonwebtoken";
import User from "../models/User.js";
 
// verifies the JWT and attaches the logged-in user to req.user.
// must run BEFORE authorizeRoles on any protected route.
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
 
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
 
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
 
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
 
export default protect;