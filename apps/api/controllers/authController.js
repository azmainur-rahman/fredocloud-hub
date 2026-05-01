import bcrypt from "bcryptjs";
import prisma from "../utils/prisma.js";
import { clearAuthCookies, generateToken } from "../utils/generateToken.js";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const passwordMessage =
  "Password must be at least 8 characters and include a letter, number, and special character.";

export const registerUser = async (req, res) => {
  try {
    const { email, password, name, avatarUrl } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, and name are required." });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: passwordMessage });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        avatarUrl,
      },
      select: publicUserSelect,
    });

    generateToken(res, user.id);

    return res.status(201).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user." });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    generateToken(res, user.id);

    const { passwordHash, ...safeUser } = user;

    return res.json({ user: safeUser });
  } catch (error) {
    return res.status(500).json({ message: "Failed to log in." });
  }
};

export const logoutUser = (req, res) => {
  clearAuthCookies(res);

  return res.json({ message: "Logged out successfully." });
};

export const getMe = (req, res) => {
  return res.json({ user: req.user });
};
