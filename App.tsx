
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Scene } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { PlusIcon, TrashIcon, LoaderIcon, WandSparklesIcon, PlayIcon } from './components/icons';
import { translations } from './translations';

// Fix: Added readonly modifier to the 'aistudio' property on the Window interface
// to resolve the TypeScript error "All declarations of 'aistudio' must have identical modifiers."
declare global {
    interface Window {
        readonly aistudio: AIStudio;
    }
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
}

type AspectRatio = '16:9' | '9:16';

const App: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [characterDescription, setCharacterDescription] = useState<string>('');
    const [characterImage, setCharacterImage] = useState<File | null>(null);
    const [characterImageB64, setCharacterImageB64] = useState<string | null>(null);
    const [storyIdea, setStoryIdea] = useState<string>('');
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);

    const [scenes, setScenes] = useState<Scene[]>([
        { id: 1, description: '', generatedPrompt: '', videoUrl: null, thumbnailUrl: null, isLoading: false, error: null },
    ]);
    const [language, setLanguage] = useState<'en' | 'vi'>('vi');
    const [videoDuration, setVideoDuration] = useState<number>(1);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

    const t = useCallback((key: string, params?: { [key: string]: string | number }) => {
        let str = translations[language][key] || key;
        if (params) {
            Object.keys(params).forEach(pKey => {
                str = str.replace(`{${pKey}}`, String(params[pKey]));
            });
        }
        return str;
    }, [language]);


    const checkApiKey = useCallback(async () => {
        try {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        } catch (error) {
            console.error('Error checking for API key:', error);
            setApiKeySelected(false);
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true); 
        } catch (error) {
            console.error('Error opening API key selection:', error);
        }
    };
    
    const handleAddScene = () => {
        setScenes([
            ...scenes,
            { id: Date.now(), description: '', generatedPrompt: '', videoUrl: null, thumbnailUrl: null, isLoading: false, error: null },
        ]);
    };

    const handleRemoveScene = (id: number) => {
        setScenes(scenes.filter((scene) => scene.id !== id));
    };

    const handleSceneDescriptionChange = (id: number, description: string) => {
        setScenes(
            scenes.map((scene) => (scene.id === id ? { ...scene, description } : scene))
        );
    };
    
    const handleGeneratedPromptChange = (id: number, prompt: string) => {
        setScenes(
            scenes.map((scene) => (scene.id === id ? { ...scene, generatedPrompt: prompt } : scene))
        );
    };
    
    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCharacterImage(file);
            try {
                const base64 = await fileToBase64(file);
                setCharacterImageB64(base64);
            } catch (error) {
                console.error("Error converting file to base64:", error);
                setCharacterImageB64(null);
            }
        }
    };

    const handleGenerateScriptFromIdea = async () => {
        if (!storyIdea.trim()) {
            alert(t('storyIdeaRequiredError'));
            return;
        }

        setIsGeneratingScript(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                You are a scriptwriter for short videos. Your task is to take a story idea and a target duration and break it down into a series of distinct scenes.

                Story Idea: "${storyIdea}"
                Target Video Duration: ${videoDuration} minutes.

                Based on the duration, decide on an appropriate number of scenes (e.g., 2-4 scenes per minute). For each scene, write a concise one or two-sentence description of the action involving the main character.

                The output must be a valid JSON array of strings, where each string is a scene description.
            `;

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                },
            });
            
            const sceneDescriptions: string[] = JSON.parse(result.text.trim());
            const newScenes: Scene[] = sceneDescriptions.map((desc, index) => ({
                id: Date.now() + index,
                description: desc,
                generatedPrompt: '',
                videoUrl: null,
                thumbnailUrl: null,
                isLoading: false,
                error: null,
            }));
            
            if (newScenes.length > 0) {
              setScenes(newScenes);
            } else {
              throw new Error("AI did not generate any scenes.");
            }

        } catch (error: any) {
            console.error('An error occurred during script generation:', error);
            alert(t('genericError', { message: error.message }));
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleGeneratePrompts = async () => {
        if (!characterDescription.trim() || !characterImageB64 || scenes.some(s => !s.description.trim())) {
            alert(t('formValidationError'));
            return;
        }

        setIsGeneratingPrompts(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const sceneDescriptions = scenes.map(s => `Scene ID ${s.id}: ${s.description}`).join('\n');
            const promptGenerationPrompt = `
                You are a creative assistant for video production. Your task is to generate video prompts for the Veo 3.1 model based on a character description, a reference image, and a series of scene descriptions. The most important goal is to maintain character consistency across all scenes. The final combined video from all scenes should be approximately ${videoDuration} minute(s) long, so pace the prompts for each scene accordingly.

                Character Description: "${characterDescription}"
                (A reference image of the character will be provided to the video model.)

                Scene Descriptions:
                ${sceneDescriptions}

                Generate a detailed, high-quality video prompt for each scene. The prompt should incorporate the character description seamlessly. The output must be a valid JSON array of objects, where each object has "id" (the original scene ID as a number) and "prompt" (the generated string prompt).
            `;
            
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: promptGenerationPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.NUMBER },
                                prompt: { type: Type.STRING },
                            },
                            required: ['id', 'prompt']
                        },
                    },
                }
            });

            const generatedPrompts: {id: number, prompt: string}[] = JSON.parse(result.text.trim());
            
            const updatedScenesWithPrompts = scenes.map(scene => {
                const foundPrompt = generatedPrompts.find(p => p.id === scene.id);
                return foundPrompt ? { ...scene, generatedPrompt: foundPrompt.prompt } : scene;
            });
            setScenes(updatedScenesWithPrompts);

        } catch (error: any) {
            console.error('An error occurred during prompt generation:', error);
            alert(t('genericError', { message: error.message }));
        } finally {
            setIsGeneratingPrompts(false);
        }
    };
    
    const handleGenerateVideo = async (sceneId: number) => {
        const sceneToProcess = scenes.find(s => s.id === sceneId);
        if (!sceneToProcess || !characterImageB64 || !characterImage) return;

        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isLoading: true, error: null } : s));

        try {
            const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let operation = await videoAi.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: sceneToProcess.generatedPrompt,
                image: {
                    imageBytes: characterImageB64,
                    mimeType: characterImage.type,
                },
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio,
                }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await videoAi.operations.getVideosOperation({ operation: operation });
            }

            const generatedVideo = operation.response?.generatedVideos?.[0];
            const downloadLink = generatedVideo?.video?.uri;
            const thumbnailLink = generatedVideo?.thumbnail?.uri;
            
            let finalThumbnailUrl = null;
            if (thumbnailLink) {
                try {
                     const thumbnailResponse = await fetch(`${thumbnailLink}&key=${process.env.API_KEY}`);
                     const thumbnailBlob = await thumbnailResponse.blob();
                     finalThumbnailUrl = URL.createObjectURL(thumbnailBlob);
                } catch (thumbError) {
                    console.warn(`Could not fetch thumbnail for scene ${sceneId}:`, thumbError)
                }
            }

            if (downloadLink) {
                const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                const videoBlob = await videoResponse.blob();
                const videoUrl = URL.createObjectURL(videoBlob);
                setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, videoUrl, thumbnailUrl: finalThumbnailUrl, isLoading: false } : s));
            } else {
                 throw new Error('Video generation finished but no download link was provided.');
            }
        } catch (err: any) {
            console.error(`Error generating video for scene ${sceneId}:`, err);
            const errorMessage = err.message || 'An unknown error occurred.';
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isLoading: false, error: errorMessage } : s));
            if (errorMessage.includes("Requested entity was not found")) {
                setApiKeySelected(false);
                alert(t('invalidApiKeyError'));
            }
        }
    };
    
    const isAnyVideoLoading = scenes.some(s => s.isLoading);
    const isFormDisabled = isGeneratingPrompts || isAnyVideoLoading;

    if (!apiKeySelected) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-lg text-center">
                    <h1 className="text-3xl font-bold mb-4 text-cyan-400">{t('welcome')}</h1>
                    <p className="mb-6 text-gray-300">{t('apiKeyPrompt')}</p>
                    <p className="mb-6 text-sm text-gray-400">{t('billingInfo')} <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">ai.google.dev/gemini-api/docs/billing</a>.</p>
                    <button
                        onClick={handleSelectKey}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                        {t('selectApiKey')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="flex justify-between items-center">
                        <div className="text-left">
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                                {t('title')}
                            </h1>
                            <p className="mt-2 text-lg text-gray-400">{t('subtitle')}</p>
                        </div>
                        <div className="flex space-x-2">
                             <button onClick={() => setLanguage('vi')} className={`px-3 py-1 text-sm rounded-md transition-colors ${language === 'vi' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Tiếng Việt</button>
                             <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm rounded-md transition-colors ${language === 'en' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>English</button>
                        </div>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex flex-col gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-3 text-cyan-300">{t('defineCharacterTitle')}</h2>
                            <textarea
                                value={characterDescription}
                                onChange={(e) => setCharacterDescription(e.target.value)}
                                placeholder={t('characterDescriptionPlaceholder')}
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                rows={4}
                                disabled={isFormDisabled}
                            />
                        </div>
                         <div>
                            <h3 className="text-xl font-semibold mb-2">{t('videoDurationTitle')}</h3>
                             <input
                                 type="number"
                                 value={videoDuration}
                                 onChange={(e) => setVideoDuration(Math.max(1, Number(e.target.value)))}
                                 min="1"
                                 className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                 disabled={isFormDisabled}
                             />
                         </div>
                        
                        <div>
                           <h3 className="text-xl font-semibold mb-2">{t('aspectRatioTitle')}</h3>
                           <div className="flex space-x-2">
                               <button
                                   onClick={() => setAspectRatio('16:9')}
                                   disabled={isFormDisabled}
                                   className={`flex-1 text-center py-2 px-4 rounded-lg transition-colors ${aspectRatio === '16:9' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                               >
                                   16:9 ({t('landscape')})
                               </button>
                               <button
                                   onClick={() => setAspectRatio('9:16')}
                                   disabled={isFormDisabled}
                                   className={`flex-1 text-center py-2 px-4 rounded-lg transition-colors ${aspectRatio === '9:16' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                               >
                                   9:16 ({t('portrait')})
                               </button>
                           </div>
                        </div>

                        <div>
                           <h3 className="text-xl font-semibold mb-3">{t('characterReferenceImageTitle')}</h3>
                           <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                               <div className="space-y-1 text-center">
                                    {characterImageB64 ? (
                                        <img src={`data:image/png;base64,${characterImageB64}`} alt="Character Preview" className="mx-auto h-32 w-32 object-cover rounded-md"/>
                                    ) : (
                                       <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                           <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                       </svg>
                                    )}
                                    <div className="flex text-sm text-gray-500">
                                       <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-cyan-400 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-cyan-500">
                                           <span>{t('uploadImage')}</span>
                                           <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg" disabled={isFormDisabled}/>
                                       </label>
                                       <p className="pl-1">{t('dragAndDrop')}</p>
                                   </div>
                                   <p className="text-xs text-gray-600">{t('imageFormatInfo')}</p>
                               </div>
                           </div>
                        </div>
                        
                        <div>
                           <h2 className="text-2xl font-bold mb-3 text-cyan-300">{t('generateScriptTitle')}</h2>
                           <textarea
                                value={storyIdea}
                                onChange={(e) => setStoryIdea(e.target.value)}
                                placeholder={t('storyIdeaPlaceholder')}
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                rows={3}
                                disabled={isFormDisabled || isGeneratingScript}
                            />
                            <button
                                onClick={handleGenerateScriptFromIdea}
                                disabled={isFormDisabled || isGeneratingScript || !storyIdea.trim()}
                                className="mt-3 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingScript ? <LoaderIcon className="w-5 h-5"/> : <WandSparklesIcon className="w-5 h-5"/>}
                                {isGeneratingScript ? t('generatingScriptButton') : t('generateScriptButton')}
                            </button>
                        </div>


                        <div>
                            <h2 className="text-2xl font-bold mb-3 text-cyan-300">{t('editScenesTitle')}</h2>
                            <div className="space-y-4">
                                {scenes.map((scene, index) => (
                                    <div key={scene.id} className="bg-gray-900/70 p-4 rounded-lg flex items-start gap-3">
                                        <span className="font-bold text-lg text-gray-400 mt-2">{index + 1}.</span>
                                        <textarea
                                            value={scene.description}
                                            onChange={(e) => handleSceneDescriptionChange(scene.id, e.target.value)}
                                            placeholder={t('scenePlaceholder', { index: index + 1 })}
                                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md flex-grow focus:ring-1 focus:ring-cyan-500"
                                            rows={2}
                                            disabled={isFormDisabled}
                                        />
                                        <button 
                                            onClick={() => handleRemoveScene(scene.id)} 
                                            className="p-2 text-gray-500 hover:text-red-500 disabled:opacity-50"
                                            disabled={scenes.length <= 1 || isFormDisabled}
                                        >
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddScene} disabled={isFormDisabled} className="mt-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors disabled:opacity-50">
                                <PlusIcon className="w-5 h-5"/>
                                {t('addScene')}
                            </button>
                        </div>
                        
                        <div className="mt-auto pt-6">
                            <button 
                                onClick={handleGeneratePrompts} 
                                disabled={isFormDisabled || !characterDescription.trim() || !characterImageB64 || scenes.some(s => !s.description.trim())}
                                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-lg text-lg hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                {isGeneratingPrompts ? <LoaderIcon className="w-6 h-6"/> : <WandSparklesIcon className="w-6 h-6"/>}
                                {isGeneratingPrompts ? t('generatingPromptsButton') : t('generatePromptsButton')}
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 text-purple-300">{t('storyboardTitle')}</h2>
                        {scenes.every(s => !s.generatedPrompt && !s.videoUrl && !s.isLoading) ? (
                            <div className="flex items-center justify-center h-full text-center text-gray-500">
                                <p>{t('storyboardPlaceholder')}</p>
                            </div>
                        ) : (
                            <div className="space-y-6 overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
                                {scenes.map((scene, index) => (
                                    <div key={scene.id} className="bg-gray-900/70 p-4 rounded-lg">
                                        <h3 className="font-bold text-lg mb-2">{t('sceneTitle', { index: index + 1 })}</h3>
                                        {scene.generatedPrompt && (
                                            <div className="mb-4">
                                                <label className="text-sm font-semibold text-gray-400 mb-1 block">{t('generatedPromptTitle')}</label>
                                                <textarea 
                                                    value={scene.generatedPrompt}
                                                    onChange={(e) => handleGeneratedPromptChange(scene.id, e.target.value)}
                                                    className="w-full text-sm bg-gray-800 p-3 rounded-md border border-gray-700 focus:ring-1 focus:ring-purple-500"
                                                    rows={3}
                                                    disabled={isAnyVideoLoading}
                                                />
                                            </div>
                                        )}
                                        <div className="aspect-video bg-gray-950 rounded-lg flex items-center justify-center relative">
                                            {scene.thumbnailUrl && !scene.videoUrl ? (
                                                <img src={scene.thumbnailUrl} alt="Video thumbnail preview" className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                !scene.isLoading && !scene.error && !scene.videoUrl && <p className="text-gray-600 text-sm">{t('videoPlaceholder')}</p>
                                            )}
                                            {scene.isLoading && (
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center">
                                                    <LoaderIcon className="w-10 h-10 mx-auto text-cyan-400"/>
                                                    <p className="mt-2 text-sm text-white">{t('generatingVideo')}</p>
                                                    <p className="text-xs text-gray-300">{t('generatingVideoSubtext')}</p>
                                                </div>
                                            )}
                                            {scene.error && (
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center text-red-400 p-4">
                                                    <p className="font-bold">{t('videoFailed')}</p>
                                                    <p className="text-xs mt-1">{scene.error}</p>
                                                </div>
                                            )}
                                            {scene.videoUrl && (
                                                <video src={scene.videoUrl} controls className="absolute inset-0 w-full h-full rounded-lg" />
                                            )}
                                        </div>
                                        {scene.generatedPrompt && !scene.videoUrl && !scene.isLoading && (
                                            <div className="mt-3">
                                                <button 
                                                    onClick={() => handleGenerateVideo(scene.id)}
                                                    disabled={isAnyVideoLoading}
                                                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <PlayIcon className="w-5 h-5" />
                                                    {t('generateVideoButton')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
