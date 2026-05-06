import React from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../AuthContext';

export const PointsBalance = () => {
  const { user, profile } = useAuth();

  if (!user || !profile) return null;

  const points = profile.points || 0;
  const pointsValueCOP = Math.floor(points / 100) * 1000;

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 shrink-0">
        <Star size={24} fill="currentColor" />
      </div>
      <div>
        <h4 className="text-orange-800 font-bold text-sm">Mis Puntos YuliedPlay</h4>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black text-orange-600 tracking-tight">
            {points.toLocaleString()}
          </span>
          <span className="text-xs text-orange-500 font-medium">pts = ${pointsValueCOP.toLocaleString()} COP</span>
        </div>
      </div>
    </div>
  );
};
