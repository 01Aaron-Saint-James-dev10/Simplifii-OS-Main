import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

const TicketCostBar = ({ toolKey, cost, onInsufficientTickets }) => {
  const { user } = useAuth();
  const balance = user?.credits ?? 0;
  const isOwner = user?.is_owner;
  const insufficient = !isOwner && balance < cost;
  const balanceAfter = balance - cost;

  if (isOwner) {
    return (
      <div className="flex items-center justify-between" data-testid="ticket-cost-bar">
        <div className="text-sm text-zinc-500">
          <span className="font-semibold text-emerald-400">Owner mode</span> — unlimited tickets
        </div>
      </div>
    );
  }

  if (insufficient) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl" data-testid="ticket-insufficient">
        <div className="flex items-center gap-3">
          <Lock size={18} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-400 font-medium">
              You're out of tickets — grab more to keep going
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              This tool uses {cost} ticket{cost > 1 ? 's' : ''}. You have {balance}.
            </p>
          </div>
          <Link
            to="/credits"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-sm whitespace-nowrap transition-all"
            data-testid="grab-tickets-link"
          >
            Grab tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between" data-testid="ticket-cost-bar">
      <div className="text-sm text-zinc-500">
        You have <span className="font-semibold text-white">{balance} ticket{balance !== 1 ? 's' : ''}</span> remaining
      </div>
    </div>
  );
};

export default TicketCostBar;
