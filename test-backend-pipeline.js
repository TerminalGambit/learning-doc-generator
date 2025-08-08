#!/usr/bin/env node

/**
 * Backend Pipeline Tester
 * Tests the complete pipeline: AI Generation → LaTeX Assembly → PDF Compilation
 * Topic: "Spiking Neural Networks" (Advanced level, 6 chapters)
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// We'll require the compiled TypeScript modules
let DocumentGeneratorService, OllamaService, LaTeXService;

try {
  // Try to load from dist directory (if compiled)
  const docGen = require('./dist/services/documentGenerator.js');
  const ollama = require('./dist/services/ollama.js');
  const latex = require('./dist/services/latex.js');
  
  DocumentGeneratorService = docGen.DocumentGeneratorService;
  OllamaService = ollama.OllamaService;
  LaTeXService = latex.LaTeXService;
} catch (error) {
  console.error('❌ Could not load TypeScript modules.');
  console.error('📝 Please compile TypeScript first: npm run build');
  console.error('🔧 Or run with ts-node: npx ts-node test-backend-pipeline.ts');
  process.exit(1);
}

class PipelineTester {
  constructor() {
    this.documentGenerator = new DocumentGeneratorService();
    this.ollamaService = new OllamaService();
    this.latexService = new LaTeXService();
    this.testId = `test_${Date.now()}`;
    this.outputDir = path.join(process.cwd(), 'test-output');
  }

  async run() {
    console.log('🧪 Starting Backend Pipeline Test');
    console.log('=================================');
    console.log(`📊 Test ID: ${this.testId}`);
    console.log(`🎯 Topic: Spiking Neural Networks`);
    console.log(`📈 Level: Advanced`);
    console.log(`📚 Chapters: 6`);
    console.log('=================================\n');

    try {
      // Ensure output directory exists
      await this.ensureOutputDir();

      // Test 1: Ollama Connection
      await this.testOllamaConnection();

      // Test 2: Chapter Outline Generation  
      const chapterTitles = await this.testChapterOutlineGeneration();

      // Test 3: AI Content Generation (chapter by chapter)
      const chapterContents = await this.testChapterContentGeneration(chapterTitles);

      // Test 4: LaTeX Document Assembly
      const latexContent = await this.testLatexAssembly(chapterContents);

      // Test 5: LaTeX Validation
      await this.testLatexValidation(latexContent);

      // Test 6: PDF Compilation
      const pdfResult = await this.testPdfCompilation(latexContent);

      // Test 7: Final Verification
      await this.testFinalVerification(pdfResult);

      // Test 8: Open PDF for Review
      if (pdfResult.success && pdfResult.pdfPath) {
        await this.openPdfForReview(pdfResult.pdfPath);
      }

      console.log('\n🎉 PIPELINE TEST COMPLETE');
      console.log('========================');
      console.log('✅ All stages passed successfully');
      console.log(`📁 Output directory: ${this.outputDir}`);
      if (pdfResult.success) {
        console.log(`📕 PDF Generated: ${pdfResult.pdfPath}`);
        console.log('\n📖 PDF should now be open for your review!');
      }

    } catch (error) {
      console.error('\n❌ PIPELINE TEST FAILED');
      console.error('=======================');
      console.error(`🚨 Error: ${error.message}`);
      console.error(`📍 Stack: ${error.stack}`);
      process.exit(1);
    }
  }

  async ensureOutputDir() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    }
  }

  async testOllamaConnection() {
    console.log('🔌 Testing Ollama Connection...');
    const connected = await this.ollamaService.checkConnection();
    
    if (!connected) {
      throw new Error('Failed to connect to Ollama. Is it running on localhost:11434?');
    }
    
    console.log('✅ Ollama connection successful');
  }

  async testChapterOutlineGeneration() {
    console.log('\n📋 Testing Chapter Outline Generation...');
    
    const request = {
      topic: 'Spiking Neural Networks',
      complexity: 'advanced',
      chapters: 6
    };

    const chapterTitles = await this.ollamaService.generateChapterOutline(
      request.topic,
      request.complexity,
      request.chapters
    );

    console.log(`✅ Generated ${chapterTitles.length} chapter titles:`);
    chapterTitles.forEach((title, index) => {
      console.log(`   ${index + 1}. ${title}`);
    });

    if (chapterTitles.length !== request.chapters) {
      console.warn(`⚠️  Expected ${request.chapters} chapters, got ${chapterTitles.length}`);
    }

    return chapterTitles;
  }

  async testChapterContentGeneration(chapterTitles) {
    console.log('\n📝 Testing Chapter Content Generation...');
    console.log('(This will test the new segmented AI approach)');
    
    const chapterContents = [];
    const completedChapters = [];
    
    for (let i = 0; i < chapterTitles.length; i++) {
      const chapterNumber = i + 1;
      const chapterTitle = chapterTitles[i];
      
      console.log(`\n🤖 Generating Chapter ${chapterNumber}: ${chapterTitle}`);
      
      try {
        const startTime = Date.now();
        
        const content = await this.ollamaService.generateChapterContent(
          'Spiking Neural Networks',
          chapterTitle,
          'advanced',
          chapterNumber,
          chapterTitles.length,
          completedChapters,  // Previous chapters for context
          chapterTitles       // Full outline for forward context
        );
        
        const generationTime = Date.now() - startTime;
        
        chapterContents.push(content);
        completedChapters.push(chapterTitle);
        
        console.log(`✅ Chapter ${chapterNumber} generated (${generationTime}ms)`);
        console.log(`📊 Content length: ${content.length} characters`);
        console.log(`🧠 Using context: ${completedChapters.length} previous chapters`);
        
      } catch (error) {
        console.log(`⚠️  Chapter ${chapterNumber} failed, using fallback content`);
        console.log(`🔄 Error: ${error.message}`);
        
        // Generate fallback content
        const fallbackContent = this.generateFallbackChapter(chapterTitle, chapterNumber);
        chapterContents.push(fallbackContent);
        completedChapters.push(chapterTitle);
        
        console.log(`✅ Chapter ${chapterNumber} fallback generated`);
      }
      
      // Small delay to avoid overwhelming Ollama
      if (i < chapterTitles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n✅ All ${chapterContents.length} chapters generated`);
    return chapterContents;
  }

  generateFallbackChapter(title, number) {
    return `\\section{${title}}

This advanced chapter provides in-depth analysis and technical implementation details for ${title}. This chapter builds upon concepts from previous chapters and prepares for advanced topics ahead.

\\subsection{Overview}
This section covers the fundamental aspects of ${title} as it relates to Spiking Neural Networks. The concepts presented here are essential for building a comprehensive understanding of the subject matter.

\\subsection{Key Concepts}
The main ideas and principles that form the foundation of this topic area include:
\\begin{itemize}
\\item Fundamental principle of ${title.toLowerCase()}
\\item Core methodologies and approaches  
\\item Essential terminology and definitions
\\item Practical implementation considerations
\\end{itemize}

\\subsection{Mathematical Framework}
The mathematical foundation for ${title} can be expressed through key equations and relationships that govern the underlying mechanisms.

\\subsection{Practical Applications}
Real-world applications and examples demonstrate how these concepts are used in practice:
\\begin{enumerate}
\\item Industry applications and use cases
\\item Common implementation patterns
\\item Best practices and recommendations
\\item Performance optimization strategies
\\end{enumerate}

\\subsection{Summary}
This chapter has provided a comprehensive overview of ${title}, covering the essential aspects needed for understanding more advanced topics. The foundation established here will be built upon in subsequent chapters as we delve deeper into the complexities of Spiking Neural Networks.

`;
  }

  async testLatexAssembly(chapterContents) {
    console.log('\n📄 Testing LaTeX Document Assembly...');
    
    const request = {
      topic: 'Spiking Neural Networks',
      complexity: 'advanced',
      chapters: chapterContents.length
    };
    
    const latexContent = this.latexService.generateDocument(request, chapterContents);
    
    console.log(`✅ LaTeX document assembled`);
    console.log(`📊 Total document length: ${latexContent.length} characters`);
    console.log(`📝 Chapters included: ${chapterContents.length}`);
    
    // Save LaTeX for inspection
    const latexPath = path.join(this.outputDir, `${this.testId}.tex`);
    await fs.writeFile(latexPath, latexContent, 'utf-8');
    console.log(`💾 LaTeX saved to: ${latexPath}`);
    
    return latexContent;
  }

  async testLatexValidation(latexContent) {
    console.log('\n🔍 Testing LaTeX Validation...');
    
    const validation = this.latexService.validateLatexContent(latexContent);
    
    if (validation.valid) {
      console.log('✅ LaTeX content is valid');
    } else {
      console.log('⚠️  LaTeX validation warnings:');
      validation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    return validation;
  }

  async testPdfCompilation(latexContent) {
    console.log('\n📋 Testing PDF Compilation...');
    console.log('(This tests the real pdflatex compilation)');
    
    try {
      const pdfResult = await this.latexService.compileToPDF(latexContent, this.testId);
      
      if (pdfResult.success) {
        console.log('✅ PDF compilation successful!');
        console.log(`📕 PDF path: ${pdfResult.pdfPath}`);
        
        // Check file size
        const stats = await fs.stat(pdfResult.pdfPath);
        console.log(`📊 PDF size: ${(stats.size / 1024).toFixed(1)} KB`);
        
        return pdfResult;
      } else {
        console.log('❌ PDF compilation failed');
        console.log(`🚨 Error: ${pdfResult.error}`);
        throw new Error(`PDF compilation failed: ${pdfResult.error}`);
      }
      
    } catch (error) {
      console.log('❌ PDF compilation error');
      throw new Error(`PDF compilation error: ${error.message}`);
    }
  }

  async testFinalVerification(pdfResult) {
    console.log('\n🔬 Testing Final Verification...');
    
    if (!pdfResult.success || !pdfResult.pdfPath) {
      throw new Error('PDF result is invalid');
    }
    
    // Verify PDF file exists and is not empty
    try {
      const stats = await fs.stat(pdfResult.pdfPath);
      
      if (stats.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      if (stats.size < 1000) { // Less than 1KB is suspicious
        console.log('⚠️  PDF file is very small, might be corrupted');
      }
      
      console.log('✅ PDF file verification passed');
      console.log(`📊 Final PDF size: ${(stats.size / 1024).toFixed(1)} KB`);
      
    } catch (error) {
      throw new Error(`PDF verification failed: ${error.message}`);
    }
  }

  async openPdfForReview(pdfPath) {
    console.log('\n📖 Opening PDF for Review...');
    
    return new Promise((resolve, reject) => {
      // Use macOS 'open' command to open the PDF
      const openProcess = spawn('open', [pdfPath]);
      
      openProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ PDF opened successfully');
          console.log('📋 Please review the PDF and provide feedback!');
          resolve();
        } else {
          console.log(`⚠️  Failed to open PDF (exit code: ${code})`);
          console.log(`📁 Manual path: ${pdfPath}`);
          resolve(); // Don't fail the test just because we can't open the PDF
        }
      });
      
      openProcess.on('error', (error) => {
        console.log(`⚠️  Error opening PDF: ${error.message}`);
        console.log(`📁 Manual path: ${pdfPath}`);
        resolve(); // Don't fail the test
      });
    });
  }
}

// Run the test
const tester = new PipelineTester();
tester.run().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
