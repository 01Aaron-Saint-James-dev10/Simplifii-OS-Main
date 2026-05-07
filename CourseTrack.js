import React from 'react';
import { Star, Trophy, Palmtree } from 'lucide-react';
export default function CourseTrack() {
  return (
    <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700 flex justify-around items-center w-full animate-fade-in">
      <Palmtree className="text-emerald-500" />
      <div className="h-1 bg-zinc-700 flex-1 mx-4 rounded-full overflow-hidden">
        <div className="bg-emerald-500 h-full w-1/3"></div>
      </div>
      <Star className="text-amber-500 animate-pulse" />
      <div className="h-1 bg-zinc-700 flex-1 mx-4 rounded-full"></div>
      <Trophy className="text-zinc-600" />
    </div>
  );
}
