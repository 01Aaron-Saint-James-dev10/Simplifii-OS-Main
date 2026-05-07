import React from 'react';
import { Star, Trophy, Palmtree, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CourseTrack({ currentWords = 0, blocks = [], verifications = [] }) {
  const targetWords = blocks.reduce((acc, b) => acc + (b.targetWords || 0), 0) || 2000;
  const progress = Math.min((currentWords / targetWords) * 100, 100);

  // Calculate islands
  let cumulative = 0;
  const islands = blocks.map((b, i) => {
    cumulative += b.targetWords || 0;
    const isApproaching = currentWords >= cumulative - 50 && currentWords < cumulative;
    
    const mappedWeek = i + 1;
    const isVerified = verifications.some(v => v.week === mappedWeek || v.week === 5); // Mock BABS1201

    return {
      id: b.id,
      name: b.type,
      percentage: (cumulative / targetWords) * 100,
      isApproaching,
      isVerified
    };
  });

  return (
    <div className="p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-zinc-700/50 flex justify-around items-center w-full relative overflow-hidden group">
      <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <Palmtree className="text-emerald-500 z-10 shrink-0" size={18} />
      
      <div className="h-2 bg-zinc-700 flex-1 mx-4 rounded-full overflow-visible shadow-inner relative z-10">
        <div 
          className="bg-emerald-500 h-full transition-all duration-500 ease-out shadow-glow-emerald rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
        
        {/* Render Islands */}
        {islands.map(island => {
          const isCompleted = progress >= island.percentage;
          return (
            <motion.div 
              key={island.id}
              initial={{ scale: 1 }}
              animate={{ 
                scale: isCompleted ? 1.5 : (island.isApproaching ? 1.5 : 1),
                boxShadow: isCompleted ? '0 0 15px rgba(16,185,129,0.8)' : (island.isApproaching ? '0 0 15px rgba(251,191,36,0.8)' : '0 0 0px rgba(0,0,0,0)')
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-zinc-900 z-20 flex items-center justify-center ${
                island.isVerified 
                  ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]'
                  : isCompleted 
                    ? 'bg-emerald-600' 
                    : island.isApproaching 
                      ? 'bg-amber-400 animate-pulse' 
                      : 'bg-zinc-500'
              }`}
              style={{ left: `${island.percentage}%` }}
              title={island.name}
            >
              {island.isVerified && <CheckCircle2 size={16} className="text-white absolute -top-4 shadow-xl rounded-full bg-emerald-500" />}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase text-zinc-500 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                WEEK {island.id}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {progress < 100 ? (
        <Star className="text-amber-500 animate-pulse z-10 shrink-0" size={18} />
      ) : (
        <Trophy className="text-amber-400 z-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] shrink-0" size={18} />
      )}
      
      <div className="absolute right-4 bottom-1 text-[8px] font-black text-zinc-500 tracking-widest z-10">
        {currentWords} / {targetWords} W
      </div>
    </div>
  );
}
