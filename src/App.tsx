import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Smartphone, 
  Download, 
  RefreshCw, 
  X, 
  Plus, 
  Heart, 
  Clock, 
  Trash2, 
  Eye, 
  Maximize2,
  Lock,
  Sun,
  Camera,
  Layers,
  HelpCircle,
  HelpCircleIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
interface Wallpaper {
  id: string;
  title: string;
  prompt: string;
  url: string;
  isFavorite?: boolean;
}

interface SavedVibe {
  vibe: string;
  timestamp: string;
}

// Preset Vibes
const PRESET_VIBES = [
  {
    name: "Minimalist Nature",
    description: "clean lines, muted greens, subtle textures, abstract mountains, serene, minimalist design, phone layout",
    tag: "Minimalist",
    color: "from-emerald-800 to-zinc-900"
  },
  {
    name: "Retro Futurism",
    description: "neon grids, glowing synthwave skies, hover cars, digital sunset, chrome finishes, retro-futuristic arcade aesthetic",
    tag: "80s Synth",
    color: "from-fuchsia-600 to-indigo-950"
  },
  {
    name: "Cozy Reading Nook",
    description: "warm soft candle light, bookshelves stacked with vintage bindings, steaming coffee mug, pouring rain on window glass, dark academia aesthetic",
    tag: "Cozy",
    color: "from-amber-700 to-stone-900"
  },
  {
    name: "Cyberpunk Cityscape",
    description: "rainy dark urban high-rise, towering holographic billboards, neon purple and teal streams, wet street reflections, sprawling lo-fi dystopia",
    tag: "Cyberpunk",
    color: "from-blue-600 to-slate-900"
  },
  {
    name: "Aesthetic Vaporwave",
    description: "retro 90s digital glitch art, pastel lavender pink sunsets, ancient Greek marble statue, floating iridescent CDs, surreal lo-fi grids",
    tag: "Vaporwave",
    color: "from-pink-500 to-purple-600"
  },
  {
    name: "Whimsical Ghibli Meadow",
    description: "rolling green grass hills, fluffy cumulonimbus clouds, vibrant yellow dandelions, hand-drawn warm animated art style, bright sunny nostalgia",
    tag: "Anime",
    color: "from-sky-400 to-yellow-600"
  },
  {
    name: "Abstract Geometric",
    description: "overlapping translucent modern circles, pastel color blocking, gold foil subtle accents, mid-century clean lines, neutral beige ground",
    tag: "Abstract",
    color: "from-stone-500 to-stone-850"
  },
  {
    name: "Ethereal Dreamscape",
    description: "floating magical lavender islands, starry midnight violet twilight sky, pastel pink dust clouds, astronomical celestial maps",
    tag: "Ethereal",
    color: "from-indigo-900 to-fuchsia-950"
  },
  {
    name: "Pixel Cyber-Café",
    description: "cute 16-bit pixel art workspace interior, warm neon lamps, steaming coffee mug, rainy glass backdrop, cute retro-gaming setup",
    tag: "Pixel Art",
    color: "from-violet-800 to-slate-950"
  },
  {
    name: "Terracotta Bohemian",
    description: "warm clay terracotta flower pots, abstract arches, sun-baked desert organic shapes, palm leaves shadow, modern bohemian poster canvas",
    tag: "Bohemian",
    color: "from-orange-700 to-stone-950"
  }
];

export default function App() {
  // State
  const [vibeInput, setVibeInput] = useState("");
  const [currentWallpapers, setCurrentWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Remix State
  const [referenceImage, setReferenceImage] = useState<Wallpaper | null>(null);
  const [remixPrompt, setRemixPrompt] = useState("");

  // Detailed view
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [showLockscreen, setShowLockscreen] = useState(false);
  
  // Saved / History Collections
  const [savedWallpapers, setSavedWallpapers] = useState<Wallpaper[]>([]);
  const [recentVibes, setRecentVibes] = useState<SavedVibe[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");

  // Multi-step loading simulator
  const loadingSteps = [
    "1. Sparking creative art direction...",
    "2. Generating 4 distinct wallpaper concepts...",
    "3. Fine-tuning prompt compositions...",
    "4. Drawing high-fidelity 9:16 canvases via Imagen...",
    "5. Rendering wallpapers, almost there..."
  ];

  // Load from local storage on mount
  useEffect(() => {
    const historicalWallpapers = localStorage.getItem("generated_wallpapers");
    const historicalVibes = localStorage.getItem("recent_vibes");
    if (historicalWallpapers) {
      try {
        setSavedWallpapers(JSON.parse(historicalWallpapers));
      } catch (e) {
        console.error("Error loading saved wallpapers:", e);
      }
    }
    if (historicalVibes) {
      try {
        setRecentVibes(JSON.parse(historicalVibes));
      } catch (e) {
        console.error("Error loading recent vibes:", e);
      }
    }
  }, []);

  // Sync state to local storage
  const saveWallpapersToLocal = (newWallpapers: Wallpaper[]) => {
    setSavedWallpapers(newWallpapers);
    localStorage.setItem("generated_wallpapers", JSON.stringify(newWallpapers));
  };

  // Step interval simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle core generate function
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const inputVal = referenceImage ? (remixPrompt || "creative variation") : vibeInput;
    if (!inputVal && !referenceImage) {
      setErrorMessage("Please select a preset, type a custom vibe, or edit an image to start drawing.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setCurrentWallpapers([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vibe: inputVal,
          referenceImage: referenceImage?.url || null,
          remixPrompt: referenceImage ? remixPrompt : null
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "An error occurred while generating your wallpapers.");
      }

      const generated: Wallpaper[] = data.wallpapers || [];
      setCurrentWallpapers(generated);
      
      // Save vibe to history if it's new and not a remix
      if (!referenceImage && vibeInput) {
        const queryClean = vibeInput.trim();
        const updatedVibes = [
          { vibe: queryClean, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...recentVibes.filter(v => v.vibe !== queryClean)
        ].slice(0, 8); // Keep last 8
        setRecentVibes(updatedVibes);
        localStorage.setItem("recent_vibes", JSON.stringify(updatedVibes));
      }

      // Automatically store in historical collection so users can browse them later
      const newSavedCollection = [
        ...generated.map(wp => ({ ...wp, isFavorite: false })),
        ...savedWallpapers
      ];
      saveWallpapersToLocal(newSavedCollection);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to establish a secure connection with the wallpaper neural drawer. Please check your Gemini settings or try with a simpler vibe description.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Download
  const triggerDownload = (wallpaper: Wallpaper) => {
    try {
      const link = document.createElement("a");
      link.href = wallpaper.url;
      link.download = `wallpaper_${wallpaper.title.toLowerCase().replace(/\s+/g, "_") || "render"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      // In some environments, opening the data url in a new tab is a standard fallback
      window.open(wallpaper.url, "_blank");
    }
  };

  // Handle turning selected wallpaper into remix reference
  const triggerRemix = (wallpaper: Wallpaper) => {
    setReferenceImage(wallpaper);
    setRemixPrompt("");
    setSelectedWallpaper(null);
    setVibeInput("");
    setActiveTab("generate");
    
    // Scroll smoothly to generator panel
    const genSection = document.getElementById("generator-panel");
    if (genSection) {
      genSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Cancel remixing mode
  const cancelRemix = () => {
    setReferenceImage(null);
    setRemixPrompt("");
  };

  // Toggle favorite wallpaper status
  const toggleFavorite = (wallpaperId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = savedWallpapers.map(wp => {
      if (wp.id === wallpaperId) {
        return { ...wp, isFavorite: !wp.isFavorite };
      }
      return wp;
    });
    saveWallpapersToLocal(updated);
    
    // Update local state if the currently reviewed wallpaper is favorited
    if (selectedWallpaper && selectedWallpaper.id === wallpaperId) {
      setSelectedWallpaper(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  // Delete wallpaper from collections
  const deleteWallpaper = (wallpaperId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = savedWallpapers.filter(wp => wp.id !== wallpaperId);
    saveWallpapersToLocal(updated);
    if (selectedWallpaper && selectedWallpaper.id === wallpaperId) {
      setSelectedWallpaper(null);
    }
  };

  // Format date helper for real-time mobile overlay clock
  const getSimulatedDateString = () => {
    const d = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      
      {/* Upper Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold tracking-tight bg-gradient-to-r from-slate-200 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                AetherVibe
              </h1>
              <p className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">
                9:16 Neural Wallpaper Canvas
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800/60">
            <button
              onClick={() => setActiveTab("generate")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "generate"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Drawer
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "saved"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Gallery
              {savedWallpapers.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-[10px] text-slate-400 font-mono font-bold">
                  {savedWallpapers.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Spark Banner */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900/40 to-slate-950 border border-slate-900/80 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono mb-3">
              <Smartphone className="w-3.5 h-3.5" /> High Definition Aspect Ratio (9:16)
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-white tracking-tight leading-tight">
              Craft beautiful workspaces for your phone.
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-2 font-sans font-light leading-relaxed">
              Describe any color tone, aesthetic style, or emotional vibe. Our neural artist generates 4 high-resolution vertical canvases ready for lockscreen previews and iterative variations.
            </p>
          </div>
          
          <div className="relative z-10 flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {PRESET_VIBES.slice(0, 3).map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setVibeInput(v.description);
                  cancelRemix();
                }}
                className="flex-shrink-0 flex flex-col justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left hover:border-slate-700/80 transition-all duration-300 w-28 h-28 cursor-pointer relative group overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${v.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <span className="text-[10px] font-mono text-indigo-400 font-medium tracking-wide">#{v.tag}</span>
                <span className="text-xs font-display font-semibold text-slate-200 group-hover:text-white line-clamp-2 mt-2 leading-snug">{v.name}</span>
              </button>
            ))}
          </div>
          
          <div className="absolute right-0 bottom-0 top-0 w-96 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            <AnimatePresence mode="wait">
              {activeTab === "generate" ? (
                <motion.div
                  key="generator-pane"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  id="generator-panel"
                  className={`p-6 rounded-2xl border bg-slate-900/40 relative backdrop-blur-sm shadow-xl ${
                    referenceImage 
                      ? "border-amber-500/30 ring-1 ring-amber-500/20 shadow-amber-500/5" 
                      : "border-slate-900"
                  }`}
                >
                  
                  {/* Remix Visual Indicator */}
                  {referenceImage && (
                    <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 relative overflow-hidden">
                      <div className="w-12 aspect-9-16 bg-slate-950 rounded-lg overflow-hidden border border-amber-500/30 flex-shrink-0 relative">
                        <img 
                          src={referenceImage.url} 
                          alt="Reference artwork" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-amber-500/10" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                          Remix Active
                        </span>
                        <h4 className="text-xs font-display font-medium text-slate-200 mt-1 truncate">
                          Reference: "{referenceImage.title}"
                        </h4>
                        <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                          {referenceImage.prompt}
                        </p>
                      </div>
                      <button
                        onClick={cancelRemix}
                        className="p-1 rounded bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 absolute top-2 right-2 cursor-pointer"
                        title="Cancel remix mode"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      {referenceImage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                          Transform Reference Vibe
                        </>
                      ) : (
                        <>
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          Define The Aesthetic
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono italic">
                      9:16 vertical mode
                    </span>
                  </div>

                  <form onSubmit={handleGenerate} className="space-y-4">
                    {/* Prompt input field */}
                    <div>
                      {referenceImage ? (
                        <textarea
                          value={remixPrompt}
                          onChange={(e) => setRemixPrompt(e.target.value)}
                          placeholder="E.g., change style to ink sketch, add green neon glowing foliage, make it sunny..."
                          className="w-full h-28 p-4 rounded-xl bg-slate-950 border border-amber-500/20 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50 text-slate-200 placeholder-slate-500 text-sm focus:outline-none resize-none transition-all leading-relaxed"
                          disabled={isLoading}
                        />
                      ) : (
                        <textarea
                          value={vibeInput}
                          onChange={(e) => setVibeInput(e.target.value)}
                          placeholder="Describe your wallpaper vibe... (e.g., 'minimalist vector landscape of sand dunes in soft sage green, quiet moody atmosphere')"
                          className="w-full h-28 p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50 text-slate-200 placeholder-slate-500 text-sm focus:outline-none resize-none transition-all leading-relaxed"
                          maxLength={350}
                          disabled={isLoading}
                        />
                      )}
                      
                      {!referenceImage && (
                        <div className="flex justify-between items-center mt-1.5 px-1">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {vibeInput.length}/350 chars
                          </span>
                          {vibeInput && (
                            <button
                              type="button"
                              onClick={() => setVibeInput("")}
                              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick presets expansion */}
                    {!referenceImage && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                          Explore Vibe Presets
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {PRESET_VIBES.map((preset, index) => {
                            const isSelected = vibeInput === preset.description;
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setVibeInput(preset.description);
                                  cancelRemix();
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                  isSelected
                                    ? "bg-indigo-600 border-indigo-500 text-white"
                                    : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                                }`}
                              >
                                {preset.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Submit generate button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-3.5 px-4 rounded-xl font-display font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        isLoading
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750"
                          : referenceImage
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold hover:brightness-110 active:scale-[0.98]"
                          : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] shadow-lg shadow-indigo-650/20"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                          Painting Wallpapers...
                        </>
                      ) : referenceImage ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Generate Remix Batch
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate 4 Variations
                        </>
                      )}
                    </button>
                  </form>

                  {errorMessage && (
                    <div className="mt-4 p-3 rounded-lg bg-red-950/30 border border-red-900/40 text-red-400 text-xs text-left leading-relaxed">
                      {errorMessage}
                    </div>
                  )}

                  {/* Recent client query memories */}
                  {recentVibes.length > 0 && !referenceImage && (
                    <div className="mt-6 border-t border-slate-800/60 pt-4">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                        <span>LATEST QUERIES</span>
                        <button
                          onClick={() => {
                            setRecentVibes([]);
                            localStorage.removeItem("recent_vibes");
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-300"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                        {recentVibes.map((h, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-slate-900 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer hover:border-slate-800 truncate"
                            onClick={() => setVibeInput(h.vibe)}
                          >
                            <span className="truncate flex-1 pr-2 font-mono">{h.vibe}</span>
                            <span className="text-[9px] font-mono text-slate-650 flex-shrink-0">{h.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              ) : (
                <motion.div
                  key="saved-collections"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 relative backdrop-blur-sm shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                      My Wallpaper Shelf
                    </span>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to clear your entire collection? This cannot be undone.")) {
                          saveWallpapersToLocal([]);
                        }
                      }}
                      className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                      title="Clear storage"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-light font-sans mb-4">
                    Every generated batch is automatically secured here. Tap any item to download, preview raw metadata, or trigger styled remixes.
                  </p>

                  <div className="border border-slate-800/40 rounded-xl p-3 bg-slate-950/40">
                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-500">
                      <span>Total Generated</span>
                      <span className="text-slate-300 font-bold">{savedWallpapers.length} shapes</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 mt-1.5">
                      <span>Starred Favorites</span>
                      <span className="text-pink-400 font-bold">
                        {savedWallpapers.filter(w => w.isFavorite).length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 text-[10px] text-slate-500 leading-relaxed italic text-left">
                    Tip: Stars are saved inside your local browser storage and remain available even after reloading the workspace.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>

          {/* RIGHT COLUMN: Results Section */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* If loading wallpapers */}
            {isLoading && (
              <div className="p-8 rounded-2xl bg-slate-900/20 border border-slate-900/60 flex flex-col items-center justify-center min-h-[500px] text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 relative animate-pulse mb-6">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-spin-slow" />
                  <div className="absolute inset-0 rounded-full border border-indigo-500/35 animate-ping opacity-30" />
                </div>
                
                <h3 className="text-lg font-display font-medium text-white mb-2">
                  Invoking Generative Painter
                </h3>
                
                {/* Active simulating sub-phrase loader */}
                <div className="h-6 overflow-hidden max-w-sm mb-6">
                  <AnimatePresence mode="popLayout">
                    <motion.p
                      key={loadingStep}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs font-mono text-indigo-400 font-semibold"
                    >
                      {loadingSteps[loadingStep]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Shimmer Placeholder Grid while waiting */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl px-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="aspect-9-16 rounded-2xl border border-slate-905-20 bg-slate-900/40 relative overflow-hidden flex flex-col justify-end p-3 shimmer"
                    >
                      <div className="h-3.5 bg-slate-800 rounded w-3/4 mb-1.5" />
                      <div className="h-2 bg-slate-800 rounded w-1/2" />
                    </div>
                  ))}
                </div>
                
                <p className="text-[10px] font-mono text-slate-500 mt-6 max-w-md">
                  We generate 4 distinct prompt variants first via Gemini-3.5, and feed them into Imagen-3 in parallel. This ensure variations are truly unique visual styles!
                </p>
              </div>
            )}

            {/* Active Wallpapers Display Grid (Drawer Mode) */}
            {!isLoading && activeTab === "generate" && (
              <div className="space-y-6">
                
                {/* Visual results state */}
                {currentWallpapers.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <span>Latest Batch Output</span>
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        </h3>
                        {vibeInput && (
                          <p className="text-xs text-slate-500 mt-1 font-sans italic line-clamp-1">
                            Vibe: "{vibeInput}"
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={handleGenerate}
                        className="p-1 px-3 rounded-lg border border-slate-800 text-xs font-medium bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> New Batch
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {currentWallpapers.map((wp) => (
                        <div
                          key={wp.id}
                          className="group aspect-9-16 rounded-2xl bg-slate-900 border border-slate-850 overflow-hidden relative shadow-lg cursor-pointer hover:border-slate-700 hover:shadow-indigo-500/5 transition-all duration-300"
                          onClick={() => setSelectedWallpaper(wp)}
                        >
                          {/* Main Image */}
                          <img
                            src={wp.url}
                            alt={wp.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Soft bottom glass overlay details */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent p-3.5 pt-10 flex flex-col justify-end translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                            <span className="text-[11px] font-display font-semibold text-white tracking-wide truncate">
                              {wp.title}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5 truncate uppercase">
                              Options available
                            </span>
                          </div>

                          {/* Quick preview corner link trigger */}
                          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 text-indigo-400 hover:text-white" title="Immersive zoom">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-850 bg-slate-900/10 flex flex-col items-center justify-center min-h-[400px] text-center" id="empty-state">
                    <div className="w-12 h-12 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Neural Studio Empty
                    </h3>
                    <p className="text-xs text-slate-500 font-light max-w-sm leading-relaxed">
                      Your generated phone wallpapers will display here in mobile high-definition grid frames. Select a visual vibe preset or type a custom layout on the left to begin!
                    </p>
                    
                    {/* Tiny initial sample vibes grid shortcut */}
                    <div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-md">
                      {PRESET_VIBES.slice(3, 7).map((v, i) => (
                        <button
                          key={i}
                          onClick={() => setVibeInput(v.description)}
                          className="p-2 text-left bg-slate-900/40 border border-slate-900 rounded-xl hover:border-slate-800 hover:bg-slate-900/60 transition-all font-sans cursor-pointer group"
                        >
                          <p className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-400">#{v.tag}</p>
                          <p className="text-xs font-semibold text-slate-300 truncate mt-0.5">{v.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gallery / Collectables Tab */}
            {activeTab === "saved" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                  <h3 className="text-sm font-mono font-semibold text-slate-400 uppercase tracking-wider">
                    Historic Gallery Collections
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {savedWallpapers.length} Wallpapers stored
                  </span>
                </div>

                {savedWallpapers.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {savedWallpapers.map((wp) => (
                      <div
                        key={wp.id}
                        className="group aspect-9-16 rounded-2xl bg-slate-900 border border-slate-850 overflow-hidden relative shadow-lg cursor-pointer hover:border-slate-700 transition-all duration-300"
                        onClick={() => setSelectedWallpaper(wp)}
                      >
                        <img
                          src={wp.url}
                          alt={wp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Star visual top tag status */}
                        {wp.isFavorite && (
                          <div className="absolute top-2.5 left-2.5 bg-pink-500/90 text-white p-1 rounded-lg border border-pink-400 shadow shadow-pink-500/20">
                            <Heart className="w-3 h-3 fill-current" />
                          </div>
                        )}

                        {/* Soft bottom glass overlay details */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent p-3.5 pt-10 flex flex-col justify-end translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                          <span className="text-[11px] font-display font-semibold text-white tracking-wide truncate">
                            {wp.title}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 mt-0.5 truncate uppercase">
                            Collected
                          </span>
                        </div>

                        {/* Action corner triggers */}
                        <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWallpaper(wp.id);
                            }}
                            className="p-1.5 rounded-lg bg-red-950/80 border border-red-900/50 text-red-400 hover:text-white shadow cursor-pointer"
                            title="Remove wallpaper"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-850 bg-slate-900/10 flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-950/40 border border-slate-900 flex items-center justify-center text-slate-500 mb-4">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      No Collected Shapes
                    </h3>
                    <p className="text-xs text-slate-500 font-light max-w-sm leading-relaxed mb-6">
                      Every wallpaper you generate is automatically logged here. Star favorites or download high definition canvases when they render!
                    </p>
                    <button
                      onClick={() => setActiveTab("generate")}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-all cursor-pointer"
                    >
                      Return to neuron drawer
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </main>

      {/* FULL SCREEN ARTWORK DIALOG OVERLAY */}
      <AnimatePresence>
        {selectedWallpaper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto px-4 py-6 md:p-10 flex items-center justify-center"
          >
            {/* Close outer area click handler */}
            <div 
              className="absolute inset-0 z-10" 
              onClick={() => {
                setSelectedWallpaper(null);
                setShowLockscreen(false);
              }} 
            />

            {/* Content modal */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl bg-slate-900 border border-slate-850 rounded-2xl relative z-20 overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              
              {/* Left Column: Interactive Mobile mockup preview with aspect-9-16 */}
              <div className="md:w-1/2 p-6 flex flex-col items-center justify-center bg-slate-950/40 border-r border-slate-850">
                <div className="w-full max-w-[280px] aspect-9-16 rounded-[40px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden bg-slate-950 bg-[radial-gradient(circle_at_center,rgba(51,65,85,0.2)_0%,rgba(15,23,42,1)_100%)]">
                  
                  {/* Speaker mesh & Camera bezel notch mock */}
                  <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-30">
                    <div className="w-24 h-4 bg-slate-800 rounded-b-2xl flex items-center justify-center">
                      <div className="w-12 h-1 bg-slate-900 rounded-full mb-1" />
                    </div>
                  </div>

                  {/* Active lockscreen visual helper toggler */}
                  {showLockscreen ? (
                    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 pt-12 pb-8 pointer-events-none">
                      
                      {/* Top Date & Time */}
                      <div className="flex flex-col items-center text-center mt-3">
                        <span className="text-[10px] font-display font-medium text-white/90 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                          {getSimulatedDateString()}
                        </span>
                        <span className="text-4xl font-display font-light text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] mt-0.5">
                          10:02 AM
                        </span>
                        <div className="flex items-center gap-1.5 mt-2 bg-black/10 backdrop-blur-[2px] px-2 py-0.5 rounded-full border border-white/5">
                          <Lock className="w-3 h-3 text-white/80" />
                          <span className="text-[9px] font-mono text-white/80 uppercase tracking-wider">Locked</span>
                        </div>
                      </div>

                      {/* Bottom camera & torch app elements */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 shadow shadow-black/20">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-1 bg-white/45 rounded-full mb-1 bg-gradient-to-r from-transparent via-white to-transparent" />
                          <span className="text-[8px] text-white/50 tracking-wide font-mono uppercase bg-black/10 px-1.5 py-0.5 rounded">swipe up to open</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 shadow shadow-black/20">
                          <Camera className="w-4 h-4" />
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 z-20 flex gap-1.5 pointer-events-none">
                      <span className="px-2 py-0.5 bg-slate-950/80 backdrop-blur-md text-slate-300 rounded text-[9px] font-mono shadow uppercase border border-slate-800">Preview 9:16</span>
                    </div>
                  )}

                  {/* Raw downloaded Image asset */}
                  <img
                    src={selectedWallpaper.url}
                    alt={selectedWallpaper.title}
                    className="absolute inset-0 w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                  
                </div>

                {/* Simulated lockscreen toggle action tab */}
                <button
                  onClick={() => setShowLockscreen(!showLockscreen)}
                  className={`mt-4 px-4 py-1.5 rounded-full text-xs font-mono font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    showLockscreen
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showLockscreen ? "Hide Lockscreen Overlay" : "Mock iOS Lockscreen UI"}
                </button>
              </div>

              {/* Right Column: Metadata details, action buttons & trigger remixes */}
              <div className="md:w-1/2 p-6 flex flex-col justify-between">
                
                {/* Header title navigation close */}
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-semibold">wallpaper attributes</span>
                      <h3 className="text-xl font-display font-medium text-white tracking-tight leading-tight mt-1">
                        {selectedWallpaper.title}
                      </h3>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedWallpaper(null);
                        setShowLockscreen(false);
                      }}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    
                    {/* Visual Prompt summary detailed */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">generation visual prompt</span>
                      <p className="text-xs text-slate-300 font-sans font-light leading-relaxed mt-1">
                        {selectedWallpaper.prompt}
                      </p>
                    </div>

                    {/* Metadata indicators */}
                    <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                      <div className="p-2.5 rounded-lg bg-slate-950/20 border border-slate-850/60">
                        <span className="text-slate-500 uppercase block">dimensions</span>
                        <span className="text-slate-350 font-bold mt-0.5 block">1024 x 1820 px</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/20 border border-slate-850/60">
                        <span className="text-slate-500 uppercase block">file format</span>
                        <span className="text-slate-350 font-bold mt-0.5 block">high-quality jpeg</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Row collections storage state */}
                <div className="mt-8 pt-5 border-t border-slate-850 space-y-4">
                  
                  {/* Star favorites & download attributes action row */}
                  <div className="flex gap-2.5">
                    
                    {/* Star favoriting toggler */}
                    {savedWallpapers.some(w => w.id === selectedWallpaper.id) ? (
                      <button
                        onClick={(e) => toggleFavorite(selectedWallpaper.id, e)}
                        className={`px-4 py-3 rounded-xl border flex items-center justify-center aspect-square cursor-pointer transition-all ${
                          savedWallpapers.find(w => w.id === selectedWallpaper.id)?.isFavorite
                            ? "bg-pink-500/10 border-pink-500/30 text-pink-500"
                            : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350 hover:border-slate-800"
                        }`}
                        title="Star favorite wallpaper"
                      >
                        <Heart className={`w-4 h-4 ${savedWallpapers.find(w => w.id === selectedWallpaper.id)?.isFavorite ? "fill-current" : ""}`} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const updated = [{ ...selectedWallpaper, isFavorite: true }, ...savedWallpapers];
                          saveWallpapersToLocal(updated);
                          // Force local render update pointer
                          setSelectedWallpaper(prev => prev ? { ...prev, isFavorite: true } : null);
                        }}
                        className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-500 hover:text-slate-350 hover:border-slate-800 flex items-center justify-center aspect-square cursor-pointer"
                        title="Add to My Shelf Collection"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    )}

                    {/* Remix Canvas Tweak Trigger */}
                    <button
                      onClick={() => triggerRemix(selectedWallpaper)}
                      className="flex-1 py-3 px-4 rounded-xl font-display font-medium text-xs tracking-wider uppercase border border-amber-500/20 text-amber-500 hover:bg-amber-500/5 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer transition-all bg-amber-500/10"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Remix Aesthetic
                    </button>

                    {/* Download Canvas Raw Asset */}
                    <button
                      onClick={() => triggerDownload(selectedWallpaper)}
                      className="flex-1 py-3 px-4 rounded-xl font-display font-medium text-xs tracking-wider uppercase bg-indigo-650 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-650/10 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download 9:16
                    </button>

                  </div>

                  {/* Warning trigger delete helper if in saved collection */}
                  {savedWallpapers.some(w => w.id === selectedWallpaper.id) && (
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>Art safely archived inside local workspace storage</span>
                      <button
                        onClick={(e) => deleteWallpaper(selectedWallpaper.id, e)}
                        className="text-slate-650 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Delete from local memory
                      </button>
                    </div>
                  )}

                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
