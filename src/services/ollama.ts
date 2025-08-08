import axios, { type AxiosInstance } from 'axios';
import { config } from '../config.ts';
import type { ComplexityLevel } from '../config.ts';

export class OllamaService {
  private baseUrl: string;
  private model: string;
  private timeout: number;
  private client: AxiosInstance;

  constructor() {
    this.baseUrl = config.ollama.baseUrl;
    this.model = config.ollama.model;
    this.timeout = config.ollama.timeout;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async generateChapterOutline(topic: string, complexity: ComplexityLevel, chapters: number): Promise<string[]> {
    console.log(`Generating chapter outline for: ${topic}`);
    console.log(`Complexity: ${complexity}, Chapters: ${chapters}`);

    const prompt = this.buildOutlinePrompt(topic, complexity, chapters);
    
    try {
      const response = await this.client.post('/api/generate', {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      });

      const generatedText = response.data.response;
      return this.parseChapterOutline(generatedText, chapters);
    } catch (error) {
      console.error('Error generating chapter outline:', error);
      // Fallback to structured outline if AI fails
      return this.generateFallbackOutline(topic, chapters);
    }
  }

  async generateChapterContent(
    topic: string, 
    chapterTitle: string, 
    complexity: ComplexityLevel,
    chapterNumber: number,
    totalChapters: number,
    previousChapters: string[] = [],
    chapterOutline?: string[]
  ): Promise<string> {
    console.log(`🤖 Generating AI content for Chapter ${chapterNumber}: ${chapterTitle}`);
    
    const prompt = this.buildEnhancedChapterPrompt(
      topic, 
      chapterTitle, 
      complexity, 
      chapterNumber, 
      totalChapters,
      previousChapters,
      chapterOutline
    );
    
    try {
      console.log(`📡 Sending request to Ollama for chapter ${chapterNumber}...`);
      const startTime = Date.now();
      
      const response = await this.client.post('/api/generate', {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7, // Slightly lower for more consistent quality
          top_p: 0.9,
          num_predict: 3000, // Allow longer responses for detailed chapters
          stop: ['\n\n\n\n'] // Stop at excessive whitespace
        }
      });

      const generationTime = Date.now() - startTime;
      console.log(`✅ Chapter ${chapterNumber} generated in ${generationTime}ms`);
      
      const generatedContent = response.data.response;
      return this.formatChapterContent(generatedContent, chapterTitle, chapterNumber);
    } catch (error) {
      console.error(`❌ Error generating AI content for chapter ${chapterNumber}:`, error);
      console.log(`🔄 Falling back to structured content for chapter ${chapterNumber}`);
      // Fallback to basic structure if AI fails
      return this.generateFallbackChapter(topic, chapterTitle, complexity, chapterNumber);
    }
  }

  private buildEnhancedChapterPrompt(
    topic: string, 
    chapterTitle: string, 
    complexity: ComplexityLevel,
    chapterNumber: number,
    totalChapters: number,
    previousChapters: string[] = [],
    chapterOutline?: string[]
  ): string {
    const complexityInstructions = {
      beginner: "Use clear, simple language. Define all technical terms. Include basic examples and step-by-step explanations. Focus on understanding rather than implementation.",
      intermediate: "Assume familiarity with basic concepts. Include technical details and code examples. Balance theory with practical applications.",
      advanced: "Provide deep technical analysis. Include complex examples, mathematical proofs, implementation details, and cutting-edge research references."
    };

    const contextualInstructions = this.buildContextualInstructions(
      chapterNumber, 
      totalChapters, 
      previousChapters,
      chapterOutline
    );

    return `You are an expert technical writer creating Chapter ${chapterNumber} of a comprehensive ${totalChapters}-chapter learning document on "${topic}".

## Chapter Details:
**Title:** ${chapterTitle}
**Position:** Chapter ${chapterNumber} of ${totalChapters}
**Complexity Level:** ${complexity}

## Context & Flow:
${contextualInstructions}

## Writing Instructions:
- **Style:** ${complexityInstructions[complexity]}
- **Format:** Use proper LaTeX formatting throughout
- **Length:** Generate substantial content (2,000-3,000 words equivalent)
- **Structure:** Use \\section{}, \\subsection{}, and \\subsubsection{} appropriately
- **Examples:** Include concrete, relevant examples
- **Exercises:** Add practice problems or thought exercises
- **Mathematical Content:** Use LaTeX math notation where appropriate

## Required Elements:
1. Clear section structure with logical progression
2. Practical examples that reinforce concepts
3. Key takeaways or summary points
4. Connection to previous and upcoming chapters

## Output Format:
Generate ONLY the LaTeX content for this chapter. Start directly with \\section{${chapterTitle}} and continue with the full chapter content.

Generate the chapter now:`;
  }

  private buildContextualInstructions(
    chapterNumber: number,
    totalChapters: number,
    previousChapters: string[],
    chapterOutline?: string[]
  ): string {
    let context = "";
    
    if (chapterNumber === 1) {
      context += "This is the introductory chapter. Establish the foundation and motivate the reader's interest in the topic.";
    } else if (chapterNumber === totalChapters) {
      context += "This is the final chapter. Synthesize previous concepts and provide closure with future directions.";
    } else {
      context += `This is a middle chapter that should build upon previous concepts while preparing for advanced topics.`;
    }

    if (previousChapters.length > 0) {
      context += `\n\n**Previous chapters covered:**\n`;
      previousChapters.slice(-3).forEach((chapter, idx) => {
        const chapterNum = previousChapters.length - 2 + idx;
        context += `- Chapter ${chapterNum}: ${chapter}\n`;
      });
      context += "\nBuild upon these concepts naturally without repeating content.";
    }

    if (chapterOutline && chapterNumber < totalChapters) {
      context += `\n\n**Upcoming chapters will cover:**\n`;
      const nextChapters = chapterOutline.slice(chapterNumber, chapterNumber + 2);
      nextChapters.forEach((chapter, idx) => {
        context += `- Chapter ${chapterNumber + idx + 1}: ${chapter}\n`;
      });
      context += "\nPrepare the reader for these topics by introducing relevant concepts.";
    }

    return context;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags');
      console.log(`✅ Successfully connected to Ollama at ${this.baseUrl}`);
      return response.status === 200;
    } catch (error) {
      console.error(`❌ Failed to connect to Ollama at ${this.baseUrl}:`, error);
      return false;
    }
  }

  private buildOutlinePrompt(topic: string, complexity: ComplexityLevel, chapters: number): string {
    const complexityInstructions = {
      beginner: "suitable for newcomers with no prior knowledge",
      intermediate: "assuming basic understanding and some experience",
      advanced: "for experts requiring deep technical details"
    };

    return `Create a comprehensive ${chapters}-chapter learning outline for "${topic}" at ${complexity} level (${complexityInstructions[complexity]}).

Requirements:
- Each chapter should build logically upon previous ones
- Cover the topic comprehensively from basics to practical applications
- Use clear, descriptive chapter titles
- Ensure proper progression of difficulty

Format: Return EXACTLY ${chapters} chapter titles, one per line, numbered from 1 to ${chapters}.

Example format:
1. Introduction to [Topic]
2. Fundamental Concepts
3. [Specific topic area]
...

Generate the outline:`;
  }

  private parseChapterOutline(generatedText: string, expectedChapters: number): string[] {
    // Extract numbered lines that look like chapter titles
    const lines = generatedText.split('\n');
    const chapters: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match patterns like "1. Chapter Title" or "Chapter 1: Title"
      const match = trimmed.match(/^(?:\d+\.\s*|Chapter\s*\d+:?\s*)(.+)$/i);
      if (match && match[1]) {
        chapters.push(match[1].trim());
      }
    }

    // If we didn't get enough chapters, pad with fallback
    while (chapters.length < expectedChapters) {
      chapters.push(`Advanced Topic ${chapters.length + 1}`);
    }

    // If we got too many, truncate
    return chapters.slice(0, expectedChapters);
  }

  private generateFallbackOutline(topic: string, chapters: number): string[] {
    const baseChapters = [
      `Introduction to ${topic}`,
      `Fundamental Concepts`,
      `Core Principles`,
      `Practical Applications`,
      `Advanced Techniques`,
      `Case Studies and Examples`,
      `Best Practices`,
      `Tools and Technologies`,
      `Implementation Strategies`,
      `Future Trends`,
      `Troubleshooting`,
      `Conclusion and Next Steps`
    ];

    // Select appropriate chapters based on requested count
    if (chapters <= baseChapters.length) {
      return baseChapters.slice(0, chapters);
    }

    // If more chapters needed, generate additional ones
    const result = [...baseChapters];
    for (let i = baseChapters.length; i < chapters; i++) {
      result.push(`Advanced Topic ${i - baseChapters.length + 1}`);
    }

    return result;
  }

  private formatChapterContent(generatedContent: string, chapterTitle: string, chapterNumber: number): string {
    // Ensure the content has proper LaTeX section formatting
    let formatted = generatedContent;

    // Add section header if not present
    if (!formatted.includes('\\section{')) {
      formatted = `\\section{${chapterTitle}}\n\n${formatted}`;
    }

    // Enhanced cleanup and formatting
    formatted = formatted
      .replace(/\n{4,}/g, '\n\n\n') // Limit excessive newlines to max 3
      .replace(/\\section\{([^}]+)\}/g, '\\section{$1}\n') // Ensure newline after section
      .replace(/\\subsection\{([^}]+)\}/g, '\\subsection{$1}\n') // Ensure newline after subsection
      .replace(/\\subsubsection\{([^}]+)\}/g, '\\subsubsection{$1}\n') // Ensure newline after subsubsection
      .replace(/\\begin\{([^}]+)\}/g, '\n\\begin{$1}') // Proper spacing before environments
      .replace(/\\end\{([^}]+)\}/g, '\\end{$1}\n') // Proper spacing after environments
      .replace(/\$\$([^$]+)\$\$/g, '\n\\[\n$1\n\\]\n') // Convert $$ to LaTeX display math
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple empty lines
      .trim();

    // Ensure chapter ends with proper spacing
    if (!formatted.endsWith('\n')) {
      formatted += '\n';
    }

    return formatted;
  }

  private generateFallbackChapter(
    topic: string, 
    chapterTitle: string, 
    complexity: ComplexityLevel, 
    chapterNumber: number
  ): string {
    const complexityContent = {
      beginner: "This chapter introduces the basic concepts and provides a foundation for understanding.",
      intermediate: "Building on previous knowledge, this chapter explores the topic in greater detail.",
      advanced: "This advanced chapter provides in-depth analysis and technical implementation details."
    };

    const chapterContext = chapterNumber === 1 
      ? "This introductory chapter sets the foundation for all subsequent learning."
      : `This chapter builds upon concepts from previous chapters and prepares for advanced topics ahead.`;

    return `\\section{${chapterTitle}}

${complexityContent[complexity]} ${chapterContext}

\\subsection{Overview}
This section covers the fundamental aspects of ${chapterTitle} as it relates to ${topic}. The concepts presented here are essential for building a comprehensive understanding of the subject matter.

\\subsection{Key Concepts}
The main ideas and principles that form the foundation of this topic area include:
\\begin{itemize}
\\item Fundamental principle of ${chapterTitle.toLowerCase()}
\\item Core methodologies and approaches
\\item Essential terminology and definitions
\\item Practical implementation considerations
\\end{itemize}

\\subsection{Detailed Analysis}
A deeper examination of ${chapterTitle} reveals several important aspects that are crucial for mastery of ${topic}. These concepts form the building blocks for more advanced understanding.

\\subsection{Practical Applications}
Real-world applications and examples demonstrate how these concepts are used in practice:
\\begin{enumerate}
\\item Industry applications and use cases
\\item Common implementation patterns
\\item Best practices and recommendations
\\item Troubleshooting and optimization strategies
\\end{enumerate}

\\subsection{Exercises and Practice}
\\begin{itemize}
\\item Review the key concepts presented in this chapter
\\item Consider how ${chapterTitle.toLowerCase()} applies to your specific context
\\item Identify potential applications in your field of interest
\\item Prepare for the concepts that will be introduced in upcoming chapters
\\end{itemize}

\\subsection{Summary}
This chapter has provided a comprehensive overview of ${chapterTitle}, covering the essential aspects needed for understanding more advanced topics. The foundation established here will be built upon in subsequent chapters as we delve deeper into the complexities of ${topic}.

\\textbf{Key Takeaways:}
\\begin{itemize}
\\item Understanding of core ${chapterTitle.toLowerCase()} principles
\\item Awareness of practical applications and use cases
\\item Preparation for advanced concepts in later chapters
\\item Foundation for hands-on implementation
\\end{itemize}
`;
  }
}
