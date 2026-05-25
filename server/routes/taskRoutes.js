const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// Get all tasks
router.get('/', protect, async (req, res) => {
  const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(tasks);
});

// Create task
router.post('/', protect, async (req, res) => {
  const { title, priority } = req.body;
  const task = await Task.create({ userId: req.user._id, title, priority });
  res.status(201).json(task);
});

// Toggle task completion
router.put('/:id/toggle', protect, async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    [{ $set: { completed: { $not: '$completed' } } }],
    { new: true }
  );
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// Delete task
router.delete('/:id', protect, async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ message: 'Task deleted' });
});

module.exports = router;
