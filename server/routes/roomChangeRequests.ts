import express from 'express';
import RoomChangeRequest from '../models/RoomChangeRequest';
import User from '../models/User';
import Room from '../models/Room';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all room change requests for a user
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const requests = await RoomChangeRequest.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a room change request
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { userId, currentRoom, requestedRoom, reason, hostelBlock } = req.body;

        // Check for existing pending request
        const existing = await RoomChangeRequest.findOne({ userId, status: 'pending' });
        if (existing) {
            return res.status(400).json({ error: 'You already have a pending room change request' });
        }

        const request = new RoomChangeRequest({
            userId,
            currentRoom,
            requestedRoom,
            reason,
            hostelBlock
        });

        await request.save();
        res.status(201).json(request);
    } catch (error) {
        console.error("Room change request error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Get all requests for a hostel block
router.get('/hostel/:hostelBlock', authMiddleware, async (req, res) => {
    try {
        // Check if user is admin (optional, can depend on authMiddleware)
        const requests = await RoomChangeRequest.find({ hostelBlock: req.params.hostelBlock })
            .populate('userId', 'name registerId')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Update request status
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { status, adminRemarks } = req.body;
        const requestId = req.params.id;

        const request = await RoomChangeRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // If approving, perform the actual room change
        if (status === 'approved' && request.status !== 'approved') {
            if (!request.requestedRoom) {
                return res.status(400).json({ error: 'No requested room specified in request' });
            }

            // check if room exists and has space
            const newRoom = await Room.findOne({
                roomNumber: request.requestedRoom,
                hostelBlock: request.hostelBlock
            });

            if (!newRoom) {
                return res.status(404).json({ error: 'Requested room not found' });
            }

            if (newRoom.currentOccupancy >= newRoom.capacity) {
                return res.status(400).json({ error: 'Requested room is already full' });
            }

            // Update User
            await User.findByIdAndUpdate(request.userId, {
                roomNumber: request.requestedRoom
            });

            // Update new room occupancy
            newRoom.currentOccupancy += 1;
            await newRoom.save();

            // Decrease old room occupancy
            const oldRoom = await Room.findOne({
                roomNumber: request.currentRoom,
                hostelBlock: request.hostelBlock
            });
            if (oldRoom && oldRoom.currentOccupancy > 0) {
                oldRoom.currentOccupancy -= 1;
                await oldRoom.save();
            }
        }

        request.status = status;
        request.adminRemarks = adminRemarks;
        request.updatedAt = new Date();
        await request.save();

        res.json(request);
    } catch (error) {
        console.error("Update room change error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
