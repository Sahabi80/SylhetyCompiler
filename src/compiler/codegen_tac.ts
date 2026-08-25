/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BasicBlock,
  ControlFlowGraph,
  ExpressionNode,
  ProgramNode,
  StatementNode,
  TACInstruction,
} from './types';

export class TACGenerator {
  private instructions: TACInstruction[] = [];
  private tempCounter = 0;
  private labelCounter = 0;
  private instCounter = 0;

  public generate(ast: ProgramNode): {
    tac: TACInstruction[];
    cfg: ControlFlowGraph;
  } {
    this.instructions = [];
    this.tempCounter = 0;
    this.labelCounter = 0;
    this.instCounter = 0;

    for (const stmt of ast.body) {
      this.generateStatement(stmt);
    }

    const cfg = this.buildControlFlowGraph(this.instructions);

    return {
      tac: this.instructions,
      cfg,
    };
  }

  private newTemp(): string {
    return `t${this.tempCounter++}`;
  }

  private newLabel(prefix = 'L'): string {
    return `${prefix}_${this.labelCounter++}`;
  }

  private emit(op: string, arg1?: string, arg2?: string, result?: string, comment?: string): TACInstruction {
    const inst: TACInstruction = {
      id: this.instCounter++,
      op,
      arg1,
      arg2,
      result,
      comment,
    };
    this.instructions.push(inst);
    return inst;
  }

  private generateStatement(stmt: StatementNode): void {
    switch (stmt.type) {
      case 'VarDecl': {
        if (stmt.init) {
          const valTemp = this.generateExpression(stmt.init);
          this.emit('ASSIGN', valTemp, undefined, stmt.identifier, `var ${stmt.identifier}`);
        } else {
          this.emit('ALLOC', undefined, undefined, stmt.identifier, `declare ${stmt.identifier}`);
        }
        break;
      }

      case 'Assignment': {
        const valTemp = this.generateExpression(stmt.value);
        if (stmt.index) {
          const idxTemp = this.generateExpression(stmt.index);
          this.emit('ARRAY_STORE', valTemp, idxTemp, stmt.identifier);
        } else if (stmt.operator === '+=') {
          const t = this.newTemp();
          this.emit('ADD', stmt.identifier, valTemp, t);
          this.emit('ASSIGN', t, undefined, stmt.identifier);
        } else if (stmt.operator === '-=') {
          const t = this.newTemp();
          this.emit('SUB', stmt.identifier, valTemp, t);
          this.emit('ASSIGN', t, undefined, stmt.identifier);
        } else {
          this.emit('ASSIGN', valTemp, undefined, stmt.identifier);
        }
        break;
      }

      case 'IfStmt': {
        const condTemp = this.generateExpression(stmt.condition);
        const thenLabel = this.newLabel('then');
        const elseLabel = this.newLabel('else');
        const endLabel = this.newLabel('endif');

        if (stmt.alternate) {
          this.emit('IF_GOTO', condTemp, undefined, thenLabel, 'branch if true');
          this.emit('GOTO', undefined, undefined, elseLabel, 'branch if false');

          this.emit('LABEL', undefined, undefined, thenLabel);
          this.generateStatement(stmt.consequent);
          this.emit('GOTO', undefined, undefined, endLabel);

          this.emit('LABEL', undefined, undefined, elseLabel);
          this.generateStatement(stmt.alternate);

          this.emit('LABEL', undefined, undefined, endLabel);
        } else {
          this.emit('IF_FALSE_GOTO', condTemp, undefined, endLabel, 'skip if false');
          this.generateStatement(stmt.consequent);
          this.emit('LABEL', undefined, undefined, endLabel);
        }
        break;
      }

      case 'WhileStmt': {
        const startLabel = this.newLabel('while_start');
        const bodyLabel = this.newLabel('while_body');
        const endLabel = this.newLabel('while_end');

        this.emit('LABEL', undefined, undefined, startLabel);
        const condTemp = this.generateExpression(stmt.condition);
        this.emit('IF_GOTO', condTemp, undefined, bodyLabel);
        this.emit('GOTO', undefined, undefined, endLabel);

        this.emit('LABEL', undefined, undefined, bodyLabel);
        this.generateStatement(stmt.body);
        this.emit('GOTO', undefined, undefined, startLabel);

        this.emit('LABEL', undefined, undefined, endLabel);
        break;
      }

      case 'ForStmt': {
        const startLabel = this.newLabel('for_cond');
        const bodyLabel = this.newLabel('for_body');
        const endLabel = this.newLabel('for_end');

        if (stmt.init) {
          this.generateStatement(stmt.init);
        }

        this.emit('LABEL', undefined, undefined, startLabel);
        if (stmt.condition) {
          const condTemp = this.generateExpression(stmt.condition);
          this.emit('IF_FALSE_GOTO', condTemp, undefined, endLabel);
        }

        this.emit('LABEL', undefined, undefined, bodyLabel);
        this.generateStatement(stmt.body);

        if (stmt.update) {
          if ('type' in stmt.update && typeof stmt.update.type === 'string') {
            if (stmt.update.type === 'Assignment' || stmt.update.type === 'ExpressionStmt') {
              this.generateStatement(stmt.update as StatementNode);
            } else {
              this.generateExpression(stmt.update as ExpressionNode);
            }
          }
        }

        this.emit('GOTO', undefined, undefined, startLabel);
        this.emit('LABEL', undefined, undefined, endLabel);
        break;
      }

      case 'BlockStmt': {
        for (const s of stmt.statements) {
          this.generateStatement(s);
        }
        break;
      }

      case 'PrintStmt': {
        for (const expr of stmt.expressions) {
          const t = this.generateExpression(expr);
          this.emit('PARAM', t);
          this.emit('CALL', 'print', '1');
        }
        break;
      }

      case 'InputStmt': {
        if (stmt.prompt) {
          this.emit('PARAM', `"${stmt.prompt}"`);
          this.emit('CALL', 'print', '1');
        }
        const t = this.newTemp();
        this.emit('CALL', 'input', '0', t);
        this.emit('ASSIGN', t, undefined, stmt.identifier);
        break;
      }

      case 'FunctionDecl': {
        this.emit('FUNC_START', undefined, undefined, stmt.name);
        for (const param of stmt.params) {
          this.emit('PARAM_DECL', undefined, undefined, param.name);
        }
        this.generateStatement(stmt.body);
        this.emit('FUNC_END', undefined, undefined, stmt.name);
        break;
      }

      case 'ReturnStmt': {
        if (stmt.value) {
          const t = this.generateExpression(stmt.value);
          this.emit('RETURN', t);
        } else {
          this.emit('RETURN');
        }
        break;
      }

      case 'BreakStmt':
        this.emit('BREAK');
        break;

      case 'ContinueStmt':
        this.emit('CONTINUE');
        break;

      case 'ExpressionStmt':
        this.generateExpression(stmt.expression);
        break;
    }
  }

  private generateExpression(expr: ExpressionNode): string {
    switch (expr.type) {
      case 'Literal': {
        if (typeof expr.value === 'string') {
          return `"${expr.value}"`;
        }
        return String(expr.value);
      }

      case 'Identifier':
        return expr.name;

      case 'BinaryExpr': {
        const left = this.generateExpression(expr.left);
        const right = this.generateExpression(expr.right);
        const res = this.newTemp();

        let opName = 'OP';
        switch (expr.operator) {
          case '+':
            opName = 'ADD';
            break;
          case '-':
            opName = 'SUB';
            break;
          case '*':
            opName = 'MUL';
            break;
          case '/':
            opName = 'DIV';
            break;
          case '%':
            opName = 'MOD';
            break;
          case '==':
            opName = 'EQ';
            break;
          case '!=':
            opName = 'NEQ';
            break;
          case '<':
            opName = 'LT';
            break;
          case '>':
            opName = 'GT';
            break;
          case '<=':
            opName = 'LTE';
            break;
          case '>=':
            opName = 'GTE';
            break;
          case '&&':
            opName = 'AND';
            break;
          case '||':
            opName = 'OR';
            break;
        }

        this.emit(opName, left, right, res);
        return res;
      }

      case 'UnaryExpr': {
        const operand = this.generateExpression(expr.operand);
        const res = this.newTemp();
        if (expr.operator === '-') {
          this.emit('NEG', operand, undefined, res);
        } else if (expr.operator === '!') {
          this.emit('NOT', operand, undefined, res);
        } else if (expr.operator === '++') {
          this.emit('ADD', operand, '1', res);
          if (expr.operand.type === 'Identifier') {
            this.emit('ASSIGN', res, undefined, expr.operand.name);
          }
        } else if (expr.operator === '--') {
          this.emit('SUB', operand, '1', res);
          if (expr.operand.type === 'Identifier') {
            this.emit('ASSIGN', res, undefined, expr.operand.name);
          }
        }
        return res;
      }

      case 'FunctionCall': {
        const argTemps = expr.args.map((a) => this.generateExpression(a));
        for (const arg of argTemps) {
          this.emit('PARAM', arg);
        }
        const res = this.newTemp();
        this.emit('CALL', expr.callee, String(argTemps.length), res);
        return res;
      }

      case 'ArrayLiteral': {
        const res = this.newTemp();
        this.emit('ARRAY_INIT', String(expr.elements.length), undefined, res);
        expr.elements.forEach((el, i) => {
          const val = this.generateExpression(el);
          this.emit('ARRAY_STORE', val, String(i), res);
        });
        return res;
      }

      case 'IndexExpr': {
        const arr = this.generateExpression(expr.array);
        const idx = this.generateExpression(expr.index);
        const res = this.newTemp();
        this.emit('ARRAY_LOAD', arr, idx, res);
        return res;
      }
    }
  }

  private buildControlFlowGraph(tac: TACInstruction[]): ControlFlowGraph {
    if (tac.length === 0) {
      return {
        blocks: [],
        entryBlockId: 'entry',
        exitBlockId: 'exit',
      };
    }

    // Identify Leaders
    const leaders = new Set<number>();
    leaders.add(0); // First instruction is a leader

    for (let i = 0; i < tac.length; i++) {
      const inst = tac[i];
      if (['GOTO', 'IF_GOTO', 'IF_FALSE_GOTO', 'RETURN', 'FUNC_START', 'FUNC_END'].includes(inst.op)) {
        if (i + 1 < tac.length) {
          leaders.add(i + 1); // Instruction after branch is a leader
        }
      }
      if (inst.op === 'LABEL' || inst.op === 'FUNC_START') {
        leaders.add(i); // Target of branch is a leader
      }
    }

    // Partition into basic blocks
    const leaderArray = Array.from(leaders).sort((a, b) => a - b);
    const blocks: BasicBlock[] = [];

    for (let j = 0; j < leaderArray.length; j++) {
      const startIdx = leaderArray[j];
      const endIdx = j + 1 < leaderArray.length ? leaderArray[j + 1] : tac.length;
      const blockInsts = tac.slice(startIdx, endIdx);
      const labelInst = blockInsts.find((i) => i.op === 'LABEL' || i.op === 'FUNC_START');
      const labelName = labelInst?.result || `B${j}`;

      blocks.push({
        id: `block_${j}`,
        label: labelName,
        instructions: blockInsts,
        predecessors: [],
        successors: [],
      });
    }

    // Connect edges (Predecessors & Successors)
    for (let k = 0; k < blocks.length; k++) {
      const block = blocks[k];
      const lastInst = block.instructions[block.instructions.length - 1];

      if (!lastInst) continue;

      if (lastInst.op === 'GOTO') {
        const targetBlock = blocks.find((b) => b.label === lastInst.result);
        if (targetBlock) {
          block.successors.push(targetBlock.id);
          targetBlock.predecessors.push(block.id);
        }
      } else if (lastInst.op === 'IF_GOTO' || lastInst.op === 'IF_FALSE_GOTO') {
        const targetBlock = blocks.find((b) => b.label === lastInst.result);
        if (targetBlock) {
          block.successors.push(targetBlock.id);
          targetBlock.predecessors.push(block.id);
        }
        // Fallthrough
        if (k + 1 < blocks.length) {
          const nextBlock = blocks[k + 1];
          block.successors.push(nextBlock.id);
          nextBlock.predecessors.push(block.id);
        }
      } else if (lastInst.op !== 'RETURN' && lastInst.op !== 'FUNC_END') {
        // Fallthrough to next block
        if (k + 1 < blocks.length) {
          const nextBlock = blocks[k + 1];
          block.successors.push(nextBlock.id);
          nextBlock.predecessors.push(block.id);
        }
      }
    }

    return {
      blocks,
      entryBlockId: blocks[0]?.id || 'entry',
      exitBlockId: blocks[blocks.length - 1]?.id || 'exit',
    };
  }
}
