import express from 'express';
import Announcement from '../models/Announcement';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all announcements (Scoped by Block)
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const { hostelBlock } = req.user;

    // Find announcements that match the user's block strictly
    const announcements = await Announcement.find({
      hostelBlock: hostelBlock
    }).sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create announcement (Admin Only - Scoped to Block unless Global flag?)
// Assuming Admin creates for their block by default.
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { title, content, isEmergency, isHoliday, isGlobal } = req.body;

    const announcement = new Announcement({
      title,
      content,
      isEmergency,
      isHoliday,
      hostelBlock: isGlobal ? undefined : req.user.hostelBlock // Auto-assign Admin's block
    });

    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update announcement
router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    // Ensure Admin can only edit their block's announcements (or global ones they created?)
    // For simplicity, matching block or if global allow update? 
    // Let's enforce block check if it has a block.

    const announcement = await Announcement.findOne({ _id: req.params.id });
    if (!announcement) return res.status(404).json({ error: 'Not found' });

    if (announcement.hostelBlock && announcement.hostelBlock !== req.user.hostelBlock) {
      return res.status(403).json({ error: 'Unauthorized to edit this block announcement' });
    }

    const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete announcement
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const announcement = await Announcement.findOne({ _id: req.params.id });
    if (!announcement) return res.status(404).json({ error: 'Not found' });

    if (announcement.hostelBlock && announcement.hostelBlock !== req.user.hostelBlock) {
      return res.status(403).json({ error: 'Unauthorized to delete this block announcement' });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;