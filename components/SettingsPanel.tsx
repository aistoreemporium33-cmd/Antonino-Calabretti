import React from 'react';
import { Brain, User, Database } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const SettingsPanel = () => {
  const { anyaProfile, longTermMemories } = useAppContext();

  return (
    <div className="h-full p-6 space-y-6 text-gray-200">
      <div className="flex items-center space-x-2 text-pink-500 mb-4">
        <Brain className="w-6 h-6" />
        <h3 className="font-bold text-lg">Core Identity</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Name</label>
          <div className="bg-gray-800 p-3 rounded-lg mt-1 text-sm font-medium">{anyaProfile.name}</div>
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Personality Trait</label>
          <div className="bg-gray-800 p-3 rounded-lg mt-1 text-sm font-medium capitalize">{anyaProfile.trait}</div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-800">
         <div className="flex items-center space-x-2 text-indigo-400 mb-4">
          <Database className="w-5 h-5" />
          <h3 className="font-bold text-sm">Memory Bank</h3>
        </div>
        <div className="bg-gray-900 rounded-lg p-2 max-h-48 overflow-y-auto">
          {longTermMemories.map((mem, i) => (
            <div key={i} className="flex items-start text-xs text-gray-400 p-2 border-b border-gray-800 last:border-0">
              <span className="mr-2 text-pink-500">•</span>
              {mem}
            </div>
          ))}
        </div>
        {!anyaProfile.isPremium && (
          <p className="text-xs text-yellow-600 mt-2">Memory limited in free tier.</p>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;