import type { APIRoute } from 'astro';
import { DocumentGeneratorService } from '../../../services/documentGenerator';

export const prerender = false;

// Import the shared instance
import { documentGenerator } from '../generate-document';

export const GET: APIRoute = async ({ params }) => {
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

    console.log(`📊 Status check requested for job: ${jobId}`);
    
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

    // Calculate elapsed time
    const elapsed = Date.now() - job.startTime.getTime();
    const elapsedMinutes = Math.round(elapsed / 60000);

    const response = {
      success: true,
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime.toISOString(),
      endTime: job.endTime?.toISOString(),
      elapsedTime: `${elapsedMinutes} minute${elapsedMinutes !== 1 ? 's' : ''}`,
      request: job.request,
      error: job.error,
      hasResult: !!job.result,
      resultSize: job.result?.latexContent?.length || 0
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error checking job status:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
