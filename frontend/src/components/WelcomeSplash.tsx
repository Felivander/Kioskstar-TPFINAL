import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles } from 'lucide-react';
import { User } from '../types';

interface WelcomeSplashProps {
  user: User | null;
  onComplete: () => void;
}

export default function WelcomeSplash({ user, onComplete }: WelcomeSplashProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeAway, setFadeAway] = useState(false);

  useEffect(() => {
    // Iniciar desvanecimiento a los 2.6s
    const fadeTimer = setTimeout(() => {
      setFadeAway(true);
    }, 2600);

    // Terminar a los 3.1s (dejar margen para la transición CSS)
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className={`fixed inset-0 z-[9999] bg-gradient-to-br from-primary-500 via-primary-600 to-autumn-leaf-600 flex flex-col items-center justify-center text-white transition-opacity duration-500 ${
            fadeAway ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Contenedor del Logo con animación de entrada elástica */}
          <motion.div
            initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 120,
              damping: 12,
              delay: 0.1,
            }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <Star className="w-20 h-20 text-white fill-white/20 animate-float" />
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: 'easeInOut',
                }}
                className="absolute -top-1 -right-1 text-yellow-300"
              >
                <Sparkles className="w-6 h-6 fill-current" />
              </motion.div>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight">
              Kiosk<span className="text-primary-200">Star</span>
            </h1>
          </motion.div>

          {/* Línea divisora animada */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease: 'easeInOut' }}
            className="w-40 h-[1.5px] bg-white/30 my-8 origin-center"
          />

          {/* Mensaje de Bienvenida personalizado */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              ¡Hola, {user?.name || 'de nuevo'}!
            </h2>
            <p className="text-white/70 text-sm font-medium animate-pulse-soft">
              Preparando tu sesión...
            </p>
          </motion.div>

          {/* Decoraciones flotantes de fondo */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[20%] left-[15%] w-3 h-3 bg-white/20 rounded-full blur-[1px] animate-float" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-[25%] right-[20%] w-4 h-4 bg-white/10 rounded-full blur-[2px] animate-float" style={{ animationDelay: '1.2s' }} />
            <div className="absolute top-[60%] left-[80%] w-2 h-2 bg-white/30 rounded-full blur-[0.5px] animate-float" style={{ animationDelay: '0.8s' }} />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
