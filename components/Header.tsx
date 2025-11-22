import React from 'react';
import { Heart, DollarSign, Camera, MessageSquare, User, Menu, X, Wallet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Header = () => {
  const { anyaProfile, appMode, setAppMode, userId, showMobileMenu, setShowMobileMenu } = useAppContext();

  return (
    <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 h-[60px] flex-none">
      <div className="flex items-center space-x-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden text-gray-400 hover:text-white transition-colors"
        >
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="relative flex items-center gap-2">
          <div className="relative">
            <Heart className="w-6 h-6 md:w-7 md:h-7 text-pink-500 fill-pink-500/20 animate-pulse-slow" />
            {anyaProfile.isPremium && <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]" />}
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight leading-none">Anya</h1>
            <p className="hidden md:block text-[10px] text-pink-400 uppercase tracking-widest font-semibold leading-none">AI Companion</p>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2 md:space-x-3 items-center text-sm">
        
        {/* Bank/Wallet Button */}
        <button
           onClick={() => setAppMode('bank')}
           className={`p-2 md:p-2.5 rounded-full transition-all border border-gray-700 active:scale-95 ${appMode === 'bank' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-emerald-400 hover:bg-gray-700'}`}
           title="Virtual Vault"
        >
           <Wallet className="w-5 h-5" />
        </button>

        {!anyaProfile.isPremium && (
          <button
            onClick={() => setAppMode('upgrade')}
            className="px-2.5 py-1.5 md:px-3 rounded-full text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg shadow-pink-900/30 flex items-center space-x-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Upgrade</span>
          </button>
        )}

        <button
          onClick={() => setAppMode(appMode === 'chat' ? 'image' : 'chat')}
          className="p-2 md:p-2.5 rounded-full text-white bg-gray-800 hover:bg-gray-700 transition-all border border-gray-700 active:scale-95"
          title={appMode === 'chat' ? 'Switch to Image Gen' : 'Switch to Chat'}
        >
          {appMode === 'chat' ? <Camera className="w-5 h-5 text-indigo-400" /> : <MessageSquare className="w-5 h-5 text-pink-400" />}
        </button>
        
        <div className="hidden md:flex items-center px-3 py-1.5 bg-gray-800/50 rounded-full border border-gray-800">
          <User className="w-3.5 h-3.5 mr-2 text-gray-500" />
          <span className="text-xs text-gray-400 font-mono">{userId ? userId.substring(0, 6) : '...'}</span>
        </div>
      </div>
    </div>
  );
};

export default Header;