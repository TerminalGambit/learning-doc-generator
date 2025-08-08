import type { APIRoute } from 'astro';
import { DocumentGeneratorService } from '../../../services/documentGenerator';

export const prerender = false;

// Import the shared instance
import { documentGenerator } from '../generate-document';

export const GET: APIRoute = async ({ params, url }) => {
  try {
    const { jobId } = params;
    
    if (!jobId) {
      return new Response(JSON.stringify({ 
        error: 'Job ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`📥 Download requested for job: ${jobId}`);
    
    const job = await documentGenerator.getJobStatus(jobId);
    
    if (!job) {
      return new Response(JSON.stringify({ 
        error: 'Job not found',
        message: `No job found with ID: ${jobId}`
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (job.status !== 'completed' || !job.result?.latexContent) {
      return new Response(JSON.stringify({ 
        error: 'Document not ready',
        message: `Job status: ${job.status}. Document generation must be completed before download.`,
        status: job.status,
        progress: job.progress
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get format from query parameter (default to latex)
    const format = url.searchParams.get('format') || 'latex';
    
    if (format === 'latex' || format === 'tex') {
      // Return LaTeX content
      const fileName = `${job.request.topic.replace(/[^a-zA-Z0-9]/g, '_')}_${job.request.complexity}.tex`;
      
      console.log(`✅ Serving LaTeX download for job ${jobId}: ${fileName}`);
      
      return new Response(job.result.latexContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-latex',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': job.result.latexContent.length.toString()
        }
      });
    } else if (format === 'json') {
      // Return job data as JSON
      const fileName = `${job.request.topic.replace(/[^a-zA-Z0-9]/g, '_')}_${job.request.complexity}.json`;
      
      const exportData = {
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress,
          startTime: job.startTime.toISOString(),
          endTime: job.endTime?.toISOString(),
          request: job.request
        },
        latexContent: job.result.latexContent,
        generatedAt: new Date().toISOString()
      };
      
      console.log(`✅ Serving JSON download for job ${jobId}: ${fileName}`);
      
      return new Response(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: 'Invalid format',
        message: 'Supported formats: latex, tex, json'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('❌ Error serving download:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
