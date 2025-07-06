const express = require('express');
const path = require('path');
require('dotenv').config();

// Import our AI Provider Manager
const { AIProviderManager } = require('./ai-providers');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize AI Manager
const aiManager = new AIProviderManager();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Briggs Empire',
    timestamp: new Date().toISOString(),
    ai_providers: aiManager.getProviderStatus()
  });
});

// Enhanced dashboard with AI status
app.get('/', (req, res) => {
  const providerStatus = aiManager.getProviderStatus();
  
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
          }
          .btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
          }
          .btn-primary {
            background: linear-gradient(45deg, #4ade80, #22c55e);
            border-color: #22c55e;
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
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏰 Briggs Empire</h1>
          <p class="subtitle">AI-Powered Book Creation & Management System</p>
          
          <div class="status-grid">
            <div class="status">
              <h3>🤖 AI Providers</h3>
              ${providerStatus.map(provider => `
                <div class="provider-status">
                  <span><strong>${provider.name.toUpperCase()}</strong></span>
                  <span class="${provider.available ? 'available' : 'unavailable'}">
                    ${provider.available ? '✅ Available' : '🔄 Rate Limited'}
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
              <h3>🔑 API Keys</h3>
              <p>OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}</p>
              <p>Claude: ${process.env.CLAUDE_API_KEY ? '✅ Configured' : '❌ Missing'}</p>
              <p>Gemini: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}</p>
            </div>
          </div>
          
          <div class="actions">
            <button class="btn btn-primary" onclick="testAI()">🧪 Test AI Generation</button>
            <button class="btn" onclick="generateBook()">📚 Generate Sample Book</button>
            <a href="/api/status" class="btn">📊 API Status</a>
            <a href="/health" class="btn">🩺 Health Check</a>
          </div>
          
          <div class="api-endpoints">
            <h3>📡 Available Endpoints:</h3>
            <div class="endpoint">POST /api/generate-content - Generate single content piece</div>
            <div class="endpoint">POST /api/generate-book - Generate complete book</div>
            <div class="endpoint">GET /api/ai-status - Get AI provider status</div>
            <div class="endpoint">GET /api/test-ai - Test AI connectivity</div>
          </div>
        </div>
        
        <script>
          async function testAI() {
            const btn = event.target;
            btn.textContent = '🔄 Testing...';
            btn.disabled = true;
            
            try {
              const response = await fetch('/api/test-ai');
              const result = await response.json();
              alert('AI Test Result: ' + JSON.stringify(result, null, 2));
            } catch (error) {
              alert('Test failed: ' + error.message);
            } finally {
              btn.textContent = '🧪 Test AI Generation';
              btn.disabled = false;
            }
          }
          
          async function generateBook() {
            const btn = event.target;
            btn.textContent = '📖 Generating...';
            btn.disabled = true;
            
            try {
              const response = await fetch('/api/generate-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: 'The AI Revolution',
                  genre: 'Non-fiction',
                  chapters: ['Introduction', 'The Rise of AI', 'Future Implications']
                })
              });
              const result = await response.json();
              alert('Book generated! Check console for details.');
              console.log('Generated book:', result);
            } catch (error) {
              alert('Generation failed: ' + error.message);
            } finally {
              btn.textContent = '📚 Generate Sample Book';
              btn.disabled = false;
            }
          }
        </script>
      </body>
    </html>
  `);
});

// API Endpoints for AI functionality

// Test AI connectivity
app.get('/api/test-ai', async (req, res) => {
  try {
    const testPrompt = "Write a single paragraph about the future of AI in publishing.";
    const result = await aiManager.generateContent(testPrompt, { type: 'test' });
    
    res.json({
