import React from 'react';
import { 
  Boxes, 
  FileCode2, 
  GitCompare, 
  Search, 
  CheckCircle2, 
  Download,
  Terminal,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadPackage: () => void;
  onDownloadScript: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadPackage,
  onDownloadScript
}) => {
  const tabs = [
    { id: 'architecture', label: 'Architecture & Review', icon: GitCompare, badge: 'Rearchitected' },
    { id: 'code', label: 'Code Explorer', icon: FileCode2, badge: '5 Modules' },
    { id: 'schema', label: 'Schema Explorer', icon: Search, badge: '370 Defs' },
    { id: 'validator', label: 'Live Validator', icon: ShieldCheck, badge: 'Test Playground' },
    { id: 'export', label: 'Export & CLI Guide', icon: Terminal, badge: 'Download' }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Boxes className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  X3D JSON Schema Rearchitecture
                </h1>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Draft 2020-12
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Modernized from <code className="text-slate-300 font-mono text-[11px]">etgenerateJSONschema2020-12.py</code>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onDownloadScript}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              title="Download standalone x3d_schema_generator.py"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download Script</span>
            </button>
            <button
              onClick={onDownloadPackage}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition active:scale-95"
              title="Download full package zip"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Package ZIP</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
