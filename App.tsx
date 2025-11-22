import React from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import UpgradeScreen from './components/UpgradeScreen';
import SettingsPanel from './components/SettingsPanel';
import VirtualBank from './components/VirtualBank';
import { AppProvider, useAppContext } from './context/AppContext';
import { X } from 'lucide-react';

const MainContent = () => {
  const { appMode, showMobileMenu, setShowMobileMenu } = useAppContext();

  if (appMode === 'upgrade') {
    return <UpgradeScreen />;
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full md:p-6 md:gap-6 overflow-hidden relative">
      
      {/* Mobile Drawer (Settings) */}
      {showMobileMenu && (
        <div className="absolute inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowMobileMenu(false)}
          />
          {/* Drawer Content */}
          <div className="absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-gray-900 border-r border-gray-800 shadow-2xl flex flex-col animate-slide-in-left">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
              <span className="font-bold text-white text-lg">Settings</span>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SettingsPanel />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Settings) */}
      <div className="hidden md:block w-80 bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-xl overflow-hidden h-full">
        <SettingsPanel />
      </div>

      {/* Main Area */}
      <div className="flex-1 bg-gray-900 md:bg-gray-900/80 backdrop-blur-sm md:rounded-2xl border-t md:border border-gray-800 shadow-xl overflow-hidden flex flex-col h-full relative z-0">
        {appMode === 'chat' && <ChatInterface />}
        {appMode === 'image' && <ImageGenerator />}
        {appMode === 'bank' && <VirtualBank />}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      {/* Use 100dvh for correct mobile viewport height handling */}
      <div className="h-[100dvh] w-full flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black text-gray-100 overflow-hidden">
        <Header />
        <MainContent />
      </div>
    </AppProvider>
  );
};

export default App;