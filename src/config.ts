export const config = {
  app: {
    name: 'Learning Document Generator',
    version: '1.0.0',
    description: 'Generate comprehensive learning documents using AI'
  },
  
  generation: {
    defaultChapters: 6,
    minChapters: 3,
    maxChapters: 12,
    complexityLevels: ['beginner', 'intermediate', 'advanced'] as const
  },

  ollama: {
    // Configure Ollama settings
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'mistral:7b',
    timeout: 60000 // 60 seconds for content generation
  },

  latex: {
    // TODO: Configure LaTeX settings
    template: 'article',
    outputFormat: 'pdf'
  }
};

export type ComplexityLevel = typeof config.generation.complexityLevels[number];

export interface DocumentRequest {
  topic: string;
  complexity: ComplexityLevel;
  chapters: number;
}

export interface GenerationJob {
  id: string;
  request: DocumentRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  result?: {
    latexContent: string;
    pdfPath?: string;
    pdfGenerated?: boolean;
  };
  error?: string;
}
