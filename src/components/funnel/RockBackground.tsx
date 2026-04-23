"use client"

import { motion } from "framer-motion"

export function RockBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">
      {/* Animated Spotlights */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [-20, 20, -20],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.15, 0.05],
          x: [20, -20, 20],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]"
      />

      {/* Floating Musical Notes (Subtle) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: "110vh", x: `${10 + i * 15}%`, opacity: 0 }}
          animate={{
            y: "-10vh",
            opacity: [0, 0.3, 0],
            rotate: [0, 45, -45, 0],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: i * 3,
            ease: "linear",
          }}
          className="absolute text-primary/20 text-4xl font-serif select-none"
        >
          {["♪", "♫", "♩", "♬"][i % 4]}
        </motion.div>
      ))}

      {/* Equalizer Bars at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-around px-4 opacity-10">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: [20, 80 * Math.random() + 20, 20],
            }}
            transition={{
              duration: 0.5 + Math.random(),
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-1 bg-primary rounded-t-full"
          />
        ))}
      </div>

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-20" />
    </div>
  )
}
