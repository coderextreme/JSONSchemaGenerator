import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  Code2, 
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  GitBranch,
  Terminal,
  Download,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { X3DUOMSemanticValidator, ValidationDiagnostic, SymbolTableEntry } from '../utils/x3duomValidator';

interface TestCase {
  id: string;
  title: string;
  category: string;
  description: string;
  json: string;
  jsonSchemaVerdict: string;
  x3duomVerdict: string;
}

const semanticTestCases: TestCase[] = [
  {
    id: 'route-type-mismatch',
    title: '1. ROUTE Type Mismatch (SFFloat → SFVec3f)',
    category: 'ROUTE Integrity',
    description: 'Routes SFFloat fraction_changed directly to SFVec3f translation without an interpolator. JSON Schema cannot validate this cross-node relationship and passes it blindly!',
    jsonSchemaVerdict: 'PASSES BLINDLY (JSON Schema cannot inspect cross-node ROUTE types)',
    x3duomVerdict: 'CAUGHT: SFFloat cannot connect to SFVec3f. Suggests PositionInterpolator.',
    json: JSON.stringify({
      "X3D": {
        "Scene": {
          "-children": [
            {
              "TimeSensor": {
                "@DEF": "Clock",
                "@cycleInterval": 5.0,
                "@loop": true
              }
            },
            {
              "Transform": {
                "@DEF": "BoxTrans",
                "@translation": [0, 1.5, 0],
                "-children": [
                  {
                    "Shape": {
                      "-geometry": {
                        "Box": { "@size": [1.0, 1.0, 1.0] }
                      }
                    }
                  }
                ]
              }
            },
            {
              "ROUTE": {
                "@fromNode": "Clock",
                "@fromField": "fraction_changed",
                "@toNode": "BoxTrans",
                "@toField": "translation"
              }
            }
          ]
        }
      }
    }, null, 2)
  },
  {
    id: 'def-use-type-mismatch',
    title: '2. DEF/USE Node Type Mismatch',
    category: 'Symbol Integrity',
    description: 'Defines Transform with @DEF="MyTrans", then tries to reuse it in a Box node with @USE="MyTrans". JSON Schema passes it because both share generic -USEField!',
    jsonSchemaVerdict: 'PASSES BLINDLY (JSON Schema shares generic -USEField across all nodes)',
    x3duomVerdict: 'CAUGHT: @USE target is a Transform, cannot be reused as a Box geometry.',
    json: JSON.stringify({
      "X3D": {
        "Scene": {
          "-children": [
            {
              "Transform": {
                "@DEF": "MyTrans",
                "@translation": [0, 2, 0]
              }
            },
            {
              "Shape": {
                "-geometry": {
                  "Box": {
                    "@USE": "MyTrans"
                  }
                }
              }
            }
          ]
        }
      }
    }, null, 2)
  },
  {
    id: 'missing-def-target',
    title: '3. Undefined @USE Reference',
    category: 'Symbol Integrity',
    description: 'References @USE="GhostBox" which was never defined in the document. JSON Schema only checks if the string matches regex pattern ^[a-zA-Z_]!',
    jsonSchemaVerdict: 'PASSES BLINDLY (Only checks regex pattern, blind to symbol existence)',
    x3duomVerdict: 'CAUGHT: Referenced DEF "GhostBox" does not exist in scene graph.',
    json: JSON.stringify({
      "X3D": {
        "Scene": {
          "-children": [
            {
              "Shape": {
                "-geometry": {
                  "Box": {
                    "@USE": "GhostBox"
                  }
                }
              }
            }
          ]
        }
      }
    }, null, 2)
  },
  {
    id: 'container-child-mismatch',
    title: '4. Container Field Inheritance Violation',
    category: 'Inheritance Rules',
    description: 'Places a Sound node inside -geometry of a Shape. -geometry only accepts nodes inheriting from X3DGeometryNode.',
    jsonSchemaVerdict: 'CRYPTIC ERROR: "Should match exactly one schema in oneOf[1]"',
    x3duomVerdict: 'EXACT ERROR: -geometry requires X3DGeometryNode, but found Sound.',
    json: JSON.stringify({
      "X3D": {
        "Scene": {
          "-children": [
            {
              "Shape": {
                "-geometry": {
                  "Sound": {
                    "@direction": [0, 0, 1]
                  }
                }
              }
            }
          ]
        }
      }
    }, null, 2)
  },
  {
    id: 'access-type-output-only',
    title: '5. AccessType Authoring Violation',
    category: 'Event Model',
    description: 'Author initializes @fraction_changed on TimeSensor in the scene file. fraction_changed is outputOnly (runtime event source) and cannot be assigned a value.',
    jsonSchemaVerdict: 'CRYPTIC: "additionalProperties: false" with no semantic explanation',
    x3duomVerdict: 'EXACT ERROR: outputOnly fields emit events at runtime, use ROUTE instead.',
    json: JSON.stringify({
      "X3D": {
        "Scene": {
          "-children": [
            {
              "TimeSensor": {
                "@fraction_changed": 0.5
              }
            }
          ]
        }
      }
    }, null, 2)
  },
  {
    id: 'valid-animated-scene',
    title: '6. Valid Animated Scene with Routing',
    category: 'Conformant',
    description: 'Fully valid X3D scene with TimeSensor, PositionInterpolator, Transform, Shape, Box, and type-matched ROUTEs.',
    jsonSchemaVerdict: 'PASSES',
    x3duomVerdict: 'PASSES (Symbol graph, ROUTE types, container fields all verified)',
    json: JSON.stringify({
      "X3D": {
        "Scene": {
          "-children": [
            {
              "TimeSensor": {
                "@DEF": "Clock",
                "@cycleInterval": 5.0,
                "@loop": true
              }
            },
            {
              "PositionInterpolator": {
                "@DEF": "Interp",
                "@key": [0, 0.5, 1],
                "@keyValue": [0, 0, 0, 0, 5, 0, 0, 0, 0]
              }
            },
            {
              "Transform": {
                "@DEF": "BoxTrans",
                "@translation": [0, 1.5, 0],
                "-children": [
                  {
                    "Shape": {
                      "-geometry": {
                        "Box": {
                          "@size": [1.0, 1.0, 1.0]
                        }
                      }
                    }
                  }
                ]
              }
            },
            {
              "ROUTE": {
                "@fromNode": "Clock",
                "@fromField": "fraction_changed",
                "@toNode": "Interp",
                "@toField": "set_fraction"
              }
            },
            {
              "ROUTE": {
                "@fromNode": "Interp",
                "@fromField": "value_changed",
                "@toNode": "BoxTrans",
                "@toField": "translation"
              }
            }
          ]
        }
      }
    }, null, 2)
  }
];

export const ValidatorTab: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(semanticTestCases[0].id);
  const [inputCode, setInputCode] = useState<string>(semanticTestCases[0].json);

  const validator = useMemo(() => new X3DUOMSemanticValidator(), []);

  const result = useMemo(() => {
    return validator.validate(inputCode);
  }, [validator, inputCode]);

  const activeCase = semanticTestCases.find(c => c.id === selectedCaseId) || semanticTestCases[0];

  const handleSelectCase = (testCase: TestCase) => {
    setSelectedCaseId(testCase.id);
    setInputCode(testCase.json);
  };

  const downloadPythonValidator = () => {
    const link = document.createElement('a');
    link.href = '/x3d_validator.py';
    link.download = 'x3d_validator.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>X3DUOM-Native Semantic Validator</span>
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Better Than JSON Schema
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            JSON Schema cannot check cross-node relationships. This validator directly references the <strong>X3D Unified Object Model (X3DUOM)</strong> to enforce graph relationships, ROUTE type compatibility, DEF/USE integrity, and container field inheritance.
          </p>
        </div>

        <button
          onClick={downloadPythonValidator}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition self-start sm:self-auto active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download x3d_validator.py</span>
        </button>
      </div>

      {/* Preset Test Scenarios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Why JSON Schema Fails (Select a Scenario):
          </span>
          <span className="text-xs text-indigo-400 font-mono">
            Direct X3DUOM Semantic Checking
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {semanticTestCases.map((tc) => {
            const isSelected = tc.id === selectedCaseId;
            return (
              <button
                key={tc.id}
                onClick={() => handleSelectCase(tc)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/60 shadow-lg'
                    : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 truncate font-mono">
                      {tc.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-400 shrink-0">
                      {tc.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {tc.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-red-400/90 font-medium">JSON Schema: Blind</span>
                  <span className="text-emerald-400 font-medium">X3DUOM: Caught</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Scenario Comparison Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1 p-3 rounded-lg bg-red-950/20 border border-red-900/30">
          <div className="flex items-center gap-1.5 font-bold text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>Generic JSON Schema Response</span>
          </div>
          <p className="text-slate-300 font-mono text-[11px]">
            {activeCase.jsonSchemaVerdict}
          </p>
        </div>

        <div className="space-y-1 p-3 rounded-lg bg-emerald-950/25 border border-emerald-900/40">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>X3DUOM-Native Validator Response</span>
          </div>
          <p className="text-slate-200 font-mono text-[11px]">
            {activeCase.x3duomVerdict}
          </p>
        </div>
      </div>

      {/* Code Editor and Semantic Diagnostic Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: JSON Input */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>X3D JSON Document</span>
            </span>
            <button
              onClick={() => {
                const defCase = semanticTestCases.find(c => c.id === selectedCaseId) || semanticTestCases[0];
                setInputCode(defCase.json);
              }}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Snippet</span>
            </button>
          </div>

          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            rows={19}
            className="w-full p-4 bg-transparent font-mono text-xs text-slate-200 leading-relaxed focus:outline-none resize-y selection:bg-indigo-500/30"
            spellCheck={false}
          />
        </div>

        {/* Right: Semantic Diagnostic Report & Symbol Table */}
        <div className="lg:col-span-5 space-y-4">
          {/* Diagnostic Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Semantic Diagnostic Report</span>
              </h3>

              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                result.valid
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {result.valid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valid X3D Scene</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{result.errorCount} Error(s)</span>
                  </>
                )}
              </div>
            </div>

            {/* Diagnostic items */}
            {result.diagnostics.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 text-xs space-y-2">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Conformant X3DUOM Architecture</span>
                </div>
                <p className="text-emerald-300/80 leading-relaxed text-[11px]">
                  All node types, container fields, DEF/USE references, and ROUTE event data types match the X3D 4.0 specification.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {result.diagnostics.map((diag, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border space-y-2 text-xs font-mono ${
                      diag.severity === 'ERROR'
                        ? 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                        : 'bg-amber-950/20 border-amber-900/50 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{diag.rule}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {diag.path}
                      </span>
                    </div>

                    <p className="font-sans text-slate-200 leading-relaxed text-xs">
                      {diag.message}
                    </p>

                    {diag.expected && (
                      <div className="text-[11px] text-slate-400">
                        <span className="text-emerald-400 font-semibold">Expected:</span> {diag.expected}
                      </div>
                    )}

                    {diag.suggestion && (
                      <div className="text-[11px] text-indigo-300 flex items-start gap-1 font-sans">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Fix:</strong> {diag.suggestion}</span>
                      </div>
                    )}

                    {diag.schemaComparison && (
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 font-sans">
                        <strong className="text-red-400">JSON Schema limitation:</strong> {diag.schemaComparison}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Symbol Table Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span>DEF Symbol Table ({result.symbolTable.length})</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Cross-node graph</span>
            </div>

            {result.symbolTable.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono py-2 text-center">
                No @DEF identifiers declared in this scene.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono max-h-36 overflow-y-auto">
                {result.symbolTable.map((sym, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-indigo-300 font-bold">@{sym.defName}</span>
                      <span className="text-slate-500 ml-1.5">({sym.nodeType})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      {sym.path}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
