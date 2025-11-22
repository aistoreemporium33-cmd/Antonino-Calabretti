import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Wallet, Shield, Clock, ScanFace, CheckCircle, FileText, Loader2, Upload, Send, X, AlertTriangle, Fingerprint, Lock, Landmark, Globe, Bitcoin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { processPayment } from '../services/firebase';

const VirtualBank = () => {
  const { anyaProfile, userId, verifyIdentity } = useAppContext();
  const balance = anyaProfile.balance || 0;
  const transactions = [...(anyaProfile.transactions || [])].reverse(); // Newest first
  
  const [activeTab, setActiveTab] = useState<'overview' | 'identity'>('overview');
  const [isScanning, setIsScanning] = useState(false);
  
  // Withdrawal States
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'stripe' | 'paypal' | 'crypto'>('stripe');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawTarget, setWithdrawTarget] = useState('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  
  // Security States
  const [biometricStep, setBiometricStep] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

  // AUTHORIZED IDENTITY CONSTANTS
  const AUTHORIZED_ID = 'YC7502332';
  const AUTHORIZED_NAME = 'ANTONINO CALABRETTI';

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsScanning(true);
          // SIMULATION: We simulate an OCR scan that "detects" the specific user provided (Antonino)
          setTimeout(() => {
              verifyIdentity({
                  realName: AUTHORIZED_NAME,
                  nationality: 'ITALIANA',
                  idNumber: AUTHORIZED_ID,
                  birthDate: '13/11/1982'
              });
              setIsScanning(false);
          }, 3000); // 3 second simulated scan
      }
  };

  const startBiometricAuth = async () => {
      setBiometricStep('scanning');
      // Simulate biometric analysis
      await new Promise(r => setTimeout(r, 2500));
      
      // Strict Check: Only verify if the profile matches the authorized owner
      if (anyaProfile.idNumber === AUTHORIZED_ID && anyaProfile.realName === AUTHORIZED_NAME) {
          setBiometricStep('success');
          // Proceed to process withdrawal automatically after success
          setTimeout(() => executeWithdrawal(), 1000);
      } else {
          setBiometricStep('failed');
          alert("ACCESS DENIED: Biometric mismatch. Only the account owner is authorized.");
      }
  };

  const executeWithdrawal = async () => {
      const amount = parseFloat(withdrawAmount);
      setIsProcessingWithdrawal(true);
      
      // Simulate bank delay
      await new Promise(r => setTimeout(r, 2000));

      if (userId) {
          const methodLabel = withdrawMethod === 'stripe' ? 'Bank Transfer' : withdrawMethod === 'paypal' ? 'PayPal' : 'Crypto';
          await processPayment(userId, -amount, `${methodLabel}: ${withdrawTarget}`);
      }

      setIsProcessingWithdrawal(false);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawTarget('');
      setBiometricStep('idle');
      alert(`Transfer of CHF ${amount.toFixed(2)} authorized and initiated successfully via ${withdrawMethod.toUpperCase()}.`);
  };

  const openWithdrawal = () => {
      if (!anyaProfile.idVerified) {
          alert("Security Alert: You must verify your identity (upload ID) before withdrawing funds.");
          setActiveTab('identity');
          return;
      }
      setShowWithdrawModal(true);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-gray-900/50 rounded-xl overflow-y-auto relative">
      
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-emerald-400" />
            Virtual Vault
            </h2>
            <p className="text-gray-400 text-sm mt-1">Manage assets & identity.</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-gray-800 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === 'overview' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
                Balance
            </button>
            <button 
                onClick={() => setActiveTab('identity')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === 'identity' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
                ID & KYC
            </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
            {/* Credit Card Visual */}
            <div className="w-full max-w-sm mx-auto md:mx-0 mb-6 relative group perspective-1000">
                <div className="relative h-56 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl border border-gray-700/50 p-6 flex flex-col justify-between overflow-hidden transition-transform transform group-hover:scale-[1.02]">
                
                {/* Card Decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -ml-6 -mb-6"></div>
                
                <div className="flex justify-between items-start z-10">
                    <Shield className="w-8 h-8 text-emerald-400" />
                    <span className="text-lg font-bold text-white italic tracking-wider">ANYA BANK</span>
                </div>

                <div className="z-10 mt-4">
                    <span className="block text-gray-400 text-xs uppercase tracking-widest mb-1">Current Balance</span>
                    <span className="text-4xl font-mono text-white font-bold tracking-tight">
                    {balance.toFixed(2)} <span className="text-lg text-emerald-400">CHF</span>
                    </span>
                </div>

                <div className="flex justify-between items-end z-10">
                    <div>
                    <p className="text-xs text-gray-500 uppercase">Account Holder</p>
                    <p className="text-sm text-gray-200 font-medium tracking-wide uppercase flex items-center">
                        {anyaProfile.idVerified ? (
                            <>
                                {anyaProfile.realName}
                                {anyaProfile.realName === AUTHORIZED_NAME && <Lock className="w-3 h-3 ml-1 text-emerald-500" />}
                            </>
                        ) : (
                            userId ? `ID: ${userId.substring(0, 8)}` : 'UNKNOWN'
                        )}
                    </p>
                    </div>
                    <div className="text-right">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className={`text-sm font-medium ${anyaProfile.idVerified ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {anyaProfile.idVerified ? 'VERIFIED' : 'UNVERIFIED'}
                    </p>
                    </div>
                </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-6">
                <button 
                    onClick={openWithdrawal}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-3 rounded-xl font-medium flex items-center justify-center transition-all active:scale-95"
                >
                    <Send className="w-4 h-4 mr-2" /> Withdraw / Send
                </button>
            </div>

            {/* Transaction History */}
            <div className="flex-1 bg-gray-950/50 border border-gray-800 rounded-xl p-4 overflow-hidden flex flex-col min-h-[200px]">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    Transaction History
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                {transactions.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 italic">
                        No transactions yet. Start your journey!
                    </div>
                ) : (
                    transactions.map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/80 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-200">{tx.description}</p>
                                <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString()}</p>
                            </div>
                        </div>
                        <div className={`font-mono font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-gray-400'}`}>
                            {tx.type === 'credit' ? '+' : ''}{tx.amount.toFixed(2)}
                        </div>
                    </div>
                    ))
                )}
                </div>
            </div>
        </>
      ) : (
          <div className="flex-1 flex flex-col items-center animate-fade-in">
              <div className="w-full max-w-md space-y-6">
                  <div className="text-center space-y-2">
                      <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                          {anyaProfile.idVerified ? <CheckCircle className="w-8 h-8 text-emerald-400" /> : <ScanFace className="w-8 h-8 text-gray-400" />}
                      </div>
                      <h3 className="text-xl font-bold text-white">
                          {anyaProfile.idVerified ? 'Identity Verified' : 'Verify Identity'}
                      </h3>
                      <p className="text-sm text-gray-400">
                          {anyaProfile.idVerified 
                            ? 'Your identity has been confirmed securely on the blockchain.' 
                            : 'Upload a government-issued ID to unlock all banking features.'}
                      </p>
                  </div>

                  {anyaProfile.idVerified ? (
                      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
                          {/* Holographic effect line */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50"></div>
                          
                          <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                              <div className="w-20 h-24 bg-gray-700 rounded-lg overflow-hidden border border-gray-600 relative">
                                  {/* Simulated Avatar based on the prompt description roughly */}
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                      <span className="text-2xl">👨🏻</span>
                                  </div>
                              </div>
                              <div className="space-y-1">
                                  <div className="text-xs text-emerald-500 font-bold uppercase tracking-wider flex items-center">
                                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                  </div>
                                  <h2 className="text-lg font-bold text-white">{anyaProfile.realName}</h2>
                                  <p className="text-sm text-gray-400">{anyaProfile.nationality}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                  <p className="text-xs text-gray-500 uppercase">Document No.</p>
                                  <p className="text-white font-mono">{anyaProfile.idNumber}</p>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase">Date of Birth</p>
                                  <p className="text-white font-mono">{anyaProfile.birthDate}</p>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase">Issued By</p>
                                  <p className="text-white">Repubblica Italiana</p>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase">Expires</p>
                                  <p className="text-white">27/11/2034</p>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {isScanning ? (
                              <div className="bg-gray-800/50 border border-emerald-500/30 rounded-xl p-10 flex flex-col items-center text-center animate-pulse">
                                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
                                  <h4 className="text-emerald-400 font-bold mb-1">Scanning Document...</h4>
                                  <p className="text-xs text-gray-400">Extracting biometric data & text (OCR)</p>
                              </div>
                          ) : (
                            <label className="block bg-gray-800 border-2 border-dashed border-gray-600 hover:border-emerald-500 hover:bg-gray-750 rounded-xl p-8 cursor-pointer transition-all group text-center">
                                <Upload className="w-10 h-10 text-gray-500 group-hover:text-emerald-400 mx-auto mb-3 transition-colors" />
                                <span className="block text-gray-300 font-medium">Upload ID Card / Passport</span>
                                <span className="block text-xs text-gray-500 mt-1">Supports JPG, PNG (Max 5MB)</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleIdUpload} />
                            </label>
                          )}
                          
                          <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg flex items-start gap-3">
                              <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                              <div className="text-xs text-blue-200/80">
                                  <p className="font-semibold text-blue-200 mb-1">Why verify?</p>
                                  Identity verification allows for higher withdrawal limits and secures your account ownership.
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-6 relative shadow-2xl">
                <button 
                    onClick={() => {
                        setShowWithdrawModal(false);
                        setBiometricStep('idle');
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-white mb-2">Withdraw Funds</h3>
                <p className="text-sm text-gray-400 mb-6">Select gateway and transfer funds.</p>

                {biometricStep === 'idle' || biometricStep === 'failed' ? (
                     <div className="space-y-4">
                        
                        {/* Gateway Selection */}
                        <div className="grid grid-cols-3 gap-2">
                           <button 
                             onClick={() => setWithdrawMethod('stripe')}
                             className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${withdrawMethod === 'stripe' ? 'bg-[#635BFF]/10 border-[#635BFF] text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                           >
                              <Landmark className="w-5 h-5 mb-1" />
                              Bank/Stripe
                           </button>
                           <button 
                             onClick={() => setWithdrawMethod('paypal')}
                             className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${withdrawMethod === 'paypal' ? 'bg-[#0070BA]/10 border-[#0070BA] text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                           >
                              <Globe className="w-5 h-5 mb-1" />
                              PayPal
                           </button>
                           <button 
                             onClick={() => setWithdrawMethod('crypto')}
                             className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${withdrawMethod === 'crypto' ? 'bg-orange-500/10 border-orange-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                           >
                              <Bitcoin className="w-5 h-5 mb-1" />
                              Crypto
                           </button>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Amount (CHF)</label>
                            <input 
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-emerald-500 outline-none font-mono"
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">Max: {balance.toFixed(2)} CHF</p>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 font-bold mb-1">
                                {withdrawMethod === 'stripe' ? 'IBAN' : withdrawMethod === 'paypal' ? 'Email Address' : 'Wallet Address'}
                            </label>
                            <input 
                                type="text"
                                value={withdrawTarget}
                                onChange={(e) => setWithdrawTarget(e.target.value)}
                                placeholder={withdrawMethod === 'stripe' ? 'CH...' : withdrawMethod === 'paypal' ? 'user@example.com' : '0x...'}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                            />
                        </div>

                        {biometricStep === 'failed' && (
                             <div className="bg-red-900/20 border border-red-700/50 p-3 rounded-lg flex items-center gap-2 animate-shake">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <p className="text-xs text-red-300 font-bold">Biometric Match Failed. Not Owner.</p>
                             </div>
                        )}

                        <button 
                            onClick={() => {
                                const amt = parseFloat(withdrawAmount);
                                if (!amt || amt <= 0 || !withdrawTarget) {
                                    alert("Please enter amount and target.");
                                    return;
                                }
                                if (amt > balance) {
                                    alert("Insufficient funds.");
                                    return;
                                }
                                startBiometricAuth();
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-all gap-2"
                        >
                            <Fingerprint className="w-5 h-5" />
                            Biometric Auth & Send
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        {biometricStep === 'scanning' && (
                            <>
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-emerald-500/30 rounded-full animate-pulse"></div>
                                    <ScanFace className="w-10 h-10 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-white text-lg">Verifying Identity...</p>
                                    <p className="text-xs text-gray-400">Comparing with owner: {AUTHORIZED_NAME}</p>
                                </div>
                            </>
                        )}

                        {biometricStep === 'success' && (
                            <>
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center animate-bounce">
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-white text-lg">Identity Confirmed</p>
                                    <p className="text-xs text-emerald-400">Processing {withdrawMethod.toUpperCase()} Transfer...</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
};

export default VirtualBank;