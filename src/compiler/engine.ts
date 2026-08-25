/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LLVMIRGenerator } from './codegen_llvm';
import { TACGenerator } from './codegen_tac';
import { CGenerator, PythonGenerator } from './codegen_transpilers';
import { Lexer } from './lexer';
import { ASTOptimizer } from './optimizer';
import { Parser } from './parser';
import { SemanticAnalyzer } from './semantic';
import { CompilationResult, CompilerDiagnostic, CompilerPerformanceMetrics, PhaseTiming } from './types';

export class CompilerEngine {
  public static compile(sourceCode: string, targetTriple = 'x86_64-linux'): CompilationResult {
    const allDiagnostics: CompilerDiagnostic[] = [];
    const tPipelineStart = performance.now();

    // Stage 1: Lexical Analysis (Tokenization)
    const tLexStart = performance.now();
    const lexer = new Lexer(sourceCode);
    const { tokens, diagnostics: lexerDiags } = lexer.tokenize();
    allDiagnostics.push(...lexerDiags);
    const tLexEnd = performance.now();
    const lexDuration = Math.max(0.01, +(tLexEnd - tLexStart).toFixed(3));

    // Stage 2: Syntax Analysis (Parsing & AST Construction)
    const tParseStart = performance.now();
    const parser = new Parser(tokens);
    const { ast, diagnostics: parserDiags } = parser.parse();
    allDiagnostics.push(...parserDiags);
    const tParseEnd = performance.now();
    const parseDuration = Math.max(0.01, +(tParseEnd - tParseStart).toFixed(3));

    // Stage 3: Semantic Analysis & Symbol Table Generation
    const tSemStart = performance.now();
    const semanticAnalyzer = new SemanticAnalyzer();
    const { symbolTable, diagnostics: semanticDiags } = semanticAnalyzer.analyze(ast);
    allDiagnostics.push(...semanticDiags);
    const tSemEnd = performance.now();
    const semDuration = Math.max(0.01, +(tSemEnd - tSemStart).toFixed(3));

    // Stage 4: AST Optimization Pipeline (Constant Folding, Dead Code, CSE)
    const tOptStart = performance.now();
    const optimizer = new ASTOptimizer();
    const { optimizedAst, metrics: optMetrics } = optimizer.optimize(ast);
    const tOptEnd = performance.now();
    const optDuration = Math.max(0.01, +(tOptEnd - tOptStart).toFixed(3));

    // Stage 5: Intermediate Code Generation (Three-Address Code & CFG)
    const tacGenerator = new TACGenerator();
    const { tac, cfg } = tacGenerator.generate(optimizedAst || ast);

    // Stage 6: Code Generation (LLVM IR Target)
    const llvmGenerator = new LLVMIRGenerator(targetTriple);
    const llvmIR = llvmGenerator.generate(optimizedAst || ast);

    // Stage 7: Transpilers (Python 3 & ANSI C99)
    const pyGen = new PythonGenerator();
    const pythonCode = pyGen.generate(optimizedAst || ast);

    const cGen = new CGenerator();
    const cCode = cGen.generate(optimizedAst || ast);

    const tPipelineEnd = performance.now();
    const totalPipelineDuration = Math.max(0.05, +(tPipelineEnd - tPipelineStart).toFixed(3));

    const coreSum = lexDuration + parseDuration + semDuration + optDuration;
    const linesCount = sourceCode.split('\n').length;
    const tokensCount = tokens.length;
    const astNodesCount = optMetrics.originalNodeCount || 0;

    const phases: PhaseTiming[] = [
      {
        phase: 'lexing',
        name: 'Lexing',
        durationMs: lexDuration,
        percentage: +((lexDuration / coreSum) * 100).toFixed(1),
        description: 'Lexical analysis converting source code into tokens & dialect normalization',
        itemsProcessed: tokensCount,
        itemUnit: 'tokens',
      },
      {
        phase: 'parsing',
        name: 'Parsing',
        durationMs: parseDuration,
        percentage: +((parseDuration / coreSum) * 100).toFixed(1),
        description: 'Recursive descent parsing building Abstract Syntax Tree (AST)',
        itemsProcessed: astNodesCount,
        itemUnit: 'AST nodes',
      },
      {
        phase: 'semantic',
        name: 'Semantic Analysis',
        durationMs: semDuration,
        percentage: +((semDuration / coreSum) * 100).toFixed(1),
        description: 'Scope hierarchy validation, type inference & symbol table resolution',
        itemsProcessed: Array.from(symbolTable.symbols.keys()).length,
        itemUnit: 'symbols',
      },
      {
        phase: 'optimization',
        name: 'Optimization',
        durationMs: optDuration,
        percentage: +((optDuration / coreSum) * 100).toFixed(1),
        description: 'AST constant folding, dead code elimination & common subexpression elimination',
        itemsProcessed: (optMetrics.constantsFolded + optMetrics.deadCodeNodesRemoved + optMetrics.subexpressionsEliminated),
        itemUnit: 'optimizations',
      },
    ];

    const throughputLinesPerSec = totalPipelineDuration > 0
      ? Math.round((linesCount / (totalPipelineDuration / 1000)))
      : 0;

    const performanceMetrics: CompilerPerformanceMetrics = {
      totalTimeMs: totalPipelineDuration,
      phases,
      linesCount,
      tokensCount,
      astNodesCount,
      throughputLinesPerSec,
    };

    const hasErrors = allDiagnostics.some((d) => d.severity === 'error');

    return {
      tokens,
      ast,
      optimizedAst,
      diagnostics: allDiagnostics,
      symbolTable,
      tac,
      cfg,
      llvmIR,
      pythonCode,
      cCode,
      optimizationMetrics: optMetrics,
      performanceMetrics,
      hasErrors,
    };
  }
}
