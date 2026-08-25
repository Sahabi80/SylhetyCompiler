/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured. Please add your key in AI Studio Settings > Secrets.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini AI Code Explanation & Optimization Route
  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const { codeSnippet, fullCode, dialect = 'sylheti', mode = 'explain' } = req.body;

      if (!codeSnippet || typeof codeSnippet !== 'string') {
        return res.status(400).json({
          error: 'codeSnippet is required and must be a non-empty string.',
        });
      }

      const ai = getGenAI();

      const dialectLabel = dialect === 'bangla' ? 'Standard Bangla (বাংলা)' : 'Sylheti Dialect (সিলেটি উপভাষা)';

      const systemInstruction = `You are the SylhetiLang Intelligent Code Assistant, an expert in compiler engineering and the Bangla & Sylheti dialect programming language.
The language syntax features:
- Core Keywords (Sylheti): 'ধরি' (variable declaration), 'কও' / 'ছাপাও' (stdout print), 'যদি' (if), 'নইলে' (else), 'যতক্ষণ' (while loop), 'ঘুরো' (for loop), 'কাম' (function), 'ফেরত' (return), 'থামাও' (break), 'চালাও' (continue), 'হাছা/সত্য' (true), 'মিছা' (false).
- Core Keywords (Bangla): 'ধরি', 'ছাপাও', 'যদি', 'নইলে', 'যতক্ষণ', 'ঘুরুন', 'ফাংশন', 'ফেরত', 'থামুন', 'চালিয়ে যান', 'সত্য', 'মিথ্যা'.
- Operators: +, -, *, /, %, ==, !=, <, >, <=, >=, বেশি, কম, সমান, না, এবং, অথবা.

Current Target Dialect: ${dialectLabel}

Instructions:
${
  mode === 'explain'
    ? `Mode: Code Explanation (কোড ব্যাখ্যা)
1. Provide a crystal-clear, structured explanation of what the selected code block does.
2. Break down the execution flow step-by-step in natural, elegant Bengali with helpful English terms in parentheses (e.g. শর্তানুসারে ব্রাঞ্চিং, লুপ ইটারেশন, রিকার্শন).
3. Identify all variables, conditional expressions, functions, loops, and data structures.
4. Conclude with an algorithmic Complexity analysis (Time Complexity O(...) & Space Complexity O(...)).`
    : `Mode: Logic Optimization & Performance Refactoring (লজিক অপ্টিমাইজেশন ও পরামর্শ)
1. Analyze the selected code for algorithmic inefficiencies, redundant operations, suboptimal loops (e.g. O(n^2) vs O(n)), unnecessary allocations, or stylistic anti-patterns.
2. Detail the exact bottlenecks and why they degrade execution efficiency.
3. Provide the improved, fully optimized code block written in ${dialectLabel}. Put the code in a standard markdown code block \`\`\`sylheti ... \`\`\` or \`\`\`bangla ... \`\`\`.
4. Explain the optimizations made (e.g. memoization, loop simplification, early break, constant folding) and quantify the theoretical performance improvement.`
}`;

      let userPrompt = `Selected Code Block:\n\`\`\`\n${codeSnippet}\n\`\`\`\n`;
      if (fullCode && fullCode.trim() !== codeSnippet.trim()) {
        userPrompt += `\nSurrounding Program Context for Reference:\n\`\`\`\n${fullCode}\n\`\`\`\n`;
      }
      userPrompt += `\nPlease provide your comprehensive ${mode === 'explain' ? 'explanation' : 'optimization suggestions and optimized code'} following the instructions.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const responseText = response.text || 'No response generated.';

      // Extract optimized replacement code snippet if present in markdown code block
      let suggestedCode: string | null = null;
      if (mode === 'optimize') {
        const codeBlockMatch = responseText.match(/```(?:sylheti|bangla|javascript|typescript)?\s*([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          suggestedCode = codeBlockMatch[1].trim();
        }
      }

      res.json({
        analysis: responseText,
        suggestedCode,
        mode,
        dialect,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in /api/ai/analyze:', err);
      const isMissingKey = err?.message?.includes('GEMINI_API_KEY') || !process.env.GEMINI_API_KEY;
      res.status(500).json({
        error: isMissingKey
          ? 'Gemini API Key is missing. Please configure GEMINI_API_KEY in Settings > Secrets.'
          : err?.message || 'Failed to process AI analysis request.',
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
