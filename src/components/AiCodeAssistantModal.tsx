/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  X,
  Zap,
  BookOpen,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Code2,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';
import { DialectType } from '../compiler/dialect_mapper';

export type AiAssistantMode = 'explain' | 'optimize';

interface AiCodeAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCode: string;
  fullCode: string;
  currentDialect: DialectType;
  initialMode?: AiAssistantMode;
  onApplyOptimization?: (replacementCode: string) => void;
}

export const AiCodeAssistantModal: React.FC<AiCodeAssistantModalProps> = ({
  isOpen,
  onClose,
  selectedCode,
  fullCode,
  currentDialect,
  initialMode = 'explain',
  onApplyOptimization,
}) => {
  const [mode, setMode] = useState<AiAssistantMode>(initialMode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);

  // Sync mode with initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setAnalysisText('');
      setSuggestedCode(null);
      setError(null);
      setApplied(false);
      fetchAnalysis(initialMode);
    }
  }, [isOpen, initialMode, selectedCode]);

  const targetSnippet = selectedCode.trim() ? selectedCode : fullCode;

  const fetchAnalysis = async (targetMode: AiAssistantMode) => {
    if (!targetSnippet.trim()) {
      setError('বিশ্লেষণের জন্য কোনো কোড পাওয়া যায়নি। কোড এডিটরে কিছু কোড লিখুন বা সিলেক্ট করুন।');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisText('');
    setSuggestedCode(null);
    setApplied(false);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codeSnippet: targetSnippet,
          fullCode: fullCode,
          dialect: currentDialect,
          mode: targetMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze code with Gemini.');
      }

      setAnalysisText(data.analysis || '');
      setSuggestedCode(data.suggestedCode || null);
    } catch (err: any) {
      console.error('Error fetching Gemini AI response:', err);
      setError(err?.message || 'Gemini API থেকে উত্তর পেতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: AiAssistantMode) => {
    if (newMode === mode && analysisText) return;
    setMode(newMode);
    fetchAnalysis(newMode);
  };

  const handleCopyText = () => {
    if (!analysisText) return;
    navigator.clipboard.writeText(analysisText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyCode = () => {
    if (!suggestedCode) return;
    navigator.clipboard.writeText(suggestedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApply = () => {
    if (!suggestedCode || !onApplyOptimization) return;
    onApplyOptimization(suggestedCode);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  const isSelectionMode = Boolean(selectedCode.trim() && selectedCode.trim() !== fullCode.trim());
  const lineCount = targetSnippet.split('\n').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden font-mono text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                  <span>Gemini AI কোড সহকারী</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded border border-emerald-800/80">
                    Gemini 3.7 Flash
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                {isSelectionMode ? (
                  <span>সিলেক্ট করা কোড ব্লক ({lineCount} লাইন) বিশ্লেষণ করা হচ্ছে</span>
                ) : (
                  <span>সম্পূর্ণ প্রোগ্রাম কোড ({lineCount} লাইন) বিশ্লেষণ করা হচ্ছে</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAnalysis(mode)}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded border border-slate-700 text-xs transition-colors cursor-pointer"
              title="পুনরায় বিশ্লেষণ চালান"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => handleModeChange('explain')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${
                mode === 'explain'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>কোড ব্যাখ্যা (Explain Code)</span>
            </button>
            <button
              onClick={() => handleModeChange('optimize')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${
                mode === 'optimize'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>লজিক অপ্টিমাইজেশন (Optimize Logic)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>উপভাষা: {currentDialect === 'bangla' ? 'বাংলা' : 'সিলেটি'}</span>
            </span>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Target Code Snippet Collapsible / Preview */}
          <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>বিশ্লেষিত কোড স্নিপেট ({lineCount} লাইন)</span>
              </span>
              <span className="text-[10px] text-slate-500">{targetSnippet.length} characters</span>
            </div>
            <pre className="p-3 text-[11px] text-emerald-300/90 font-mono bg-slate-950/60 overflow-x-auto max-h-32 leading-relaxed selection:bg-emerald-900 selection:text-white">
              {targetSnippet}
            </pre>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-lg text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-rose-300">ত্রুটি (Error)</p>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">{error}</p>
                <button
                  onClick={() => fetchAnalysis(mode)}
                  className="mt-2 text-[11px] px-2.5 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-100 rounded font-medium transition-colors"
                >
                  আবার চেষ্টা করুন
                </button>
              </div>
            </div>
          )}

          {/* Loading Shimmer State */}
          {isLoading && (
            <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                <span>
                  {mode === 'explain'
                    ? 'Gemini 3.7 Flash কোডের গঠন ও লজিক ধাপে ধাপে বিশ্লেষণ করছে...'
                    : 'Gemini 3.7 Flash অ্যালগরিদমিক অপ্টিমাইজেশন ও জটিলতা হিসাব করছে...'}
                </span>
              </div>
              <div className="space-y-2.5 pt-1">
                <div className="h-3.5 bg-slate-800/70 rounded w-5/6 animate-pulse"></div>
                <div className="h-3.5 bg-slate-800/70 rounded w-full animate-pulse"></div>
                <div className="h-3.5 bg-slate-800/70 rounded w-4/6 animate-pulse"></div>
                <div className="h-20 bg-slate-900/80 border border-slate-800 rounded animate-pulse"></div>
                <div className="h-3.5 bg-slate-800/70 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Suggested Optimized Code Replacement Card (When in Optimize mode & code is generated) */}
          {!isLoading && mode === 'optimize' && suggestedCode && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-800/70 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>প্রস্তাবিত অপ্টিমাইজড কোড (Suggested Replacement)</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px] transition-colors"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'কপি হয়েছে' : 'কোড কপি'}</span>
                  </button>
                  {onApplyOptimization && (
                    <button
                      onClick={handleApply}
                      disabled={applied}
                      className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-emerald-600 text-white rounded text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      {applied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>এডিটরে প্রয়োগ সম্পন্ন!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>এডিটরে প্রতিস্থাপন করুন</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded border border-amber-800/60 bg-slate-950 overflow-hidden">
                <pre className="p-3 text-[11px] text-amber-200 font-mono overflow-x-auto leading-relaxed">
                  {suggestedCode}
                </pre>
              </div>
            </div>
          )}

          {/* Gemini AI Detailed Markdown Explanation */}
          {!isLoading && analysisText && (
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  {mode === 'explain' ? (
                    <>
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>বিশদ কোড ব্যাখ্যা ও বিশ্লেষণ</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>পারফরম্যান্স ও অপ্টিমাইজেশন রিপোর্ট</span>
                    </>
                  )}
                </span>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px] transition-colors"
                >
                  {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? 'কপি হয়েছে' : 'পুরো উত্তর কপি'}</span>
                </button>
              </div>

              {/* Rendered Markdown Output */}
              <div className="text-slate-300 text-xs leading-relaxed font-sans prose prose-invert max-w-none prose-p:my-1.5 prose-headings:text-slate-100 prose-headings:font-mono prose-headings:font-bold prose-headings:my-2 prose-code:font-mono prose-code:text-emerald-300 prose-code:bg-slate-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:p-3 prose-pre:rounded-lg prose-ul:my-1.5 prose-li:my-0.5">
                <Markdown>{analysisText}</Markdown>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px]">Powered by Google Gemini 3.7 Flash</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors cursor-pointer"
            >
              বন্ধ করুন (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
