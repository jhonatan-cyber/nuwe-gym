import { Link } from '@tanstack/react-router'
import { Users, TrendingUp, Lock, ShoppingBag } from 'lucide-react'

interface QuickActionsGridProps {
  totalMembers: number
}

export function QuickActionsGrid({ totalMembers }: QuickActionsGridProps) {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] lg:items-stretch">
      {/* Usuarios Card */}
      <Link
        to="/members"
        className="group relative overflow-hidden rounded-4xl p-5 h-full flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #f9f0e0 0%, #f0d9b5 100%)',
        }}
      >
        <div className="absolute -top-6 -right-6 size-28 rounded-full bg-amber-400/30 blur-2xl pointer-events-none transition-all duration-500 group-hover:scale-125" />
        <div className="flex justify-between items-start z-10">
          <div className="size-11 rounded-2xl bg-white/50 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/60">
            <Users className="size-5 text-amber-900" />
          </div>
          <span className="text-[10px] font-bold text-amber-800/70 bg-white/50 backdrop-blur-md border border-white/60 px-2.5 py-1 rounded-full flex items-center gap-1">
            <TrendingUp className="size-2.5" /> +1%
          </span>
        </div>
        <div className="z-10">
          <div className="text-4xl font-black text-amber-950 tracking-tight leading-none">
            {totalMembers}
          </div>
          <p className="text-[11px] font-semibold text-amber-800/70 mt-1.5 uppercase tracking-widest">
            Socios Totales
          </p>
        </div>
        <div className="absolute right-3 bottom-8 w-[90px] h-[32px] opacity-25 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 40">
            <path
              d="M0,35 Q15,25 30,30 T60,10 T90,25 L100,20"
              fill="none"
              stroke="#92400e"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </Link>

      {/* Middle Column: Molinete + Tienda stacked */}
      <div className="flex flex-col gap-4">
        {/* Control Molinete */}
        <Link
          to="/check-ins"
          className="group relative overflow-hidden rounded-4xl flex-1 flex items-center transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-[#fef3c7] via-[#fde68a]/90 to-transparent z-10 pointer-events-none" />
          <div className="absolute -top-6 -left-6 size-24 rounded-full bg-yellow-400/40 blur-2xl pointer-events-none" />
          <div className="relative z-20 p-5 flex flex-col gap-2 max-w-[55%]">
            <div className="size-10 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/60">
              <Lock className="size-4 text-yellow-900" />
            </div>
            <div>
              <div className="text-lg font-black text-yellow-950 tracking-tight leading-tight">
                Control Molinete
              </div>
              <p className="text-[10px] font-semibold text-yellow-800/60 mt-0.5 uppercase tracking-widest">
                Autenticación
              </p>
            </div>
          </div>
          <img
            src="/images/turnstile.png"
            alt="Molinete"
            className="absolute right-0 top-0 h-full w-auto object-contain object-right opacity-95 pointer-events-none transition-all duration-500 group-hover:scale-105 drop-shadow-2xl"
          />
        </Link>

        {/* Tienda */}
        <Link
          to="/pos"
          className="group relative overflow-hidden rounded-4xl flex-1 flex items-center transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #fae8ff 0%, #e9d5ff 100%)',
          }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-[#fae8ff] via-[#e9d5ff]/90 to-transparent z-10 pointer-events-none" />
          <div className="absolute -top-6 -left-6 size-24 rounded-full bg-purple-400/30 blur-2xl pointer-events-none" />
          <div className="relative z-20 p-5 flex flex-col gap-2 max-w-[55%]">
            <div className="size-10 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/60">
              <ShoppingBag className="size-4 text-purple-900" />
            </div>
            <div>
              <div className="text-lg font-black text-purple-950 tracking-tight leading-tight">
                Tienda
              </div>
              <p className="text-[10px] font-semibold text-purple-800/60 mt-0.5 uppercase tracking-widest">
                Venta directa
              </p>
            </div>
          </div>
          <img
            src="/images/shop.png"
            alt="Tienda"
            className="absolute right-0 top-0 h-full w-auto object-contain object-right opacity-95 pointer-events-none transition-all duration-500 group-hover:scale-105 drop-shadow-2xl"
          />
        </Link>
      </div>

      {/* Control Facial */}
      <Link
        to="/check-ins"
        className="group relative overflow-hidden rounded-4xl p-5 h-full flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-lg dark:bg-[#1a1f35] bg-[#dde5ff]"
      >
        <div className="absolute -top-6 -right-6 size-28 rounded-full dark:bg-indigo-500/20 bg-indigo-400/30 blur-2xl pointer-events-none transition-all duration-500 group-hover:scale-125" />
        <div className="flex justify-between items-start z-10">
          <div className="size-11 rounded-2xl dark:bg-white/10 bg-white/50 backdrop-blur-md flex items-center justify-center shadow-sm dark:border-white/10 border-white/60 border">
            <svg
              className="size-5 dark:text-indigo-300 text-indigo-900"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0Z" />
              <path d="M8 10v.01M16 10v.01" />
              <path d="M12 14s1.5 2 4 2" />
            </svg>
          </div>
        </div>
        <div className="z-10">
          <div className="text-xl font-black dark:text-white text-indigo-950 tracking-tight leading-tight">
            Control
            <br />
            Facial
          </div>
          <p className="text-[11px] font-semibold dark:text-indigo-300/50 text-indigo-800/60 mt-1.5 uppercase tracking-widest">
            Sin contacto
          </p>
        </div>
        <div className="absolute right-3 bottom-3 size-20 opacity-20 dark:opacity-15 pointer-events-none">
          <svg
            className="w-full h-full dark:text-indigo-300 text-indigo-700"
            viewBox="0 0 80 80"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="40" cy="32" r="14" />
            <circle cx="40" cy="32" r="22" strokeDasharray="4 4" />
            <circle cx="35" cy="28" r="2" fill="currentColor" />
            <circle cx="45" cy="28" r="2" fill="currentColor" />
            <path d="M34 38 Q40 44 46 38" strokeLinecap="round" />
          </svg>
        </div>
      </Link>
    </div>
  )
}
