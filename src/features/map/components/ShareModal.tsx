import React, { useState } from "react";
import { X, Copy, Check, ExternalLink, Map as MapIcon, Share2 } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat?: number;
  lng?: number;
}

export function ShareModal({ isOpen, onClose, lat = 23.8103, lng = 90.4125 }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/dap-map?lat=${lat}&lng=${lng}` : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}&color=0D1117&bgcolor=FFFFFF`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div 
        className="fixed inset-0 w-full h-full bg-slate-900/75 z-[1060] animate-fade-in"
        onClick={onClose}
      />
      <div 
        role="dialog"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-lg flex flex-col animate-slide-up bg-white dark:bg-slate-900 z-[1061] w-[90%] max-w-sm"
      >
        <div className="p-3 border-b border-slate-500/25 flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-t-xl">
          <h6 className="font-bold mb-0 flex items-center gap-2 text-slate-900 dark:text-white text-lg">
            <Share2 size={18} className="text-blue-600" />
            Share Map Location
          </h6>
          <button aria-label="Close modal" className="bg-transparent text-slate-500 p-1 border-0 hover:text-blue-600 transition-colors cursor-pointer" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center">
          <div className="bg-white p-2 rounded-lg mb-4 shadow-sm border border-slate-200">
            <img src={qrUrl} alt="QR Code for Location" width={150} height={150} />
          </div>

          <div className="w-full mb-4">
            <label className="text-sm text-slate-500 mb-1 font-bold block">Direct Link</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-grow bg-transparent text-slate-900 dark:text-white border border-slate-500/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                value={shareUrl} 
                readOnly 
              />
              <button 
                aria-label="Copy to clipboard"
                className={`px-4 py-2 text-sm rounded-md text-white font-medium flex items-center gap-2 transition-colors cursor-pointer border-0 ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={handleCopy}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2">
            <label className="text-sm text-slate-500 mb-1 font-bold block">Open in External Maps</label>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm rounded-md flex items-center justify-center gap-2 border border-slate-500/50 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors no-underline"
            >
              <ExternalLink size={16} /> Google Maps
            </a>
            <a 
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm rounded-md flex items-center justify-center gap-2 border border-slate-500/50 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors no-underline"
            >
              <MapIcon size={16} /> OpenStreetMap
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
