#!/bin/zsh

# Learning Document Generator Script
# Usage: ./generate-doc.sh "Topic Name" <chapters> <complexity>
# Where complexity: 1=beginner, 2=intermediate, 3=advanced

set -e  # Exit on any error

# Function to display help
show_help() {
    cat << 'EOF'
🎓 Learning Document Generator
===============================

This script generates comprehensive learning documents using AI and compiles them into PDF format.

📖 USAGE:
    ./generate-doc.sh "<topic>" <chapters> <complexity>
    ./generate-doc.sh help|--help|-h

📝 PARAMETERS:
    topic       The learning topic to generate content for
                (use quotes if the topic contains spaces)
    
    chapters    Number of chapters to generate (1-20 recommended)
                Must be a positive integer
    
    complexity  Learning complexity level:
                1 = beginner    (basic concepts, simple examples)
                2 = intermediate (moderate depth, some prerequisites)
                3 = advanced    (deep technical content, expert level)

🚀 EXAMPLES:
    # Generate a beginner Python guide with 4 chapters
    ./generate-doc.sh "Python Programming" 4 1
    
    # Create an intermediate Machine Learning document with 6 chapters
    ./generate-doc.sh "Machine Learning Fundamentals" 6 2
    
    # Generate an advanced guide to Neural Networks with 8 chapters
    ./generate-doc.sh "Deep Neural Networks" 8 3
    
    # Single word topics don't need quotes
    ./generate-doc.sh Blockchain 5 2
    
    # Topics with special characters should be quoted
    ./generate-doc.sh "C++ Programming" 7 3

🔧 WHAT IT DOES:
    1. 🔍 Tests connection to local Ollama AI service
    2. 📝 Generates a structured chapter outline
    3. 🧠 Uses AI to create detailed content for each chapter
    4. 📚 Assembles content into LaTeX document format
    5. ✅ Validates LaTeX syntax and structure
    6. 🔄 Compiles LaTeX to PDF using pdflatex
    7. 🚀 Automatically opens the generated PDF

📋 REQUIREMENTS:
    • Ollama AI service running locally (ollama serve)
    • Node.js and npm/npx installed
    • pdflatex installed (part of LaTeX distribution)
    • macOS (for automatic PDF opening)

⏱️  ESTIMATED TIME:
    • Small documents (3-4 chapters): 2-5 minutes
    • Medium documents (5-8 chapters): 5-15 minutes
    • Large documents (8+ chapters): 10-30 minutes
    
    Time varies based on topic complexity and AI response speed.

📁 OUTPUT:
    Generated files are saved in the project's downloads directory:
    • PDF: Final compiled document
    • LaTeX: Source LaTeX file
    • JSON: Raw generated content data

❌ COMMON ERRORS:
    • "Ollama service not available" → Run 'ollama serve' first
    • "pdflatex not found" → Install LaTeX distribution
    • Timeout errors → AI generation taking too long (uses fallback)

💡 TIPS:
    • Be specific with topics for better content quality
    • Start with fewer chapters for testing
    • Advanced complexity requires more generation time
    • Check that Ollama is running before starting

For more information, visit: https://github.com/ollama/ollama
EOF
}

# Check for help flags
if [ $# -eq 1 ] && [[ "$1" =~ ^(help|--help|-h)$ || "$1" == "?" ]]; then
    show_help
    exit 0
fi

# Check if correct number of arguments provided
if [ $# -ne 3 ]; then
    echo "❌ Error: Incorrect number of arguments"
    echo ""
    echo "📖 USAGE: $0 \"<topic>\" <chapters> <complexity>"
    echo "   💡 TIP: Run '$0 help' for detailed instructions"
    echo ""
    echo "🚀 QUICK EXAMPLES:"
    echo "   $0 \"Machine Learning\" 5 2"
    echo "   $0 \"Python Basics\" 4 1"
    echo "   $0 \"Advanced Algorithms\" 8 3"
    exit 1
fi

# Parse arguments
TOPIC="$1"
CHAPTERS="$2"
COMPLEXITY="$3"

# Validate arguments
if ! [[ "$CHAPTERS" =~ ^[0-9]+$ ]] || [ "$CHAPTERS" -lt 1 ]; then
    echo "Error: Chapters must be a positive integer"
    exit 1
fi

if ! [[ "$COMPLEXITY" =~ ^[123]$ ]]; then
    echo "Error: Complexity must be 1, 2, or 3"
    exit 1
fi

# Map complexity number to string
case $COMPLEXITY in
    1) COMPLEXITY_STR="beginner" ;;
    2) COMPLEXITY_STR="intermediate" ;;
    3) COMPLEXITY_STR="advanced" ;;
esac

echo "🚀 Starting document generation..."
echo "📚 Topic: $TOPIC"
echo "📖 Chapters: $CHAPTERS"
echo "🎯 Complexity: $COMPLEXITY_STR"
echo ""

# Create a temporary test script with the parameters
TEMP_SCRIPT="./temp-pipeline-$$.ts"

cat > "$TEMP_SCRIPT" << EOF
import { DocumentGeneratorService } from './src/services/documentGenerator.ts';
import type { DocumentRequest, GenerationJob } from './src/config.ts';

async function runPipeline() {
  console.log('🔧 Initializing services...');
  
  const docGenerator = new DocumentGeneratorService();

  try {
    // Create generation job
    console.log('📝 Creating generation job...');
    const request: DocumentRequest = {
      topic: '$TOPIC',
      complexity: '$COMPLEXITY_STR' as 'beginner' | 'intermediate' | 'advanced',
      chapters: $CHAPTERS
    };
    
    const job = await docGenerator.generateDocument(request);
    console.log(\`🎯 Job created with ID: \${job.id}\`);

    // Monitor progress
    console.log('📊 Monitoring progress...');
    let currentJob: GenerationJob | null = job;
    const startTime = Date.now();
    
    while (true) {
      currentJob = await docGenerator.getJobStatus(job.id);
      if (!currentJob) {
        throw new Error('Job not found');
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(\`⏱️  [\${elapsed}s] Status: \${currentJob.status} - \${currentJob.progress}%\`);
      
      if (currentJob.status === 'failed') {
        throw new Error(\`Job failed: \${currentJob.error}\`);
      }
      
      if (currentJob.status === 'completed') {
        break;
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('✅ Document generation completed!');
    
    if (currentJob.result?.pdfGenerated && currentJob.result?.pdfPath) {
      console.log(\`📄 PDF generated at: \${currentJob.result.pdfPath}\`);
      
      // Verify PDF exists and has content
      const fs = await import('fs');
      if (fs.existsSync(currentJob.result.pdfPath)) {
        const stats = fs.statSync(currentJob.result.pdfPath);
        console.log(\`📊 PDF size: \${Math.round(stats.size / 1024)} KB\`);
        
        // Open the PDF
        console.log('🚀 Opening PDF...');
        const { spawn } = await import('child_process');
        spawn('open', [currentJob.result.pdfPath], { detached: true });
        
        console.log('🎉 Document generation pipeline completed successfully!');
        return currentJob.result.pdfPath;
      } else {
        throw new Error('PDF file not found after generation');
      }
    } else {
      console.log('✅ Document generation completed (LaTeX only)');
      if (currentJob.result?.latexContent) {
        console.log('📄 LaTeX content available');
        console.log('⚠️  PDF compilation may have failed, but LaTeX document was generated');
      }
    }
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

// Run the pipeline
runPipeline().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
EOF

echo "🔄 Running document generation pipeline..."
echo ""

# Run the TypeScript test script with proper configuration
if ! npx ts-node --esm "$TEMP_SCRIPT"; then
    echo "❌ Document generation failed"
    rm -f "$TEMP_SCRIPT"
    exit 1
fi

# Clean up temporary script
rm -f "$TEMP_SCRIPT"

echo ""
echo "🎉 Script completed successfully!"
echo "📁 Check the generated PDF in the downloads folder"
