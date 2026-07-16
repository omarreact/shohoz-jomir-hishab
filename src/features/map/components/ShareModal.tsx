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
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 z-index-modal animate-fade-in"
        style={{ zIndex: 1060 }}
        onClick={onClose}
      />
      <div 
        role="dialog"
        className="position-fixed top-50 start-50 translate-middle rounded-4 shadow-lg d-flex flex-column animate-slide-up"
        style={{ width: "90%", maxWidth: "450px", zIndex: 1070, backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", color: "white" }}
      >
        <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
          <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <Share2 size={18} className="text-primary" />
            Share Map Location
          </h6>
          <button className="btn btn-sm btn-link text-secondary p-0 border-0 hover-text-primary transition-colors" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="p-4 d-flex flex-column align-items-center">
          <div className="bg-white p-2 rounded-3 mb-4 shadow-sm">
            <img src={qrUrl} alt="QR Code for Location" width={150} height={150} />
          </div>

          <div className="w-100 mb-4">
            <label className="small text-secondary mb-1 fw-bold">Direct Link</label>
            <div className="d-flex gap-2">
              <input 
                type="text" 
                className="form-control bg-transparent text-white border-secondary border-opacity-50" 
                value={shareUrl} 
                readOnly 
              />
              <button 
                className={`btn ${copied ? 'btn-success' : 'btn-primary'} d-flex align-items-center gap-2`}
                onClick={handleCopy}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="w-100 d-flex flex-column gap-2">
            <label className="small text-secondary mb-1 fw-bold">Open in External Maps</label>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 text-white border-secondary border-opacity-50 hover-bg-dark"
            >
              <ExternalLink size={16} /> Google Maps
            </a>
            <a 
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 text-white border-secondary border-opacity-50 hover-bg-dark"
            >
              <MapIcon size={16} /> OpenStreetMap
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
