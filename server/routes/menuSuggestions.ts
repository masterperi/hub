import express from 'express';
import MenuSuggestion from '../models/MenuSuggestion';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all menu suggestions
router.get('/', async (req, res) => {
  try {
    const { hostelBlock, forDate } = req.query;
    const query: any = {};
    if (hostelBlock) query.hostelBlock = hostelBlock;

    if (forDate) {
      const d = new Date(forDate as string);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      query.forDate = { $gte: start, $lte: end };
    }

    const suggestions = await MenuSuggestion.find(query).populate('userId', 'name').sort({ votes: -1 });
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create menu suggestion
router.post('/', async (req, res) => {
  try {
    if (!req.body.hostelBlock) {
      return res.status(400).json({ error: 'Hostel block is required' });
    }
    // Set userId from authenticated user
    const suggestionData = {
      ...req.body,
      userId: (req as any).user.id,
      votedBy: [(req as any).user.id], // Creator automatically votes
      votes: 1
    };
    const suggestion = new MenuSuggestion(suggestionData);
    await suggestion.save();
    res.status(201).json(suggestion);
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Vote for suggestion
router.post('/:id/vote', async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Check if user has already voted
    const existingSuggestion = await MenuSuggestion.findById(req.params.id);
    if (!existingSuggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    if (existingSuggestion.votedBy.includes(userId)) {
      return res.status(400).json({ error: 'You have already voted for this suggestion' });
    }

    const suggestion = await MenuSuggestion.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { votes: 1 },
        $push: { votedBy: userId }
      },
      { new: true }
    );

    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete suggestion
router.delete('/:id', async (req, res) => {
  try {
    const suggestion = await MenuSuggestion.findByIdAndDelete(req.params.id);
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
    res.json({ message: 'Suggestion deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;