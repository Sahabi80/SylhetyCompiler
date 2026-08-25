/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ExpressionNode,
  ProgramNode,
  StatementNode,
} from './types';

export interface ExecutionFrame {
  functionName: string;
  variables: Record<string, any>;
  line: number;
}

export interface DebugPauseInfo {
  line: number;
  statementType: string;
  callStack: ExecutionFrame[];
  variables: Record<string, any>;
  globals: Record<string, any>;
  totalSteps: number;
  stdout: string[];
}

export type DebugAction = 'continue' | 'step' | 'stop';
export type PauseHandler = (info: DebugPauseInfo) => Promise<DebugAction>;

export interface InterpreterOutput {
  stdout: string[];
  executionTimeMs: number;
  totalSteps: number;
  callStack: ExecutionFrame[];
  error?: string;
  isStopped?: boolean;
}

export type InputProvider = (promptText: string) => Promise<string>;

class ReturnValue {
  constructor(public value: any) {}
}

class BreakSignal {}
class ContinueSignal {}
class StopExecutionSignal {}

export class Interpreter {
  private stdout: string[] = [];
  private totalSteps = 0;
  private maxSteps = 50000;
  private globals: Record<string, any> = {};
  private functions = new Map<string, StatementNode & { type: 'FunctionDecl' }>();
  private inputProvider?: InputProvider;
  private callStack: ExecutionFrame[] = [];
  private breakpoints: Set<number> = new Set();
  private onPause?: PauseHandler;
  private isStepping = false;
  private isTerminated = false;

  constructor(inputProvider?: InputProvider, breakpoints?: Set<number> | number[], onPause?: PauseHandler) {
    this.inputProvider = inputProvider;
    if (breakpoints) {
      this.breakpoints = new Set(breakpoints);
    }
    this.onPause = onPause;
    this.initBuiltins();
  }

  public setBreakpoints(breakpoints: Set<number> | number[]): void {
    this.breakpoints = new Set(breakpoints);
  }

  public addBreakpoint(line: number): void {
    this.breakpoints.add(line);
  }

  public removeBreakpoint(line: number): void {
    this.breakpoints.delete(line);
  }

  public clearBreakpoints(): void {
    this.breakpoints.clear();
  }

  public setPauseHandler(handler: PauseHandler | undefined): void {
    this.onPause = handler;
  }

  public setStepping(stepping: boolean): void {
    this.isStepping = stepping;
  }

  public stop(): void {
    this.isTerminated = true;
  }

  private initBuiltins(): void {
    this.globals['দৈর্ঘ্য'] = (obj: any) => (obj ? obj.length : 0);
    this.globals['len'] = (obj: any) => (obj ? obj.length : 0);
    this.globals['বর্গমূল'] = (val: number) => Math.sqrt(Number(val));
    this.globals['sqrt'] = (val: number) => Math.sqrt(Number(val));
    this.globals['পরমমান'] = (val: number) => Math.abs(Number(val));
    this.globals['abs'] = (val: number) => Math.abs(Number(val));
    this.globals['পূর্ণসংখ্যা'] = (val: any) => parseInt(val, 10) || 0;
    this.globals['int'] = (val: any) => parseInt(val, 10) || 0;
  }

  public async run(
    ast: ProgramNode,
    breakpoints?: Set<number>,
    onPause?: PauseHandler
  ): Promise<InterpreterOutput> {
    this.stdout = [];
    this.totalSteps = 0;
    this.globals = {};
    this.functions.clear();
    this.callStack = [];
    this.isStepping = false;
    this.isTerminated = false;
    if (breakpoints) {
      this.breakpoints = new Set(breakpoints);
    }
    if (onPause) {
      this.onPause = onPause;
    }
    this.initBuiltins();

    const startTime = performance.now();

    // Register all top-level functions first
    for (const stmt of ast.body) {
      if (stmt.type === 'FunctionDecl') {
        this.functions.set(stmt.name, stmt);
      }
    }

    try {
      this.pushFrame('global', this.globals, 1);
      for (const stmt of ast.body) {
        if (stmt.type !== 'FunctionDecl') {
          await this.executeStatement(stmt, this.globals);
        }
      }
      this.popFrame();

      const elapsed = performance.now() - startTime;
      return {
        stdout: this.stdout,
        executionTimeMs: Math.round(elapsed * 100) / 100,
        totalSteps: this.totalSteps,
        callStack: this.callStack,
      };
    } catch (err: any) {
      const elapsed = performance.now() - startTime;
      if (err instanceof StopExecutionSignal) {
        return {
          stdout: this.stdout,
          executionTimeMs: Math.round(elapsed * 100) / 100,
          totalSteps: this.totalSteps,
          callStack: this.callStack,
          isStopped: true,
        };
      }
      return {
        stdout: this.stdout,
        executionTimeMs: Math.round(elapsed * 100) / 100,
        totalSteps: this.totalSteps,
        callStack: this.callStack,
        error: err?.message || String(err),
      };
    }
  }

  private extractVariables(env: Record<string, any>): Record<string, any> {
    const vars: Record<string, any> = {};
    const builtinNames = new Set(['দৈর্ঘ্য', 'len', 'বর্গমূল', 'sqrt', 'পরমমান', 'abs', 'পূর্ণসংখ্যা', 'int']);

    let current: any = env;
    while (current && current !== Object.prototype) {
      for (const key of Object.getOwnPropertyNames(current)) {
        if (!(key in vars)) {
          const val = current[key];
          if (typeof val !== 'function' || !builtinNames.has(key)) {
            vars[key] = val;
          }
        }
      }
      current = Object.getPrototypeOf(current);
    }
    return vars;
  }

  private async checkBreakpoint(stmt: StatementNode, env: Record<string, any>): Promise<void> {
    if (this.isTerminated) {
      throw new StopExecutionSignal();
    }
    const isBp = this.breakpoints.has(stmt.loc.line);
    if ((isBp || this.isStepping) && this.onPause) {
      const currentVars = this.extractVariables(env);
      if (this.callStack.length > 0) {
        this.callStack[this.callStack.length - 1].line = stmt.loc.line;
        this.callStack[this.callStack.length - 1].variables = { ...currentVars };
      }

      const pauseInfo: DebugPauseInfo = {
        line: stmt.loc.line,
        statementType: stmt.type,
        callStack: this.callStack.map((f) => ({
          functionName: f.functionName,
          line: f.line,
          variables: { ...f.variables },
        })),
        variables: currentVars,
        globals: this.extractVariables(this.globals),
        totalSteps: this.totalSteps,
        stdout: [...this.stdout],
      };

      const action = await this.onPause(pauseInfo);
      if (action === 'step') {
        this.isStepping = true;
      } else if (action === 'continue') {
        this.isStepping = false;
      } else if (action === 'stop') {
        throw new StopExecutionSignal();
      }
    }
  }

  private pushFrame(name: string, vars: Record<string, any>, line: number): void {
    this.callStack.push({
      functionName: name,
      variables: { ...vars },
      line,
    });
  }

  private popFrame(): void {
    this.callStack.pop();
  }

  private step(line: number): void {
    this.totalSteps++;
    if (this.totalSteps > this.maxSteps) {
      throw new Error(`সর্বোচ্চ ধাপ সীমা অতিক্রম করেছে (${this.maxSteps} steps limit reached - Possible Infinite Loop)`);
    }
    if (this.callStack.length > 0) {
      this.callStack[this.callStack.length - 1].line = line;
    }
  }

  private async executeStatement(stmt: StatementNode, env: Record<string, any>): Promise<any> {
    this.step(stmt.loc.line);
    await this.checkBreakpoint(stmt, env);

    switch (stmt.type) {
      case 'VarDecl': {
        const val = stmt.init ? await this.evaluateExpression(stmt.init, env) : undefined;
        env[stmt.identifier] = val;
        break;
      }

      case 'Assignment': {
        const val = await this.evaluateExpression(stmt.value, env);
        if (stmt.index) {
          const arr = env[stmt.identifier];
          const idx = await this.evaluateExpression(stmt.index, env);
          if (Array.isArray(arr)) {
            arr[idx] = val;
          }
        } else if (stmt.operator === '+=') {
          env[stmt.identifier] = (env[stmt.identifier] || 0) + val;
        } else if (stmt.operator === '-=') {
          env[stmt.identifier] = (env[stmt.identifier] || 0) - val;
        } else {
          env[stmt.identifier] = val;
        }
        break;
      }

      case 'IfStmt': {
        const cond = await this.evaluateExpression(stmt.condition, env);
        if (this.isTruthy(cond)) {
          await this.executeStatement(stmt.consequent, env);
        } else if (stmt.alternate) {
          await this.executeStatement(stmt.alternate, env);
        }
        break;
      }

      case 'WhileStmt': {
        while (this.isTruthy(await this.evaluateExpression(stmt.condition, env))) {
          try {
            await this.executeStatement(stmt.body, env);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        break;
      }

      case 'ForStmt': {
        const loopEnv = Object.create(env);
        if (stmt.init) {
          await this.executeStatement(stmt.init, loopEnv);
        }

        while (true) {
          if (stmt.condition) {
            const cond = await this.evaluateExpression(stmt.condition, loopEnv);
            if (!this.isTruthy(cond)) break;
          }

          try {
            await this.executeStatement(stmt.body, loopEnv);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) {
              // continue to update
            } else {
              throw e;
            }
          }

          if (stmt.update) {
            if ('type' in stmt.update && typeof stmt.update.type === 'string') {
              if (stmt.update.type === 'Assignment' || stmt.update.type === 'ExpressionStmt') {
                await this.executeStatement(stmt.update as StatementNode, loopEnv);
              } else {
                await this.evaluateExpression(stmt.update as ExpressionNode, loopEnv);
              }
            }
          }
        }
        break;
      }

      case 'BlockStmt': {
        const blockEnv = Object.create(env);
        for (const s of stmt.statements) {
          await this.executeStatement(s, blockEnv);
        }
        // Copy back modified variables to parent env
        for (const key of Object.keys(blockEnv)) {
          if (key in env) {
            env[key] = blockEnv[key];
          }
        }
        break;
      }

      case 'PrintStmt': {
        const values: string[] = [];
        for (const expr of stmt.expressions) {
          const val = await this.evaluateExpression(expr, env);
          if (val === true) values.push('হাছা (true)');
          else if (val === false) values.push('মিছা (false)');
          else if (val === null) values.push('খালি (null)');
          else if (typeof val === 'object') values.push(JSON.stringify(val));
          else values.push(String(val));
        }
        this.stdout.push(values.join(' '));
        break;
      }

      case 'InputStmt': {
        let inputVal = '';
        if (this.inputProvider) {
          inputVal = await this.inputProvider(stmt.prompt || `লও (${stmt.identifier}): `);
        } else {
          inputVal = '0';
        }

        // Auto convert to number if numeric
        if (!isNaN(Number(inputVal)) && inputVal.trim() !== '') {
          env[stmt.identifier] = Number(inputVal);
        } else {
          env[stmt.identifier] = inputVal;
        }
        break;
      }

      case 'ReturnStmt': {
        const val = stmt.value ? await this.evaluateExpression(stmt.value, env) : undefined;
        throw new ReturnValue(val);
      }

      case 'BreakStmt':
        throw new BreakSignal();

      case 'ContinueStmt':
        throw new ContinueSignal();

      case 'ExpressionStmt':
        await this.evaluateExpression(stmt.expression, env);
        break;
    }
  }

  private async evaluateExpression(expr: ExpressionNode, env: Record<string, any>): Promise<any> {
    switch (expr.type) {
      case 'Literal':
        return expr.value;

      case 'Identifier': {
        if (expr.name in env) {
          return env[expr.name];
        }
        if (expr.name in this.globals) {
          return this.globals[expr.name];
        }
        throw new Error(`চলক '${expr.name}' খুঁজে পাওয়া যায়নি (Variable not defined)`);
      }

      case 'BinaryExpr': {
        const left = await this.evaluateExpression(expr.left, env);
        const right = await this.evaluateExpression(expr.right, env);

        switch (expr.operator) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            if (right === 0) throw new Error('শূন্য দিয়ে ভাগ করা অবৈধ (Division by zero)');
            return left / right;
          case '%':
            if (right === 0) throw new Error('শূন্য দিয়ে ভাগশেষ নির্ণয় অবৈধ (Modulo by zero)');
            return left % right;
          case '==':
            return left === right;
          case '!=':
            return left !== right;
          case '<':
            return left < right;
          case '>':
            return left > right;
          case '<=':
            return left <= right;
          case '>=':
            return left >= right;
          case '&&':
            return this.isTruthy(left) && this.isTruthy(right);
          case '||':
            return this.isTruthy(left) || this.isTruthy(right);
        }
        return null;
      }

      case 'UnaryExpr': {
        const opVal = await this.evaluateExpression(expr.operand, env);
        if (expr.operator === '-') return -opVal;
        if (expr.operator === '!') return !this.isTruthy(opVal);
        if (expr.operator === '++') {
          const newVal = Number(opVal) + 1;
          if (expr.operand.type === 'Identifier') {
            env[expr.operand.name] = newVal;
          }
          return expr.isPrefix ? newVal : opVal;
        }
        if (expr.operator === '--') {
          const newVal = Number(opVal) - 1;
          if (expr.operand.type === 'Identifier') {
            env[expr.operand.name] = newVal;
          }
          return expr.isPrefix ? newVal : opVal;
        }
        return opVal;
      }

      case 'FunctionCall': {
        const funcDecl = this.functions.get(expr.callee);
        const builtin = this.globals[expr.callee];

        const argValues: any[] = [];
        for (const arg of expr.args) {
          argValues.push(await this.evaluateExpression(arg, env));
        }

        if (builtin && typeof builtin === 'function') {
          return builtin(...argValues);
        }

        if (!funcDecl) {
          throw new Error(`ফাংশন '${expr.callee}' খুঁজে পাওয়া যায়নি (Undefined function)`);
        }

        // Call user-defined function
        const funcEnv: Record<string, any> = {};
        funcDecl.params.forEach((param, idx) => {
          funcEnv[param.name] = argValues[idx];
        });

        this.pushFrame(funcDecl.name, funcEnv, funcDecl.loc.line);
        try {
          await this.executeStatement(funcDecl.body, funcEnv);
          this.popFrame();
          return undefined;
        } catch (e) {
          this.popFrame();
          if (e instanceof ReturnValue) {
            return e.value;
          }
          throw e;
        }
      }

      case 'ArrayLiteral': {
        const elements: any[] = [];
        for (const el of expr.elements) {
          elements.push(await this.evaluateExpression(el, env));
        }
        return elements;
      }

      case 'IndexExpr': {
        const arr = await this.evaluateExpression(expr.array, env);
        const idx = await this.evaluateExpression(expr.index, env);
        if (!Array.isArray(arr) && typeof arr !== 'string') {
          throw new Error('ইনডেক্সিং শুধুমাত্র তালিকা অথবা বাক্যে সম্ভব');
        }
        return arr[idx];
      }
    }
  }

  private isTruthy(val: any): boolean {
    return Boolean(val);
  }
}
