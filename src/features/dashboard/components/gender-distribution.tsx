interface GenderStats {
  female: number
  male: number
}

interface GenderDistributionProps {
  genderStats: GenderStats
}

export function GenderDistribution({ genderStats }: GenderDistributionProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
        Distribución
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Mujeres */}
        <div
          className="rounded-2xl overflow-hidden relative h-[160px] flex flex-col justify-between p-3.5"
          style={{
            background: 'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 100%)',
          }}
        >
          <div className="dark:hidden absolute inset-0 bg-linear-to-br from-pink-100/50 to-pink-200/30" />
          <div className="flex items-center justify-between z-10">
            <span className="size-8 rounded-xl bg-pink-500/15 border border-pink-300/30 flex items-center justify-center text-lg font-bold text-pink-500">
              ♀
            </span>
            <span className="text-[9px] font-bold text-pink-600 bg-pink-500/10 border border-pink-300/30 px-2 py-0.5 rounded-full">
              Mujeres
            </span>
          </div>
          <div className="z-10">
            <div className="text-3xl font-black text-pink-700 leading-none">
              {genderStats.female}
            </div>
            <p className="text-[9px] text-pink-500/80 font-semibold mt-1 uppercase tracking-widest">
              Socias activas
            </p>
          </div>
          <img
            src="/images/female_avatar.png"
            alt="Mujer"
            className="absolute right-0 bottom-0 h-[100px] w-auto object-contain opacity-85 pointer-events-none"
          />
        </div>

        {/* Hombres */}
        <div
          className="rounded-2xl overflow-hidden relative h-[160px] flex flex-col justify-between p-3.5"
          style={{
            background: 'linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)',
          }}
        >
          <div className="flex items-center justify-between z-10">
            <span className="size-8 rounded-xl bg-amber-500/15 border border-amber-300/30 flex items-center justify-center text-lg font-bold text-amber-500">
              ♂
            </span>
            <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 border border-amber-300/30 px-2 py-0.5 rounded-full">
              Hombres
            </span>
          </div>
          <div className="z-10">
            <div className="text-3xl font-black text-amber-700 leading-none">
              {genderStats.male}
            </div>
            <p className="text-[9px] text-amber-500/80 font-semibold mt-1 uppercase tracking-widest">
              Socios activos
            </p>
          </div>
          <img
            src="/images/male_avatar.png"
            alt="Hombre"
            className="absolute right-0 bottom-0 h-[100px] w-auto object-contain opacity-85 pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
}
