import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function Cursor() {
  const [habilitado, setHabilitado] = useState(false);
  const [hover, setHover] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const pontoX = useSpring(x, { stiffness: 900, damping: 60, mass: 0.3 });
  const pontoY = useSpring(y, { stiffness: 900, damping: 60, mass: 0.3 });
  const anelX = useSpring(x, { stiffness: 220, damping: 26, mass: 0.7 });
  const anelY = useSpring(y, { stiffness: 220, damping: 26, mass: 0.7 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setHabilitado(true);

    const mover = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const aoPassar = (e: MouseEvent) => {
      const alvo = e.target as HTMLElement | null;
      setHover(!!alvo?.closest("a, button, [data-hover]"));
    };

    window.addEventListener("mousemove", mover, { passive: true });
    window.addEventListener("mouseover", aoPassar, { passive: true });
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseover", aoPassar);
    };
  }, [x, y]);

  if (!habilitado) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] size-2 rounded-full bg-brand-600"
        style={{ x: pontoX, y: pontoY, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] size-9 rounded-full border-[1.5px] border-brand-600/50"
        style={{ x: anelX, y: anelY, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: hover ? 1.9 : 1, opacity: hover ? 0.95 : 0.55 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      />
    </>
  );
}
