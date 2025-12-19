import express from 'express';
import Attendance from '../models/Attendance';
import { authMiddleware } from '../middleware/auth';


const router = express.Router();

// Get all attendances
router.get('/', authMiddleware, async (req, res) => {

  try {
    const attendances = await Attendance.find().populate('userId', 'name registerId');
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get attendances by user
router.get('/user/:userId', authMiddleware, async (req, res) => {

  try {
    const attendances = await Attendance.find({ userId: req.params.userId });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Check attendance for a specific user and date
router.get('/check/:userId/:date', authMiddleware, async (req, res) => {

  try {
    const { userId, date } = req.params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Widen window to match delete logic (account for timezones)
    startOfDay.setDate(startOfDay.getDate() - 1);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({ marked: !!attendance, attendance });
  } catch (error) {
    res.status(500).json({ error: 'Server error CHECK' });
  }
});

// Get attendance by date (Admin)
router.get('/date/:date', authMiddleware, async (req, res) => {

  try {
    const { date } = req.params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId', 'name registerId');

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Server error DATE' });
  }
});

// Get today's attendance
router.get("/today", authMiddleware, async (req, res) => {

  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const attendances = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate("userId", "name registerId");

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: "Server error TODAY" });
  }
});

// Get simple stats for a specific user
router.get("/stats/:userId", authMiddleware, async (req, res) => {

  try {
    const { userId } = req.params;
    const mongoose = (await import('mongoose')).default;

    const stats = await Attendance.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$isPresent", count: { $sum: 1 } } }
    ]);

    const present = stats.find(s => s._id === true)?.count || 0;
    const absent = stats.find(s => s._id === false)?.count || 0;
    const leave = 0; // Assuming no leave status in current model
    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({
      present,
      absent,
      leave,
      percentage
    });
  } catch (error) {
    console.error("STATS ERROR:", error);
    res.status(500).json({ error: "Server error STATS" });
  }
});

// @ts-ignore - config path exists
import { HOSTEL_LOCATIONS } from '../config/hostels';
import { getFaceEmbedding, calculateSimilarity } from '../services/faceRecognition';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

function isPointInPolygon(
  lat: number,
  lon: number,
  polygon: Array<{ latitude: number; longitude: number }>
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude;
    const yi = polygon[i].longitude;
    const xj = polygon[j].latitude;
    const yj = polygon[j].longitude;

    const intersect =
      yi > lon !== yj > lon &&
      lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Mark attendance with Triple Verification
router.post('/', authMiddleware, async (req, res) => {

  try {
    const { userId, date, isPresent, photoUrl, latitude, longitude, reason, selectedHostel } = req.body;

    // 0. Sanitize photoUrl - remove double prefixes
    let sanitizedPhotoUrl = photoUrl;
    if (photoUrl && typeof photoUrl === 'string') {
      const parts = photoUrl.split('base64,');
      if (parts.length > 2) {
        // We have double prefix, e.g. data:image/jpeg;base64,data:image/png;base64,...
        sanitizedPhotoUrl = `data:image/jpeg;base64,${parts[parts.length - 1]}`;
      }
    }

    // 1. Fetch User to get their Hostel and Face Embedding
    const User = (await import('../models/User')).default;
    const user = await User.findById(userId);

    if (user) {
      console.log(`🔍 Checking attendance for ${user.name} (ID: ${user._id})`);
      console.log(`   - Face ID present: ${!!user.faceEmbedding}, Length: ${user.faceEmbedding?.length}`);
    }

    if (!user) {
      console.log(`❌ User not found for ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`👤 User fetched: ${user.name} (${user._id})`);
    console.log(`👤 Face Embedding Status: ${user.faceEmbedding ? 'Present' : 'Missing'}, Length: ${user.faceEmbedding?.length}`);

    // Check for existing attendance for this date
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingAttendance) {
      return res.status(400).json({ error: 'Attendance already marked for today.' });
    }

    // 2. Validate GPS (Geofencing) - Use selectedHostel from request
    const hostelToValidate = selectedHostel || user.hostelBlock;
    const hostelConfig = HOSTEL_LOCATIONS[hostelToValidate];

    if (hostelConfig && latitude && longitude && latitude !== "web") {
      let isInside = false;

      if (hostelConfig.radius && hostelConfig.center) {
        const distance = getDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          hostelConfig.center.latitude,
          hostelConfig.center.longitude
        );
        console.log(`📍 Distance from center: ${distance.toFixed(2)}m (Max: ${hostelConfig.radius}m)`);
        isInside = distance <= hostelConfig.radius;
      } else {
        isInside = isPointInPolygon(
          parseFloat(latitude),
          parseFloat(longitude),
          hostelConfig.points
        );
      }

      if (!isInside) {
        return res.status(400).json({
          error: `Location validation failed. You are outside ${hostelToValidate} boundaries.`
        });
      }
    } else if (!hostelConfig && isPresent) {
      console.warn(`No coordinates configured for hostel: ${hostelToValidate}`);
    }

    // 3. Face Verification using FaceNet (JS-based)
    if (isPresent && photoUrl) {
      // Check if user has a registered Face ID (embedding)
      if (!user.faceEmbedding || user.faceEmbedding.length === 0) {
        console.log(`❌ No face embedding registered for ${user.name}`);
        return res.status(400).json({ error: 'Face ID not registered. Please tap your profile picture to register your Face ID.' });
      }

      try {
        console.log(`\n🔍 === FACE VERIFICATION START for ${user.name} ===`);
        const faceStartTime = Date.now();

        // Generate embedding for the current capture
        let currentEmbedding;
        try {
          currentEmbedding = await getFaceEmbedding(sanitizedPhotoUrl);
        } catch (faceError: any) {
          console.log(`❌ Face detection/verification error: ${faceError.message}`);
          return res.status(400).json({ error: faceError.message });
        }
        const faceElapsed = Date.now() - faceStartTime;

        // Compare current embedding with stored Face ID
        const similarity = calculateSimilarity(user.faceEmbedding, Array.from(currentEmbedding));

        console.log(`📊 Face matching result: ${similarity.toFixed(2)}% similarity (checked in ${faceElapsed}ms)`);

        const MATCH_THRESHOLD = 50; // Threshold for FaceNet (Cosine Similarity * 100)

        if (similarity < MATCH_THRESHOLD) {
          return res.status(400).json({
            error: `Face mismatch! Similarity: ${similarity.toFixed(1)}%. Please ensure it's you.`
          });
        }

        console.log(`✅ Face ID verified for ${user.name}`);
      } catch (err: any) {
        console.error("Face verification error:", err);
        // Fallback or stricter error handling
        return res.status(500).json({ error: 'Face verification service error. Please try again.' });
      }
    }

    const attendance = new Attendance({
      userId,
      date,
      isPresent,
      photoUrl: sanitizedPhotoUrl, // Use sanitized URL
      latitude,
      longitude,
      reason,
    });
    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update attendance
router.put('/:id', authMiddleware, async (req, res) => {

  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance not found' });
    }
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete today's attendance (For testing)
// Delete today's attendance (For testing)
router.delete('/today/:userId', authMiddleware, async (req, res) => {

  try {
    const { userId } = req.params;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const result = await Attendance.deleteMany({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({
      message: 'Attendance deleted',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({ error: 'Server error DELETE TODAY' });
  }
});

// Delete attendance for specific user and date
router.delete('/user/:userId/date/:date', authMiddleware, async (req, res) => {

  try {
    const { userId, date } = req.params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Widen the search to account for timezone shifts.
    // If the user says "2025-12-17", we surely mean an attendance marked "approx now"
    // The previous math covers 00:00 to 23:59 LOCAL SERVER TIME.
    // But if sending dateStr, it's UTC 00:00.
    // Let's cover the entire 48h window surrounding that date to be safe, 
    // effectively catching any record marked "for that calendar date" in any timezone.

    // Better yet, just use a wider window.
    startOfDay.setDate(startOfDay.getDate() - 1);
    endOfDay.setDate(endOfDay.getDate() + 1);

    console.log(`--- DELETE REQUEST (WIDENED) ---`);
    console.log(`User: ${userId}, Date param: ${date}`);
    console.log(`Start of Day (Widened): ${startOfDay.toISOString()}`);
    console.log(`End of Day (Widened): ${endOfDay.toISOString()}`);

    // Debug: Find ALL records for this user to see what dates we have
    const allUserRecords = await Attendance.find({ userId });

    // Debug: Find specific range match
    const existing = await Attendance.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const result = await Attendance.deleteMany({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(`Deleted count: ${result.deletedCount}`);
    console.log(`----------------------`);

    res.json({
      message: 'Attendance deleted',
      deletedCount: result.deletedCount,
      debug: {
        userId,
        dateParam: date,
        serverQueryStart: startOfDay.toISOString(),
        serverQueryEnd: endOfDay.toISOString(),
        foundRecordsInRange: existing.map(e => ({ id: e._id, date: e.date.toISOString() })),
        ALL_USER_RECORDS: allUserRecords.map(e => ({ id: e._id, date: e.date.toISOString() }))
      }
    });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({ error: 'Server error DELETE DATE' });
  }
});

export default router;