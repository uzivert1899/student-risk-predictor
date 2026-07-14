import { motion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const colorMap = {
  dropout: {
    shell:
      "bg-white/5 border-[#F43F5E]/30 shadow-[0_0_30px_rgba(244,63,94,0.12)]",
    icon: "bg-[#F43F5E]/20 text-[#F43F5E]",
    accent: "text-[#F43F5E]",
    border: "border-[#F43F5E]/30",
  },
  enrolled: {
    shell:
      "bg-white/5 border-[#FBBF24]/30 shadow-[0_0_30px_rgba(251,191,36,0.12)]",
    icon: "bg-[#FBBF24]/20 text-[#FBBF24]",
    accent: "text-[#FBBF24]",
    border: "border-[#FBBF24]/30",
  },
  graduate: {
    shell:
      "bg-white/5 border-[#34D399]/30 shadow-[0_0_30px_rgba(52,211,153,0.12)]",
    icon: "bg-[#34D399]/20 text-[#34D399]",
    accent: "text-[#34D399]",
    border: "border-[#34D399]/30",
  },
  neutral: {
    shell: "bg-white/5 border-white/10 shadow-[0_0_30px_rgba(245,158,11,0.08)]",
    icon: "bg-[#F59E0B]/20 text-[#F59E0B]",
    accent: "text-slate-200",
    border: "border-white/10",
  },
  notChecked: {
    shell:
      "bg-white/5 border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.04)]",
    icon: "bg-white/10 text-white/70",
    accent: "text-slate-400",
    border: "border-white/10",
  },
};

function StatCard({ label, value, colorVariant = "neutral", icon: Icon }) {
  const [displayValue, setDisplayValue] = useState(0);
  const spring = useSpring(0, { stiffness: 80, damping: 20 });

  useEffect(() => {
    spring.set(value);
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return () => unsubscribe();
  }, [spring, value]);

  const colors = colorMap[colorVariant] || colorMap.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-[24px] border p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${colors.shell} border-l-4 ${colors.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${colors.icon}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <p className="font-display text-3xl font-bold tracking-tight text-white">
            {displayValue}
          </p>
          <p className={`mt-1 text-sm font-medium ${colors.accent}`}>{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default StatCard;
