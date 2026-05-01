import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authorized. Access token is missing." });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || "dev_access_secret",
    );

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized. User not found." });
    }

    req.user = user;

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired." });
    }

    return res
      .status(401)
      .json({ message: "Not authorized. Invalid access token." });
  }
};
