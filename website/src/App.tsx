import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Monitor, Apple, Terminal } from 'lucide-react';

interface Release {
  name: string;
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

function App() {
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'windows': return <Monitor className="w-5 h-5" />;
      case 'mac': return <Apple className="w-5 h-5" />;
      case 'linux': return <Terminal className="w-5 h-5" />;
      default: return <Download className="w-5 h-5" />;
    }
  };

  const DownloadButton = ({ platform, extension, substring, label }: { platform: string, extension: string, substring?: string, label: string }) => {
    const url = getAsset(extension, substring);
    return (
      <motion.a
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.98 }}
        href={url}
        className="glass flex items-center justify-between px-6 py-4 rounded-xl text-white/90 hover:text-white transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
            {getPlatformIcon(platform)}
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium text-lg">{label}</span>
            <span className="text-xs text-white/40">Download {extension.toUpperCase()}</span>
          </div>
        </div>
        <Download className="w-5 h-5 text-white/30 group-hover:text-white/70 transition-colors" />
      </motion.a>
    );
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass max-w-2xl w-full p-10 rounded-3xl relative z-10 border-white/10 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
            className="w-24 h-24 rounded-3xl glass flex items-center justify-center mb-6 shadow-xl"
          >
            <img src="https://raw.githubusercontent.com/dddevid/Spotverlay/master/src-tauri/icons/icon.png" alt="Logo" className="w-16 h-16 rounded-xl" />
          </motion.div>
          
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Spotverlay</h1>
          <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
            A beautiful, always-on-top media overlay. See what's playing without losing focus.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-3 mb-8">
                <span className="px-3 py-1 rounded-full bg-white/5 text-sm text-white/70 border border-white/10">
                  Version {release?.tag_name || 'latest'}
                </span>
                <a href="https://github.com/dddevid/Spotverlay" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-1">
                <DownloadButton platform="windows" extension=".exe" label="Windows (x64)" />
                <div className="grid grid-cols-2 gap-3">
                  <DownloadButton platform="mac" extension=".dmg" substring="aarch64" label="macOS (Apple Silicon)" />
                  <DownloadButton platform="mac" extension=".dmg" substring="x86_64" label="macOS (Intel)" />
                </div>
                <DownloadButton platform="linux" extension=".AppImage" label="Linux" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default App;
