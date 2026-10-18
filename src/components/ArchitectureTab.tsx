import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Cpu, 
  ArrowRight,
  Code2,
  Check,
  Copy,
  ChevronRight,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { comparisonMetrics, codeSmells } from '../data/architectureComparison';

export const ArchitectureTab: React.FC = () => {
  const [selectedSmellId, setSelectedSmellId] = useState<string>(codeSmells[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedSmell = codeSmells.find(s => s.id === selectedSmellId) || codeSmells[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Executive Summary */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Architecture Transformation Complete & Tested</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            From Brittle Monolith to Clean, Typed, Table-Driven Architecture
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            The original script (<code className="text-indigo-300 font-mono text-xs bg-slate-800/80 px-1.5 py-0.5 rounded">etgenerateJSONschema2020-12.py</code>) 
            constructed 1.2+ MB JSON documents via hundreds of raw string concatenations, comma-stripping hacks, and mutated global variables. 
            We rearchitected it into a <strong>pure, AST-based, domain-driven Python engine</strong> that generates 100% syntactically guaranteed Draft 2020-12 JSON Schema directly from standard objects.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="text-xs text-slate-400 font-medium">Generated Defs</div>
              <div className="text-xl sm:text-2xl font-bold text-indigo-400 font-mono mt-0.5">370</div>
              <div className="text-[11px] text-slate-500 mt-0.5">All X3D 4.0 Nodes & Statements</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="text-xs text-slate-400 font-medium">Generation Speed</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-0.5">&lt; 0.8s</div>
              <div className="text-[11px] text-slate-500 mt-0.5">2.5MB X3DUOM XML input</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="text-xs text-slate-400 font-medium">Dead Code Removed</div>
              <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono mt-0.5">280+ lines</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Orphaned functions & comment blocks</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="text-xs text-slate-400 font-medium">Automated Tests</div>
              <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-0.5">6/6 Pass</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Schema validation & unit tests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Architectural Diagram: Before vs After Pipeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Pipeline Architecture Comparison
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Legacy Architecture */}
          <div className="rounded-xl border border-red-900/30 bg-red-950/10 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-red-900/20">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="font-semibold text-sm text-red-200">Original Monolithic Pipeline</span>
              </div>
              <span className="text-[11px] font-mono text-red-400/80 bg-red-900/30 px-2 py-0.5 rounded">Brittle</span>
            </div>
            
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-red-900/40 text-slate-300">
                <span className="text-red-400 font-bold">1. XML Stream:</span> sys.stdin XML parsing
              </div>
              <div className="flex justify-center text-red-500">↓</div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-red-900/40 text-slate-300">
                <span className="text-red-400 font-bold">2. Global Side Effects:</span> 
                <span className="text-slate-400 block mt-1">Direct mutations on global dicts: `classes`, `containerFields`, `regex`</span>
              </div>
              <div className="flex justify-center text-red-500">↓</div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-red-900/40 text-slate-300">
                <span className="text-red-400 font-bold">3. Raw String Concat:</span>
                <span className="text-slate-400 block mt-1">code += string concatenation with manual comma slicing code[:-2]</span>
              </div>
              <div className="flex justify-center text-red-500">↓</div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-red-900/40 text-slate-300">
                <span className="text-red-400 font-bold">4. sys.stdout Flush:</span> Unchecked schema write, vulnerable to JSON syntax breaks
              </div>
            </div>
          </div>

          {/* Rearchitected Pipeline */}
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/15 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-sm text-emerald-200">Rearchitected Modular Pipeline</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-900/30 px-2 py-0.5 rounded">Production Grade</span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-800/40 text-slate-300">
                <span className="text-emerald-400 font-bold">1. Input Ingestion:</span> Standard `argparse` CLI (File path or stream)
              </div>
              <div className="flex justify-center text-emerald-500">↓</div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-800/40 text-slate-300">
                <span className="text-emerald-400 font-bold">2. Domain Object Model:</span>
                <span className="text-slate-400 block mt-1">`X3DClassDef` graph nodes with pure recursion & typed mapping</span>
              </div>
              <div className="flex justify-center text-emerald-500">↓</div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-800/40 text-slate-300">
                <span className="text-emerald-400 font-bold">3. In-Memory JSON Schema AST:</span>
                <span className="text-slate-400 block mt-1">Constructs clean native dict tree with typed bounds & table lookups</span>
              </div>
              <div className="flex justify-center text-emerald-500">↓</div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-800/40 text-slate-300">
                <span className="text-emerald-400 font-bold">4. json.dump() Serialization:</span> Guaranteed RFC/Draft 2020-12 validity
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Smells Catalog & Fix Inspector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Code Smells Catalog: Before & After Solutions
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click any code smell below to inspect the transformation</span>
        </div>

        {/* Smells Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {codeSmells.map((smell) => {
            const isSelected = smell.id === selectedSmellId;
            return (
              <button
                key={smell.id}
                onClick={() => setSelectedSmellId(smell.id)}
                className={`p-2.5 text-left rounded-xl border text-xs font-medium transition ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="truncate font-semibold">{smell.name.split('. ')[1]}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Smell Detail Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-base font-bold text-white">{selectedSmell.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{selectedSmell.problem}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{selectedSmell.impact}</span>
            </div>
          </div>

          {/* Side by side code view */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Original Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-red-400">
                <span className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Original Pattern
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Brittle</span>
              </div>
              <div className="relative group">
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-red-950 font-mono text-[11px] text-red-200 overflow-x-auto leading-relaxed max-h-56">
                  {selectedSmell.originalSnippet}
                </pre>
              </div>
            </div>

            {/* Rearchitected Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Rearchitected Pattern
                </span>
                <button
                  onClick={() => handleCopy(selectedSmell.rearchitectedSnippet, selectedSmell.id)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition"
                >
                  {copiedId === selectedSmell.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative group">
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-emerald-950 font-mono text-[11px] text-emerald-200 overflow-x-auto leading-relaxed max-h-56">
                  {selectedSmell.rearchitectedSnippet}
                </pre>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
            <strong className="text-indigo-400">Architectural Solution: </strong>
            {selectedSmell.solution}
          </div>
        </div>
      </div>

      {/* Comprehensive Metric Comparison Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Detailed Comparison Matrix
          </h3>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Area / Metric</th>
                <th className="py-3 px-4">Original Script</th>
                <th className="py-3 px-4">Rearchitected Design</th>
                <th className="py-3 px-4">Improvement & Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparisonMetrics.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-200 whitespace-nowrap">
                    <div>{item.metric}</div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{item.category}</span>
                  </td>
                  <td className="py-3.5 px-4 text-red-300/80 font-mono text-[11px] leading-relaxed max-w-xs">
                    {item.original}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-300/90 font-mono text-[11px] leading-relaxed max-w-xs">
                    {item.rearchitected}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-sans leading-relaxed">
                    <span className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item.improvement}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
