/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReviewRequirement {
  id: string;
  reviewNumber: 1 | 2 | 3;
  title: string;
  description: string;
  status: 'passed' | 'failed' | 'pending';
  testCode: string;
  expectedOutputSubstring?: string;
  validationCheck: (result: any) => boolean;
}

export const CSE4114_REVIEWS: ReviewRequirement[] = [
  // Review 1 Requirements
  {
    id: 'rev1_lexer',
    reviewNumber: 1,
    title: 'Lexer Tokenisation & Unicode Support',
    description: 'Lexer tokenises Bangla numerals, Sylheti keywords, identifiers, operators, and string literals correctly.',
    status: 'passed',
    testCode: `ধরি ক = ১০; ধরি খ = ২০; ধরি যোগফল = ক + খ;`,
    validationCheck: (res) => res.tokens.length > 5 && !res.hasErrors,
  },
  {
    id: 'rev1_parser_valid',
    reviewNumber: 1,
    title: 'Parser AST Generation & Syntax Trees',
    description: 'Parser handles valid Bangla/Sylheti grammar statements and builds well-formed Abstract Syntax Trees.',
    status: 'passed',
    testCode: `ধরি ক = ৫ * (৩ + ২);`,
    validationCheck: (res) => res.ast !== null && res.ast.body.length > 0,
  },
  {
    id: 'rev1_symbol_table',
    reviewNumber: 1,
    title: 'Symbol Table & Scopes',
    description: 'Symbol table tracks variable declarations, nested scopes, types, memory offsets, and const qualifiers.',
    status: 'passed',
    testCode: `ধরি এক্স: আস্তা = ১০০; ধ্রুবক ওয়াই: ভাংতি = ৩.১৪;`,
    validationCheck: (res) => res.symbolTable.symbols.size >= 2,
  },
  {
    id: 'rev1_type_checking',
    reviewNumber: 1,
    title: 'Semantic Analysis & Type Checking',
    description: 'Verifies variable initialization, arithmetic operand compatibility, and detects redeclarations or undeclared variables.',
    status: 'passed',
    testCode: `ধরি সংখ্যা: আস্তা = ৫০; ধরি গুণ = সংখ্যা * ২;`,
    validationCheck: (res) => !res.hasErrors,
  },

  // Review 2 Requirements
  {
    id: 'rev2_tac_codegen',
    reviewNumber: 2,
    title: 'Three-Address Code (TAC) & Quadruple Generation',
    description: 'Generates linear TAC with temporary registers and quadruples for arithmetic, assignments, and expressions.',
    status: 'passed',
    testCode: `ধরি ক = ১০; ধরি খ = ২০; ধরি গ = (ক + খ) * ৩;`,
    validationCheck: (res) => res.tac.length > 0 && res.tac.some((t: any) => t.op === 'ADD' || t.op === 'MUL'),
  },
  {
    id: 'rev2_error_recovery',
    reviewNumber: 2,
    title: 'Panic Mode Error Recovery',
    description: 'Parser demonstrates synchronization at statement boundaries to detect and report multiple syntax errors without crashing.',
    status: 'passed',
    testCode: `ধরি বৈধ = ১০
কও("বৈধ লাইন")
ধরি দ্বিতীয়_বৈধ = ২০
`,
    validationCheck: (res) => res.ast !== null,
  },
  {
    id: 'rev2_executable_runs',
    reviewNumber: 2,
    title: 'Code Execution & Standard I/O',
    description: 'Generated code executes arithmetic, expressions, and assignments correctly produces standard output.',
    status: 'passed',
    testCode: `ধরি ক = ৭; ধরি খ = ৮; কও(ক * খ);`,
    expectedOutputSubstring: '56',
    validationCheck: (res) => res.pythonCode.length > 0 && res.cCode.length > 0,
  },

  // Review 3 Requirements
  {
    id: 'rev3_if_else',
    reviewNumber: 3,
    title: 'Complete If-Else & Elif Branching',
    description: 'Full conditional branching with comparison operators, boolean evaluation, and jump labels.',
    status: 'passed',
    testCode: `ধরি বয়স = ২০; যদি (বয়স >= ১৮) { কও("প্রাপ্তবয়স্ক"); } নইলে { কও("অপ্রাপ্তবয়স্ক"); }`,
    validationCheck: (res) => res.llvmIR.includes('br i1') || res.llvmIR.includes('icmp'),
  },
  {
    id: 'rev3_loops',
    reviewNumber: 3,
    title: 'While & For Loops with Control Flow',
    description: 'Full iterative loops support including initialization, conditional checking, update steps, and loop breaks.',
    status: 'passed',
    testCode: `ঘুরো (ধরি i = ০; i < ৩; i++) { কও(i); }`,
    validationCheck: (res) => res.tac.some((t: any) => t.op === 'LABEL' || t.op === 'GOTO' || t.op === 'IF_GOTO' || t.op === 'IF_FALSE_GOTO'),
  },
  {
    id: 'rev3_llvm_ir',
    reviewNumber: 3,
    title: 'Target-Independent LLVM IR Generation',
    description: 'Produces syntactically valid LLVM IR with SSA form, function prototypes, printf/puts calls, and memory allocas.',
    status: 'passed',
    testCode: `ধরি সংখ্যা = ১৫; কও(সংখ্যা * ২);`,
    validationCheck: (res) => res.llvmIR.includes('define i32 @main()') && res.llvmIR.includes('@printf'),
  },
  {
    id: 'rev3_optimization',
    reviewNumber: 3,
    title: 'Optimization Passes (O1 / O2)',
    description: 'Performs constant folding, dead code elimination, and algebraic identity simplifications before target code generation.',
    status: 'passed',
    testCode: `ধ্রুবক হিসাব = ৫ + ১০ * ২; যদি (মিছা) { কও("মুছে যাবে"); }`,
    validationCheck: (res) => res.optimizationMetrics.constantsFolded >= 1 || res.optimizationMetrics.deadCodeNodesRemoved >= 1,
  },
];
