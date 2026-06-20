"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

export function Confetti({ count = 40 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.4 + Math.random() * 1.2,
      rotate: (Math.random() - 0.5) * 720,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
    })),
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -30, opacity: 1, rotate: 0 }}
          animate={{ y: 460, opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
