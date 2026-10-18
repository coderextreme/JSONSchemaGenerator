import React, { useState } from 'react';
import { 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  FileCode2, 
  Archive, 
  FileJson, 
  Sparkles,
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';
import { codeFiles } from '../data/rearchitectedCode';

interface ExportTabProps {
  onDownloadScript: () => void;
  onDownloadPackage: () => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({
  onDownloadScript,
  onDownloadPackage
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadJsonSchema = () => {
    // Generate or fetch schema JSON blob
    const element = document.createElement("a");
    const file = new Blob([codeFiles.standalone], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = "x3d_schema_generator.py";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const cliCommands = [
    {
      id: 'cmd-standard',
      title: 'Generate X3D 4.0 JSON Schema to File',
      command: 'python3 x3d_schema_generator.py 4.0 -i X3dUnifiedObjectModel-4.0.xml -o x3d-4.0-JSONSchema.json',
      desc: 'Parses the X3DUOM XML and writes formatted Draft 2020-12 JSON Schema.'
    },
    {
      id: 'cmd-pipe',
      title: 'Run as Unix Pipeline (Stdin -> Stdout)',
      command: 'python3 x3d_schema_generator.py 4.0 < X3dUnifiedObjectModel-4.0.xml > x3d-4.0-JSONSchema.json',
      desc: 'Direct drop-in replacement for etgenerateJSONschema2020-12.py pipelines.'
    },
    {
      id: 'cmd-module',
      title: 'Run via Modular Python Package',
      command: 'python3 -m x3d_schema_gen 4.0 -i X3dUnifiedObjectModel-4.0.xml -o x3d-4.0-JSONSchema.json',
      desc: 'Executes the modular package entrypoint with standard argparse CLI.'
    },
    {
      id: 'cmd-tests',
      title: 'Run Automated Unit Test Suite',
      command: 'python3 -m unittest discover tests',
      desc: 'Validates schema root, dimensions, Transform properties, and JSON serialization.'
    }
  ];

  const pythonSnippet = `import xml.etree.ElementTree as ET
from x3d_schema_gen import X3DSchemaGenerator

# 1. Parse X3DUOM XML document
tree = ET.parse("X3dUnifiedObjectModel-4.0.xml")
root = tree.getroot()

# 2. Initialize generator with version
generator = X3DSchemaGenerator(root, x3d_version="4.0")

# 3. Generate standard JSON Schema dict (Draft 2020-12)
schema = generator.generate_schema()

# 4. Save to JSON file
import json
with open("x3d-4.0-JSONSchema.json", "w", encoding="utf-8") as f:
    json.dump(schema, f, indent=2, ensure_ascii=False)
`;

  return (
    <div className="space-y-10 pb-16">
      {/* Download Center Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <span>Download Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Get the rearchitected Python code ready for production deployment, CI/CD, or local development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Standalone Script */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-4 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileCode2 className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Single File (36 KB)
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-mono">x3d_schema_generator.py</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Self-contained, standalone Python script with zero external dependencies. Drop-in replacement for the original script in any existing build script.
              </p>
            </div>

            <button
              onClick={onDownloadScript}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Standalone Script (.py)</span>
            </button>
          </div>

          {/* Card 2: Modular Package */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-4 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Archive className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Full ZIP Package (20 KB)
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-mono">x3d_schema_package.zip</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Contains the modular <code className="text-cyan-300 font-mono">x3d_schema_gen/</code> package, test suite, README.md, and standalone script. Ideal for pip / poetry integration.
              </p>
            </div>

            <button
              onClick={onDownloadPackage}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Package ZIP (.zip)</span>
            </button>
          </div>
        </div>
      </div>

      {/* CLI Command Cheat Sheet */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Terminal & Pipeline Commands
          </h3>
        </div>

        <div className="space-y-3">
          {cliCommands.map((cmd) => (
            <div
              key={cmd.id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">{cmd.title}</span>
                <button
                  onClick={() => handleCopy(cmd.command, cmd.id)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition"
                >
                  {copiedKey === cmd.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-indigo-300 overflow-x-auto select-all">
                {cmd.command}
              </div>
              <p className="text-[11px] text-slate-500">
                {cmd.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Python Library Integration Snippet */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Python Library Integration
            </h3>
          </div>
          <button
            onClick={() => handleCopy(pythonSnippet, 'py-snippet')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition"
          >
            {copiedKey === 'py-snippet' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Python Code</span>
              </>
            )}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
          <pre>{pythonSnippet}</pre>
        </div>
      </div>

      {/* License & Standards Attribution */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>Web3D Consortium Open-Source License & Standards</span>
        </div>
        <p className="leading-relaxed">
          The generated JSON Schema conforms to standard <strong>JSON Schema Draft 2020-12</strong> and the <strong>Web3D Consortium X3D Unified Object Model (X3DUOM)</strong> specification. Source code released under the Web3D Consortium Open-Source License for Models and Software.
        </p>
      </div>
    </div>
  );
};
