// AI Provider Manager - Core of Briggs Empire
// File: ai-providers.js

class AIProviderManager {
  constructor() {
    this.providers = {
      openai: new OpenAIProvider(),
      claude: new ClaudeProvider(), 
      gemini: new GeminiProvider()
    };
    
    this.defaultProvider = 'openai';
    this.rateLimits = new Map();
    this.failoverChain = ['openai', 'claude', 'gemini'];
    this.qualityThresholds = {
      minLength: 500,
      maxLength: 4000,
      coherenceScore: 0.7
    };
  }

  // Main content generation method with automatic failover
  async generateContent(prompt, options = {}) {
    const {
      type = 'chapter',
      provider = this.defaultProvider,
      requireConsistency = true,
      maxRetries = 2
    } = options;

    let attempts = 0;
    let lastError = null;

    // Try primary provider first, then failover chain
    const providersToTry = [provider, ...this.failoverChain.filter(p => p !== provider)];

    for (const providerName of providersToTry) {
      try {
        // Check rate limits
        if (this.isRateLimited(providerName)) {
          console.log(`Provider ${providerName} rate limited, trying next...`);
          continue;
        }

        // Generate content
        const content = await this.providers[providerName].generate(prompt, type);
        
        // Quality validation
        const qualityCheck = this.validateQuality(content);
        if (!qualityCheck.passes) {
          console.log(`Quality check failed for ${providerName}: ${qualityCheck.reason}`);
          attempts++;
          if (attempts < maxRetries) continue;
        }

        // Consistency check (if enabled and we have previous content)
        if (requireConsistency && options.previousContent) {
          const consistencyScore = await this.checkConsistency(content, options.previousContent);
          if (consistencyScore < this.qualityThresholds.coherenceScore) {
            console.log(`Consistency check failed for ${providerName}: ${consistencyScore}`);
            attempts++;
            if (attempts < maxRetries) continue;
          }
        }

        // Success! Update rate limits and return
        this.updateRateLimit(providerName);
        return {
          content,
          provider: providerName,
          qualityScore: qualityCheck.score,
          consistencyScore: options.previousContent ? await this.checkConsistency(content, options.previousContent) : null,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        console.error(`Provider ${providerName} failed:`, error.message);
        lastError = error;
        this.handleProviderError(providerName, error);
        continue;
      }
    }

    // All providers failed
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  // Generate entire book with consistency across chapters
  async generateBook(bookPrompt, chapterOutline) {
    const book = {
      title: bookPrompt.title,
      chapters: [],
      metadata: {
        startTime: new Date().toISOString(),
        providers: [],
        qualityScores: []
      }
    };

    let previousContent = bookPrompt.context || '';

    for (let i = 0; i < chapterOutline.length; i++) {
      const chapter = chapterOutline[i];
      console.log(`Generating Chapter ${i + 1}: ${chapter.title}`);

      try {
        const result = await this.generateContent(
          this.buildChapterPrompt(bookPrompt, chapter, previousContent),
          {
            type: 'chapter',
            requireConsistency: true,
            previousContent: previousContent,
            maxRetries: 3
          }
        );

        const chapterData = {
          number: i + 1,
          title: chapter.title,
          content: result.content,
          provider: result.provider,
          qualityScore: result.qualityScore,
          consistencyScore: result.consistencyScore,
          wordCount: result.content.split(' ').length,
          timestamp: result.timestamp
        };

        book.chapters.push(chapterData);
        book.metadata.providers.push(result.provider);
        book.metadata.qualityScores.push(result.qualityScore);

        // Update context for next chapter
        previousContent = this.buildContextFromChapters(book.chapters);

        // Brief pause to respect rate limits
        await this.sleep(1000);

      } catch (error) {
        console.error(`Failed to generate chapter ${i + 1}:`, error);
        
        // Add placeholder chapter to maintain structure
        book.chapters.push({
          number: i + 1,
          title: chapter.title,
          content: `[GENERATION FAILED: ${error.message}]`,
          provider: null,
          qualityScore: 0,
          consistencyScore: 0,
          wordCount: 0,
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    }

    book.metadata.endTime = new Date().toISOString();
    book.metadata.totalWords = book.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
    book.metadata.averageQuality = book.metadata.qualityScores.reduce((sum, score) => sum + score, 0) / book.metadata.qualityScores.length;
    book.metadata.successfulChapters = book.chapters.filter(ch => !ch.error).length;

    return book;
  }

  // Build chapter prompt with context
  buildChapterPrompt(bookPrompt, chapter, previousContent) {
    return `
BOOK CONTEXT:
Title: ${bookPrompt.title}
Genre: ${bookPrompt.genre}
Style: ${bookPrompt.style}
Target Audience: ${bookPrompt.audience}

PREVIOUS CONTEXT:
${previousContent.slice(-1500)} // Last 1500 chars for context

CHAPTER TO WRITE:
Title: ${chapter.title}
Outline: ${chapter.outline}
Key Points: ${chapter.keyPoints?.join(', ') || 'None specified'}

INSTRUCTIONS:
Write a compelling ${chapter.length || '2000-3000'} word chapter that:
1. Maintains consistency with the previous content
2. Follows the chapter outline closely
3. Matches the book's established tone and style
4. Includes engaging storytelling elements
5. Ends with a natural transition to the next chapter

Write the chapter content now:
`;
  }

  // Quality validation
  validateQuality(content) {
    const wordCount = content.split(' ').length;
    const score = Math.min(
      (wordCount / this.qualityThresholds.minLength) * 0.5 +
      (this.qualityThresholds.maxLength / Math.max(wordCount, this.qualityThresholds.maxLength)) * 0.3 +
      this.calculateCoherenceScore(content) * 0.2,
      1.0
    );

    return {
      passes: score >= 0.6 && wordCount >= this.qualityThresholds.minLength,
      score: score,
      reason: score < 0.6 ? 'Quality score too low' : wordCount < this.qualityThresholds.minLength ? 'Content too short' : 'Passed'
    };
  }

  // Simple coherence scoring
  calculateCoherenceScore(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 3) return 0.3;

    // Basic coherence indicators
    const hasTransitions = /\b(however|therefore|meanwhile|furthermore|consequently|moreover)\b/gi.test(content);
    const hasVariedSentences = new Set(sentences.map(s => s.length)).size > 2;
    const hasGoodStructure = content.includes('\n\n') || content.includes('\n');

    return (hasTransitions ? 0.4 : 0) + (hasVariedSentences ? 0.3 : 0) + (hasGoodStructure ? 0.3 : 0);
  }

  // Cross-AI consistency checking
  async checkConsistency(newContent, previousContent) {
    // Simple consistency check - in production, could use embeddings
    const newWords = new Set(newContent.toLowerCase().match(/\b\w+\b/g) || []);
    const prevWords = new Set(previousContent.toLowerCase().match(/\b\w+\b/g) || []);
    
    const intersection = new Set([...newWords].filter(word => prevWords.has(word)));
    const union = new Set([...newWords, ...prevWords]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  // Build context from previous chapters
  buildContextFromChapters(chapters) {
    return chapters
      .slice(-2) // Last 2 chapters
      .map(ch => `Chapter ${ch.number}: ${ch.title}\n${ch.content.slice(-800)}`) // Last 800 chars each
      .join('\n\n');
  }

  // Rate limiting
  isRateLimited(provider) {
    const limit = this.rateLimits.get(provider);
    if (!limit) return false;
    return Date.now() - limit.lastCall < limit.cooldown;
  }

  updateRateLimit(provider) {
    this.rateLimits.set(provider, {
      lastCall: Date.now(),
      cooldown: 2000 // 2 second cooldown
    });
  }

  handleProviderError(provider, error) {
    // Increase cooldown on errors
    this.rateLimits.set(provider, {
      lastCall: Date.now(),
      cooldown: 10000 // 10 second cooldown on error
    });
  }

  // Utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Status reporting
  getProviderStatus() {
    return Object.keys(this.providers).map(name => ({
      name,
      available: !this.isRateLimited(name),
      lastUsed: this.rateLimits.get(name)?.lastCall || null
    }));
  }
}

// Individual Provider Classes
class OpenAIProvider {
  async generate(prompt, type) {
    // Implementation will use OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: type === 'chapter' ? 4000 : 2000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenAI API error');
    
    return data.choices[0].message.content;
  }
}

class ClaudeProvider {
  async generate(prompt, type) {
    // Implementation will use Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: type === 'chapter' ? 4000 : 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Claude API error');
    
    return data.content[0].text;
  }
}

class GeminiProvider {
  async generate(prompt, type) {
    // Implementation will use Google Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: type === 'chapter' ? 4000 : 2000,
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Gemini API error');
    
    return data.candidates[0].content.parts[0].text;
  }
}

module.exports = { AIProviderManager };
