import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import fs from 'fs';

// Import routes
import adminRoutes from './routes/admin.js';
import clientRoutes from './routes/clients.js';
import leadRoutes from './routes/leads.js';
import propertyRoutes from './routes/properties.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import clientInquiryRoutes from './routes/clientInquiries.js';
import contactRoutes from './routes/contact.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads/properties');
const profileImagesDir = path.join(__dirname, 'uploads/profile-images');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created properties uploads directory:', uploadsDir);
}

if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
  console.log('✅ Created profile images directory:', profileImagesDir);
}

// ============= CRITICAL: CORS CONFIGURATION FIRST =============
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// ============= HELMET CONFIGURATION =============
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============= STATIC FILES =============
const addCorsHeaders = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
};

app.use('/uploads/properties', addCorsHeaders, express.static(path.join(__dirname, 'uploads/properties'), {
  maxAge: '1d',
  etag: false
}));

app.use('/uploads/profile-images', addCorsHeaders, express.static(path.join(__dirname, 'uploads/profile-images'), {
  maxAge: '1d',
  etag: false
}));

app.use('/uploads/avatars', addCorsHeaders, express.static(path.join(__dirname, 'public/avatars'), {
  maxAge: '1d',
  etag: false
}));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/realizty';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ============= API ROUTES =============

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      user: '/api/users/*',
      auth: '/api/auth/*',
      properties: '/api/properties/*',
      admin: '/api/admin/*',
      clientInquiries: '/api/client-inquiries/*'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test CORS endpoint
app.post('/api/test-cors', (req, res) => {
  console.log('✅ CORS test endpoint hit');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({
    success: true,
    message: 'CORS is working!',
    receivedData: req.body
  });
});

// ============= REGISTER ALL API ROUTES =============
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/client-inquiries', clientInquiryRoutes);
app.use('/api/contact', contactRoutes);

// 404 handler for missing uploads
app.use('/uploads/*', (req, res) => {
  console.error('❌ Image not found:', req.url);
  res.status(404).json({ 
    success: false,
    error: 'Image not found',
    path: req.url 
  });
});

// 404 handler for API
app.use('/api/*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  console.error('Error Stack:', err.stack);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.'
    });
  }
  
  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only images are allowed.'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const INITIAL_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_ATTEMPTS = 10;

function startServer(port, attemptsLeft = MAX_PORT_ATTEMPTS) {
  const server = app.listen(port);

  server.on('listening', () => {
    console.log('\n🚀 ============================================');
    console.log(`✅ Server running on port ${port}`);
    console.log(`🌐 API Base: http://localhost:${port}/api`);
    console.log(`🧪 Test CORS: http://localhost:${port}/api/test-cors`);
    console.log('============================================\n');

    console.log('📁 Available Endpoints:');
    console.log('   POST   /api/client-inquiries         - Submit inquiry');
    console.log('   GET    /api/client-inquiries         - Get all inquiries');
    console.log('   POST   /api/test-cors                - Test CORS');
    console.log('\n✅ CORS enabled for all origins (development mode)');
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} in use.`);
      server.close?.();
      if (attemptsLeft > 1) {
        const nextPort = port + 1;
        console.log(`🔁 Trying port ${nextPort} (${attemptsLeft - 1} attempts left)`);
        setTimeout(() => startServer(nextPort, attemptsLeft - 1), 300);
      } else {
        console.error(`❌ All ${MAX_PORT_ATTEMPTS} port attempts failed. Exiting.`);
        process.exit(1);
      }
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}

startServer(INITIAL_PORT);