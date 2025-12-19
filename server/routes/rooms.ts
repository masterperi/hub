import express from 'express';
import Room from '../models/Room';
import User from '../models/User';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all rooms (Scoped by Block)
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const { hostelBlock } = req.user;

    // Students/Admins see rooms in their block
    // We get the raw room docs first
    const rooms = await Room.find({ hostelBlock }).lean();

    // Enhancing rooms with real-time occupancy
    // This could be expensive if there are many rooms. 
    // Optimization: Depending on usage, might be better to do an aggregation.
    // For now, let's just map it if the list isn't massive.
    // A better approach for "All Rooms" might be to just trust the DB or do an aggregate.
    // Given the specific issue is on "Room Details" (single room), let's focus on that first, 
    // but the user might view a list too.
    // Let's stick effectively to the single room fix for the specific user complaint, 
    // but updating 'all' is consistent.

    // Using aggregation to get counts per room would be better for performance.
    const roomOccupancy = await User.aggregate([
      { $match: { hostelBlock: hostelBlock } },
      { $group: { _id: "$roomNumber", count: { $sum: 1 } } }
    ]);

    const occupancyMap = new Map(roomOccupancy.map(r => [r._id, r.count]));

    const roomsWithOccupancy = rooms.map((room: any) => ({
      ...room,
      currentOccupancy: occupancyMap.get(room.roomNumber) || 0
    }));

    res.json(roomsWithOccupancy);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get rooms by specific block letter (A, B, C, D)
router.get('/block/:block', authMiddleware, async (req: any, res) => {
  try {
    const { block } = req.params;
    const { hostelBlock } = req.user;

    // Filter rooms by starting letter if block is single char, or just return all
    const query: any = { hostelBlock };
    if (block && block.length === 1) {
      query.roomNumber = { $regex: new RegExp(`^${block}`, 'i') };
    }

    const rooms = await Room.find(query).lean();

    // Use aggregation to get counts per room
    const roomOccupancy = await User.aggregate([
      { $match: { hostelBlock: hostelBlock } },
      { $group: { _id: "$roomNumber", count: { $sum: 1 } } }
    ]);

    const occupancyMap = new Map(roomOccupancy.map(r => [r._id, r.count]));

    const roomsWithOccupancy = rooms.map((room: any) => ({
      ...room,
      currentOccupancy: occupancyMap.get(room.roomNumber) || 0
    }));

    res.json(roomsWithOccupancy);
  } catch (error) {
    console.error("Error fetching rooms by block:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific room
router.get('/:roomNumber/:hostelBlock', authMiddleware, async (req: any, res) => {
  try {
    const { roomNumber, hostelBlock } = req.params;

    if (req.user.hostelBlock?.trim().toLowerCase() !== hostelBlock?.trim().toLowerCase() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to this block' });
    }

    let room = await Room.findOne({ roomNumber, hostelBlock }).lean();

    // Dynamic Occupancy Calculation
    const realTimeOccupancy = await User.countDocuments({ roomNumber, hostelBlock });

    if (!room) {
      // Fallback: If room doesn't exist in Room collection, return a virtual one
      return res.json({
        roomNumber,
        hostelBlock,
        capacity: 4, // Default capacity
        currentOccupancy: realTimeOccupancy
      });
    }

    res.json({
      ...room,
      currentOccupancy: realTimeOccupancy
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create room (Admin Only - Auto Block)
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { roomNumber, capacity } = req.body;

    const existingRoom = await Room.findOne({
      roomNumber,
      hostelBlock: req.user.hostelBlock
    });

    if (existingRoom) {
      return res.status(400).json({ error: 'Room already exists in this block' });
    }

    const room = new Room({
      roomNumber,
      hostelBlock: req.user.hostelBlock,
      capacity,
      currentOccupancy: 0
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update room
router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    // Ensure Admin can only edit their block's rooms
    const room = await Room.findOneAndUpdate(
      {
        _id: req.params.id,
        hostelBlock: req.user.hostelBlock
      },
      req.body,
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ error: 'Room not found or unauthorized' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete room
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const room = await Room.findOneAndDelete({
      _id: req.params.id,
      hostelBlock: req.user.hostelBlock
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found or unauthorized' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;