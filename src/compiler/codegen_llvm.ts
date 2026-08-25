/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ExpressionNode,
  ProgramNode,
  StatementNode,
} from './types';

export interface LLVMTargetConfig {
  triple: string;
  dataLayout: string;
  name: string;
}

export const LLVM_TARGETS: Record<string, LLVMTargetConfig> = {
  'x86_64-linux': {
    name: 'Linux x86_64 (Cloud Native / Server)',
    triple: 'x86_64-pc-linux-gnu',
    dataLayout: 'e-m:e-p270:32:32-p271:32:32-p272:64:64-i64:64-f80:128-n8:16:32:64-S128',
  },
  'arm64-darwin': {
    name: 'Apple Silicon ARM64 (macOS / iOS)',
    triple: 'arm64-apple-darwin',
    dataLayout: 'e-m:o-i64:64-i128:128-n32:64-S128',
  },
  'wasm32': {
    name: 'WebAssembly (WASM32 Browser VM)',
    triple: 'wasm32-unknown-unknown',
    dataLayout: 'e-m:e-p:32:32-i64:64-n32:64-S128',
  },
};

export class LLVMIRGenerator {
  private target: LLVMTargetConfig;
  private stringConstants: { id: string; value: string; length: number }[] = [];
  private regCounter = 1;
  private labelCounter = 1;
  private varTypes = new Map<string, string>();
  private currentFunction = 'main';

  constructor(targetKey = 'x86_64-linux') {
    this.target = LLVM_TARGETS[targetKey] || LLVM_TARGETS['x86_64-linux'];
  }

  public generate(ast: ProgramNode): string {
    this.stringConstants = [];
    this.regCounter = 1;
    this.labelCounter = 1;
    this.varTypes.clear();

    const functionDecls: string[] = [];
    const mainBodyLines: string[] = [];

    // Separate function declarations from top-level script statements
    const customFunctions: StatementNode[] = [];
    const mainStatements: StatementNode[] = [];

    for (const stmt of ast.body) {
      if (stmt.type === 'FunctionDecl') {
        customFunctions.push(stmt);
      } else {
        mainStatements.push(stmt);
      }
    }

    // Generate custom functions first
    for (const funcStmt of customFunctions) {
      if (funcStmt.type === 'FunctionDecl') {
        this.currentFunction = funcStmt.name;
        this.regCounter = 1;
        const funcLines: string[] = [];

        // Parameter signature
        const paramSignatures = funcStmt.params.map((p) => {
          const type = p.type === 'float' ? 'double' : p.type === 'string' ? 'i8*' : 'i32';
          this.varTypes.set(p.name, type);
          return `${type} %${p.name}.param`;
        });

        const retType = funcStmt.returnType === 'float' ? 'double' : funcStmt.returnType === 'void' ? 'void' : 'i32';

        funcLines.push(`define ${retType} @${funcStmt.name}(${paramSignatures.join(', ')}) {`);
        funcLines.push(`entry:`);

        // Allocate memory for params
        for (const p of funcStmt.params) {
          const type = p.type === 'float' ? 'double' : 'i32';
          funcLines.push(`  %${p.name} = alloca ${type}, align 4`);
          funcLines.push(`  store ${type} %${p.name}.param, ${type}* %${p.name}, align 4`);
        }

        // Generate function body
        for (const s of funcStmt.body.statements) {
          funcLines.push(...this.generateStatement(s));
        }

        // Default return if not explicitly returned
        if (retType === 'void') {
          funcLines.push(`  ret void`);
        } else {
          funcLines.push(`  ret ${retType} 0`);
        }

        funcLines.push(`}`);
        functionDecls.push(funcLines.join('\n'));
      }
    }

    // Generate main function
    this.currentFunction = 'main';
    this.regCounter = 1;
    mainBodyLines.push(`define i32 @main() {`);
    mainBodyLines.push(`entry:`);

    for (const stmt of mainStatements) {
      mainBodyLines.push(...this.generateStatement(stmt));
    }

    mainBodyLines.push(`  ret i32 0`);
    mainBodyLines.push(`}`);

    // Build header and global strings
    const header: string[] = [
      `; ModuleID = 'SylhetiLang_App'`,
      `source_filename = "program.syl"`,
      `target datalayout = "${this.target.dataLayout}"`,
      `target triple = "${this.target.triple}"`,
      ``,
      `; Standard Library Format Strings & Externals`,
      `@.str_int_fmt = private unnamed_addr constant [4 x i8] c"%d\\0A\\00", align 1`,
      `@.str_float_fmt = private unnamed_addr constant [4 x i8] c"%f\\0A\\00", align 1`,
      `@.str_str_fmt = private unnamed_addr constant [4 x i8] c"%s\\0A\\00", align 1`,
      `@.str_scan_int = private unnamed_addr constant [3 x i8] c"%d\\00", align 1`,
      ``,
    ];

    // String constants
    for (const sc of this.stringConstants) {
      const escaped = sc.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      header.push(`@${sc.id} = private unnamed_addr constant [${sc.length} x i8] c"${escaped}\\00", align 1`);
    }

    if (this.stringConstants.length > 0) {
      header.push(``);
    }

    // External declarations
    header.push(`declare i32 @printf(i8*, ...)`);
    header.push(`declare i32 @scanf(i8*, ...)`);
    header.push(`declare i32 @puts(i8*)`);
    header.push(``);

    return [...header, ...functionDecls, '', ...mainBodyLines].join('\n');
  }

  private newReg(): string {
    return `%${this.regCounter++}`;
  }

  private newLabel(prefix = 'label'): string {
    return `${prefix}.${this.labelCounter++}`;
  }

  private addStringConstant(str: string): string {
    const id = `.str.${this.stringConstants.length + 1}`;
    const byteLength = new TextEncoder().encode(str).length + 1;
    this.stringConstants.push({ id, value: str, length: byteLength });
    return id;
  }

  private generateStatement(stmt: StatementNode): string[] {
    const lines: string[] = [];

    switch (stmt.type) {
      case 'VarDecl': {
        const type = stmt.dataType === 'float' ? 'double' : 'i32';
        this.varTypes.set(stmt.identifier, type);
        lines.push(`  %${stmt.identifier} = alloca ${type}, align 4`);

        if (stmt.init) {
          const { reg: initReg, type: exprType, preLines } = this.generateExpression(stmt.init);
          lines.push(...preLines);
          lines.push(`  store ${exprType} ${initReg}, ${exprType}* %${stmt.identifier}, align 4`);
        }
        break;
      }

      case 'Assignment': {
        const type = this.varTypes.get(stmt.identifier) || 'i32';
        const { reg: valReg, type: exprType, preLines } = this.generateExpression(stmt.value);
        lines.push(...preLines);

        if (stmt.operator === '+=') {
          const loadReg = this.newReg();
          const addReg = this.newReg();
          lines.push(`  ${loadReg} = load ${type}, ${type}* %${stmt.identifier}, align 4`);
          lines.push(`  ${addReg} = add nsw ${type} ${loadReg}, ${valReg}`);
          lines.push(`  store ${type} ${addReg}, ${type}* %${stmt.identifier}, align 4`);
        } else if (stmt.operator === '-=') {
          const loadReg = this.newReg();
          const subReg = this.newReg();
          lines.push(`  ${loadReg} = load ${type}, ${type}* %${stmt.identifier}, align 4`);
          lines.push(`  ${subReg} = sub nsw ${type} ${loadReg}, ${valReg}`);
          lines.push(`  store ${type} ${subReg}, ${type}* %${stmt.identifier}, align 4`);
        } else {
          lines.push(`  store ${exprType} ${valReg}, ${type}* %${stmt.identifier}, align 4`);
        }
        break;
      }

      case 'IfStmt': {
        const { reg: condReg, preLines } = this.generateExpression(stmt.condition);
        lines.push(...preLines);

        const thenLabel = this.newLabel('then');
        const elseLabel = this.newLabel('else');
        const mergeLabel = this.newLabel('ifcont');

        if (stmt.alternate) {
          lines.push(`  br i1 ${condReg}, label %${thenLabel}, label %${elseLabel}`);

          lines.push(`${thenLabel}:`);
          lines.push(...this.generateStatement(stmt.consequent));
          lines.push(`  br label %${mergeLabel}`);

          lines.push(`${elseLabel}:`);
          lines.push(...this.generateStatement(stmt.alternate));
          lines.push(`  br label %${mergeLabel}`);

          lines.push(`${mergeLabel}:`);
        } else {
          lines.push(`  br i1 ${condReg}, label %${thenLabel}, label %${mergeLabel}`);

          lines.push(`${thenLabel}:`);
          lines.push(...this.generateStatement(stmt.consequent));
          lines.push(`  br label %${mergeLabel}`);

          lines.push(`${mergeLabel}:`);
        }
        break;
      }

      case 'WhileStmt': {
        const condLabel = this.newLabel('while.cond');
        const bodyLabel = this.newLabel('while.body');
        const endLabel = this.newLabel('while.end');

        lines.push(`  br label %${condLabel}`);
        lines.push(`${condLabel}:`);

        const { reg: condReg, preLines } = this.generateExpression(stmt.condition);
        lines.push(...preLines);
        lines.push(`  br i1 ${condReg}, label %${bodyLabel}, label %${endLabel}`);

        lines.push(`${bodyLabel}:`);
        lines.push(...this.generateStatement(stmt.body));
        lines.push(`  br label %${condLabel}`);

        lines.push(`${endLabel}:`);
        break;
      }

      case 'ForStmt': {
        const condLabel = this.newLabel('for.cond');
        const bodyLabel = this.newLabel('for.body');
        const stepLabel = this.newLabel('for.step');
        const endLabel = this.newLabel('for.end');

        if (stmt.init) {
          lines.push(...this.generateStatement(stmt.init));
        }

        lines.push(`  br label %${condLabel}`);
        lines.push(`${condLabel}:`);

        if (stmt.condition) {
          const { reg: condReg, preLines } = this.generateExpression(stmt.condition);
          lines.push(...preLines);
          lines.push(`  br i1 ${condReg}, label %${bodyLabel}, label %${endLabel}`);
        } else {
          lines.push(`  br label %${bodyLabel}`);
        }

        lines.push(`${bodyLabel}:`);
        lines.push(...this.generateStatement(stmt.body));
        lines.push(`  br label %${stepLabel}`);

        lines.push(`${stepLabel}:`);
        if (stmt.update) {
          if ('type' in stmt.update && typeof stmt.update.type === 'string') {
            if (stmt.update.type === 'Assignment' || stmt.update.type === 'ExpressionStmt') {
              lines.push(...this.generateStatement(stmt.update as StatementNode));
            } else {
              const { preLines } = this.generateExpression(stmt.update as ExpressionNode);
              lines.push(...preLines);
            }
          }
        }
        lines.push(`  br label %${condLabel}`);

        lines.push(`${endLabel}:`);
        break;
      }

      case 'PrintStmt': {
        for (const expr of stmt.expressions) {
          const { reg: valReg, type: exprType, preLines } = this.generateExpression(expr);
          lines.push(...preLines);

          const callReg = this.newReg();
          if (exprType === 'i32') {
            lines.push(`  ${callReg} = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.str_int_fmt, i32 0, i32 0), i32 ${valReg})`);
          } else if (exprType === 'double') {
            lines.push(`  ${callReg} = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.str_float_fmt, i32 0, i32 0), double ${valReg})`);
          } else if (exprType === 'i8*') {
            lines.push(`  ${callReg} = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.str_str_fmt, i32 0, i32 0), i8* ${valReg})`);
          } else if (exprType === 'i1') {
            const zextReg = this.newReg();
            lines.push(`  ${zextReg} = zext i1 ${valReg} to i32`);
            lines.push(`  ${callReg} = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.str_int_fmt, i32 0, i32 0), i32 ${zextReg})`);
          }
        }
        break;
      }

      case 'ReturnStmt': {
        if (stmt.value) {
          const { reg: valReg, type: exprType, preLines } = this.generateExpression(stmt.value);
          lines.push(...preLines);
          lines.push(`  ret ${exprType} ${valReg}`);
        } else {
          lines.push(`  ret void`);
        }
        break;
      }

      case 'BlockStmt': {
        for (const s of stmt.statements) {
          lines.push(...this.generateStatement(s));
        }
        break;
      }

      case 'ExpressionStmt': {
        const { preLines } = this.generateExpression(stmt.expression);
        lines.push(...preLines);
        break;
      }
    }

    return lines;
  }

  private generateExpression(expr: ExpressionNode): { reg: string; type: string; preLines: string[] } {
    const preLines: string[] = [];

    switch (expr.type) {
      case 'Literal': {
        if (expr.dataType === 'int') {
          return { reg: String(expr.value), type: 'i32', preLines };
        }
        if (expr.dataType === 'float') {
          return { reg: String(expr.value), type: 'double', preLines };
        }
        if (expr.dataType === 'bool') {
          return { reg: expr.value ? '1' : '0', type: 'i1', preLines };
        }
        if (expr.dataType === 'string') {
          const strId = this.addStringConstant(String(expr.value));
          const byteLen = new TextEncoder().encode(String(expr.value)).length + 1;
          const reg = this.newReg();
          preLines.push(`  ${reg} = getelementptr inbounds [${byteLen} x i8], [${byteLen} x i8]* @${strId}, i32 0, i32 0`);
          return { reg, type: 'i8*', preLines };
        }
        return { reg: '0', type: 'i32', preLines };
      }

      case 'Identifier': {
        const type = this.varTypes.get(expr.name) || 'i32';
        const reg = this.newReg();
        preLines.push(`  ${reg} = load ${type}, ${type}* %${expr.name}, align 4`);
        return { reg, type, preLines };
      }

      case 'BinaryExpr': {
        const left = this.generateExpression(expr.left);
        const right = this.generateExpression(expr.right);
        preLines.push(...left.preLines, ...right.preLines);

        const resReg = this.newReg();
        const type = left.type === 'double' || right.type === 'double' ? 'double' : 'i32';

        switch (expr.operator) {
          case '+':
            preLines.push(`  ${resReg} = add nsw ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type, preLines };
          case '-':
            preLines.push(`  ${resReg} = sub nsw ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type, preLines };
          case '*':
            preLines.push(`  ${resReg} = mul nsw ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type, preLines };
          case '/':
            preLines.push(`  ${resReg} = sdiv ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type, preLines };
          case '%':
            preLines.push(`  ${resReg} = srem ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type, preLines };
          case '==':
            preLines.push(`  ${resReg} = icmp eq ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type: 'i1', preLines };
          case '!=':
            preLines.push(`  ${resReg} = icmp ne ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type: 'i1', preLines };
          case '<':
            preLines.push(`  ${resReg} = icmp slt ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type: 'i1', preLines };
          case '>':
            preLines.push(`  ${resReg} = icmp sgt ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type: 'i1', preLines };
          case '<=':
            preLines.push(`  ${resReg} = icmp sle ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type: 'i1', preLines };
          case '>=':
            preLines.push(`  ${resReg} = icmp sge ${type} ${left.reg}, ${right.reg}`);
            return { reg: resReg, type: 'i1', preLines };
          case '&&':
            preLines.push(`  ${resReg} = and i1 ${left.reg}, ${right.reg}`);
            return { reg: resReg, type: 'i1', preLines };
          case '||':
            preLines.push(`  ${resReg} = or i1 ${left.reg}, ${right.reg}`);
            return { reg: resReg, type: 'i1', preLines };
        }

        return { reg: '0', type: 'i32', preLines };
      }

      case 'UnaryExpr': {
        const op = this.generateExpression(expr.operand);
        preLines.push(...op.preLines);
        const resReg = this.newReg();

        if (expr.operator === '-') {
          preLines.push(`  ${resReg} = sub nsw i32 0, ${op.reg}`);
          return { reg: resReg, type: 'i32', preLines };
        }
        if (expr.operator === '!') {
          preLines.push(`  ${resReg} = xor i1 ${op.reg}, 1`);
          return { reg: resReg, type: 'i1', preLines };
        }
        if (expr.operator === '++' && expr.operand.type === 'Identifier') {
          preLines.push(`  ${resReg} = add nsw i32 ${op.reg}, 1`);
          preLines.push(`  store i32 ${resReg}, i32* %${expr.operand.name}, align 4`);
          return { reg: resReg, type: 'i32', preLines };
        }
        if (expr.operator === '--' && expr.operand.type === 'Identifier') {
          preLines.push(`  ${resReg} = sub nsw i32 ${op.reg}, 1`);
          preLines.push(`  store i32 ${resReg}, i32* %${expr.operand.name}, align 4`);
          return { reg: resReg, type: 'i32', preLines };
        }
        return op;
      }

      case 'FunctionCall': {
        const argResults = expr.args.map((a) => this.generateExpression(a));
        for (const ar of argResults) {
          preLines.push(...ar.preLines);
        }
        const formattedArgs = argResults.map((ar) => `${ar.type} ${ar.reg}`).join(', ');
        const resReg = this.newReg();
        preLines.push(`  ${resReg} = call i32 @${expr.callee}(${formattedArgs})`);
        return { reg: resReg, type: 'i32', preLines };
      }

      default:
        return { reg: '0', type: 'i32', preLines };
    }
  }
}
