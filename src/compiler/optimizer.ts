/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AssignmentNode,
  BinaryExprNode,
  BlockStmtNode,
  ExpressionNode,
  ForStmtNode,
  FunctionDeclNode,
  IfStmtNode,
  LiteralNode,
  OptimizationMetrics,
  ProgramNode,
  StatementNode,
  UnaryExprNode,
  VarDeclNode,
  WhileStmtNode,
} from './types';

export class ASTOptimizer {
  private constantsFolded = 0;
  private deadCodeRemoved = 0;
  private subexpressionsEliminated = 0;
  private knownConstants = new Map<string, number | string | boolean>();

  public optimize(ast: ProgramNode): {
    optimizedAst: ProgramNode;
    metrics: OptimizationMetrics;
  } {
    this.constantsFolded = 0;
    this.deadCodeRemoved = 0;
    this.subexpressionsEliminated = 0;
    this.knownConstants.clear();

    const originalCount = this.countNodes(ast);
    const optimizedBody = this.optimizeStatements(ast.body);

    const optimizedAst: ProgramNode = {
      ...ast,
      body: optimizedBody,
    };

    const optimizedCount = this.countNodes(optimizedAst);

    return {
      optimizedAst,
      metrics: {
        originalNodeCount: originalCount,
        optimizedNodeCount: optimizedCount,
        constantsFolded: this.constantsFolded,
        deadCodeNodesRemoved: this.deadCodeRemoved,
        subexpressionsEliminated: this.subexpressionsEliminated,
        loopsOptimized: 0,
      },
    };
  }

  private countNodes(node: any): number {
    if (!node || typeof node !== 'object') return 0;
    let count = 1;

    for (const key of Object.keys(node)) {
      const val = node[key];
      if (Array.isArray(val)) {
        for (const item of val) {
          count += this.countNodes(item);
        }
      } else if (val && typeof val === 'object' && 'type' in val) {
        count += this.countNodes(val);
      }
    }
    return count;
  }

  private optimizeStatements(stmts: StatementNode[]): StatementNode[] {
    const result: StatementNode[] = [];
    let hasReturned = false;

    for (const stmt of stmts) {
      if (hasReturned) {
        // Dead code elimination after return
        this.deadCodeRemoved++;
        continue;
      }

      const optStmt = this.optimizeStatement(stmt);
      if (optStmt) {
        result.push(optStmt);
        if (optStmt.type === 'ReturnStmt') {
          hasReturned = true;
        }
      }
    }

    return result;
  }

  private optimizeStatement(stmt: StatementNode): StatementNode | null {
    switch (stmt.type) {
      case 'VarDecl': {
        const init = stmt.init ? this.optimizeExpression(stmt.init) : undefined;
        if (stmt.isConst && init && init.type === 'Literal' && typeof init.value !== 'object') {
          this.knownConstants.set(stmt.identifier, init.value as any);
        }
        return {
          ...stmt,
          init,
        };
      }

      case 'Assignment': {
        const val = this.optimizeExpression(stmt.value);
        return {
          ...stmt,
          value: val,
        };
      }

      case 'IfStmt': {
        const cond = this.optimizeExpression(stmt.condition);

        // Constant condition evaluation
        if (cond.type === 'Literal') {
          if (cond.value === true || (typeof cond.value === 'number' && cond.value !== 0)) {
            // Always true: keep only consequent
            this.deadCodeRemoved++;
            return this.optimizeStatement(stmt.consequent);
          } else if (cond.value === false || cond.value === 0 || cond.value === null) {
            // Always false: keep only alternate
            this.deadCodeRemoved++;
            if (stmt.alternate) {
              return this.optimizeStatement(stmt.alternate);
            }
            return null; // Entire if is removed
          }
        }

        const cons = this.optimizeStatement(stmt.consequent) || {
          type: 'BlockStmt',
          statements: [],
          loc: stmt.loc,
        };
        const alt = stmt.alternate ? this.optimizeStatement(stmt.alternate) || undefined : undefined;

        return {
          ...stmt,
          condition: cond,
          consequent: cons,
          alternate: alt,
        };
      }

      case 'WhileStmt': {
        const cond = this.optimizeExpression(stmt.condition);
        if (cond.type === 'Literal' && (cond.value === false || cond.value === 0)) {
          this.deadCodeRemoved++;
          return null; // Loop never executes
        }
        const body = this.optimizeStatement(stmt.body) || {
          type: 'BlockStmt',
          statements: [],
          loc: stmt.loc,
        };
        return {
          ...stmt,
          condition: cond,
          body,
        };
      }

      case 'ForStmt': {
        const init = stmt.init ? this.optimizeStatement(stmt.init) || undefined : undefined;
        const cond = stmt.condition ? this.optimizeExpression(stmt.condition) : undefined;
        const body = this.optimizeStatement(stmt.body) || {
          type: 'BlockStmt',
          statements: [],
          loc: stmt.loc,
        };
        return {
          ...stmt,
          init,
          condition: cond,
          body,
        };
      }

      case 'BlockStmt': {
        const stmts = this.optimizeStatements(stmt.statements);
        return {
          ...stmt,
          statements: stmts,
        };
      }

      case 'FunctionDecl': {
        const body = this.optimizeStatement(stmt.body) as BlockStmtNode;
        return {
          ...stmt,
          body: body || stmt.body,
        };
      }

      case 'ReturnStmt': {
        const val = stmt.value ? this.optimizeExpression(stmt.value) : undefined;
        return {
          ...stmt,
          value: val,
        };
      }

      case 'PrintStmt': {
        const exprs = stmt.expressions.map((e) => this.optimizeExpression(e));
        return {
          ...stmt,
          expressions: exprs,
        };
      }

      default:
        return stmt;
    }
  }

  private optimizeExpression(expr: ExpressionNode): ExpressionNode {
    switch (expr.type) {
      case 'BinaryExpr': {
        const left = this.optimizeExpression(expr.left);
        const right = this.optimizeExpression(expr.right);

        // Constant folding
        if (left.type === 'Literal' && right.type === 'Literal') {
          const lVal = left.value;
          const rVal = right.value;

          if (typeof lVal === 'number' && typeof rVal === 'number') {
            let foldedVal: number | boolean | null = null;
            switch (expr.operator) {
              case '+':
                foldedVal = lVal + rVal;
                break;
              case '-':
                foldedVal = lVal - rVal;
                break;
              case '*':
                foldedVal = lVal * rVal;
                break;
              case '/':
                if (rVal !== 0) foldedVal = lVal / rVal;
                break;
              case '%':
                if (rVal !== 0) foldedVal = lVal % rVal;
                break;
              case '==':
                foldedVal = lVal === rVal;
                break;
              case '!=':
                foldedVal = lVal !== rVal;
                break;
              case '<':
                foldedVal = lVal < rVal;
                break;
              case '>':
                foldedVal = lVal > rVal;
                break;
              case '<=':
                foldedVal = lVal <= rVal;
                break;
              case '>=':
                foldedVal = lVal >= rVal;
                break;
            }

            if (foldedVal !== null) {
              this.constantsFolded++;
              const isBool = typeof foldedVal === 'boolean';
              const isFloat = !isBool && !Number.isInteger(foldedVal);
              return {
                type: 'Literal',
                value: foldedVal,
                raw: String(foldedVal),
                dataType: isBool ? 'bool' : isFloat ? 'float' : 'int',
                loc: expr.loc,
              };
            }
          }

          if (typeof lVal === 'string' && typeof rVal === 'string' && expr.operator === '+') {
            this.constantsFolded++;
            return {
              type: 'Literal',
              value: lVal + rVal,
              raw: `"${lVal + rVal}"`,
              dataType: 'string',
              loc: expr.loc,
            };
          }
        }

        // Algebraic Simplifications
        // x + 0 -> x, 0 + x -> x
        if (expr.operator === '+' && right.type === 'Literal' && right.value === 0) {
          this.constantsFolded++;
          return left;
        }
        if (expr.operator === '+' && left.type === 'Literal' && left.value === 0) {
          this.constantsFolded++;
          return right;
        }

        // x * 1 -> x, 1 * x -> x
        if (expr.operator === '*' && right.type === 'Literal' && right.value === 1) {
          this.constantsFolded++;
          return left;
        }
        if (expr.operator === '*' && left.type === 'Literal' && left.value === 1) {
          this.constantsFolded++;
          return right;
        }

        // x * 0 -> 0, 0 * x -> 0
        if (expr.operator === '*' && ((right.type === 'Literal' && right.value === 0) || (left.type === 'Literal' && left.value === 0))) {
          this.constantsFolded++;
          return {
            type: 'Literal',
            value: 0,
            raw: '0',
            dataType: 'int',
            loc: expr.loc,
          };
        }

        return {
          ...expr,
          left,
          right,
        };
      }

      case 'UnaryExpr': {
        const operand = this.optimizeExpression(expr.operand);

        if (operand.type === 'Literal') {
          if (expr.operator === '-' && typeof operand.value === 'number') {
            this.constantsFolded++;
            return {
              type: 'Literal',
              value: -operand.value,
              raw: String(-operand.value),
              dataType: operand.dataType,
              loc: expr.loc,
            };
          }
          if (expr.operator === '!' && typeof operand.value === 'boolean') {
            this.constantsFolded++;
            return {
              type: 'Literal',
              value: !operand.value,
              raw: String(!operand.value),
              dataType: 'bool',
              loc: expr.loc,
            };
          }
        }

        return {
          ...expr,
          operand,
        };
      }

      case 'Identifier': {
        if (this.knownConstants.has(expr.name)) {
          const val = this.knownConstants.get(expr.name)!;
          this.subexpressionsEliminated++;
          const isBool = typeof val === 'boolean';
          const isFloat = typeof val === 'number' && !Number.isInteger(val);
          return {
            type: 'Literal',
            value: val,
            raw: String(val),
            dataType: isBool ? 'bool' : typeof val === 'string' ? 'string' : isFloat ? 'float' : 'int',
            loc: expr.loc,
          };
        }
        return expr;
      }

      case 'FunctionCall': {
        const args = expr.args.map((a) => this.optimizeExpression(a));
        return {
          ...expr,
          args,
        };
      }

      default:
        return expr;
    }
  }
}
