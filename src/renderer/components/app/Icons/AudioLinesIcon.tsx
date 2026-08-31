import { motion } from "motion/react";
import type { SVGAttributes } from "react";

type Props = SVGAttributes<SVGSVGElement>;

/**
 * Equalizer bars (lucide `audio-lines`) pulsing while mounted — the
 * playing-track indicator. Adapted from lucide-animated
 * (https://lucide-animated.com/, MIT) without its hover-driven controls:
 * rows render this only while the track is playing, so the bars just loop
 * for the icon's lifetime. Decorative — `aria-hidden` is baked in.
 */
export const AudioLinesIcon = ({ className, ...props }: Props) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M2 10v3" />
    <motion.path
      animate={{ d: ["M6 6v11", "M6 10v3", "M6 6v11"] }}
      d="M6 6v11"
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
    />
    <motion.path
      animate={{ d: ["M10 3v18", "M10 9v5", "M10 3v18"] }}
      d="M10 3v18"
      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
    />
    <motion.path
      animate={{ d: ["M14 8v7", "M14 6v11", "M14 8v7"] }}
      d="M14 8v7"
      transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
    />
    <motion.path
      animate={{ d: ["M18 5v13", "M18 7v9", "M18 5v13"] }}
      d="M18 5v13"
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
    />
    <path d="M22 10v3" />
  </svg>
);
