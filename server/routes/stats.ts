import express from "express";
import User from "../models/User";
import Attendance from "../models/Attendance";
import LeaveRequest from "../models/LeaveRequest";
import Complaint from "../models/Complaint";
import MenuSuggestion from "../models/MenuSuggestion";
import RoomChangeRequest from "../models/RoomChangeRequest";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.get("/admin", authMiddleware, async (req: any, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admins only" });
        }

        const adminBlock = req.user.hostelBlock;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const studentIdsInBlock = await User.distinct("_id", { role: "student", hostelBlock: adminBlock });

        const [studentCount, attendanceCount, pendingLeaveCount, openComplaintCount, absentStudents, recentSuggestions, pendingRoomChanges] = await Promise.all([
            User.countDocuments({ role: "student", hostelBlock: adminBlock }),
            Attendance.countDocuments({ date: { $gte: today }, isPresent: true, userId: { $in: studentIdsInBlock } }),
            LeaveRequest.countDocuments({ status: "pending", hostelBlock: adminBlock }),
            Complaint.countDocuments({ status: { $ne: "resolved" }, hostelBlock: adminBlock }),
            // Find students in admin's block who didn't mark attendance today
            User.find({
                role: "student",
                hostelBlock: adminBlock,
                _id: {
                    $nin: await Attendance.distinct("userId", { date: { $gte: today }, isPresent: true, userId: { $in: studentIdsInBlock } })
                }
            }).select("name registerId roomNumber"),
            MenuSuggestion.find({ hostelBlock: adminBlock }).sort({ createdAt: -1 }).limit(3),
            RoomChangeRequest.countDocuments({ status: "pending", hostelBlock: adminBlock })
        ]);

        res.json({
            studentCount,
            attendanceCount,
            pendingLeaveCount,
            openComplaintCount,
            pendingRoomChanges,
            absentCount: absentStudents.length,
            absentStudents,
            recentSuggestions,
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
