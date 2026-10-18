/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { ArchitectureTab } from './components/ArchitectureTab';
import { CodeExplorerTab } from './components/CodeExplorerTab';
import { SchemaExplorerTab } from './components/SchemaExplorerTab';
import { ValidatorTab } from './components/ValidatorTab';
import { ExportTab } from './components/ExportTab';
import { codeFiles } from './data/rearchitectedCode';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('architecture');

  const handleDownloadScript = () => {
    const blob = new Blob([codeFiles.standalone], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'x3d_schema_generator.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPackage = () => {
    // We can trigger download of the package ZIP created in the workspace
    const link = document.createElement('a');
    link.href = '/x3d_schema_package.zip';
    link.download = 'x3d_schema_package.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadPackage={handleDownloadPackage}
        onDownloadScript={handleDownloadScript}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'code' && <CodeExplorerTab />}
        {activeTab === 'schema' && <SchemaExplorerTab />}
        {activeTab === 'validator' && <ValidatorTab />}
        {activeTab === 'export' && (
          <ExportTab
            onDownloadPackage={handleDownloadPackage}
            onDownloadScript={handleDownloadScript}
          />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>X3D Unified Object Model (X3DUOM) &bull; JSON Schema Draft 2020-12 Generator</span>
          <span className="font-mono text-slate-600 text-[11px]">Web3D Consortium Open-Source License</span>
        </div>
      </footer>
    </div>
  );
}
