/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TokenType =
  // Keywords
  | 'KW_VAR'          // ধরি / dhori / রাখইন / rakhoin
  | 'KW_CONST'        // ধ্রুবক / dhrubok / একদম / ekdom
  | 'KW_IF'           // যদি / zodi / jodi
  | 'KW_ELSE'         // নইলে / noile / na_oile
  | 'KW_ELIF'         // অথবা_যদি / othoba_zodi
  | 'KW_WHILE'        // যতক্ষণ / jotokkhon / চলে / chole
  | 'KW_FOR'          // ঘুরো / ghuro / বারবার / bar_bar
  | 'KW_PRINT'        // কও / kwa / দেখাও / dekhao / ছাপাও / chapao
  | 'KW_INPUT'        // লও / lao / ইনপুট / input
  | 'KW_FUNCTION'     // কাম / kaam / ফাংশন / function
  | 'KW_RETURN'       // ফেরত / ferot / দেও / dew
  | 'KW_BREAK'        // থামো / thamo / ভাংগিয়া / bhangia
  | 'KW_CONTINUE'     // পরেরটা / porerta / চালাও / chalao
  | 'KW_TRUE'         // হাছা / hasa / সত্য / true
  | 'KW_FALSE'        // মিছা / misa / মিথ্যা / false
  | 'KW_NULL'         // খালি / khali / null

  // Type annotations
  | 'TYPE_INT'        // আস্তা / সংখ্যা / int
  | 'TYPE_FLOAT'      // ভাংতি / float
  | 'TYPE_STRING'     // লেখা / str
  | 'TYPE_BOOL'       // সত্যমিছা / bool
  | 'TYPE_VOID'       // খালি / void

  // Literals & Identifiers
  | 'IDENTIFIER'
  | 'NUMBER_LITERAL'
  | 'STRING_LITERAL'

  // Operators
  | 'PLUS'            // + / যোগ
  | 'MINUS'           // - / বিয়োগ
  | 'STAR'            // * / গুণ
  | 'SLASH'           // / / ভাগ
  | 'PERCENT'         // % / ভাগশেষ
  | 'ASSIGN'          // =
  | 'PLUS_ASSIGN'     // +=
  | 'MINUS_ASSIGN'    // -=
  | 'INC'             // ++
  | 'DEC'             // --
  | 'EQ'              // == / সমান
  | 'NEQ'             // != / অসমান
  | 'LT'              // < / কম
  | 'GT'              // > / বেশি
  | 'LTE'             // <= / কম_বা_সমান
  | 'GTE'             // >= / বেশি_বা_সমান
  | 'AND'             // && / আর / and
  | 'OR'              // || / বা / or
  | 'NOT'             // ! / না / not

  // Delimiters
  | 'LPAREN'          // (
  | 'RPAREN'          // )
  | 'LBRACE'          // {
  | 'RBRACE'          // }
  | 'LBRACKET'        // [
  | 'RBRACKET'        // ]
  | 'COMMA'           // ,
  | 'COLON'           // :
  | 'SEMICOLON'       // ; বা দাঁড়ি ।
  | 'DOT'             // .

  // Special
  | 'EOF'
  | 'UNKNOWN';

export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
  length: number;
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal?: any;
  loc: SourceLocation;
  normalizedDialect?: string; // Standard Bangla equivalent
}

export type DataType = 'int' | 'float' | 'string' | 'bool' | 'void' | 'array' | 'unknown';

export interface ASTNodeBase {
  type: string;
  loc: SourceLocation;
}

export interface ProgramNode extends ASTNodeBase {
  type: 'Program';
  body: StatementNode[];
}

export interface VarDeclNode extends ASTNodeBase {
  type: 'VarDecl';
  identifier: string;
  dataType?: DataType;
  init?: ExpressionNode;
  isConst: boolean;
}

export interface AssignmentNode extends ASTNodeBase {
  type: 'Assignment';
  identifier: string;
  index?: ExpressionNode;
  operator: '=' | '+=' | '-=';
  value: ExpressionNode;
}

export interface BinaryExprNode extends ASTNodeBase {
  type: 'BinaryExpr';
  operator: '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '<' | '>' | '<=' | '>=' | '&&' | '||';
  left: ExpressionNode;
  right: ExpressionNode;
  inferredType?: DataType;
}

export interface UnaryExprNode extends ASTNodeBase {
  type: 'UnaryExpr';
  operator: '-' | '!' | '++' | '--';
  operand: ExpressionNode;
  isPrefix: boolean;
  inferredType?: DataType;
}

export interface LiteralNode extends ASTNodeBase {
  type: 'Literal';
  value: number | string | boolean | null;
  raw: string;
  dataType: DataType;
}

export interface IdentifierNode extends ASTNodeBase {
  type: 'Identifier';
  name: string;
  inferredType?: DataType;
}

export interface ArrayLiteralNode extends ASTNodeBase {
  type: 'ArrayLiteral';
  elements: ExpressionNode[];
  dataType: DataType;
}

export interface IndexExprNode extends ASTNodeBase {
  type: 'IndexExpr';
  array: ExpressionNode;
  index: ExpressionNode;
  inferredType?: DataType;
}

export interface FunctionCallNode extends ASTNodeBase {
  type: 'FunctionCall';
  callee: string;
  args: ExpressionNode[];
  inferredType?: DataType;
}

export interface PrintStmtNode extends ASTNodeBase {
  type: 'PrintStmt';
  expressions: ExpressionNode[];
}

export interface InputStmtNode extends ASTNodeBase {
  type: 'InputStmt';
  identifier: string;
  prompt?: string;
}

export interface BlockStmtNode extends ASTNodeBase {
  type: 'BlockStmt';
  statements: StatementNode[];
}

export interface IfStmtNode extends ASTNodeBase {
  type: 'IfStmt';
  condition: ExpressionNode;
  consequent: StatementNode;
  alternate?: StatementNode;
}

export interface WhileStmtNode extends ASTNodeBase {
  type: 'WhileStmt';
  condition: ExpressionNode;
  body: StatementNode;
}

export interface ForStmtNode extends ASTNodeBase {
  type: 'ForStmt';
  init?: StatementNode;
  condition?: ExpressionNode;
  update?: ExpressionNode | StatementNode;
  body: StatementNode;
}

export interface FunctionDeclNode extends ASTNodeBase {
  type: 'FunctionDecl';
  name: string;
  params: { name: string; type?: DataType }[];
  returnType: DataType;
  body: BlockStmtNode;
}

export interface ReturnStmtNode extends ASTNodeBase {
  type: 'ReturnStmt';
  value?: ExpressionNode;
}

export interface BreakStmtNode extends ASTNodeBase {
  type: 'BreakStmt';
}

export interface ContinueStmtNode extends ASTNodeBase {
  type: 'ContinueStmt';
}

export interface ExpressionStmtNode extends ASTNodeBase {
  type: 'ExpressionStmt';
  expression: ExpressionNode;
}

export type ExpressionNode =
  | BinaryExprNode
  | UnaryExprNode
  | LiteralNode
  | IdentifierNode
  | ArrayLiteralNode
  | IndexExprNode
  | FunctionCallNode;

export type StatementNode =
  | VarDeclNode
  | AssignmentNode
  | PrintStmtNode
  | InputStmtNode
  | BlockStmtNode
  | IfStmtNode
  | WhileStmtNode
  | ForStmtNode
  | FunctionDeclNode
  | ReturnStmtNode
  | BreakStmtNode
  | ContinueStmtNode
  | ExpressionStmtNode;

export interface CompilerDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  loc: SourceLocation;
  stage: 'lexer' | 'parser' | 'semantic' | 'codegen' | 'runtime';
  suggestion?: string;
}

export interface SymbolTableEntry {
  name: string;
  type: DataType;
  scopeLevel: number;
  isConst: boolean;
  isInitialized: boolean;
  loc: SourceLocation;
  memoryOffset?: number;
  params?: { name: string; type?: DataType }[];
  returnType?: DataType;
}

export interface Scope {
  id: number;
  name: string;
  parent?: Scope;
  children: Scope[];
  symbols: Map<string, SymbolTableEntry>;
}

export interface TACInstruction {
  id: number;
  op: string;
  arg1?: string;
  arg2?: string;
  result?: string;
  comment?: string;
}

export interface BasicBlock {
  id: string;
  label: string;
  instructions: TACInstruction[];
  predecessors: string[];
  successors: string[];
}

export interface ControlFlowGraph {
  blocks: BasicBlock[];
  entryBlockId: string;
  exitBlockId: string;
}

export interface OptimizationMetrics {
  originalNodeCount: number;
  optimizedNodeCount: number;
  constantsFolded: number;
  deadCodeNodesRemoved: number;
  subexpressionsEliminated: number;
  loopsOptimized: number;
}

export interface PhaseTiming {
  phase: 'lexing' | 'parsing' | 'semantic' | 'optimization' | 'codegen';
  name: string;
  durationMs: number;
  percentage: number;
  description: string;
  itemsProcessed: number;
  itemUnit: string;
}

export interface CompilerPerformanceMetrics {
  totalTimeMs: number;
  phases: PhaseTiming[];
  linesCount: number;
  tokensCount: number;
  astNodesCount: number;
  throughputLinesPerSec: number;
}

export interface CompilationResult {
  tokens: Token[];
  ast: ProgramNode | null;
  optimizedAst?: ProgramNode | null;
  diagnostics: CompilerDiagnostic[];
  symbolTable: Scope;
  tac: TACInstruction[];
  cfg: ControlFlowGraph;
  llvmIR: string;
  pythonCode: string;
  cCode: string;
  optimizationMetrics: OptimizationMetrics;
  performanceMetrics: CompilerPerformanceMetrics;
  hasErrors: boolean;
}
