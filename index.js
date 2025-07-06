const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Railway port configuration - this is CRITICAL
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint - Railway uses this
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Briggs Empire',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint with beautiful dashboard
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>🏰 Briggs Empire</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white; 
            text-align: center; 
            padding: 50px;
            margin: 0;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(0,0,0,0.1); 
            padding: 40px; 
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          h1 { font-size: 3em; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
          .status { 
            background: rgba(255,255,255,0.2); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0;
            border: 1px solid rgba(255,255,255,0.3);
          }
          .port-info { background: rgba(0,255,0,0.2); }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏰 Welcome to Briggs Empire</h1>
          <p>AI-Powered Book Creation & Management System</p>
          
          <div class="status port-info">
            <h3>🚢 Port Configuration</h3>
            <p><strong>Running on Port:</strong> ${PORT}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Server Status:</strong> ✅ ONLINE</p>
          </div>
          
          <div class="status">
            <h3>🤖 AI Providers Ready</h3>
            <p>OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not Set'}</p>
            <p>Claude: ${process.env.CLAUDE_API_KEY ? '✅ Configured' : '❌ Not Set'}</p>
            <p>Gemini: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not Set'}</p>
          </div>
          
          <div class="status">
            <h3>📊 System Info</h3>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
            <p><strong>Node.js:</strong> ${process.version}</p>
          </div>
          
          <p><em>Ready to build your book empire!</em></p>
        </div>
      </body>
    </html>
  `);
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Briggs Empire API Online',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    ai_providers: {
      openai: process.env.OPENAI_API_KEY ? 'ready' : 'not configured',
      claude: process.env.CLAUDE_API_KEY ? 'ready' : 'not configured',
      gemini: process.env.GEMINI_API_KEY ? 'ready' : 'not configured'
    }
  });
});

// Simple API endpoints for testing
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working!',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    port: PORT
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`,
    port: PORT
  });
});

// Start server - CRITICAL: Listen on 0.0.0.0 for Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏰 Briggs Empire server starting...`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Server ready and listening on 0.0.0.0:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
