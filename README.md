# Learning Document Generator 📚🤖

An AI-powered tool that automatically generates comprehensive learning documents on any topic using **Ollama** for content generation and **LaTeX** for professional PDF compilation.

## ✨ Features

- 🧠 **AI-Powered Content**: Uses Ollama (local LLM) for intelligent content generation
- 📖 **Structured Learning**: Generates well-organized chapters with logical progression
- 🎯 **Complexity Levels**: Supports beginner, intermediate, and advanced content
- 📄 **Professional Output**: Compiles to high-quality PDF documents using LaTeX
- 🚀 **One-Command Generation**: Simple shell script interface
- 🔄 **Fallback System**: Graceful fallback to structured content if AI fails
- ⚡ **Progress Monitoring**: Real-time progress tracking and status updates
- 🎨 **Web Interface**: Modern Astro-based frontend with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Shell Script  │────│  TypeScript API  │────│   Services      │
│  generate-doc   │    │     (Astro)      │    │                 │
└─────────────────┘    └──────────────────┘    │ ┌─────────────┐ │
                                                │ │ OllamaService│ │
┌─────────────────┐    ┌──────────────────┐    │ └─────────────┘ │
│  Web Frontend   │────│  Document Gen    │────│ ┌─────────────┐ │
│ (Astro+Tailwind)│    │    Service       │    │ │LaTeXService │ │
└─────────────────┘    └──────────────────┘    │ └─────────────┘ │
                                                └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   File System    │
                    │ ┌──────────────┐ │
                    │ │   LaTeX      │ │
                    │ │    Files     │ │
                    │ └──────────────┘ │
                    │ ┌──────────────┐ │
                    │ │   PDF Files  │ │
                    │ └──────────────┘ │
                    └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+) and npm
- **Ollama** running locally ([Installation Guide](https://ollama.ai/))
- **LaTeX** distribution (MacTeX, TeX Live, or MiKTeX)
- **macOS** (for automatic PDF opening)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/TerminalGambit/learning-doc-generator.git
   cd learning-doc-generator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Ollama service**:
   ```bash
   ollama serve
   ```

4. **Pull a compatible model** (if not already available):
   ```bash
   ollama pull mistral:7b
   # or
   ollama pull llama3.2:1b
   ```

### Usage

#### Command Line Interface

```bash
# Make the script executable (first time only)
chmod +x generate-doc.sh

# Generate a document
./generate-doc.sh "Topic Name" <chapters> <complexity>
```

**Parameters:**
- `topic`: Learning topic (use quotes if contains spaces)
- `chapters`: Number of chapters (1-20 recommended)
- `complexity`: 1=beginner, 2=intermediate, 3=advanced

**Examples:**
```bash
# Beginner Python guide with 4 chapters
./generate-doc.sh "Python Programming" 4 1

# Intermediate Machine Learning document with 6 chapters
./generate-doc.sh "Machine Learning Fundamentals" 6 2

# Advanced Neural Networks guide with 8 chapters
./generate-doc.sh "Deep Neural Networks" 8 3
```

#### Web Interface

```bash
# Start the development server
npm run dev

# Open browser to http://localhost:4321
```

## 📁 Project Structure

```
learning-doc-generator/
├── src/
│   ├── components/           # Astro/React components
│   │   └── DocumentForm.tsx  # Main form component
│   ├── layouts/              # Page layouts
│   │   └── Layout.astro      # Base layout
│   ├── pages/                # Astro pages and API routes
│   │   ├── api/              # API endpoints
│   │   │   ├── download-pdf/[jobId].ts
│   │   │   ├── download/[jobId].ts
│   │   │   ├── generate-document.ts
│   │   │   └── job-status/[jobId].ts
│   │   └── index.astro       # Homepage
│   ├── services/             # Core business logic
│   │   ├── documentGenerator.ts  # Main orchestration service
│   │   ├── ollama.ts        # Ollama AI integration
│   │   └── latex.ts         # LaTeX compilation service
│   ├── styles/               # Global styles
│   └── config.ts            # Configuration and types
├── output/                   # Generated documents
├── public/                   # Static assets
├── generate-doc.sh          # CLI script
├── package.json
├── tsconfig.json
├── tailwind.config.mjs
└── astro.config.mjs
```

## 🔧 Technical Details

### Document Generation Pipeline

1. **Input Validation**: Validate topic, chapters, and complexity parameters
2. **Ollama Connection**: Test connection to local Ollama service
3. **Outline Generation**: AI generates structured chapter outline
4. **Content Generation**: 
   - Sequential chapter generation with context awareness
   - Each chapter includes previous chapters for continuity
   - Fallback to structured content on AI timeout
5. **LaTeX Assembly**: Combine chapters into professional LaTeX document
6. **PDF Compilation**: Two-pass pdflatex compilation with cleanup
7. **Output**: Generated PDF automatically opens for review

### AI Content Generation

The system uses **contextual prompts** for each chapter that include:
- Chapter position and role in the document
- Previous chapter summaries for continuity
- Upcoming chapter previews for preparation
- Complexity-appropriate writing style
- LaTeX formatting requirements

### Fallback System

If AI generation fails or times out:
- Structured fallback content is generated
- Document generation continues without interruption
- PDF compilation proceeds normally
- Users still get a complete document

### Configuration

Key settings in `src/config.ts`:
```typescript
export const config = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'mistral:7b',
    timeout: 60000 // 60 seconds
  },
  generation: {
    defaultChapters: 6,
    minChapters: 3,
    maxChapters: 12
  }
}
```

## 🎨 Web Interface Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Progress**: Live updates during document generation
- **Multiple Downloads**: PDF, LaTeX source, and JSON data
- **Job Management**: Track and manage multiple generation jobs
- **Error Handling**: User-friendly error messages and recovery

## ⚙️ API Endpoints

- `POST /api/generate-document` - Start document generation
- `GET /api/job-status/[jobId]` - Check generation progress
- `GET /api/download/[jobId]` - Download LaTeX/JSON files
- `GET /api/download-pdf/[jobId]` - Download compiled PDF

## 🐛 Troubleshooting

### Common Issues

**"Ollama service not available"**
```bash
# Start Ollama service
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

**"pdflatex not found"**
```bash
# Install LaTeX (macOS)
brew install --cask mactex

# Verify installation
pdflatex --version
```

**AI Generation Timeouts**
- Increase timeout in `src/config.ts`
- Use smaller chapter counts for testing
- Check Ollama model performance

**PDF Compilation Errors**
- Check LaTeX syntax in generated files
- Ensure all required packages are installed
- Review compilation logs in output directory

### Debugging

Enable detailed logging:
```bash
DEBUG=1 ./generate-doc.sh "Test Topic" 3 1
```

Check generated files:
```bash
ls -la output/
```

## 🔄 Development

### Setup Development Environment

```bash
# Clone and install
git clone https://github.com/TerminalGambit/learning-doc-generator.git
cd learning-doc-generator
npm install

# Start development server
npm run dev

# Run tests (if available)
npm test
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit with clear messages
6. Push to your fork
7. Create a Pull Request

### Code Style

- TypeScript with strict mode enabled
- ESLint and Prettier for code formatting
- Clear, descriptive variable and function names
- Comprehensive error handling
- Detailed JSDoc comments for public APIs

## 📊 Performance

### Typical Generation Times
- **Small documents** (3-4 chapters): 2-5 minutes
- **Medium documents** (5-8 chapters): 5-15 minutes  
- **Large documents** (8+ chapters): 10-30 minutes

*Times vary based on topic complexity, AI model speed, and system performance.*

### Resource Usage
- **Memory**: ~200-500MB during generation
- **CPU**: Moderate during AI generation, high during PDF compilation
- **Disk**: ~1-10MB per generated document
- **Network**: Only for Ollama API calls (localhost)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- **[Ollama](https://ollama.ai/)** for local LLM capabilities
- **[Astro](https://astro.build/)** for the modern web framework
- **[Tailwind CSS](https://tailwindcss.com/)** for utility-first styling
- **LaTeX** community for document typesetting excellence

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/TerminalGambit/learning-doc-generator/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/TerminalGambit/learning-doc-generator/discussions)
- 📧 **Contact**: [Create an Issue](https://github.com/TerminalGambit/learning-doc-generator/issues/new)

---

**Made with ❤️ by [TerminalGambit](https://github.com/TerminalGambit)**
