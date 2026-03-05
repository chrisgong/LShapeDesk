
import React, { useState, useEffect, useRef } from 'react';
import { 
  Ruler, Printer, Download,
  Settings2, ZoomIn, ZoomOut, Maximize, 
  Calculator, Circle, Square, Trash2,
  CornerDownRight, Menu, X, History,
  Clock, ArrowRight, Save, Upload
} from 'lucide-react';
import BlueprintCanvas from './components/BlueprintCanvas';
import { DEFAULT_SPECS } from './constants';
import { MatSpecs, Hole, HistoryEntry } from './types';

const AppLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="url(#logo_gradient)" />
    <path d="M10 10V22H22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 22V20.5M16.5 22V20.5M20 22V20.5M10 13H11.5M10 16.5H11.5M10 20H11.5" stroke="white" strokeWidth="1" strokeOpacity="0.5"/>
    <defs>
      <linearGradient id="logo_gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1"/>
        <stop offset="1" stopColor="#4338CA"/>
      </linearGradient>
    </defs>
  </svg>
);

const App: React.FC = () => {
  const [specs, setSpecs] = useState<MatSpecs>(DEFAULT_SPECS);
  const [showDimensions, setShowDimensions] = useState(true);
  const [theme, setTheme] = useState<'blueprint' | 'modern' | 'minimal'>('blueprint');
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 0.25 });
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'params' | 'history'>('params');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/history');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setHistory(data);
        }
      } catch (e) {
        console.error('Failed to load history from file, fallback to localStorage', e);
        const savedHistory = localStorage.getItem('blueprint_history');
        if (savedHistory) {
          try {
            setHistory(JSON.parse(savedHistory));
          } catch (err) {
            console.error('Failed to parse history from localStorage', err);
          }
        }
      }
    };
    load();
  }, []);

  useEffect(() => {
    const k = 1 - Math.SQRT1_2;
    const next = { ...specs };

    if (specs.arcMode === 'gh') {
      const dH = Math.abs(specs.H - specs.D); 
      const dG = Math.abs(specs.G - specs.C); 
      if (dH > 0 && dG > 0) {
        const calculatedR = Math.round((dH + dG) + Math.sqrt(2 * dH * dG));
        next.R = calculatedR;
        next.E = specs.A - specs.D - calculatedR;
        next.F = specs.B - specs.C - calculatedR;
        next.Z = calculatedR * Math.sqrt(2);
        next.S = calculatedR * k;
      }
    } else if (specs.arcMode === 'zs') {
      const s_val = specs.S; 
      const z_val = specs.Z; 
      if (s_val > 0 && z_val > 0) {
        const calculatedR = Math.round((s_val / 2) + (Math.pow(z_val, 2) / (8 * s_val)));
        next.R = calculatedR;
        next.E = specs.A - specs.D - calculatedR;
        next.F = specs.B - specs.C - calculatedR;
        next.H = specs.D + calculatedR * k;
        next.G = specs.C + calculatedR * k;
      }
    } else {
      next.E = specs.A - specs.D - specs.R;
      next.F = specs.B - specs.C - specs.R;
      next.H = specs.D + specs.R * k; 
      next.G = specs.C + specs.R * k; 
      next.Z = specs.R * Math.sqrt(2);
      next.S = specs.R * k;
    }

    const hasChanged = 
      Math.abs(next.E - specs.E) > 0.5 || 
      Math.abs(next.F - specs.F) > 0.5 || 
      Math.abs(next.R - specs.R) > 0.5;

    if (hasChanged) {
      setSpecs(next);
    }
  }, [specs.A, specs.B, specs.C, specs.D, specs.R, specs.G, specs.H, specs.Z, specs.S, specs.arcMode]);

  const updateSpec = (key: keyof MatSpecs, val: any) => {
    setSpecs(prev => ({ ...prev, [key]: val }));
  };

  const addHole = (type: 'circle' | 'rect') => {
    const newHole: Hole = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      distFromTop: 150,
      distFromLeft: 150,
      ...(type === 'circle' ? { radius: 30 } : { width: 80, height: 50 })
    };
    setSpecs(prev => ({ ...prev, holes: [...prev.holes, newHole] }));
  };

  const updateHole = (id: string, updates: Partial<Hole>) => {
    setSpecs(prev => ({
      ...prev,
      holes: prev.holes.map(h => h.id === id ? { ...h, ...updates } : h)
    }));
  };

  const removeHole = (id: string) => {
    setSpecs(prev => ({
      ...prev,
      holes: prev.holes.filter(h => h.id !== id)
    }));
  };

  const persistHistory = (entries: HistoryEntry[]) => {
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries),
    }).catch((err) => {
      console.error('Failed to persist history to file', err);
    });
  };

  const addToHistory = () => {
    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      specs: JSON.parse(JSON.stringify(specs))
    };
    const updatedHistory = [newEntry, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('blueprint_history', JSON.stringify(updatedHistory));
    persistHistory(updatedHistory);
  };

  const applyHistory = (entry: HistoryEntry) => {
    setSpecs(entry.specs);
    setSidebarTab('params');
    // Optional: provide feedback
  };

  const clearHistory = () => {
    const empty: HistoryEntry[] = [];
    setHistory(empty);
    localStorage.removeItem('blueprint_history');
    persistHistory(empty);
  };

  // 导出当前参数为可还原的本地 JSON 记录
  const exportCurrentConfig = () => {
    const payload = {
      version: 1,
      createdAt: new Date().toISOString(),
      specs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `deskmat_config_${ts}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 从本地 JSON 文件还原参数
  const handleImportConfigClick = () => {
    importInputRef.current?.click();
  };

  const handleImportConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const data = JSON.parse(text);
        const loadedSpecs = (data && data.specs) ? data.specs : data;
        if (!loadedSpecs || typeof loadedSpecs !== 'object') {
          throw new Error('Invalid config format');
        }
        setSpecs(prev => ({
          ...prev,
          ...loadedSpecs,
          holes: loadedSpecs.holes || [],
        }));
        setSidebarTab('params');
      } catch (err) {
        console.error('Failed to import config', err);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - viewState.x, y: e.clientY - viewState.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewState(prev => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - viewState.x, y: touch.clientY - viewState.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setViewState(prev => ({
      ...prev,
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y
    }));
  };

  const handleEnd = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.001;
    setViewState(prev => ({ ...prev, scale: Math.min(Math.max(prev.scale + delta, 0.02), 5) }));
  };

  const exportAsImage = () => {
    if (!svgRef.current) return;
    addToHistory(); // Record to history on every export
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const scale = 2; 
    canvas.width = (specs.A + 800) * scale;
    canvas.height = (specs.B + 800) * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = theme === 'blueprint' ? '#0f172a' : theme === 'modern' ? '#f8fafc' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `DeskMat_Production_Draft_${new Date().getTime()}.png`;
      downloadLink.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className={`h-screen flex flex-col ${theme === 'blueprint' ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'} overflow-hidden`}>
      <header className="h-14 border-b px-4 md:px-6 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur-md border-slate-800 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="hidden xs:block"><AppLogo /></div>
          <h1 className="text-sm md:text-lg font-black tracking-tighter text-indigo-100 italic uppercase truncate max-w-[120px] md:max-w-none">
            Blueprint Pro
          </h1>
        </div>
        <div className="flex items-center gap-1 md:gap-3">
          <div className="hidden sm:flex bg-slate-800 p-1 rounded-lg">
            {['left', 'right'].map(o => (
              <button key={o} onClick={() => updateSpec('orientation', o)} className={`px-2 md:px-4 py-1 text-[9px] md:text-[10px] font-black rounded-md transition-all ${specs.orientation === o ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                {o === 'left' ? 'LEFT-L' : 'RIGHT-L'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowDimensions(!showDimensions)} className={`p-2 rounded-lg transition-colors ${showDimensions ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`} title="Toggle Dimensions">
            <Ruler className="w-5 h-5" />
          </button>
          <button onClick={exportAsImage} className="p-2 text-slate-500 hover:text-white transition-colors" title="Download PNG">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <aside className={`
          fixed md:relative inset-y-0 left-0 z-40
          w-80 md:w-96 bg-[#0f172a] border-r border-slate-800 p-4 md:p-6 
          overflow-y-auto transition-transform duration-300 transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col gap-5
        `}>
          {/* Sidebar Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setSidebarTab('params')} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'params' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Settings2 className="w-4 h-4" /> Parameters
            </button>
            <button 
              onClick={() => setSidebarTab('history')} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <History className="w-4 h-4" /> History
            </button>
          </div>

          {sidebarTab === 'params' ? (
            <>
              {/* Shape Type Toggle */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-4">
                <button 
                  onClick={() => updateSpec('shapeType', 'l-shape')} 
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${(!specs.shapeType || specs.shapeType === 'l-shape') ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  L-Shape
                </button>
                <button 
                  onClick={() => updateSpec('shapeType', 'rectangle')} 
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${specs.shapeType === 'rectangle' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Rectangle
                </button>
              </div>

              {(!specs.shapeType || specs.shapeType === 'l-shape') && (
                <section className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 shadow-2xl">
                  <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-4">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 italic">Arc Calculation</h2>
                    <div className="flex bg-slate-800 p-1 rounded-lg w-full xs:w-auto">
                      {(['radius', 'gh', 'zs'] as const).map(m => (
                        <button key={m} onClick={() => updateSpec('arcMode', m)} className={`flex-1 xs:flex-none px-3 py-1 text-[10px] font-black rounded-md transition-all ${specs.arcMode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {specs.arcMode === 'radius' && (
                      <div>
                        <label className="text-[9px] block uppercase font-black text-blue-400 mb-1.5">R: Inner Radius (mm)</label>
                        <input type="number" value={specs.R} onChange={e => updateSpec('R', Number(e.target.value))} className="w-full bg-slate-950 border border-blue-500/30 rounded-lg px-3 py-2.5 font-mono text-lg text-blue-300 outline-none" />
                      </div>
                    )}
                    {specs.arcMode === 'gh' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[9px] block uppercase font-black text-emerald-400 mb-1.5">H (Side Edge Dist)</label>
                        <input type="number" value={Math.round(specs.H)} onChange={e => updateSpec('H', Number(e.target.value))} className="w-full bg-slate-950 border border-emerald-500/30 rounded-lg px-3 py-2.5 font-mono text-lg text-emerald-400 outline-none" /></div>
                        <div><label className="text-[9px] block uppercase font-black text-emerald-400 mb-1.5">G (Top Edge Dist)</label>
                        <input type="number" value={Math.round(specs.G)} onChange={e => updateSpec('G', Number(e.target.value))} className="w-full bg-slate-950 border border-emerald-500/30 rounded-lg px-3 py-2.5 font-mono text-lg text-emerald-400 outline-none" /></div>
                      </div>
                    )}
                    {specs.arcMode === 'zs' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[9px] block uppercase font-black text-fuchsia-400 mb-1.5">Z (Chord)</label>
                        <input type="number" value={Math.round(specs.Z)} onChange={e => updateSpec('Z', Number(e.target.value))} className="w-full bg-slate-950 border border-fuchsia-500/30 rounded-lg px-3 py-2.5 font-mono text-lg text-fuchsia-400 outline-none" /></div>
                        <div><label className="text-[9px] block uppercase font-black text-fuchsia-400 mb-1.5">S (Sagitta)</label>
                        <input type="number" value={Math.round(specs.S)} onChange={e => updateSpec('S', Number(e.target.value))} className="w-full bg-slate-950 border border-fuchsia-500/30 rounded-lg px-3 py-2.5 font-mono text-lg text-fuchsia-400 outline-none" /></div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-slate-500">
                    <Settings2 className="w-4 h-4" />
                    <h2 className="text-[9px] font-black uppercase tracking-widest italic">Main Frame</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {((!specs.shapeType || specs.shapeType === 'l-shape') ? 
                      [{l:'A Width',k:'A'},{l:'B Height',k:'B'},{l:'C Theoretical Y',k:'C'},{l:'D Theoretical X',k:'D'}] : 
                      [{l:'A Width',k:'A'},{l:'B Height',k:'B'}]
                    ).map(item => (
                      <div key={item.l}>
                        <label className="text-[8px] block mb-1 uppercase font-bold opacity-40">{item.l}</label>
                        <input type="number" value={(specs as any)[item.k]} onChange={e => updateSpec(item.k as any, Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 font-mono text-xs text-indigo-100 outline-none" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3 text-slate-500">
                    <CornerDownRight className="w-4 h-4" />
                    <h2 className="text-[9px] font-black uppercase tracking-widest italic">{(!specs.shapeType || specs.shapeType === 'l-shape') ? 'Outer Radii C1-C5' : 'Corner Radii C1-C4'}</h2>
                  </div>
                  <div className={`grid ${(!specs.shapeType || specs.shapeType === 'l-shape') ? 'grid-cols-5' : 'grid-cols-4'} gap-1.5`}>
                    {((!specs.shapeType || specs.shapeType === 'l-shape') ? ['r1', 'r2', 'r3', 'r4', 'r5'] : ['r1', 'r2', 'r3', 'r4']).map((rKey, i) => (
                      <div key={rKey}>
                        <label className="text-[7px] block mb-1 uppercase font-bold opacity-40 text-center">C{i+1}</label>
                        <input type="number" value={(specs as any)[rKey]} onChange={e => updateSpec(rKey as any, Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-1.5 font-mono text-[9px] text-center text-white outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-fuchsia-400">
                    <Calculator className="w-4 h-4" />
                    <h2 className="text-[9px] font-black uppercase tracking-widest italic">Cutout Configuration</h2>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => addHole('circle')} className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors text-fuchsia-400 border border-fuchsia-500/30 shadow-lg" title="Add Circle Hole"><Circle className="w-4 h-4"/></button>
                    <button onClick={() => addHole('rect')} className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors text-fuchsia-400 border border-fuchsia-500/30 shadow-lg" title="Add Rect Hole"><Square className="w-4 h-4"/></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {specs.holes.map((hole, idx) => (
                    <div key={hole.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg group hover:border-fuchsia-500/30 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter italic">Hole #{idx + 1} ({hole.type})</span>
                        <button onClick={() => removeHole(hole.id)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] block mb-1 uppercase font-bold opacity-40">From Left (mm)</label>
                            <input type="number" value={hole.distFromLeft} onChange={e => updateHole(hole.id, { distFromLeft: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1.5 text-[10px] font-mono text-white outline-none" />
                          </div>
                          <div>
                            <label className="text-[8px] block mb-1 uppercase font-bold opacity-40">From Top (mm)</label>
                            <input type="number" value={hole.distFromTop} onChange={e => updateHole(hole.id, { distFromTop: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1.5 text-[10px] font-mono text-white outline-none" />
                          </div>
                        </div>
                        <div>
                          {hole.type === 'circle' ? (
                            <div>
                              <label className="text-[8px] block mb-1 uppercase font-bold opacity-40">Radius (R)</label>
                              <input type="number" value={hole.radius} onChange={e => updateHole(hole.id, { radius: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1.5 text-[10px] font-mono text-white outline-none" />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] block mb-1 uppercase font-bold opacity-40">Width (L)</label>
                                <input type="number" value={hole.width} onChange={e => updateHole(hole.id, { width: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1.5 text-[10px] font-mono text-white outline-none" />
                              </div>
                              <div>
                                <label className="text-[8px] block mb-1 uppercase font-bold opacity-40">Height (W)</label>
                                <input type="number" value={hole.height} onChange={e => updateHole(hole.id, { height: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1.5 text-[10px] font-mono text-white outline-none" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {specs.holes.length === 0 && (
                    <div className="text-center py-4 text-slate-600 text-[10px] font-black uppercase italic">
                      No cutouts added
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <section className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Clock className="w-4 h-4" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest italic">Recent Exports</h2>
                </div>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-[9px] font-black text-slate-500 hover:text-red-400 uppercase">Clear All</button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={exportCurrentConfig}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-200 hover:border-indigo-500/60 hover:text-white transition-colors"
                >
                  <Save className="w-3 h-3" />
                  Export JSON
                </button>
                <button
                  onClick={handleImportConfigClick}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-200 hover:border-emerald-500/60 hover:text-white transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  Import JSON
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleImportConfigChange}
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {history.map((entry) => (
                  <button 
                    key={entry.id} 
                    onClick={() => applyHistory(entry)}
                    className="w-full text左 p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono text-slate-500 italic">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div className="text-[10px] flex justify-between"><span className="text-slate-600">A:</span> <span className="text-slate-300">{entry.specs.A}</span></div>
                      <div className="text-[10px] flex justify-between"><span className="text-slate-600">B:</span> <span className="text-slate-300">{entry.specs.B}</span></div>
                      <div className="text-[10px] flex justify之间"><span className="text-slate-600">R:</span> <span className="text-slate-300">{Math.round(entry.specs.R)}</span></div>
                      <div className="text-[10px] flex justify-between"><span className="text-slate-600">Cut:</span> <span className="text-slate-300">{entry.specs.holes.length}</span></div>
                    </div>
                  </button>
                ))}
                {history.length === 0 && (
                  <div className="py-20 text-center text-slate-700 text-[10px] font-black uppercase italic border-2 border-dashed border-slate-800 rounded-2xl">
                    No history found
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="pt-4 border-t border-slate-800 space-y-3 shrink-0">
             <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 backdrop-blur-sm">
               <div className="flex justify-between text-[9px] font-mono text-slate-400 uppercase mb-1"><span>Radius:</span> <span className="text-white font-black">{Math.round(specs.R)} mm</span></div>
               <div className="flex justify-between text-[9px] font-mono text-slate-400 uppercase"><span>E / F Arms:</span> <span className="text-orange-400 font-black">{Math.round(specs.E)} / {Math.round(specs.F)}</span></div>
             </div>
             <button onClick={exportAsImage} className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-500 transition-all active:scale-[0.98]">
               <Download className="w-4 h-4" /> Export Final Draft
             </button>
          </div>
        </aside>

        <div 
          className="flex-1 relative bg-[#020617] cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleEnd} onWheel={handleWheel}
          ref={containerRef}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})` }}>
            <div className="pointer-events-auto">
               <BlueprintCanvas ref={svgRef} specs={specs} showDimensions={showDimensions} theme={theme} />
            </div>
          </div>

          <div className="absolute bottom-6 right-6 flex flex-col gap-3 md:flex-row md:items-center">
             <button onClick={() => setViewState({x:0,y:0,scale:0.25})} className="p-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-slate-400 hover:text-white shadow-2xl active:scale-90 transition-all"><Maximize className="w-5 h-5"/></button>
             <div className="flex bg-slate-900 border border-slate-700 rounded-2xl p-1 shadow-2xl overflow-hidden">
                <button onClick={() => setViewState(v=>({...v,scale:v.scale/1.25}))} className="p-3 text-slate-400 hover:text-white active:bg-slate-800 transition-all"><ZoomOut className="w-5 h-5"/></button>
                <div className="w-px bg-slate-700 my-2"></div>
                <button onClick={() => setViewState(v=>({...v,scale:v.scale*1.25}))} className="p-3 text-slate-400 hover:text-white active:bg-slate-800 transition-all"><ZoomIn className="w-5 h-5"/></button>
             </div>
             <button onClick={() => setSidebarOpen(true)} className="md:hidden p-3.5 bg-indigo-600 rounded-2xl text-white shadow-2xl active:scale-95 transition-all"><Settings2 className="w-6 h-6"/></button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
