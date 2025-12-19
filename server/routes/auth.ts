import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Room from "../models/Room";
import { authMiddleware } from "../middleware/auth";

// Helper to sign token
const signToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      hostelBlock: user.hostelBlock,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

const router = express.Router();

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    const {
      registerId,
      password,
      name,
      phone,
      role,
      roomNumber,
      hostelBlock,
    } = req.body;

    console.log("Register Attempt:", req.body); // DEBUG LOG

    if (!registerId || !password || !name || !role || !hostelBlock) {
      console.log("Missing fields:", { registerId, password, name, role, hostelBlock });
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await User.findOne({ registerId });
    if (existingUser) {
      console.log("User already exists:", registerId);
      return res.status(400).json({ error: "User already exists" });
    }

    // Check Room Capacity for Students
    if (role === 'student' && roomNumber && hostelBlock) {
      const room = await Room.findOne({ roomNumber, hostelBlock });
      const capacity = room ? room.capacity : 4; // Default capacity 4

      const currentOccupants = await User.countDocuments({ roomNumber, hostelBlock });

      if (currentOccupants >= capacity) {
        return res.status(400).json({ error: `Room ${roomNumber} is full (Capacity: ${capacity})` });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      registerId,
      password: hashedPassword,
      name,
      phone,
      role,
      roomNumber: role === 'student' ? roomNumber : undefined,
      hostelBlock,
    });

    console.log("User created successfully:", user.registerId);

    // Update Room Occupancy
    if (role === 'student' && roomNumber && hostelBlock) {
      await Room.findOneAndUpdate(
        { roomNumber, hostelBlock },
        {
          $inc: { currentOccupancy: 1 },
          $setOnInsert: { capacity: 4 }
        },
        { upsert: true, new: true }
      );
    }

    const token = signToken(user);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        registerId: user.registerId,
        name: user.name,
        phone: user.phone,
        role: user.role,
        roomNumber: user.roomNumber,
        hostelBlock: user.hostelBlock,
        profileImage: user.profileImage,
      },
      token,
    });
  } catch (err: any) {
    console.error("Registration Error Detail:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Validation Error", details: err.errors });
    }
    res.status(500).json({ error: "Registration failed", message: err.message });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { registerId, password, role } = req.body;

    if (!registerId || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const user = await User.findOne({ registerId });
    if (!user) {
      return res.status(400).json({ error: "Invalid Register Number / Staff ID" });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ error: "Role mismatch" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid Password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        hostelBlock: user.hostelBlock, // ✅ IMPORTANT
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        registerId: user.registerId,
        name: user.name,
        phone: user.phone,
        role: user.role,
        roomNumber: user.roomNumber,
        hostelBlock: user.hostelBlock,
        profileImage: user.profileImage,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   CHANGE PASSWORD
========================= */
router.put("/password", authMiddleware, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // From authMiddleware

    if (!newPassword) {
      return res.status(400).json({ error: "Missing new password" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password ONLY if provided
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Incorrect current password" });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
