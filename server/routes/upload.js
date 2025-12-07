import express from 'express';
import multer from 'multer';
import Property from '../models/Property.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

const router = express.Router();

router.post('/:propertyId/upload', upload.single('file'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    property.images.push(req.file.path);
    await property.save();
    res.json({ success: true, file: req.file.path });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
