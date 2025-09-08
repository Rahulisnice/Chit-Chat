import JWT from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token = req.headers.authorization;
  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "unauthorized user" /* toast use krna h*/,
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Not authorized , token failed" }); /* toast use krna h*/
  }
};
