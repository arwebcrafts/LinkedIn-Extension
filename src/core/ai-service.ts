/**
 * AI SERVICE
 * High-quality comment and post generation using OpenAI
 */

export interface CommentContext {
  postContent: string;
  authorName: string;
  authorTitle?: string;
  postTopic?: string;
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'thoughtful';
  length?: 'short' | 'medium' | 'long';
}

export interface PostContext {
  topic: string;
  goal?: 'engagement' | 'education' | 'inspiration' | 'lead_generation';
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'storytelling';
  includeCallToAction?: boolean;
  targetAudience?: string;
}

export class AIService {
  private readonly OPENAI_API_KEY: string;
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.OPENAI_API_KEY = apiKey;
  }

  /**
   * Generate engaging, human-like comment
   * Creates authentic comments that drive real engagement
   */
  public async generateComment(context: CommentContext): Promise<string> {
    const systemPrompt = this.getCommentSystemPrompt(context);
    const userPrompt = this.getCommentUserPrompt(context);

    try {
      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Fast and cost-effective
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.9, // Higher creativity for natural variety
          max_tokens: 200,
          presence_penalty: 0.6, // Encourage diverse vocabulary
          frequency_penalty: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const comment = data.choices[0].message.content.trim();

      // Clean up any unwanted formatting
      return this.cleanupComment(comment);

    } catch (error) {
      console.error('AI comment generation failed:', error);
      // Fallback to a high-quality template
      return this.getFallbackComment(context);
    }
  }

  /**
   * Generate lead magnet post
   * Creates engaging posts that attract attention and drive action
   */
  public async generatePost(context: PostContext): Promise<string> {
    const systemPrompt = this.getPostSystemPrompt(context);
    const userPrompt = this.getPostUserPrompt(context);

    try {
      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Higher quality for posts
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 800,
          presence_penalty: 0.5,
          frequency_penalty: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const post = data.choices[0].message.content.trim();

      return this.cleanupPost(post);

    } catch (error) {
      console.error('AI post generation failed:', error);
      throw error;
    }
  }

  /**
   * System prompt for comment generation
   * Optimized for engaging, authentic LinkedIn comments
   */
  private getCommentSystemPrompt(context: CommentContext): string {
    const tone = context.tone || 'professional';
    const length = context.length || 'medium';

    return `You are a LinkedIn engagement expert writing authentic, engaging comments.

YOUR GOAL: Write comments that:
- Sound 100% human and conversational
- Add genuine value to the discussion
- Encourage the author to respond
- Show you actually read and understood the post
- Build real professional connections

TONE: ${this.getToneGuidance(tone)}

LENGTH GUIDELINE:
${length === 'short' ? '- 1-2 sentences (15-30 words)' : ''}
${length === 'medium' ? '- 2-3 sentences (30-60 words)' : ''}
${length === 'long' ? '- 3-4 sentences (60-100 words)' : ''}

RULES:
✅ DO:
- Reference specific points from the post
- Share a brief personal insight or experience
- Ask a thoughtful follow-up question (sometimes)
- Use natural, conversational language
- Include relevant emojis occasionally (not overused)
- Show genuine interest and enthusiasm
- Agree AND add unique perspective

❌ DON'T:
- Use generic phrases like "Great post!" or "Thanks for sharing"
- Sound overly formal or robotic
- Use marketing speak or buzzwords excessively
- Make it about selling or self-promotion
- Use multiple exclamation marks!!!
- Start with "This is so true" or "I couldn't agree more"
- Copy the post's language exactly

AUTHENTIC PATTERNS:
- Start with a specific observation: "The point about X really resonates..."
- Share mini-story: "I experienced this when..."
- Add perspective: "What I've found is..."
- Bridge ideas: "This connects to..."
- Ask curious question: "Have you noticed...?"

Write ONLY the comment text. No quotes, no labels, no explanations.`;
  }

  /**
   * User prompt for comment generation
   */
  private getCommentUserPrompt(context: CommentContext): string {
    return `Write an engaging LinkedIn comment for this post:

AUTHOR: ${context.authorName}${context.authorTitle ? ` (${context.authorTitle})` : ''}
${context.postTopic ? `TOPIC: ${context.postTopic}` : ''}

POST CONTENT:
"${context.postContent}"

Write a comment that shows you read and understood the post, adds value, and encourages conversation.`;
  }

  /**
   * System prompt for post generation
   * Optimized for lead magnet, high-engagement posts
   */
  private getPostSystemPrompt(context: PostContext): string {
    const goal = context.goal || 'engagement';
    const tone = context.tone || 'professional';

    return `You are a LinkedIn content strategist writing viral, engaging posts that drive real results.

YOUR GOAL: Create a ${goal === 'lead_generation' ? 'LEAD MAGNET' : 'HIGHLY ENGAGING'} post that:
- Stops the scroll in first 2 seconds
- Provides genuine, actionable value
- Encourages comments and shares
- Positions the author as an authority
- ${goal === 'lead_generation' ? 'Drives profile visits and connection requests' : 'Sparks meaningful discussion'}

TONE: ${this.getToneGuidance(tone)}

STRUCTURE (Use this flow):

1. HOOK (First line - CRITICAL):
   - Ask provocative question, OR
   - Share surprising statistic, OR
   - Make bold statement, OR
   - Tell micro-story opening

2. CONTEXT (2-3 lines):
   - Explain the problem or situation
   - Make it relatable and specific
   - Use "you" to speak directly to reader

3. VALUE (Main content):
   ${goal === 'education' ? '- Share 3-5 actionable tips/insights' : ''}
   ${goal === 'inspiration' ? '- Tell a compelling story with lesson' : ''}
   ${goal === 'engagement' ? '- Present contrarian or thought-provoking idea' : ''}
   ${goal === 'lead_generation' ? '- Tease valuable knowledge/framework' : ''}
   - Use short paragraphs (1-2 lines max)
   - Include specific examples
   - Add line breaks for readability

4. CALL TO ACTION:
   ${context.includeCallToAction !== false ? '- Ask engaging question' : ''}
   - Encourage comments with specific prompt
   - ${goal === 'lead_generation' ? 'Invite to DM/connect for more' : ''}

FORMATTING:
✅ DO:
- Use line breaks liberally (every 1-2 sentences)
- Start strong with hook
- Use numbered lists when sharing tips
- Include 2-3 relevant emojis (strategic placement)
- Keep paragraphs SHORT (mobile-friendly)
- Use "you" and "your" to engage reader
- End with engaging question

❌ DON'T:
- Write long blocks of text
- Use excessive hashtags (max 3-5, at end)
- Sound salesy or promotional
- Use corporate jargon
- Write generic "motivational" content
- Start with "I'm excited to share..."
- Overuse emojis

PROVEN PATTERNS:
- Personal story → lesson → question
- Problem → solution framework → invitation to discuss
- Controversial opinion → supporting points → "What do you think?"
- Surprising data → implications → actionable takeaway

TARGET: 150-250 words (LinkedIn sweet spot)

Write the complete post. No quotes around it, no labels.`;
  }

  /**
   * User prompt for post generation
   */
  private getPostUserPrompt(context: PostContext): string {
    return `Write a compelling LinkedIn post about:

TOPIC: ${context.topic}
${context.targetAudience ? `TARGET AUDIENCE: ${context.targetAudience}` : ''}
GOAL: ${context.goal || 'engagement'}

Create a post that stops the scroll and drives real engagement. Make it valuable and authentic.`;
  }

  /**
   * Get tone-specific guidance
   */
  private getToneGuidance(tone: string): string {
    const tones: Record<string, string> = {
      professional: 'Professional yet approachable. Clear, confident, authoritative but warm.',
      casual: 'Conversational and friendly. Like talking to a colleague over coffee.',
      enthusiastic: 'Energetic and passionate. Show genuine excitement without being over-the-top.',
      thoughtful: 'Reflective and insightful. Measured, considered, wisdom-sharing.',
      storytelling: 'Narrative-driven. Paint a picture, create emotional connection.',
    };

    return tones[tone] || tones.professional;
  }

  /**
   * Clean up AI-generated comment
   */
  private cleanupComment(comment: string): string {
    return comment
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\n\n+/g, '\n') // Single line breaks
      .replace(/  +/g, ' ') // Remove multiple spaces
      .trim();
  }

  /**
   * Clean up AI-generated post
   */
  private cleanupPost(post: string): string {
    return post
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\n\n\n+/g, '\n\n') // Max double line breaks
      .trim();
  }

  /**
   * Fallback comment templates (high-quality)
   */
  private getFallbackComment(context: CommentContext): string {
    const templates = [
      `The point about ${this.extractKeyPhrase(context.postContent)} really resonates. I've seen this play out in my own experience, and it's spot on.`,
      `This is exactly what I've been thinking about lately. Your insight on ${this.extractKeyPhrase(context.postContent)} adds a perspective I hadn't considered.`,
      `Really valuable perspective here. The way you explained ${this.extractKeyPhrase(context.postContent)} makes it so clear and actionable.`,
      `I appreciate how you broke down ${this.extractKeyPhrase(context.postContent)}. It's refreshing to see someone address this so directly.`,
      `This connects perfectly with something I experienced recently. Your point about ${this.extractKeyPhrase(context.postContent)} is especially relevant right now.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Extract key phrase from post (simple version)
   */
  private extractKeyPhrase(content: string): string {
    const words = content.split(' ');
    if (words.length > 10) {
      return words.slice(0, 8).join(' ') + '...';
    }
    return content;
  }

  /**
   * Generate multiple comment variations
   * Useful for A/B testing or variety
   */
  public async generateCommentVariations(context: CommentContext, count: number = 3): Promise<string[]> {
    const variations = await Promise.all(
      Array(count).fill(null).map(() => this.generateComment(context))
    );
    return variations;
  }

  /**
   * Analyze post to determine best comment approach
   */
  public analyzePostForComment(postContent: string): {
    suggestedTone: 'professional' | 'casual' | 'enthusiastic' | 'thoughtful';
    suggestedLength: 'short' | 'medium' | 'long';
    topic: string;
  } {
    const contentLower = postContent.toLowerCase();

    // Determine tone based on content
    let suggestedTone: 'professional' | 'casual' | 'enthusiastic' | 'thoughtful' = 'professional';

    if (contentLower.includes('excited') || contentLower.includes('amazing') || contentLower.includes('!')) {
      suggestedTone = 'enthusiastic';
    } else if (contentLower.includes('think') || contentLower.includes('reflection') || contentLower.includes('consider')) {
      suggestedTone = 'thoughtful';
    } else if (contentLower.includes('hey') || contentLower.includes('folks') || contentLower.includes('😊')) {
      suggestedTone = 'casual';
    }

    // Determine length based on post length
    const wordCount = postContent.split(/\s+/).length;
    let suggestedLength: 'short' | 'medium' | 'long' = 'medium';

    if (wordCount < 50) {
      suggestedLength = 'short';
    } else if (wordCount > 200) {
      suggestedLength = 'long';
    }

    // Extract topic (simplified)
    const topic = postContent.substring(0, 100) + '...';

    return { suggestedTone, suggestedLength, topic };
  }
}

export default AIService;
