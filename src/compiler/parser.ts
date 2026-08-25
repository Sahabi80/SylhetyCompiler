/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AssignmentNode,
  ASTNodeBase,
  BlockStmtNode,
  BreakStmtNode,
  CompilerDiagnostic,
  ContinueStmtNode,
  DataType,
  ExpressionNode,
  ExpressionStmtNode,
  ForStmtNode,
  FunctionCallNode,
  FunctionDeclNode,
  IdentifierNode,
  IfStmtNode,
  InputStmtNode,
  LiteralNode,
  PrintStmtNode,
  ProgramNode,
  ReturnStmtNode,
  SourceLocation,
  StatementNode,
  Token,
  TokenType,
  UnaryExprNode,
  VarDeclNode,
  WhileStmtNode,
} from './types';

export class Parser {
  private tokens: Token[];
  private current = 0;
  private diagnostics: CompilerDiagnostic[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): { ast: ProgramNode; diagnostics: CompilerDiagnostic[] } {
    this.current = 0;
    this.diagnostics = [];
    const statements: StatementNode[] = [];

    while (!this.isAtEnd()) {
      try {
        const stmt = this.declaration();
        if (stmt) {
          statements.push(stmt);
        }
      } catch (error) {
        this.synchronize();
      }
    }

    const firstLoc = statements[0]?.loc || { line: 1, column: 1, offset: 0, length: 0 };
    const lastLoc = statements[statements.length - 1]?.loc || firstLoc;

    const ast: ProgramNode = {
      type: 'Program',
      body: statements,
      loc: {
        line: 1,
        column: 1,
        offset: 0,
        length: lastLoc.offset + lastLoc.length,
      },
    };

    return { ast, diagnostics: this.diagnostics };
  }

  private declaration(): StatementNode | null {
    // Function declaration: 'কাম' / 'ফাংশন'
    if (this.match('KW_FUNCTION')) {
      return this.functionDeclaration();
    }

    // Variable declaration: 'ধরি' / 'রাখইন'
    if (this.match('KW_VAR')) {
      return this.varDeclaration(false);
    }

    // Constant declaration: 'ধ্রুবক' / 'একদম'
    if (this.match('KW_CONST')) {
      return this.varDeclaration(true);
    }

    return this.statement();
  }

  private functionDeclaration(): FunctionDeclNode {
    const startTok = this.previous();
    const nameToken = this.consume('IDENTIFIER', "ফাংশনের নাম প্রয়োজন (Expected function name)");
    const name = nameToken.lexeme;

    this.consume('LPAREN', "ফাংশন প্যারামিটারের শুরুতে '(' প্রত্যাশিত");
    const params: { name: string; type?: DataType }[] = [];

    if (!this.check('RPAREN')) {
      do {
        const paramToken = this.consume('IDENTIFIER', 'প্যারামিটারের নাম দিন (Expected parameter name)');
        let paramType: DataType | undefined;
        if (this.match('COLON')) {
          paramType = this.parseTypeAnnotation();
        }
        params.push({ name: paramToken.lexeme, type: paramType });
      } while (this.match('COMMA'));
    }

    this.consume('RPAREN', "ফাংশন প্যারামিটার শেষে ')' প্রত্যাশিত");

    let returnType: DataType = 'void';
    if (this.match('COLON')) {
      returnType = this.parseTypeAnnotation();
    }

    this.consume('LBRACE', "ফাংশন বডির শুরুতে '{' প্রত্যাশিত");
    const body = this.blockStatement();

    return {
      type: 'FunctionDecl',
      name,
      params,
      returnType,
      body,
      loc: this.mergeLoc(startTok.loc, body.loc),
    };
  }

  private varDeclaration(isConst: boolean): VarDeclNode {
    const startTok = this.previous();
    const nameToken = this.consume('IDENTIFIER', 'চলকের নাম প্রয়োজন (Expected variable name)');
    let dataType: DataType | undefined;

    if (this.match('COLON')) {
      dataType = this.parseTypeAnnotation();
    }

    let init: ExpressionNode | undefined;
    if (this.match('ASSIGN')) {
      init = this.expression();
    } else if (isConst) {
      this.error(this.peek(), 'ধ্রুবক (const) ঘোষণার সময় অবশ্যই প্রাথমিক মান নির্ধারণ করতে হবে');
    }

    this.consumeOptionalSemicolon();

    return {
      type: 'VarDecl',
      identifier: nameToken.lexeme,
      dataType,
      init,
      isConst,
      loc: this.mergeLoc(startTok.loc, init?.loc || nameToken.loc),
    };
  }

  private parseTypeAnnotation(): DataType {
    if (this.match('TYPE_INT')) return 'int';
    if (this.match('TYPE_FLOAT')) return 'float';
    if (this.match('TYPE_STRING')) return 'string';
    if (this.match('TYPE_BOOL')) return 'bool';
    if (this.match('TYPE_VOID')) return 'void';
    this.error(this.peek(), 'অবৈধ টাইপ স্পেসিফায়ার (Invalid type specifier)');
    return 'unknown';
  }

  private statement(): StatementNode {
    if (this.match('KW_IF')) return this.ifStatement();
    if (this.match('KW_WHILE')) return this.whileStatement();
    if (this.match('KW_FOR')) return this.forStatement();
    if (this.match('KW_PRINT')) return this.printStatement();
    if (this.match('KW_INPUT')) return this.inputStatement();
    if (this.match('KW_RETURN')) return this.returnStatement();
    if (this.match('KW_BREAK')) return this.breakStatement();
    if (this.match('KW_CONTINUE')) return this.continueStatement();
    if (this.match('LBRACE')) return this.blockStatement();

    return this.expressionOrAssignmentStatement();
  }

  private ifStatement(): IfStmtNode {
    const startTok = this.previous();
    const hasParen = this.match('LPAREN');
    const condition = this.expression();
    if (hasParen) {
      this.consume('RPAREN', "শর্তের শেষে ')' প্রত্যাশিত");
    }

    // Body of if
    const consequent = this.statement();
    let alternate: StatementNode | undefined;

    if (this.match('KW_ELIF')) {
      alternate = this.ifStatement();
    } else if (this.match('KW_ELSE')) {
      alternate = this.statement();
    }

    return {
      type: 'IfStmt',
      condition,
      consequent,
      alternate,
      loc: this.mergeLoc(startTok.loc, alternate?.loc || consequent.loc),
    };
  }

  private whileStatement(): WhileStmtNode {
    const startTok = this.previous();
    const hasParen = this.match('LPAREN');
    const condition = this.expression();
    if (hasParen) {
      this.consume('RPAREN', "শর্তের শেষে ')' প্রত্যাশিত");
    }

    const body = this.statement();

    return {
      type: 'WhileStmt',
      condition,
      body,
      loc: this.mergeLoc(startTok.loc, body.loc),
    };
  }

  private forStatement(): ForStmtNode {
    const startTok = this.previous();
    const hasParen = this.match('LPAREN');

    // Init
    let init: StatementNode | undefined;
    if (this.match('SEMICOLON')) {
      init = undefined;
    } else if (this.match('KW_VAR')) {
      init = this.varDeclaration(false);
    } else {
      init = this.expressionOrAssignmentStatement();
    }

    // Condition
    let condition: ExpressionNode | undefined;
    if (!this.check('SEMICOLON')) {
      condition = this.expression();
    }
    this.consume('SEMICOLON', "লুপ শর্তের পর ';' অথবা '।' প্রত্যাশিত");

    // Update
    let update: ExpressionNode | undefined;
    if (!this.check('RPAREN') && !this.check('LBRACE') && !this.isAtEnd()) {
      update = this.expression();
    }

    if (hasParen) {
      this.consume('RPAREN', "ফর লুপ হেডার শেষে ')' প্রত্যাশিত");
    }

    const body = this.statement();

    return {
      type: 'ForStmt',
      init,
      condition,
      update,
      body,
      loc: this.mergeLoc(startTok.loc, body.loc),
    };
  }

  private printStatement(): PrintStmtNode {
    const startTok = this.previous();
    const hasParen = this.match('LPAREN');
    const expressions: ExpressionNode[] = [];

    if (!this.check('RPAREN') && !this.check('SEMICOLON') && !this.check('RBRACE') && !this.isAtEnd()) {
      do {
        expressions.push(this.expression());
      } while (this.match('COMMA'));
    }

    if (hasParen) {
      this.consume('RPAREN', "কও(...) আর্গুমেন্ট শেষে ')' প্রত্যাশিত");
    }

    this.consumeOptionalSemicolon();

    return {
      type: 'PrintStmt',
      expressions,
      loc: this.mergeLoc(startTok.loc, expressions[expressions.length - 1]?.loc || startTok.loc),
    };
  }

  private inputStatement(): InputStmtNode {
    const startTok = this.previous();
    const hasParen = this.match('LPAREN');
    let prompt: string | undefined;

    const idToken = this.consume('IDENTIFIER', 'ইনপুট সংরক্ষণের চলক নাম প্রত্যাশিত');

    if (this.match('COMMA')) {
      if (this.check('STRING_LITERAL')) {
        prompt = String(this.advance().literal);
      }
    }

    if (hasParen) {
      this.consume('RPAREN', "লও(...) শেষে ')' প্রত্যাশিত");
    }

    this.consumeOptionalSemicolon();

    return {
      type: 'InputStmt',
      identifier: idToken.lexeme,
      prompt,
      loc: this.mergeLoc(startTok.loc, idToken.loc),
    };
  }

  private returnStatement(): ReturnStmtNode {
    const startTok = this.previous();
    let value: ExpressionNode | undefined;

    if (!this.check('SEMICOLON') && !this.check('RBRACE') && !this.isAtEnd()) {
      value = this.expression();
    }

    this.consumeOptionalSemicolon();

    return {
      type: 'ReturnStmt',
      value,
      loc: this.mergeLoc(startTok.loc, value?.loc || startTok.loc),
    };
  }

  private breakStatement(): BreakStmtNode {
    const tok = this.previous();
    this.consumeOptionalSemicolon();
    return {
      type: 'BreakStmt',
      loc: tok.loc,
    };
  }

  private continueStatement(): ContinueStmtNode {
    const tok = this.previous();
    this.consumeOptionalSemicolon();
    return {
      type: 'ContinueStmt',
      loc: tok.loc,
    };
  }

  private blockStatement(): BlockStmtNode {
    const startLoc = this.previous().loc;
    const statements: StatementNode[] = [];

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt) {
        statements.push(stmt);
      }
    }

    const endTok = this.consume('RBRACE', "ব্লকের সমাপ্তিতে '}' প্রত্যাশিত");

    return {
      type: 'BlockStmt',
      statements,
      loc: this.mergeLoc(startLoc, endTok.loc),
    };
  }

  private expressionOrAssignmentStatement(): StatementNode {
    const expr = this.expression();

    // Check if it's an assignment like `a = 10` or `a += 5`
    if (this.match('ASSIGN') || this.match('PLUS_ASSIGN') || this.match('MINUS_ASSIGN')) {
      const opTok = this.previous();
      const op = opTok.type === 'PLUS_ASSIGN' ? '+=' : opTok.type === 'MINUS_ASSIGN' ? '-=' : '=';

      if (expr.type === 'Identifier') {
        const val = this.expression();
        this.consumeOptionalSemicolon();
        return {
          type: 'Assignment',
          identifier: expr.name,
          operator: op,
          value: val,
          loc: this.mergeLoc(expr.loc, val.loc),
        };
      } else if (expr.type === 'IndexExpr') {
        const val = this.expression();
        this.consumeOptionalSemicolon();
        return {
          type: 'Assignment',
          identifier: (expr.array as IdentifierNode).name || 'temp',
          index: expr.index,
          operator: op,
          value: val,
          loc: this.mergeLoc(expr.loc, val.loc),
        };
      } else {
        this.error(opTok, 'অবৈধ অ্যাসাইনমেন্ট টার্গেট (Invalid assignment target)');
      }
    }

    this.consumeOptionalSemicolon();

    return {
      type: 'ExpressionStmt',
      expression: expr,
      loc: expr.loc,
    };
  }

  // --- Expressions (Pratt Parser / Operator Precedence) ---

  public expression(): ExpressionNode {
    return this.logicalOr();
  }

  private logicalOr(): ExpressionNode {
    let expr = this.logicalAnd();

    while (this.match('OR')) {
      const op = this.previous();
      const right = this.logicalAnd();
      expr = {
        type: 'BinaryExpr',
        operator: '||',
        left: expr,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private logicalAnd(): ExpressionNode {
    let expr = this.equality();

    while (this.match('AND')) {
      const op = this.previous();
      const right = this.equality();
      expr = {
        type: 'BinaryExpr',
        operator: '&&',
        left: expr,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private equality(): ExpressionNode {
    let expr = this.comparison();

    while (this.match('EQ') || this.match('NEQ')) {
      const op = this.previous().type === 'EQ' ? '==' : '!=';
      const right = this.comparison();
      expr = {
        type: 'BinaryExpr',
        operator: op,
        left: expr,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private comparison(): ExpressionNode {
    let expr = this.term();

    while (this.match('LT') || this.match('LTE') || this.match('GT') || this.match('GTE')) {
      const tok = this.previous();
      let op: '<' | '<=' | '>' | '>=' = '<';
      if (tok.type === 'LTE') op = '<=';
      else if (tok.type === 'GT') op = '>';
      else if (tok.type === 'GTE') op = '>=';

      const right = this.term();
      expr = {
        type: 'BinaryExpr',
        operator: op,
        left: expr,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private term(): ExpressionNode {
    let expr = this.factor();

    while (this.match('PLUS') || this.match('MINUS')) {
      const op = this.previous().type === 'PLUS' ? '+' : '-';
      const right = this.factor();
      expr = {
        type: 'BinaryExpr',
        operator: op,
        left: expr,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private factor(): ExpressionNode {
    let expr = this.unary();

    while (this.match('STAR') || this.match('SLASH') || this.match('PERCENT')) {
      const tok = this.previous();
      const op = tok.type === 'STAR' ? '*' : tok.type === 'SLASH' ? '/' : '%';
      const right = this.unary();
      expr = {
        type: 'BinaryExpr',
        operator: op,
        left: expr,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private unary(): ExpressionNode {
    if (this.match('NOT') || this.match('MINUS') || this.match('INC') || this.match('DEC')) {
      const tok = this.previous();
      let op: '-' | '!' | '++' | '--' = '-';
      if (tok.type === 'NOT') op = '!';
      else if (tok.type === 'INC') op = '++';
      else if (tok.type === 'DEC') op = '--';

      const operand = this.unary();
      return {
        type: 'UnaryExpr',
        operator: op,
        operand,
        isPrefix: true,
        loc: this.mergeLoc(tok.loc, operand.loc),
      };
    }

    return this.postfix();
  }

  private postfix(): ExpressionNode {
    let expr = this.primary();

    while (true) {
      if (this.match('LPAREN')) {
        // Function call: foo(a, b)
        const args: ExpressionNode[] = [];
        if (!this.check('RPAREN')) {
          do {
            args.push(this.expression());
          } while (this.match('COMMA'));
        }
        const rparen = this.consume('RPAREN', "ফাংশন কলের শেষে ')' প্রত্যাশিত");

        const calleeName = expr.type === 'Identifier' ? expr.name : 'anonymous';
        expr = {
          type: 'FunctionCall',
          callee: calleeName,
          args,
          loc: this.mergeLoc(expr.loc, rparen.loc),
        } as FunctionCallNode;
      } else if (this.match('LBRACKET')) {
        // Array indexing: arr[i]
        const indexExpr = this.expression();
        const rbracket = this.consume('RBRACKET', "ইনডেক্সিং শেষে ']' প্রত্যাশিত");
        expr = {
          type: 'IndexExpr',
          array: expr,
          index: indexExpr,
          loc: this.mergeLoc(expr.loc, rbracket.loc),
        };
      } else if (this.match('INC') || this.match('DEC')) {
        const op = this.previous().type === 'INC' ? '++' : '--';
        expr = {
          type: 'UnaryExpr',
          operator: op,
          operand: expr,
          isPrefix: false,
          loc: this.mergeLoc(expr.loc, this.previous().loc),
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): ExpressionNode {
    if (this.match('KW_TRUE')) {
      const tok = this.previous();
      return {
        type: 'Literal',
        value: true,
        raw: tok.lexeme,
        dataType: 'bool',
        loc: tok.loc,
      };
    }

    if (this.match('KW_FALSE')) {
      const tok = this.previous();
      return {
        type: 'Literal',
        value: false,
        raw: tok.lexeme,
        dataType: 'bool',
        loc: tok.loc,
      };
    }

    if (this.match('KW_NULL')) {
      const tok = this.previous();
      return {
        type: 'Literal',
        value: null,
        raw: tok.lexeme,
        dataType: 'void',
        loc: tok.loc,
      };
    }

    if (this.match('NUMBER_LITERAL')) {
      const tok = this.previous();
      const val = tok.literal as number;
      const isFloat = !Number.isInteger(val);
      return {
        type: 'Literal',
        value: val,
        raw: tok.lexeme,
        dataType: isFloat ? 'float' : 'int',
        loc: tok.loc,
      };
    }

    if (this.match('STRING_LITERAL')) {
      const tok = this.previous();
      return {
        type: 'Literal',
        value: tok.literal as string,
        raw: tok.lexeme,
        dataType: 'string',
        loc: tok.loc,
      };
    }

    if (this.match('IDENTIFIER')) {
      const tok = this.previous();
      return {
        type: 'Identifier',
        name: tok.lexeme,
        loc: tok.loc,
      };
    }

    if (this.match('LBRACKET')) {
      // Array literal [1, 2, 3]
      const startLoc = this.previous().loc;
      const elements: ExpressionNode[] = [];
      if (!this.check('RBRACKET')) {
        do {
          elements.push(this.expression());
        } while (this.match('COMMA'));
      }
      const endTok = this.consume('RBRACKET', "তালিকা শেষে ']' প্রত্যাশিত");
      return {
        type: 'ArrayLiteral',
        elements,
        dataType: 'array',
        loc: this.mergeLoc(startLoc, endTok.loc),
      };
    }

    if (this.match('LPAREN')) {
      const expr = this.expression();
      this.consume('RPAREN', "গ্রুপিং এক্সপ্রেশনের শেষে ')' প্রত্যাশিত");
      return expr;
    }

    const currentTok = this.peek();
    this.error(currentTok, `অপ্রত্যাশিত টোকেন '${currentTok.lexeme}' (Unexpected token in expression)`);
    this.advance(); // Advance past the bad token
    return {
      type: 'Literal',
      value: 0,
      raw: '0',
      dataType: 'int',
      loc: currentTok.loc,
    };
  }

  // Helper utilities
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current] || this.tokens[this.tokens.length - 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1] || this.tokens[0];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    this.error(this.peek(), message);
    return this.peek();
  }

  private consumeOptionalSemicolon(): void {
    if (this.check('SEMICOLON')) {
      this.advance();
    }
  }

  private error(token: Token, message: string): void {
    this.diagnostics.push({
      severity: 'error',
      message,
      loc: token.loc,
      stage: 'parser',
    });
  }

  // Panic mode error recovery: skip tokens until a statement boundary
  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === 'SEMICOLON') return;

      switch (this.peek().type) {
        case 'KW_FUNCTION':
        case 'KW_VAR':
        case 'KW_CONST':
        case 'KW_FOR':
        case 'KW_IF':
        case 'KW_WHILE':
        case 'KW_PRINT':
        case 'KW_RETURN':
        case 'RBRACE':
          return;
      }

      this.advance();
    }
  }

  private mergeLoc(loc1: SourceLocation, loc2: SourceLocation): SourceLocation {
    const startOffset = Math.min(loc1.offset, loc2.offset);
    const endOffset = Math.max(loc1.offset + loc1.length, loc2.offset + loc2.length);
    return {
      line: loc1.line,
      column: loc1.column,
      offset: startOffset,
      length: endOffset - startOffset,
    };
  }
}
