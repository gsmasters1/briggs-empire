// File: ai-book-generator.js
// Advanced AI Book Generation System for Briggs Empire

class BookGenerator {
  constructor() {
    this.providers = ['openai', 'claude'];
    this.currentProvider = 'openai';
    this.rateLimits = new Map();
  }

  // Generate complete book with multiple chapters
  async generateBook(bookConfig) {
    const startTime = Date.now();
    console.log(`🏰 Starting book generation: "${bookConfig.title}"`);

    const book = {
      title: bookConfig.title,
      genre: bookConfig.genre || 'General',
      chapters: [],
      metadata: {
        startTime: new Date().toISOString(),
        providers: [],
        totalWords: 0,
        generationTime: 0
      }
    };

    // Create chapter outline
    const chapterOutline = bookConfig.chapters || [
      'Introduction',
      'Main Content',
      'Conclusion'
    ];

    let bookContext = `This book titled "${bookConfig.title}" is a ${book.genre} work.`;

    // Generate each chapter
    for (let i = 0; i < chapterOutline.length; i++) {
      const chapterTitle = chapterOutline[i];
      console.log(`📝 Generating Chapter ${i + 1}: ${chapterTitle}`);

      try {
        const chapterContent = await this.generateChapter({
          bookTitle: bookConfig.title,
          chapterTitle: chapterTitle,
          chapterNumber: i + 1,
          totalChapters: chapterOutline.length,
          genre: book.genre,
          context: bookContext,
          targetWords: bookConfig.chapterLength || 1500
        });

        const chapter = {
          number: i + 1,
          title: chapterTitle,
          content: chapterContent.content,
          provider: chapterContent.provider,
          wordCount: chapterContent.wordCount,
          timestamp: new Date().toISOString()
        };

        book.chapters.push(chapter);
        book.metadata.providers.push(chapterContent.provider);
        book.metadata.totalWords += chapterContent.wordCount;

        // Update context for next chapter
        bookContext += `\n\nChapter ${i + 1}: ${chapterTitle}\n${chapterContent.content.substring(0, 500)}...`;

        // Brief pause between chapters
        await this.sleep(2000);

      } catch (error) {
        console.error(`❌ Failed to generate Chapter ${i + 1}:`, error.message);
        
        book.chapters.push({
          number: i + 1,
          title: chapterTitle,
          content: `[Chapter generation failed: ${error.message}]`,
          provider: null,
          wordCount: 0,
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    }

    // Finalize book metadata
    book.metadata.endTime = new Date().toISOString();
    book.metadata.generationTime = Math.round((Date.now() - startTime) / 1000);
    book.metadata.successfulChapters = book.chapters.filter(ch => !ch.error).length;

    console.log(`✅ Book "${bookConfig.title}" completed in ${book.metadata.generationTime} seconds`);
    console.log(`📊 Stats: ${book.metadata.totalWords} words, ${book.metadata.successfulChapters}/${chapterOutline.length} chapters successful`);

    return book;
  }

  // Generate individual chapter with AI
  async generateChapter(config) {
    const prompt = this.buildChapterPrompt(config);
    
    // Try primary provider first, then fallback
    for (const provider of this.providers) {
      if (this.isRateLimited(provider)) {
        console.log(`⏳ Provider ${provider} rate limited, trying next...`);
        continue;
      }

      try {
        const content = await this.callAI(provider, prompt);
        this.updateRateLimit(provider);

        return {
          content: content,
          provider: provider,
          wordCount: content.split(' ').length
        };

      } catch (error) {
        console.error(`❌ Provider ${provider} failed:`, error.message);
        this.handleProviderError(provider);
        continue;
      }
    }

    throw new Error('All AI providers failed for chapter generation');
  }

  // Build optimized prompt for chapter generation
  buildChapterPrompt(config) {
    return `You are writing Chapter ${config.chapterNumber} of ${config.totalChapters} for a ${config.genre} book titled "${config.bookTitle}".

CHAPTER DETAILS:
- Title: ${config.chapterTitle}
- Target Length: ${config.targetWords} words
- Genre: ${config.genre}

BOOK CONTEXT:
${config.context}

INSTRUCTIONS:
Write an engaging ${config.targetWords}-word chapter that:
1. Has a compelling opening that hooks the reader
2. Develops the topic thoroughly with specific examples
3. Maintains consistent tone and style with the book
4. Includes smooth transitions between sections
5. Ends with a satisfying conclusion that flows to the next chapter

Write the complete chapter content now:`;
  }

  // Call AI provider APIs
  async callAI(provider, prompt) {
    switch (provider) {
      case 'openai':
        return await this.callOpenAI(prompt);
      case 'claude':
        return await this.callClaude(prompt);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  // OpenAI API call
  async callOpenAI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    return data.choices[0].message.content;
  }

  // Claude API call
  async callClaude(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Claude API error');
    }

    return data.content[0].text;
  }

  // Rate limiting management
  isRateLimited(provider) {
    const limit = this.rateLimits.get(provider);
    if (!limit) return false;
    return Date.now() - limit.lastCall < limit.cooldown;
  }

  updateRateLimit(provider) {
    this.rateLimits.set(provider, {
      lastCall: Date.now(),
      cooldown: 3000 // 3 second cooldown between calls
    });
  }

  handleProviderError(provider) {
    this.rateLimits.set(provider, {
      lastCall: Date.now(),
      cooldown: 15000 // 15 second cooldown on error
    });
  }

  // Generate quick content snippet for testing
  async generateSnippet(topic) {
    const prompt = `Write a compelling 200-word introduction about: ${topic}`;
    
    for (const provider of this.providers) {
      if (this.isRateLimited(provider)) continue;
      
      try {
        const content = await this.callAI(provider, prompt);
        this.updateRateLimit(provider);
        
        return {
          content: content,
          provider: provider,
          wordCount: content.split(' ').length,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Provider ${provider} failed:`, error.message);
        this.handleProviderError(provider);
        continue;
      }
    }
    
    throw new Error('All AI providers failed for snippet generation');
  }

  // Get system status
  getStatus() {
    return {
      providers: this.providers.map(name => ({
        name,
        available: !this.isRateLimited(name),
        configured: this.isProviderConfigured(name),
        lastUsed: this.rateLimits.get(name)?.lastCall || null
      })),
      currentProvider: this.currentProvider,
      timestamp: new Date().toISOString()
    };
  }

  isProviderConfigured(provider) {
    switch (provider) {
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      case 'claude':
        return !!process.env.CLAUDE_API_KEY;
      default:
        return false;
    }
  }

  // Utility functions
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { BookGenerator };
