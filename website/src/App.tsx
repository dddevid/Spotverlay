import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Monitor, Apple, Terminal, Play, Volume2, VolumeX } from 'lucide-react';
import { Showcase } from './Showcase';

interface Release {
  name: string;
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

function App() {
  const [appState, setAppState] = useState<'idle' | 'playing' | 'done'>('idle');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.github.com/repos/dddevid/Spotverlay/releases/latest')
      .then(res => res.json())
      .then(data => {
        setRelease(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching release:', err);
        setLoading(false);
      });
  }, []);

  const getAsset = (extension: string, substring: string = '') => {
    return release?.assets.find(a => a.name.endsWith(extension) && a.name.includes(substring))?.browser_download_url || '#';
  };

  const DownloadButton = ({ platform, extension, substring, label }: { platform: string, extension: string, substring?: string, label: string }) => {
    const url = getAsset(extension, substring);
    const icon = platform === 'windows' ? <Monitor className="w-5 h-5" /> : platform === 'mac' ? <Apple className="w-5 h-5" /> : <Terminal className="w-5 h-5" />;
    return (
      <motion.a
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.98 }}
        href={url}
        className="glass flex flex-1 items-center justify-between px-4 py-4 md:px-6 md:py-4 rounded-xl text-white/90 hover:text-white transition-colors group"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
            {icon}
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium text-sm md:text-lg">{label}</span>
            <span className="text-[10px] md:text-xs text-white/40">Download {extension.toUpperCase()}</span>
          </div>
        </div>
        <Download className="w-4 h-4 md:w-5 md:h-5 text-white/30 group-hover:text-white/70 transition-colors" />
      </motion.a>
    );
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-6 overflow-hidden bg-background">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] md:w-[500px] h-[400px] md:h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

      <AnimatePresence mode="wait">
        {appState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 text-center"
          >
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAppState('playing')}
                className="glass px-8 py-4 rounded-full flex items-center gap-3 text-xl font-bold bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer border border-white/10 shadow-2xl"
              >
                <div className="w-10 h-10 rounded-full bg-[#1ED760] flex items-center justify-center text-black group-hover:shadow-[0_0_20px_#1ED760] transition-shadow">
                  <Play className="w-5 h-5 ml-1" fill="currentColor" />
                </div>
                Play Experience
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="glass w-16 h-16 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10 shadow-xl"
              >
                {soundEnabled ? <Volume2 className="w-6 h-6 text-white" /> : <VolumeX className="w-6 h-6 text-white/50" />}
              </motion.button>
            </div>
          </motion.div>
        )}

        {appState === 'playing' && (
          <motion.div key="playing" className="absolute inset-0 z-20">
            <Showcase onComplete={() => setAppState('done')} soundEnabled={soundEnabled} />
          </motion.div>
        )}

        {appState === 'done' && (
          <motion.div 
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="w-full max-w-5xl relative z-10 flex flex-col gap-6 pt-10 pb-20"
          >
            {/* Header Morph from Showcase Outro logic */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full glass rounded-3xl p-6 md:p-10 shadow-2xl border-white/10">
              <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl glass flex items-center justify-center mb-6 shadow-xl">
                  <img src="https://raw.githubusercontent.com/dddevid/Spotverlay/master/src-tauri/icons/icon.png" alt="Logo" className="w-14 h-14 md:w-16 md:h-16 rounded-xl" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Spotverlay</h1>
                <p className="text-base md:text-lg text-white/60 max-w-md leading-relaxed mb-6">
                  A beautiful, always-on-top media overlay. See what's playing without losing focus.
                </p>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#1ED760]/20 text-[#1ED760] text-sm border border-[#1ED760]/30">
                    Version {loading ? '...' : release?.tag_name || 'latest'}
                  </span>
                  <a href="https://github.com/dddevid/Spotverlay" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                  </a>
                </div>
              </div>

              {/* Downloads Grid */}
              <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[320px]">
                <DownloadButton platform="windows" extension=".exe" label="Windows (x64)" />
                <div className="flex flex-col md:flex-row gap-3">
                  <DownloadButton platform="mac" extension=".dmg" substring="aarch64" label="macOS (ARM)" />
                  <DownloadButton platform="mac" extension=".dmg" substring="x86_64" label="macOS (Intel)" />
                </div>
                <DownloadButton platform="linux" extension=".AppImage" label="Linux" />
              </div>
            </div>

            {/* Screenshots Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass rounded-3xl overflow-hidden border-white/10 group cursor-pointer"
              >
                <div className="p-4 bg-white/5 border-b border-white/5 font-medium text-sm text-white/60 group-hover:text-white transition-colors">
                  Overlay in action
                </div>
                <div className="p-6 md:p-10 flex justify-center bg-black/20">
                  <img src={import.meta.env.BASE_URL + 'screenshots/overlay.png'} alt="Overlay" className="max-w-full drop-shadow-2xl rounded-xl" />
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="glass rounded-3xl overflow-hidden border-white/10 group cursor-pointer"
              >
                <div className="p-4 bg-white/5 border-b border-white/5 font-medium text-sm text-white/60 group-hover:text-white transition-colors">
                  Customization Settings
                </div>
                <div className="p-6 md:p-10 flex justify-center bg-black/20">
                  <img src={import.meta.env.BASE_URL + 'screenshots/settings.png'} alt="Settings" className="max-w-full drop-shadow-2xl rounded-xl w-3/4 md:w-1/2" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
