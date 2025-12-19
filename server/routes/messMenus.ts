import express from 'express';
import MessMenu from '../models/MessMenu';

const router = express.Router();

// Get all mess menus
router.get('/', async (req, res) => {
  try {
    const { hostelBlock } = req.query;
    const query = hostelBlock ? { hostelBlock } : {};
    const menus = await MessMenu.find(query).sort({ date: 1 });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get menu by date
router.get('/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const { hostelBlock } = req.query;

    if (!hostelBlock) {
      return res.status(400).json({ error: 'Hostel block is required' });
    }

    let menus = await MessMenu.find({ date, hostelBlock });

    // If no specific menu for this date, look for default menu for this day of week
    if (menus.length === 0) {
      const dayOfWeek = date.getDay();
      console.log(`[DEBUG] No specific menu for ${date} in ${hostelBlock}. Fallback to dayOfWeek: ${dayOfWeek}`);
      menus = await MessMenu.find({ isDefault: true, dayOfWeek, hostelBlock });

      // Second fallback: Look for "Common" or "General" menu if block specific is missing
      if (menus.length === 0) {
        console.log(`[DEBUG] No block-specific default for ${hostelBlock}. Fallback to Common menu.`);
        menus = await MessMenu.find({ isDefault: true, dayOfWeek, hostelBlock: "Common" });
      }

      console.log(`[DEBUG] Found ${menus.length} menus after fallbacks.`);
    }

    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create mess menu
router.post('/', async (req, res) => {
  try {
    if (!req.body.hostelBlock) {
      return res.status(400).json({ error: 'Hostel block is required' });
    }
    const menu = new MessMenu(req.body);
    await menu.save();
    res.status(201).json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update mess menu
router.put('/:id', async (req, res) => {
  try {
    const menu = await MessMenu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete mess menu
router.delete('/:id', async (req, res) => {
  try {
    const menu = await MessMenu.findByIdAndDelete(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;