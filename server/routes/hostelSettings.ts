import express from "express";
import HostelSettings from "../models/HostelSettings";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// Get settings for a hostel block
router.get("/:hostelBlock", authMiddleware, async (req, res) => {
    try {
        let settings = await HostelSettings.findOne({ hostelBlock: req.params.hostelBlock });

        // If no settings exist, create default ones
        if (!settings) {
            settings = await HostelSettings.create({
                hostelBlock: req.params.hostelBlock,
                leaveWindowFrom: null,
                leaveWindowTo: null,
                leaveWindowLabel: ""
            });
        }

        res.json(settings);
    } catch (error) {
        console.error("Fetch settings error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Update settings (Admin only)
router.put("/:hostelBlock", authMiddleware, async (req: any, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin only" });
        }

        // Admins can only update their own block
        if (req.user.hostelBlock !== req.params.hostelBlock) {
            return res.status(403).json({ error: "Unauthorized to update another hostel's settings" });
        }

        const { leaveWindowFrom, leaveWindowTo, leaveWindowLabel } = req.body;

        const settings = await HostelSettings.findOneAndUpdate(
            { hostelBlock: req.params.hostelBlock },
            {
                leaveWindowFrom,
                leaveWindowTo,
                leaveWindowLabel,
                updatedBy: req.user.id
            },
            { new: true, upsert: true }
        );

        res.json(settings);
    } catch (error) {
        console.error("Update settings error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
