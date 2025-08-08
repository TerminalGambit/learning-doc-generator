import { OllamaService } from './ollama.ts';
import { LaTeXService } from './latex.ts';
import type { DocumentRequest, GenerationJob } from '../config.ts';

export class DocumentGeneratorService {
  private ollamaService: OllamaService;
  private latexService: LaTeXService;
  private jobs: Map<string, GenerationJob> = new Map();

  constructor() {
    this.ollamaService = new OllamaService();
    this.latexService = new LaTeXService();
  }

  async generateDocument(request: DocumentRequest): Promise<GenerationJob> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: GenerationJob = {
      id: jobId,
      request,
      status: 'pending',
      progress: 0,
      startTime: new Date()
    };

    this.jobs.set(jobId, job);
    
    // Start generation process asynchronously
    this.processGeneration(job).catch(error => {
      console.error(`Error processing job ${jobId}:`, error);
      job.status = 'failed';
      job.error = error.message;
      job.endTime = new Date();
    });

    return job;
  }

  async getJobStatus(jobId: string): Promise<GenerationJob | null> {
    return this.jobs.get(jobId) || null;
  }

  private async processGeneration(job: GenerationJob): Promise<void> {
    try {
      console.log(`🚀 Starting document generation for job ${job.id}`);
      
      job.status = 'processing';
      job.progress = 10;

      // Step 1: Check Ollama connection
      console.log('🔌 Checking Ollama connection...');
      const connected = await this.ollamaService.checkConnection();
      if (!connected) {
        throw new Error('Failed to connect to Ollama service');
      }
      
      job.progress = 20;

      // Step 2: Generate chapter outline
      console.log('📋 Generating chapter outline...');
      const chapterTitles = await this.ollamaService.generateChapterOutline(
        job.request.topic,
        job.request.complexity,
        job.request.chapters
      );
      
      job.progress = 30;
      console.log(`✅ Generated ${chapterTitles.length} chapter titles:`, chapterTitles);

      // Step 3: Generate content for each chapter with enhanced context
      console.log('📝 Generating chapter content with contextual AI prompts...');
      const chapterContents: string[] = [];
      const completedChapters: string[] = [];
      
      for (let i = 0; i < chapterTitles.length; i++) {
        const chapterNumber = i + 1;
        console.log(`📖 Generating contextual content for Chapter ${chapterNumber}: ${chapterTitles[i]}`);
        
        // Generate chapter with full context awareness
        const content = await this.ollamaService.generateChapterContent(
          job.request.topic,
          chapterTitles[i],
          job.request.complexity,
          chapterNumber,
          chapterTitles.length,
          completedChapters, // Previous chapter titles for context
          chapterTitles // Full outline for forward-looking context
        );
        
        chapterContents.push(content);
        completedChapters.push(chapterTitles[i]); // Add to completed list for next chapter's context
        
        // Update progress (30% to 80% for content generation)
        job.progress = 30 + ((i + 1) / chapterTitles.length) * 50;
        console.log(`✅ Chapter ${chapterNumber} completed with context. Progress: ${Math.round(job.progress)}%`);
        
        // Brief pause between chapters to prevent overwhelming Ollama
        if (i < chapterTitles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      job.progress = 85;

      // Step 4: Generate complete LaTeX document
      console.log('📄 Assembling LaTeX document...');
      const latexDocument = this.latexService.generateDocument(job.request, chapterContents);
      
      job.progress = 85;

      // Step 5: Validate LaTeX content
      console.log('🔍 Validating LaTeX content...');
      const validation = this.latexService.validateLatexContent(latexDocument);
      if (!validation.valid) {
        console.warn('⚠️  LaTeX validation warnings:', validation.errors);
      }

      job.progress = 90;

      // Step 6: Compile to PDF
      console.log('📋 Compiling LaTeX to PDF...');
      const pdfResult = await this.latexService.compileToPDF(latexDocument, job.id);
      
      job.progress = 95;

      // Step 7: Finalize job
      job.progress = 100;
      job.status = 'completed';
      job.endTime = new Date();
      job.result = {
        latexContent: latexDocument,
        pdfPath: pdfResult.pdfPath,
        pdfGenerated: pdfResult.success
      };

      if (pdfResult.success) {
        console.log(`🎉 Document generation completed for job ${job.id}`);
        console.log(`📁 Total time: ${job.endTime.getTime() - job.startTime.getTime()}ms`);
        console.log(`📁 PDF generated: ${pdfResult.pdfPath}`);
      } else {
        console.warn(`⚠️  Document generated but PDF compilation failed: ${pdfResult.error}`);
        console.log(`📁 LaTeX document available, PDF compilation can be retried`);
      }

    } catch (error) {
      console.error(`❌ Error in document generation:`, error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error occurred';
      job.endTime = new Date();
      throw error;
    }
  }

  async getAllJobs(): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values());
  }

  async deleteJob(jobId: string): Promise<boolean> {
    return this.jobs.delete(jobId);
  }

  async getJobsStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };
  }
}
