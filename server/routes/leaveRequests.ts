import express from "express";
import LeaveRequest from "../models/LeaveRequest";
import User from "../models/User";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

/* =========================
   STUDENT → CREATE REQUEST
========================= */
router.post("/", authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Students only" });
    }

    const { fromDate, toDate, reason, imageUrl, isEmergency } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const request = await LeaveRequest.create({
      userId: user._id,
      hostelBlock: user.hostelBlock,
      fromDate,
      toDate,
      reason,
      imageUrl,
      isEmergency: isEmergency || false,
    });

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create request" });
  }
});

/* =========================
   STUDENT → VIEW OWN
========================= */
router.get("/user", authMiddleware, async (req: any, res) => {
  try {
    const requests = await LeaveRequest.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

/* =========================
   STUDENT → VIEW OWN (BY ID)
========================= */
router.get("/user/:userId", authMiddleware, async (req: any, res) => {
  try {
    // Security check: only allow own data or admin
    if (req.params.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const requests = await LeaveRequest.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

/* =========================
   ADMIN → VIEW BLOCK
========================= */
router.get("/", authMiddleware, async (req: any, res) => {
  try {
    // Fetch latest user data to ensure valid hostelBlock
    const admin = await User.findById(req.user.id);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const requests = await LeaveRequest.find({
      hostelBlock: admin.hostelBlock,
    })
      .populate("userId", "name registerId")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

/* =========================
   ADMIN → UPDATE STATUS
========================= */
// ... (imports)

router.patch("/:id/status", authMiddleware, async (req: any, res) => {
  try {
    // Fetch fresh admin data to ensure hostelBlock is accurate
    const admin = await User.findById(req.user.id);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { status, adminRemarks } = req.body;

    const request = await LeaveRequest.findOneAndUpdate(
      {
        _id: req.params.id,
        hostelBlock: admin.hostelBlock, // Use fresh DB value
      },
      { status, adminRemarks },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found or unauthorized" });
    }

    res.json(request);
  } catch (err) {
    console.error("Update Request Error:", err);
    res.status(500).json({ message: "Failed to update request" });
  }
});

export default router;
