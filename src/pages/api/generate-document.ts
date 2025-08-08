import type { APIRoute } from 'astro';
import { DocumentGeneratorService } from '../../services/documentGenerator';
import { config } from '../../config';
import type { ComplexityLevel } from '../../config';

export const prerender = false;

// Create a singleton instance
const documentGenerator = new DocumentGeneratorService();

// Export for use in other endpoints
export { documentGenerator };

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validate request data
    const { topic, complexity, chapters } = data;
    
    if (!topic || !complexity || !chapters) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: topic, complexity, and chapters are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate complexity level
    if (!config.generation.complexityLevels.includes(complexity as ComplexityLevel)) {
      return new Response(JSON.stringify({ 
        error: `Invalid complexity level. Must be one of: ${config.generation.complexityLevels.join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate chapters count
    const chapterCount = parseInt(chapters);
    if (isNaN(chapterCount) || chapterCount < config.generation.minChapters || chapterCount > config.generation.maxChapters) {
      return new Response(JSON.stringify({ 
        error: `Invalid chapter count. Must be between ${config.generation.minChapters} and ${config.generation.maxChapters}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🎯 Document generation request received:', {
      topic,
      complexity,
      chapters: chapterCount,
      timestamp: new Date().toISOString()
    });

    // Start the actual document generation
    const job = await documentGenerator.generateDocument({
      topic: topic.trim(),
      complexity: complexity as ComplexityLevel,
      chapters: chapterCount
    });

    const response = {
      success: true,
      message: 'Document generation started successfully',
      jobId: job.id,
      estimatedTime: chapterCount * 3, // Rough estimate: 3 minutes per chapter
      status: job.status,
      progress: job.progress,
      data: {
        topic,
        complexity,
        chapters: chapterCount
      }
    };

    console.log(`✅ Job ${job.id} created and processing started`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error processing document generation request:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
