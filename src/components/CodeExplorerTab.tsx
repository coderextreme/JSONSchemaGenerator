import React, { useState } from 'react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  FolderTree, 
  FileText, 
  Info, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { codeFiles } from '../data/rearchitectedCode';

interface FileDescriptor {
  id: string;
  filename: string;
  path: string;
  language: string;
  badge: string;
  description: string;
  content: string;
}

export const CodeExplorerTab: React.FC = () => {
  const fileList: FileDescriptor[] = [
    {
      id: 'standalone',
      filename: 'x3d_schema_generator.py',
      path: 'x3d_schema_generator.py',
      language: 'python',
      badge: 'Standalone Drop-in',
      description: 'Single-file production replacement for etgenerateJSONschema2020-12.py with zero external dependencies.',
      content: codeFiles.standalone
    },
    {
      id: 'generator',
      filename: 'generator.py',
      path: 'x3d_schema_gen/generator.py',
      language: 'python',
      badge: 'Core Engine',
      description: 'The core JSON Schema builder engine using dictionary AST and table-driven type mappings.',
      content: codeFiles.generator
    },
    {
      id: 'models',
      filename: 'models.py',
      path: 'x3d_schema_gen/models.py',
      language: 'python',
      badge: 'Domain Models',
      description: 'X3DClassDef hierarchy representation, parent-child graph traversal, and typed number parsing.',
      content: codeFiles.models
    },
    {
      id: 'static_defs',
      filename: 'static_defs.py',
      path: 'x3d_schema_gen/static_defs.py',
      language: 'python',
      badge: 'Schema Constants',
      description: 'Static definition schemas for -childStatements, -NamedUSEField, -USEField, and the @geoSystem family.',
      content: codeFiles.static_defs
    },
    {
      id: 'cli',
      filename: 'cli.py',
      path: 'x3d_schema_gen/cli.py',
      language: 'python',
      badge: 'CLI Interface',
      description: 'Standard argparse CLI supporting custom input/output paths, stream piping, and indentation.',
      content: codeFiles.cli
    },
    {
      id: 'tests',
      filename: 'test_generator.py',
      path: 'tests/test_generator.py',
      language: 'python',
      badge: 'Automated Tests',
      description: 'Unit test suite verifying JSON Schema root schema, static defs, Transform node, vector bounds, and serialization.',
      content: codeFiles.tests
    },
    {
      id: 'original',
      filename: 'etgenerateJSONschema2020-12.py',
      path: 'original_script.py',
      language: 'python',
      badge: 'Original Monolith',
      description: 'The original script from coderextreme/X3DJSONLD for reference and side-by-side verification.',
      content: codeFiles.original
    },
    {
      id: 'readme',
      filename: 'README.md',
      path: 'README.md',
      language: 'markdown',
      badge: 'Documentation',
      description: 'Comprehensive usage guide, migration instructions, and CLI command references.',
      content: codeFiles.readme
    }
  ];

  const [activeFileId, setActiveFileId] = useState<string>('standalone');
  const [copied, setCopied] = useState<boolean>(false);

  const activeFile = fileList.find(f => f.id === activeFileId) || fileList[0];
  const lines = activeFile.content.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-400" />
            <span>Rearchitected Codebase Explorer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse both the standalone drop-in script and the modular <code className="text-indigo-300 font-mono">x3d_schema_gen</code> package.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy File</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar File Tree + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: File Tree */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            <span>Files & Modules ({fileList.length})</span>
          </div>

          <div className="space-y-1.5">
            {fileList.map((file) => {
              const isActive = file.id === activeFileId;
              const isOriginal = file.id === 'original';
              return (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                    isActive
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <FileCode2 className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isActive 
                      ? 'text-indigo-400' 
                      : isOriginal 
                        ? 'text-red-400/80' 
                        : 'text-slate-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold truncate text-slate-200">
                        {file.filename}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                        isOriginal 
                          ? 'bg-red-950/60 text-red-300 border border-red-900/40' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {file.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                      {file.path}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active File Info Box */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-2 mt-4 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
              <Info className="w-3.5 h-3.5" />
              <span>Module Purpose</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {activeFile.description}
            </p>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Lines: {lines.length}</span>
              <span>Size: {(activeFile.content.length / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col">
          {/* Code Viewer Window Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="font-mono text-xs text-slate-300 ml-2 font-medium">
                {activeFile.path}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
              {activeFile.language} • {lines.length} lines
            </span>
          </div>

          {/* Code Content */}
          <div className="p-4 overflow-x-auto max-h-[680px] font-mono text-xs leading-relaxed text-slate-200 select-text">
            <pre className="table w-full">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/50">
                  <span className="table-cell select-none text-right pr-4 text-slate-600 text-[11px] w-10">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre text-slate-300">
                    {line || ' '}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
