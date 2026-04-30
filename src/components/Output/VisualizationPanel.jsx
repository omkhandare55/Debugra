import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const VisualizationPanel = ({ data }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = data?.steps || [];
  const totalSteps = steps.length;

  useEffect(() => {
    let interval;
    if (isPlaying && currentStep < totalSteps - 1) {
      interval = setInterval(() => {
        setCurrentStep((prev) => prev + 1);
      }, 1500); // 1.5 seconds per step
    } else if (currentStep >= totalSteps - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, totalSteps]);

  if (totalSteps === 0) {
    return (
      <div className="p-4 text-gray-400 bg-slate-900 rounded-lg border border-slate-800">
        No visualization data available. Try generating it again.
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-lg border border-slate-700 shadow-xl overflow-hidden text-sm">
      {/* Header / Controls */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
        <h3 className="text-amber-500 font-semibold flex items-center gap-2">
          <Play size={16} /> Time-Travel Debugger
        </h3>
        <div className="flex items-center gap-2 bg-slate-900 rounded-md p-1 border border-slate-700">
          <button 
            onClick={() => setCurrentStep(0)} 
            disabled={currentStep === 0}
            className="p-1 hover:bg-slate-700 disabled:opacity-50 rounded transition-colors"
            title="Restart"
          >
            <RotateCcw size={16} className="text-gray-300" />
          </button>
          <button 
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} 
            disabled={currentStep === 0}
            className="p-1 hover:bg-slate-700 disabled:opacity-50 rounded transition-colors"
            title="Previous Step"
          >
            <ChevronLeft size={16} className="text-gray-300" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={16} className="text-amber-400" /> : <Play size={16} className="text-green-400" />}
          </button>
          <button 
            onClick={() => setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1))} 
            disabled={currentStep === totalSteps - 1}
            className="p-1 hover:bg-slate-700 disabled:opacity-50 rounded transition-colors"
            title="Next Step"
          >
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Progress Bar */}
        <div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
            <div 
              className="bg-amber-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 text-right">Step {currentStep + 1} of {totalSteps}</div>
        </div>

        {/* Current Line Code */}
        <div className="bg-slate-900 border border-slate-700 rounded-md p-3 font-mono shadow-inner">
          <span className="text-gray-600 mr-4 select-none border-r border-slate-700 pr-3">L{step.line}</span>
          <span className="text-emerald-400">{step.code}</span>
        </div>

        {/* Explanation */}
        <div className="bg-indigo-900/20 border border-indigo-800/50 rounded-md p-4 text-indigo-200">
          <p className="font-medium text-indigo-400 mb-1 text-xs uppercase tracking-wider flex items-center gap-2">
            💡 What's happening
          </p>
          <p className="text-sm leading-relaxed">{step.explanation}</p>
        </div>

        {/* Variables State (The Memory Visualizer) */}
        <div className="bg-slate-900 rounded-md border border-slate-700 overflow-hidden shadow-inner">
          <div className="bg-slate-800 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-slate-700">
            Memory State
          </div>
          <div className="p-4">
            {step.variables && Object.keys(step.variables).length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(step.variables).map(([key, val]) => (
                  <div key={key} className="flex flex-col bg-slate-800 rounded-md p-3 border border-slate-600 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                    <span className="text-amber-400 font-mono text-xs mb-1 ml-1">{key}</span>
                    <span className="text-white font-mono text-sm ml-1 break-all">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm text-center py-2">No variables tracked at this step.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPanel;
