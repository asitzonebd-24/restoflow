import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Store, MapPin, Phone, Utensils } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  businessName: string;
  logo?: string;
  address?: string;
  phone?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, url, businessName, logo, address, phone }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (qrRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(qrRef.current, {
          quality: 1,
          pixelRatio: 4, // Higher scale for better resolution
          backgroundColor: '#ffffff',
        });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${businessName.replace(/\s+/g, '_')}_QR_Code.png`;
        link.click();
      } catch (error) {
        console.error('Error generating QR code image:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Utensils size={20} />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Store QR Code</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 flex flex-col items-center bg-slate-50/50">
          {/* QR Code Container to be downloaded */}
          <div 
            ref={qrRef} 
            className="bg-white p-8 rounded-[2rem] flex flex-col items-center justify-center w-full max-w-[360px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 relative overflow-hidden"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-indigo-50 to-white -z-10"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
            
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-2 text-center">
              Scan For Online Order
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 text-center">
              Point your camera at the QR code
            </p>
            
            <div className="bg-white p-5 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.05)] border-2 border-indigo-50 mb-8 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
              <div className="relative bg-white p-2 rounded-2xl">
                <QRCodeSVG 
                  value={url} 
                  size={220} 
                  level="H"
                  includeMargin={false}
                  fgColor="#0f172a"
                  imageSettings={logo ? {
                    src: logo,
                    x: undefined,
                    y: undefined,
                    height: 48,
                    width: 48,
                    excavate: true,
                  } : undefined}
                />
              </div>
            </div>

            <div className="flex flex-col items-center text-center w-full">
              {logo ? (
                <img src={logo} alt={businessName} className="w-14 h-14 object-contain rounded-full border-2 border-slate-100 mb-3 bg-white shadow-sm" crossOrigin="anonymous" />
              ) : (
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 border-2 border-indigo-100 shadow-sm">
                  <Store size={24} />
                </div>
              )}
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">{businessName}</h4>
              
              {(address || phone) && (
                <div className="flex flex-col items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest w-full">
                  {address && (
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg w-full justify-center">
                      <MapPin size={12} className="text-indigo-500 shrink-0" />
                      <span className="truncate max-w-[250px]">{address}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg w-full justify-center">
                      <Phone size={12} className="text-indigo-500 shrink-0" />
                      <span>{phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleDownload}
            className="mt-8 w-full max-w-[360px] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 border-2 border-slate-900"
          >
            <Download size={18} />
            Download High-Res QR Code
          </button>
        </div>
      </div>
    </div>
  );
};
