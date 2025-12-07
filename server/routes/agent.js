// routes/agent.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Agents endpoint',
    agents: []
  });
});

export default router;