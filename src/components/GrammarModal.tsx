/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DIALECT_DICTIONARY } from '../compiler/dialect_mapper';
import { BookOpen, X, Sparkles, FileText, Globe } from 'lucide-react';

interface GrammarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrammarModal: React.FC<GrammarModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'keywords' | 'ebnf' | 'phonetics'>('keywords');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 font-mono">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden text-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                SYLHETILANG GRAMMAR & DIALECT SPECIFICATION
              </h2>
              <p className="text-[10px] text-slate-400">
                Formal EBNF Grammar, Keywords Lexicon & Phonetic Mappings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-1 px-4 py-1.5 bg-slate-950/60 border-b border-slate-800 text-[11px] shrink-0">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'keywords' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Keywords Lexicon
          </button>
          <button
            onClick={() => setActiveTab('ebnf')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'ebnf' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            EBNF Grammar
          </button>
          <button
            onClick={() => setActiveTab('phonetics')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'phonetics' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Phonetics Guide
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-3 overflow-auto text-xs">
          {activeTab === 'keywords' && (
            <div className="space-y-2">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="pb-1 pl-1">SYLHETI FORM</th>
                    <th className="pb-1">STANDARD BANGLA</th>
                    <th className="pb-1">ROMANIZED PHONETIC</th>
                    <th className="pb-1">ENGLISH EQUIVALENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {DIALECT_DICTIONARY.map((dict, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 text-slate-300 text-[11px]">
                      <td className="py-1 pl-1 font-bold text-amber-300">{dict.sylheti}</td>
                      <td className="py-1 text-emerald-400">{dict.bangla}</td>
                      <td className="py-1 text-cyan-300">{dict.phonetic}</td>
                      <td className="py-1 text-slate-400">{dict.english}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ebnf' && (
            <div className="space-y-2 font-mono text-xs text-slate-300">
              <pre className="p-3 bg-slate-950 rounded border border-slate-800 whitespace-pre-wrap leading-5 text-[11px] text-slate-200">
{`// SylhetiLang Formal EBNF Grammar Specification

Program       ::= Statement* EOF ;

Statement     ::= VarDecl
                | Assignment
                | IfStmt
                | WhileStmt
                | ForStmt
                | PrintStmt
                | InputStmt
                | FunctionDecl
                | ReturnStmt
                | BreakStmt
                | ContinueStmt
                | BlockStmt
                | ExpressionStmt ;

VarDecl       ::= ("ধরি" | "রাখইন" | "dhori") IDENTIFIER (":" Type)? ("=" Expression)? (";" | "।")? ;
ConstDecl     ::= ("ধ্রুবক" | "একদম" | "dhrubok") IDENTIFIER (":" Type)? "=" Expression (";" | "।")? ;

Assignment    ::= IDENTIFIER ("[" Expression "]")? ("=" | "+=" | "-=") Expression (";" | "।")? ;

IfStmt        ::= ("যদি" | "zodi") ("(" Expression ")" | Expression) Statement
                  (("অথবা_যদি" | "othoba_zodi") ("(" Expression ")" | Expression) Statement)*
                  (("নইলে" | "noile") Statement)? ;

WhileStmt     ::= ("যতক্ষণ" | "jotokkhon") ("(" Expression ")" | Expression) Statement ;

ForStmt       ::= ("ঘুরো" | "ghuro") "(" (VarDecl | Assignment | ";") Expression? ";" Expression? ")" Statement ;

PrintStmt     ::= ("কও" | "dekhao" | "ছাপাও") ("(" Expression ("," Expression)* ")" | Expression+) (";" | "।")? ;

FunctionDecl  ::= ("কাম" | "ফাংশন" | "kaam") IDENTIFIER "(" (IDENTIFIER (":" Type)? ("," IDENTIFIER (":" Type)?)*)? ")" (":" Type)? BlockStmt ;

ReturnStmt    ::= ("ফেরত" | "ferot" | "দেও") Expression? (";" | "।")? ;

Expression    ::= LogicalOr ;
LogicalOr     ::= LogicalAnd ( ("||" | "বা" | "অথবা") LogicalAnd )* ;
LogicalAnd    ::= Equality ( ("&&" | "আর" | "এবং") Equality )* ;
Equality      ::= Comparison ( ("==" | "!=" | "সমান" | "অসমান") Comparison )* ;
Comparison    ::= Term ( ("<" | "<=" | ">" | ">=" | "কম" | "বেশি") Term )* ;
Term          ::= Factor ( ("+" | "-" | "যোগ" | "বিয়োগ") Factor )* ;
Factor        ::= Unary ( ("*" | "/" | "%" | "গুণ" | "ভাগ" | "ভাগশেষ") Unary )* ;
Unary         ::= ("!" | "-" | "++" | "--" | "না") Unary | Primary ;
Primary       ::= NUMBER | STRING | IDENTIFIER | BOOLEAN | ArrayLiteral | "(" Expression ")" ;`}
              </pre>
            </div>
          )}

          {activeTab === 'phonetics' && (
            <div className="space-y-2 text-xs leading-relaxed text-slate-300">
              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1.5">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Phonetic Rules & Phonological Distinctiveness:
                </h3>
                <p className="text-[11px]">
                  Sylheti language dialect variations handled by the multi-layered token mapping engine:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  <li><strong>&apos;জ&apos; and &apos;য&apos; &rarr; &apos;Z&apos; sound:</strong> &apos;যদি&apos; mapped to &apos;zodi&apos;.</li>
                  <li><strong>&apos;ছ&apos; and &apos;স&apos; &rarr; &apos;S&apos; / &apos;H&apos; sound:</strong> &apos;সত্য&apos; mapped to &apos;হাছা (Hasa)&apos;.</li>
                  <li><strong>Print Statement:</strong> Regional variant &apos;কও (Kwa)&apos; or &apos;কও দেহি&apos;.</li>
                  <li><strong>Loop construct:</strong> Regional &apos;ঘুরো (Ghuro)&apos; or &apos;বারবার (Bar Bar)&apos;.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
