import type { APIRoute } from 'astro';
import { DocumentGeneratorService } from '../../../services/documentGenerator';
import { promises as fs } from 'fs';
import path from 'path';

// Shared instance for consistency
const documentGenerator = new DocumentGeneratorService();

export const GET: APIRoute = async ({ params, request }) => {
  const jobId = params.jobId;
  
  if (!jobId) {
    return new Response('Job ID is required', { status: 400 });
  }

  console.log(`📥 PDF download requested for job: ${jobId}`);

  try {
    // Get job status
    const job = await documentGenerator.getJobStatus(jobId);
    
    if (!job) {
      console.log(`❌ Job not found: ${jobId}`);
      return new Response('Job not found', { status: 404 });
    }

    if (job.status !== 'completed') {
      console.log(`⏳ Job not completed: ${jobId}, status: ${job.status}`);
      return new Response(`Job not completed. Status: ${job.status}`, { status: 400 });
    }

    if (!job.result?.pdfGenerated || !job.result?.pdfPath) {
      console.log(`❌ PDF not available for job: ${jobId}`);
      return new Response('PDF not available for this job', { status: 404 });
    }

    // Check if PDF file exists
    try {
      await fs.access(job.result.pdfPath);
    } catch (error) {
      console.log(`❌ PDF file not found: ${job.result.pdfPath}`);
      return new Response('PDF file not found on disk', { status: 404 });
    }

    // Read and serve the PDF file
    const pdfBuffer = await fs.readFile(job.result.pdfPath);
    const topic = job.request.topic.replace(/[^a-zA-Z0-9]/g, '_');
    const complexity = job.request.complexity;
    const filename = `${topic}_${complexity}.pdf`;

    console.log(`✅ Serving PDF download for job ${jobId}: ${filename}`);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error(`❌ Error serving PDF download for job ${jobId}:`, error);
    return new Response('Internal server error', { status: 500 });
  }
};
