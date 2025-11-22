import React, { useState } from 'react';
import { Upload, ImageIcon, Video, Loader2, Download, Zap, Sparkles, Wand2, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { generateMagicImage } from '../services/gemini';
import { updateImageCount } from '../services/firebase';

const SCENARIOS = [
  { label: "Rainy Passion", text: "A passionate kiss in the pouring rain, dramatic backlighting, water droplets, photorealistic, 8k." },
  { label: "Cozy Winter", text: "Cuddling by a fireplace in a log cabin, snow outside window, warm fire glow, knitted sweaters, intimate." },
  { label: "Sunset Walk", text: "Walking hand in hand on a beach at golden hour, long shadows, soft ocean breeze, romantic atmosphere." },
  { label: "Neon City", text: "Embracing in a cyberpunk city street, neon signs reflecting in puddles, futuristic fashion, cinematic depth of field." },
  { label: "Picnic Date", text: "Lying on grass in a sunny park, cherry blossoms falling, soft natural light, pastel colors, dreamy." },
];

const MODIFIERS = [
  "Cinematic Lighting", "Photorealistic", "8k", "Soft Focus", 
  "Vintage Film", "Dramatic Shadows", "Ethereal", "Vibrant Colors",
  "Black & White", "Oil Painting Style"
];

const ImageGenerator = () => {
  const { anyaProfile, imageGenerationCount, userId, setAppMode } = useAppContext();
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Make them kiss passionately in the rain, cinematic lighting.');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'static' | 'video'>('static');

  const FREE_LIMIT = 3;
  const isLimitReached = !anyaProfile.isPremium && imageGenerationCount >= FREE_LIMIT;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip prefix for API usage later
        setBase64Image(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!base64Image || !prompt) return;
    if (isLimitReached) {
      setAppMode('upgrade');
      return;
    }

    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      if (mode === 'video') {
        // Video generation requires Veo or specific video models. 
        // For this demo/prototype, we simulate video generation delay as requested by user logic,
        // or use a placeholder since Veo integration is complex for this snippet scope.
        await new Promise(r => setTimeout(r, 4000));
        setResultUrl("https://placehold.co/600x400/1e293b/ec4899?text=Video+Generated+(Simulation)");
      } else {
        const url = await generateMagicImage(base64Image, prompt);
        if (url) {
          setResultUrl(url);
          if (userId && !anyaProfile.isPremium) {
             updateImageCount(userId, imageGenerationCount + 1);
          }
        } else {
          setError("Failed to generate image. Try a different prompt.");
        }
      }
    } catch (e) {
      setError("Generation failed due to API constraints or content policy.");
    } finally {
      setLoading(false);
    }
  };

  const addModifier = (mod: string) => {
    setPrompt(prev => {
      const trimmed = prev.trim();
      if (trimmed.includes(mod)) return trimmed; // Avoid duplicates
      const separator = trimmed && !trimmed.endsWith(',') ? ', ' : ' ';
      return trimmed + separator + mod;
    });
  };

  return (
    <div className="h-full flex flex-col p-6 bg-gray-900/50 rounded-xl overflow-y-auto">
      <div className="mb-6 border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-pink-500 flex items-center gap-2">
          <ImageIcon className="w-6 h-6" /> 
          Haptic Memory Generator
        </h2>
        <p className="text-gray-400 text-sm mt-1">Upload a photo to reimagine a memory with Anya.</p>
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-gray-800 p-1 rounded-lg w-max mb-6 mx-auto">
        <button 
          onClick={() => setMode('static')} 
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${mode === 'static' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
        >
          <ImageIcon className="w-4 h-4 inline mr-2"/> Static Image
        </button>
        <button 
          onClick={() => setMode('video')} 
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${mode === 'video' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
        >
          <Video className="w-4 h-4 inline mr-2"/> Motion Memory
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className={`border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center transition-colors ${base64Image ? 'border-green-500/50 bg-green-900/10' : 'border-gray-700 hover:border-pink-500/50 hover:bg-gray-800'}`}>
            <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-sm text-gray-400 font-medium">{base64Image ? 'Image Loaded' : 'Upload Source Image'}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={loading} />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-300">Prompt</label>
              <span className="text-xs text-gray-500">Describe the memory</span>
            </div>
            
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-pink-500 focus:outline-none h-24 resize-none"
              placeholder="e.g. Dancing in a ballroom..."
            />

            {/* Prompt Builder UI */}
            <div className="space-y-3 pt-2">
              
              {/* Scenarios (Quick Start) */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1 text-yellow-500" /> Quick Scenarios
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                  {SCENARIOS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(s.text)}
                      className="whitespace-nowrap px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-pink-500/50 rounded-lg text-xs text-gray-300 transition-all flex-shrink-0"
                      title={s.text}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modifiers (Builder) */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2 flex items-center">
                  <Wand2 className="w-3 h-3 mr-1 text-indigo-400" /> Enhancers
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MODIFIERS.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => addModifier(m)}
                      className="px-2 py-1 bg-gray-800/50 hover:bg-indigo-900/30 border border-gray-700/50 hover:border-indigo-500/50 rounded text-[10px] text-gray-400 hover:text-indigo-200 transition-all flex items-center"
                    >
                      <Plus className="w-2 h-2 mr-1 opacity-50" /> {m}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !base64Image || !prompt}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center shadow-lg transition-all
              ${loading || !base64Image ? 'bg-gray-700 text-gray-500' : 'bg-pink-600 hover:bg-pink-500 text-white'}
            `}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Zap className="w-5 h-5 mr-2" />}
            {loading ? 'Dreaming...' : 'Generate Memory'}
          </button>
          
          {isLimitReached && (
            <p className="text-center text-xs text-yellow-500 mt-2">Free limit reached. Upgrade to generate more.</p>
          )}
          {error && <p className="text-center text-xs text-red-400 mt-2">{error}</p>}
        </div>

        {/* Result Section */}
        <div className="bg-gray-950 rounded-xl border border-gray-800 flex items-center justify-center min-h-[300px] relative overflow-hidden">
           {resultUrl ? (
             <>
               <img src={resultUrl} alt="Generated" className="w-full h-full object-contain" />
               <a href={resultUrl} download="anya_memory.png" className="absolute bottom-4 right-4 bg-gray-900/80 p-2 rounded-full text-white hover:bg-pink-600 transition">
                 <Download className="w-5 h-5" />
               </a>
             </>
           ) : (
             <div className="text-center p-6">
               <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  {mode === 'video' ? <Video className="w-8 h-8 text-gray-700" /> : <ImageIcon className="w-8 h-8 text-gray-700" />}
               </div>
               <p className="text-gray-600 text-sm">Your visualization will appear here.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;