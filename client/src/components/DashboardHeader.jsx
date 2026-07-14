function DashboardHeader({ checked = 0, total = 0 }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-r from-[#B45309] to-[#7F1D1D] px-5 py-4 shadow-[0_0_50px_rgba(180,83,9,0.2)] sm:px-6 sm:py-5">
      <div className="absolute inset-0 opacity-35">
        <div className="absolute -right-8 top-4 h-28 w-28 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute bottom-0 left-[-18px] h-20 w-20 rounded-full bg-[#34D399]/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_35%)]" />
      </div>
      <div className="relative">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-100/80">
          Academic Risk Intelligence
        </p>
        <h1 className="mt-2 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
          Student Risk Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-100/80 sm:text-base">
          {`${checked} of ${total} students checked`}
        </p>
      </div>
    </div>
  );
}

export default DashboardHeader;
