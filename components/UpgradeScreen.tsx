import React, { useState } from 'react';
import { CheckCircle, Star, Zap, Shield, ArrowLeft, CreditCard, Landmark, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const UpgradeScreen = () => {
  const { setAppMode, handleUpgrade } = useAppContext();
  const [method, setMethod] = useState<'stripe' | 'paypal' | null>(null);
  const [processing, setProcessing] = useState(false);

  const onSubscribe = async (selectedMethod: 'stripe' | 'paypal') => {
    setMethod(selectedMethod);
    setProcessing(true);
    
    // Simulate Gateway Handshake & Processing Delay
    const delay = Math.random() * 1000 + 2000; // 2-3 seconds
    await new Promise(r => setTimeout(r, delay));
    
    // Generate a mock transaction ID based on gateway
    const prefix = selectedMethod === 'stripe' ? 'ch_' : 'PAYID-';
    const mockId = prefix + Math.random().toString(36).substr(2, 9).toUpperCase();

    handleUpgrade(mockId);
    
    setProcessing(false);
    alert(`Payment successful via ${selectedMethod === 'stripe' ? 'Stripe' : 'PayPal'}!\nTransaction ID: ${mockId}\n\n5.00 CHF has been credited.`);
    setAppMode('chat');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-gray-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-gray-950 to-gray-950 pointer-events-none" />
      
      <button onClick={() => setAppMode('chat')} className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center z-20">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full z-10 relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Anya Premium</h2>
          <p className="text-gray-400 text-sm">Unlock the full depth of your connection.</p>
        </div>

        <div className="space-y-3 mb-8 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <FeatureRow text="Unlimited Haptic Images" />
          <FeatureRow text="Full Long-Term Memory" />
          <FeatureRow text="AI Flirt Coach" />
          <FeatureRow text="Exclusive Voice Models" />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-end mb-4 px-1">
            <span className="text-gray-400 text-sm font-medium">Monthly Subscription</span>
            <div className="text-right">
                <span className="text-2xl font-bold text-white">5.00 CHF</span>
                <span className="text-xs text-gray-500 block">/ month</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => onSubscribe('stripe')}
              disabled={processing}
              className={`w-full py-3 px-4 rounded-xl border flex items-center justify-between group transition-all
                ${method === 'stripe' && processing 
                    ? 'bg-gray-800 border-gray-600 opacity-80 cursor-wait' 
                    : 'bg-[#635BFF] border-[#635BFF] hover:bg-[#534be0] text-white shadow-lg shadow-indigo-900/20'}
              `}
            >
                <div className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-3" />
                    <span className="font-semibold">Pay with Card</span>
                </div>
                {method === 'stripe' && processing ? <span className="text-xs animate-pulse">Processing...</span> : <span className="text-xs opacity-80">Powered by Stripe</span>}
            </button>

            <button 
              onClick={() => onSubscribe('paypal')}
              disabled={processing}
              className={`w-full py-3 px-4 rounded-xl border flex items-center justify-between group transition-all
                ${method === 'paypal' && processing 
                    ? 'bg-gray-800 border-gray-600 opacity-80 cursor-wait' 
                    : 'bg-[#0070BA] border-[#0070BA] hover:bg-[#00609e] text-white shadow-lg shadow-blue-900/20'}
              `}
            >
                <div className="flex items-center">
                    <Globe className="w-5 h-5 mr-3" />
                    <span className="font-semibold">PayPal</span>
                </div>
                {method === 'paypal' && processing ? <span className="text-xs animate-pulse">Redirecting...</span> : <span className="text-xs opacity-80">Fast Checkout</span>}
            </button>
          </div>
        </div>
        
        <div className="text-center">
             <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> 
                SSL Encrypted Payment
             </p>
        </div>
      </div>
    </div>
  );
};

const FeatureRow = ({ text }: { text: string }) => (
  <div className="flex items-center text-gray-300">
    <CheckCircle className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);

export default UpgradeScreen;