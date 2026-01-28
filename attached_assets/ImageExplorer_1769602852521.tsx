
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Language } from '../types';

interface ImageExplorerProps {
  targetLanguage: Language;
}

const ImageExplorer: React.FC<ImageExplorerProps> = ({ targetLanguage }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
            { text: `Identify the main objects in this image and provide their names and brief descriptions in ${targetLanguage.name}. Format the output with bold headers and bullet points.` }
          ]
        }
      });

      setAnalysis(response.text || "No analysis available.");
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="glass rounded-[40px] p-8 shadow-sm flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors group relative overflow-hidden h-96">
            {image ? (
              <>
                <img src={image} className="absolute inset-0 w-full h-full object-cover rounded-[38px] opacity-20" alt="" />
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                   <img src={image} className="max-h-full max-w-full rounded-2xl shadow-xl border-4 border-white" alt="Uploaded" />
                </div>
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 shadow-sm"
                >
                  <i className="fas fa-times"></i>
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center cursor-pointer">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fas fa-cloud-upload-alt text-3xl"></i>
                </div>
                <span className="font-bold text-slate-700">Upload an image</span>
                <span className="text-sm text-slate-400 mt-1">Practice vocabulary in context</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>
          
          {image && !analysis && (
            <button 
              onClick={analyzeImage}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:bg-slate-300"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
              {loading ? 'Analyzing Content...' : 'Learn from Image'}
            </button>
          )}
        </div>

        <div className="flex-1 glass rounded-[40px] p-8 shadow-sm border border-slate-100 min-h-[400px]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fas fa-language text-indigo-500"></i>
            Visual Context Vocabulary
          </h3>
          
          {!analysis && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <i className="fas fa-image text-4xl mb-4 opacity-20"></i>
              <p>Upload a photo of your surroundings or an interesting scene to get personalized vocabulary in {targetLanguage.name}.</p>
            </div>
          ) : loading ? (
            <div className="space-y-6">
              <div className="h-4 w-3/4 bg-slate-100 rounded-full animate-pulse"></div>
              <div className="h-4 w-1/2 bg-slate-100 rounded-full animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-20 w-full bg-slate-50 rounded-2xl animate-pulse"></div>
                <div className="h-20 w-full bg-slate-50 rounded-2xl animate-pulse"></div>
              </div>
            </div>
          ) : (
            <div className="prose prose-indigo max-w-none text-slate-700">
              <div className="whitespace-pre-wrap leading-relaxed">
                {analysis}
              </div>
              <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-700 italic">
                Tips: Try photos of grocery stores, parks, or street signs for practical learning.
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center font-medium">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageExplorer;
