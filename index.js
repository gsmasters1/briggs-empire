const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock AI status for testing
const mockAIStatus = [
  { name: 'openai', available: !!process.env.OPENAI_API_KEY, lastUsed: null },
  { name: 'claude', available: !!process.env.CLAUDE_API_KEY, lastUsed: null },
  { name: 'gemini', available: !!process.env.GEMINI_API_KEY, lastUsed: null }
];

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Briggs Empire',
    timestamp: new Date().toISOString(),
    ai_providers: mockAIStatus
  });
});

// Dashboard with working buttons
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>🏰 Briggs Empire</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white; 
            margin: 0;
            padding: 20px;
          }
          .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: rgba(0,0,0,0.1); 
            padding: 40px; 
            border-radius: 15px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
          }
          h1 { 
            font-size: 3.5em; 
            margin-bottom: 10px; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            text-align: center;
          }
          .subtitle {
            text-align: center;
            font-size: 1.3em;
            margin-bottom: 40px;
            opacity: 0.9;
          }
          .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          .status { 
            background: rgba(255,255,255,0.15); 
            padding: 25px; 
            border-radius: 12px; 
            border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
          }
          .status h3 {
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .provider-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            padding: 10px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
          }
          .available { color: #4ade80; }
          .unavailable { color: #f87171; }
          .actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 30px 0;
          }
          .btn {
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.3);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            text-decoration: none;
            text-align: center;
            font-weight: bold;
            transition: all 0.3s ease;
            cursor: pointer;
            font-size: 16px;
          }
          .btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
          }
          .btn-primary {
            background: linear-gradient(45deg, #4ade80, #22c55e);
            border-color: #22c55e;
          }
          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          .api-endpoints {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .endpoint {
            font-family: 'Courier New', monospace;
            background: rgba(0,0,0,0.4);
            padding: 8px 12px;
            border-radius: 6px;
            margin: 5px 0;
            font-size: 0.9em;
          }
          #output {
            background: rgba(0,0,0,0.4);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            min-height: 100px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏰 Briggs Empire</h1>
          <p class="subtitle">AI-Powered Book Creation & Management System</p>
          
          <div class="status-grid">
            <div class="status">
              <h3>🤖 AI Providers</h3>
              ${mockAIStatus.map(provider => `
                <div class="provider-status">
                  <span><strong>${provider.name.toUpperCase()}</strong></span>
                  <span class="${provider.available ? 'available' : 'unavailable'}">
                    ${provider.available ? '✅ Configured' : '❌ Missing Key'}
                  </span>
                </div>
              `).join('')}
            </div>
            
            <div class="status">
              <h3>⚡ System Status</h3>
              <p><strong>Server:</strong> ✅ Online</p>
              <p><strong>Port:</strong> ${PORT}</p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
              <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
            </div>
            
            <div class="status">
              <h3>🔑 Configuration</h3>
              <p>OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Ready' : '❌ Missing'}</p>
              <p>Claude: ${process.env.CLAUDE_API_KEY ? '✅ Ready' : '❌ Missing'}</p>
              <p>Gemini: ${process.env.GEMINI_API_KEY ? '✅ Ready' : '❌ Missing'}</p>
            </div>
          </div>
          
          <div class="actions">
            <button class="btn btn-primary" onclick="testConnection()">🧪 Test Connection</button>
            <button class="btn" onclick="testAPI()">📡 Test API</button>
            <a href="/api/status" class="btn">📊 API Status</a>
            <a href="/health" class="btn">🩺 Health Check</a>
          </div>
          
          <div id="output">Ready to test Briggs Empire functionality...</div>
          
          <div class="api-endpoints">
            <h3>📡 Available Endpoints:</h3>
            <div class="endpoint">GET /health - System health check</div>
            <div class="endpoint">GET /api/status - Detailed system status</div>
            <div class="endpoint">POST /api/test - Test endpoint functionality</div>
            <div class="endpoint">GET /api/config - Configuration status</div>
          </div>
        </div>
        
        <script>
          function updateOutput(message) {
            document.getElementById('output').textContent = message;
          }
          
          async function testConnection() {
            const btn = event.target;
            btn.textContent = '🔄 Testing...';
            btn.disabled = true;
            updateOutput('Testing server connection...');
            
            try {
              const response = await fetch('/health');
              const result = await response.json();
              updateOutput('Connection Test SUCCESS:\\n' + JSON.stringify(result, null, 2));
            } catch (error) {
              updateOutput('Connection Test FAILED:\\n' + error.message);
            } finally {
              btn.textContent = '🧪 Test Connection';
              btn.disabled = false;
            }
          }
          
          async function testAPI() {
            const btn = event.target;
            btn.textContent = '🔄 Testing API...';
            btn.disabled = true;
            updateOutput('Testing API endpoints...');
            
            try {
              const response = await fetch('/api/status');
              const result = await response.json();
              updateOutput('API Test SUCCESS:\\n' + JSON.stringify(result, null, 2));
            } catch (error) {
              updateOutput('API Test FAILED:\\n' + error.message);
            } finally {
              btn.textContent = '📡 Test API';
              btn.disabled = false;
            }
          }
        </script>
      </body>
    </html>
  `);
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Briggs Empire API Online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    ai_providers: mockAIStatus,
    server_info: {
      port: PORT,
      node_version: process.version,
      platform: process.platform
    },
    features: {
      basic_server: true,
      api_endpoints: true,
      health_checks: true,
      ai_ready: mockAIStatus.some(p => p.available)
    }
  });
});

// Test endpoint
app.post('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    received_data: req.body
  });
});

// Configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    ai_providers: mockAIStatus,
    environment: process.env.NODE_ENV || 'development',
    features_available: [
      'Health Monitoring',
      'API Status Checking', 
      'Configuration Validation',
      'Error Handling'
    ],
    next_steps: [
      'Add AI Provider Manager',
      'Implement Book Generation',
      'Connect Database',
      'Add Authentication'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`,
    available_endpoints: ['/health', '/api/status', '/api/config', '/api/test']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏰 Briggs Empire server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Basic functionality ready`);
  console.log(`🚀 Dashboard available at: http://localhost:${PORT}`);
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
