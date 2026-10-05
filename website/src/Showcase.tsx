import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const playAudio = (src: string, vol = 0.8) => {
  const audio = new Audio(import.meta.env.BASE_URL + src);
  audio.volume = vol;
  audio.play().catch(() => {});
};

export const Showcase: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 30 fps timings from Remotion
    const s2ms = (frames: number) => (frames / 30) * 1000;

    // Music
    const music = new Audio(import.meta.env.BASE_URL + 'audio/downloaded/music.mp3');
    music.volume = 0.35;
    music.play().catch(() => {});

    // SFX Schedule
    setTimeout(() => playAudio('audio/synth/boom.wav', 0.9), s2ms(0));
    setTimeout(() => playAudio('audio/downloaded/whoosh-air.mp3', 0.7), s2ms(8));
    setTimeout(() => playAudio('audio/downloaded/whoosh-transition.mp3', 0.8), s2ms(66));
    setTimeout(() => playAudio('audio/downloaded/whoosh-air.mp3', 0.6), s2ms(84));
    setTimeout(() => playAudio('audio/synth/tick.wav', 0.7), s2ms(118));
    setTimeout(() => playAudio('audio/downloaded/whoosh-short.mp3', 0.6), s2ms(158));
    setTimeout(() => playAudio('./audio/downloaded/whoosh-transition.mp3', 0.8), s2ms(166));
    [188, 194, 200, 206, 212].forEach((f, i) => {
      setTimeout(() => playAudio(`./audio/synth/pop-${i + 1}.wav`, 0.7), s2ms(f));
    });
    setTimeout(() => playAudio('./audio/downloaded/whoosh-transition.mp3', 0.8), s2ms(226));
    setTimeout(() => playAudio('./audio/synth/chime.wav', 0.75), s2ms(262));

    // Fade out music at the end
    setTimeout(() => {
      let vol = 0.35;
      const fade = setInterval(() => {
        vol -= 0.05;
        if (vol <= 0) {
          music.pause();
          clearInterval(fade);
        } else {
          music.volume = vol;
        }
      }, 100);
    }, s2ms(255));

    // Visual sequence
    setTimeout(() => setStep(1), s2ms(0));    // Intro
    setTimeout(() => setStep(2), s2ms(75));   // Screen
    setTimeout(() => setStep(3), s2ms(170));  // Players
    setTimeout(() => {
      setStep(4);
      onComplete(); // Move to main site
    }, s2ms(230));

    return () => {
      music.pause();
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 flex items-center justify-center font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 1 && <Intro key="intro" />}
        {step === 2 && <Screen key="screen" />}
        {step === 3 && <Players key="players" />}
      </AnimatePresence>
    </div>
  );
};

const Intro = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.1 }}
    transition={{ duration: 0.5, type: 'spring' }}
    className="flex flex-col items-center gap-8"
  >
    <div className="flex items-end gap-2 h-32">
      {[0.4, 0.8, 0.5, 1].map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: ['40%', `${h * 100}%`, '40%'] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          className="w-6 bg-[#1ED760] rounded-full shadow-[0_0_30px_rgba(30,215,96,0.5)]"
        />
      ))}
    </div>
    <motion.h1 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-7xl font-extrabold tracking-tight"
    >
      Spot<span className="text-[#1ED760]">verlay</span>
    </motion.h1>
    <motion.p
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="text-2xl text-white/60 font-medium"
    >
      The always-on-top now playing overlay
    </motion.p>
  </motion.div>
);

const Screen = () => {
  const [song, setSong] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setSong(1), 1600); // Swap song timing
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="flex flex-col items-center w-full max-w-4xl px-4"
    >
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-2">Know what's playing.</h2>
        <h2 className="text-4xl md:text-5xl font-bold text-[#1ED760]">Never alt-tab.</h2>
      </div>

      <div className="relative w-full aspect-video md:h-[400px] bg-gradient-to-br from-[#2c1f6a] via-[#121326] to-[#07080d] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
        {/* Fake window UI */}
        <div className="absolute left-4 top-4 md:left-20 md:top-20 w-3/4 h-1/2 rounded-2xl bg-white/5 border border-white/10 hidden md:block" />
        <div className="absolute left-8 top-8 md:left-28 md:top-28 w-40 h-4 rounded-lg bg-white/10 hidden md:block" />
        <div className="absolute left-8 top-16 md:left-28 md:top-36 w-64 h-3 rounded-lg bg-white/5 hidden md:block" />

        {/* Spotverlay Widget */}
        <motion.div 
          initial={{ y: -150, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 0.5 }}
          className="absolute right-4 top-4 md:right-8 md:top-8"
        >
          <div className="relative w-[280px] md:w-[320px] h-[80px] md:h-[90px]">
            <AnimatePresence mode="wait">
              {song === 0 ? (
                <OverlayCard key="song1" title="Blinding Lights" artist="The Weeknd" c1="#ff3d6e" c2="#7a1fa2" />
              ) : (
                <OverlayCard key="song2" title="Get Lucky" artist="Daft Punk" c1="#f5b83d" c2="#e0502b" />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const OverlayCard = ({ title, artist, c1, c2 }: { title: string, artist: string, c1: string, c2: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.05 }}
    className="absolute inset-0 glass rounded-2xl p-3 flex items-center gap-3 md:gap-4 shadow-xl"
  >
    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl border border-white/10 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-sm md:text-base text-white truncate">{title}</div>
      <div className="text-xs md:text-sm text-white/60 truncate">{artist}</div>
    </div>
    <div className="flex items-end gap-1 h-4 mr-2">
      {[1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          animate={{ height: ['30%', '100%', '30%'] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          className="w-1 bg-[#1ED760] rounded-sm"
        />
      ))}
    </div>
  </motion.div>
);

const Players = () => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className="flex flex-col items-center w-full px-4"
  >
    <div className="text-center mb-12">
      <h2 className="text-4xl md:text-6xl font-bold mb-2">Works with your</h2>
      <h2 className="text-4xl md:text-6xl font-bold text-[#1ED760]">favorite players</h2>
    </div>
    <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
      {[
        { name: "Spotify", color: "#1ED760" },
        { name: "Spotifast", color: "#4cc2ff" },
        { name: "SpotLight", color: "#ffd24c" },
        { name: "Apple Music", color: "#ff4d6d" },
        { name: "Musly", color: "#b388ff" },
      ].map((p, i) => (
        <motion.div
          key={p.name}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.15, type: 'spring' }}
          className="glass px-5 md:px-8 py-3 md:py-4 rounded-full flex items-center gap-3 text-lg md:text-2xl font-semibold border-white/10"
        >
          <div className="w-4 h-4 rounded-full shadow-lg" style={{ background: p.color, boxShadow: `0 0 15px ${p.color}` }} />
          {p.name}
        </motion.div>
      ))}
    </div>
  </motion.div>
);
