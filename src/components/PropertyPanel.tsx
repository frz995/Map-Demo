import React from 'react';
import { X, Info } from 'lucide-react';

interface PropertyPanelProps {
  properties: Record<string, unknown> | null;
  onClose: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ properties, onClose }) => {
  if (!properties) return null;

  return (
    <div className="absolute top-20 right-4 z-10 bg-[#2d2d2d] text-white p-0 rounded-lg shadow-lg w-80 border border-[#404040] overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between p-4 bg-[#363636] border-b border-[#404040]">
        <div className="flex items-center gap-2">
          <Info size={20} className="text-[#0066cc]" />
          <h3 className="font-semibold text-lg">Feature Details</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(properties).map(([key, value]) => (
              <tr key={key} className="border-b border-[#404040] last:border-0">
                <td className="py-3 pr-4 font-medium text-gray-400 capitalize w-1/3">
                  {key.replace(/_/g, ' ')}
                </td>
                <td className="py-3 text-gray-200">
                  {String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertyPanel;
