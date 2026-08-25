/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrayLiteralNode,
  AssignmentNode,
  BinaryExprNode,
  BlockStmtNode,
  CompilerDiagnostic,
  DataType,
  ExpressionNode,
  ForStmtNode,
  FunctionCallNode,
  FunctionDeclNode,
  IdentifierNode,
  IfStmtNode,
  IndexExprNode,
  InputStmtNode,
  LiteralNode,
  PrintStmtNode,
  ProgramNode,
  ReturnStmtNode,
  Scope,
  SourceLocation,
  StatementNode,
  SymbolTableEntry,
  UnaryExprNode,
  VarDeclNode,
  WhileStmtNode,
} from './types';

// Levenshtein distance for fuzzy typo correction suggestions
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export class SemanticAnalyzer {
  private diagnostics: CompilerDiagnostic[] = [];
  private rootScope: Scope;
  private currentScope: Scope;
  private scopeCounter = 0;
  private memoryOffsetCounter = 0;
  private currentFunction?: FunctionDeclNode;

  constructor() {
    this.rootScope = {
      id: 0,
      name: 'Global',
      children: [],
      symbols: new Map(),
    };
    this.currentScope = this.rootScope;
    this.registerBuiltinFunctions();
  }

  private registerBuiltinFunctions(): void {
    // Built-in standard library functions
    this.rootScope.symbols.set('দৈর্ঘ্য', {
      name: 'দৈর্ঘ্য',
      type: 'int',
      scopeLevel: 0,
      isConst: true,
      isInitialized: true,
      loc: { line: 0, column: 0, offset: 0, length: 0 },
      params: [{ name: 'obj', type: 'unknown' }],
      returnType: 'int',
    });
    this.rootScope.symbols.set('len', {
      name: 'len',
      type: 'int',
      scopeLevel: 0,
      isConst: true,
      isInitialized: true,
      loc: { line: 0, column: 0, offset: 0, length: 0 },
      params: [{ name: 'obj', type: 'unknown' }],
      returnType: 'int',
    });
    this.rootScope.symbols.set('পূর্ণসংখ্যা', {
      name: 'পূর্ণসংখ্যা',
      type: 'int',
      scopeLevel: 0,
      isConst: true,
      isInitialized: true,
      loc: { line: 0, column: 0, offset: 0, length: 0 },
      params: [{ name: 'val', type: 'unknown' }],
      returnType: 'int',
    });
    this.rootScope.symbols.set('int', {
      name: 'int',
      type: 'int',
      scopeLevel: 0,
      isConst: true,
      isInitialized: true,
      loc: { line: 0, column: 0, offset: 0, length: 0 },
      params: [{ name: 'val', type: 'unknown' }],
      returnType: 'int',
    });
    this.rootScope.symbols.set('বর্গমূল', {
      name: 'বর্গমূল',
      type: 'float',
      scopeLevel: 0,
      isConst: true,
      isInitialized: true,
      loc: { line: 0, column: 0, offset: 0, length: 0 },
      params: [{ name: 'num', type: 'float' }],
      returnType: 'float',
    });
    this.rootScope.symbols.set('sqrt', {
      name: 'sqrt',
      type: 'float',
      scopeLevel: 0,
      isConst: true,
      isInitialized: true,
      loc: { line: 0, column: 0, offset: 0, length: 0 },
      params: [{ name: 'num', type: 'float' }],
      returnType: 'float',
    });
    this.rootScope.symbols.set('পরমমান', {
      name: 'পরমমান',
      type: 'int',
      scopeLevel: 0,
      isConst: true,
      isInitialized: true,
      loc: { line: 0, column: 0, offset: 0, length: 0 },
      params: [{ name: 'val', type: 'int' }],
      returnType: 'int',
    });
    this.rootScope.symbols.set('abs', {
      name: 'abs',
      type: 'int',
      scopeLevel: 0,
      isConst: true,
      isInitialized: true,
      loc: { line: 0, column: 0, offset: 0, length: 0 },
      params: [{ name: 'val', type: 'int' }],
      returnType: 'int',
    });
  }

  public analyze(ast: ProgramNode): {
    symbolTable: Scope;
    diagnostics: CompilerDiagnostic[];
  } {
    this.diagnostics = [];
    this.scopeCounter = 0;
    this.memoryOffsetCounter = 0;
    this.rootScope.children = [];
    this.currentScope = this.rootScope;

    for (const stmt of ast.body) {
      this.analyzeStatement(stmt);
    }

    return {
      symbolTable: this.rootScope,
      diagnostics: this.diagnostics,
    };
  }

  private enterScope(name: string): Scope {
    this.scopeCounter++;
    const newScope: Scope = {
      id: this.scopeCounter,
      name,
      parent: this.currentScope,
      children: [],
      symbols: new Map(),
    };
    this.currentScope.children.push(newScope);
    this.currentScope = newScope;
    return newScope;
  }

  private exitScope(): void {
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
    }
  }

  private analyzeStatement(stmt: StatementNode): void {
    switch (stmt.type) {
      case 'VarDecl':
        this.analyzeVarDecl(stmt);
        break;
      case 'Assignment':
        this.analyzeAssignment(stmt);
        break;
      case 'FunctionDecl':
        this.analyzeFunctionDecl(stmt);
        break;
      case 'IfStmt':
        this.analyzeIfStmt(stmt);
        break;
      case 'WhileStmt':
        this.analyzeWhileStmt(stmt);
        break;
      case 'ForStmt':
        this.analyzeForStmt(stmt);
        break;
      case 'BlockStmt':
        this.analyzeBlockStmt(stmt);
        break;
      case 'PrintStmt':
        this.analyzePrintStmt(stmt);
        break;
      case 'InputStmt':
        this.analyzeInputStmt(stmt);
        break;
      case 'ReturnStmt':
        this.analyzeReturnStmt(stmt);
        break;
      case 'ExpressionStmt':
        this.analyzeExpression(stmt.expression);
        break;
      case 'BreakStmt':
      case 'ContinueStmt':
        break;
    }
  }

  private analyzeVarDecl(node: VarDeclNode): void {
    const name = node.identifier;

    // Check if already declared in the CURRENT scope
    if (this.currentScope.symbols.has(name)) {
      this.addDiagnostic(
        'error',
        `চলক '${name}' এই স্কোপে ইতোমধ্যে ঘোষিত হয়েছে (Redeclaration of variable '${name}')`,
        node.loc,
        'semantic'
      );
      return;
    }

    let initType: DataType = 'unknown';
    if (node.init) {
      initType = this.analyzeExpression(node.init);
    }

    // Type checking between explicit type annotation and init expression
    let finalType: DataType = node.dataType || initType || 'unknown';
    if (node.dataType && node.init && initType !== 'unknown') {
      if (node.dataType !== initType) {
        // Special case: int can promote to float
        if (!(node.dataType === 'float' && initType === 'int')) {
          this.addDiagnostic(
            'error',
            `টাইপ অসঙ্গতি: '${node.dataType}' টাইপের চলকে '${initType}' মান রাখা যাবে না (Type mismatch in variable declaration)`,
            node.loc,
            'semantic'
          );
        }
      }
    }

    this.memoryOffsetCounter += 4;
    const entry: SymbolTableEntry = {
      name,
      type: finalType,
      scopeLevel: this.getScopeDepth(),
      isConst: node.isConst,
      isInitialized: node.init !== undefined,
      loc: node.loc,
      memoryOffset: this.memoryOffsetCounter,
    };

    this.currentScope.symbols.set(name, entry);
  }

  private analyzeAssignment(node: AssignmentNode): void {
    const symbol = this.lookupSymbol(node.identifier);

    if (!symbol) {
      const suggestion = this.findClosestSymbol(node.identifier);
      this.addDiagnostic(
        'error',
        `অঘোষিত চলক '${node.identifier}' (Undeclared variable '${node.identifier}')`,
        node.loc,
        'semantic',
        suggestion ? `আপনি কি '${suggestion}' বুঝিয়েছেন? (Did you mean '${suggestion}'?)` : undefined
      );
      return;
    }

    if (symbol.isConst) {
      this.addDiagnostic(
        'error',
        `ধ্রুবক (constant) '${node.identifier}'-এর মান পরিবর্তন করা অসম্ভব (Cannot reassign constant)`,
        node.loc,
        'semantic'
      );
    }

    if (node.index) {
      const idxType = this.analyzeExpression(node.index);
      if (idxType !== 'int' && idxType !== 'unknown') {
        this.addDiagnostic(
          'error',
          `তালিকার ইনডেক্স অবশ্যই পূর্ণসংখ্যা (int) হতে হবে (Array index must be integer, got '${idxType}')`,
          node.index.loc,
          'semantic'
        );
      }
    }

    const valType = this.analyzeExpression(node.value);

    // Type checking
    if (symbol.type !== 'unknown' && valType !== 'unknown') {
      if (symbol.type !== valType && !(symbol.type === 'float' && valType === 'int')) {
        this.addDiagnostic(
          'warning',
          `অ্যাসাইনমেন্টে সম্ভাব্য টাইপ অসঙ্গতি: '${symbol.type}' চলকে '${valType}' মান দেওয়া হচ্ছে`,
          node.loc,
          'semantic'
        );
      }
    }

    symbol.isInitialized = true;
  }

  private analyzeFunctionDecl(node: FunctionDeclNode): void {
    if (this.currentScope.symbols.has(node.name)) {
      this.addDiagnostic(
        'error',
        `ফাংশন '${node.name}' ইতোমধ্যে ঘোষিত হয়েছে (Duplicate function declaration)`,
        node.loc,
        'semantic'
      );
    }

    const entry: SymbolTableEntry = {
      name: node.name,
      type: node.returnType,
      scopeLevel: this.getScopeDepth(),
      isConst: true,
      isInitialized: true,
      loc: node.loc,
      params: node.params,
      returnType: node.returnType,
    };
    this.currentScope.symbols.set(node.name, entry);

    // Enter function scope
    this.enterScope(`Function_${node.name}`);
    const prevFunc = this.currentFunction;
    this.currentFunction = node;

    // Register params
    for (const param of node.params) {
      this.memoryOffsetCounter += 4;
      this.currentScope.symbols.set(param.name, {
        name: param.name,
        type: param.type || 'unknown',
        scopeLevel: this.getScopeDepth(),
        isConst: false,
        isInitialized: true,
        loc: node.loc,
        memoryOffset: this.memoryOffsetCounter,
      });
    }

    // Analyze body statements
    for (const stmt of node.body.statements) {
      this.analyzeStatement(stmt);
    }

    this.currentFunction = prevFunc;
    this.exitScope();
  }

  private analyzeIfStmt(node: IfStmtNode): void {
    const condType = this.analyzeExpression(node.condition);
    if (condType !== 'bool' && condType !== 'unknown') {
      this.addDiagnostic(
        'info',
        `শর্তটি বুলিয়ান (bool) টাইপ হওয়া কাম্য (Expected boolean condition, got '${condType}')`,
        node.condition.loc,
        'semantic'
      );
    }

    this.analyzeStatement(node.consequent);
    if (node.alternate) {
      this.analyzeStatement(node.alternate);
    }
  }

  private analyzeWhileStmt(node: WhileStmtNode): void {
    this.analyzeExpression(node.condition);
    this.analyzeStatement(node.body);
  }

  private analyzeForStmt(node: ForStmtNode): void {
    this.enterScope('ForLoop');
    if (node.init) {
      this.analyzeStatement(node.init);
    }
    if (node.condition) {
      this.analyzeExpression(node.condition);
    }
    if (node.update) {
      if ('type' in node.update && typeof node.update.type === 'string') {
        if (node.update.type === 'Assignment' || node.update.type === 'ExpressionStmt') {
          this.analyzeStatement(node.update as StatementNode);
        } else {
          this.analyzeExpression(node.update as ExpressionNode);
        }
      }
    }
    this.analyzeStatement(node.body);
    this.exitScope();
  }

  private analyzeBlockStmt(node: BlockStmtNode): void {
    this.enterScope('Block');
    for (const stmt of node.statements) {
      this.analyzeStatement(stmt);
    }
    this.exitScope();
  }

  private analyzePrintStmt(node: PrintStmtNode): void {
    for (const expr of node.expressions) {
      this.analyzeExpression(expr);
    }
  }

  private analyzeInputStmt(node: InputStmtNode): void {
    const symbol = this.lookupSymbol(node.identifier);
    if (!symbol) {
      // Auto-declare if not declared in current scope (convenience feature in Sylheti)
      this.memoryOffsetCounter += 4;
      this.currentScope.symbols.set(node.identifier, {
        name: node.identifier,
        type: 'string',
        scopeLevel: this.getScopeDepth(),
        isConst: false,
        isInitialized: true,
        loc: node.loc,
        memoryOffset: this.memoryOffsetCounter,
      });
    } else {
      symbol.isInitialized = true;
    }
  }

  private analyzeReturnStmt(node: ReturnStmtNode): void {
    if (!this.currentFunction) {
      this.addDiagnostic(
        'error',
        `'ফেরত' (return) শুধুমাত্র ফাংশনের অভ্যন্তরে ব্যবহারযোগ্য`,
        node.loc,
        'semantic'
      );
      return;
    }

    if (node.value) {
      const valType = this.analyzeExpression(node.value);
      if (this.currentFunction.returnType !== 'void' && this.currentFunction.returnType !== 'unknown') {
        if (valType !== this.currentFunction.returnType && !(this.currentFunction.returnType === 'float' && valType === 'int')) {
          this.addDiagnostic(
            'warning',
            `ফাংশন '${this.currentFunction.name}'-এর রিটার্ন টাইপ '${this.currentFunction.returnType}', কিন্তু ফেরত দেওয়া হচ্ছে '${valType}'`,
            node.loc,
            'semantic'
          );
        }
      }
    }
  }

  public analyzeExpression(expr: ExpressionNode): DataType {
    switch (expr.type) {
      case 'Literal':
        return expr.dataType;

      case 'Identifier': {
        const symbol = this.lookupSymbol(expr.name);
        if (!symbol) {
          const suggestion = this.findClosestSymbol(expr.name);
          this.addDiagnostic(
            'error',
            `অঘোষিত চলক '${expr.name}' (Undeclared identifier '${expr.name}')`,
            expr.loc,
            'semantic',
            suggestion ? `আপনি কি '${suggestion}' বুঝিয়েছেন?` : undefined
          );
          return 'unknown';
        }
        if (!symbol.isInitialized) {
          this.addDiagnostic(
            'warning',
            `চলক '${expr.name}' মান নির্ধারণ ছাড়া ব্যবহার করা হয়েছে (Variable '${expr.name}' used before initialization)`,
            expr.loc,
            'semantic'
          );
        }
        expr.inferredType = symbol.type;
        return symbol.type;
      }

      case 'BinaryExpr': {
        const leftType = this.analyzeExpression(expr.left);
        const rightType = this.analyzeExpression(expr.right);

        // Arithmetic
        if (['+', '-', '*', '/', '%'].includes(expr.operator)) {
          if (expr.operator === '+' && (leftType === 'string' || rightType === 'string')) {
            expr.inferredType = 'string';
            return 'string';
          }
          if (leftType === 'float' || rightType === 'float') {
            expr.inferredType = 'float';
            return 'float';
          }
          expr.inferredType = 'int';
          return 'int';
        }

        // Comparison & Logical
        if (['==', '!=', '<', '>', '<=', '>=', '&&', '||'].includes(expr.operator)) {
          expr.inferredType = 'bool';
          return 'bool';
        }

        return 'unknown';
      }

      case 'UnaryExpr': {
        const operandType = this.analyzeExpression(expr.operand);
        if (expr.operator === '!') {
          expr.inferredType = 'bool';
          return 'bool';
        }
        expr.inferredType = operandType;
        return operandType;
      }

      case 'FunctionCall': {
        const symbol = this.lookupSymbol(expr.callee);
        if (!symbol) {
          this.addDiagnostic(
            'error',
            `অঘোষিত ফাংশন '${expr.callee}' (Undeclared function '${expr.callee}')`,
            expr.loc,
            'semantic'
          );
          return 'unknown';
        }

        for (const arg of expr.args) {
          this.analyzeExpression(arg);
        }

        const retType = symbol.returnType || symbol.type || 'unknown';
        expr.inferredType = retType;
        return retType;
      }

      case 'ArrayLiteral': {
        for (const el of expr.elements) {
          this.analyzeExpression(el);
        }
        expr.dataType = 'array';
        return 'array';
      }

      case 'IndexExpr': {
        this.analyzeExpression(expr.array);
        const idxType = this.analyzeExpression(expr.index);
        if (idxType !== 'int' && idxType !== 'unknown') {
          this.addDiagnostic(
            'error',
            `ইনডেক্স অবশ্যই পূর্ণসংখ্যা হতে হবে (Got '${idxType}')`,
            expr.index.loc,
            'semantic'
          );
        }
        expr.inferredType = 'unknown';
        return 'unknown';
      }
    }
  }

  private lookupSymbol(name: string): SymbolTableEntry | undefined {
    let scope: Scope | undefined = this.currentScope;
    while (scope) {
      if (scope.symbols.has(name)) {
        return scope.symbols.get(name);
      }
      scope = scope.parent;
    }
    return undefined;
  }

  private findClosestSymbol(name: string): string | undefined {
    let bestMatch: string | undefined;
    let minDistance = 3; // Max threshold

    let scope: Scope | undefined = this.currentScope;
    while (scope) {
      for (const key of scope.symbols.keys()) {
        const dist = levenshtein(name, key);
        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = key;
        }
      }
      scope = scope.parent;
    }
    return bestMatch;
  }

  private getScopeDepth(): number {
    let depth = 0;
    let scope = this.currentScope;
    while (scope.parent) {
      depth++;
      scope = scope.parent;
    }
    return depth;
  }

  private addDiagnostic(
    severity: 'error' | 'warning' | 'info',
    message: string,
    loc: SourceLocation,
    stage: 'lexer' | 'parser' | 'semantic' | 'codegen' | 'runtime',
    suggestion?: string
  ): void {
    this.diagnostics.push({
      severity,
      message,
      loc,
      stage,
      suggestion,
    });
  }
}
