import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

type AppLoaderProps = {
  static?: boolean;
};

const AppLoader = ({ static: isStatic }: AppLoaderProps) => {
  const [isVisible, setIsVisible] = useState(!isStatic);

  useEffect(() => {
    if (isStatic) return;
    // Ensure loader is visible initially for non-static preloading
    setIsVisible(true);
  }, [isStatic]);

  if (!isVisible && !isStatic) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-charcoal"
      initial={{ opacity: 1 }}
      animate={!isStatic ? { opacity: 1 } : { opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={!isStatic ? { scale: [1, 1.15, 1] } : { rotate: 360 }}
          transition={
            !isStatic
              ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 1.2, repeat: Infinity, ease: 'linear' }
          }
          className="relative flex h-16 w-16 items-center justify-center"
        >
          <Shield className="h-10 w-10 text-copper-light" />
          {isStatic && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-sand/10 border-t-copper-light/60" />
            </span>
          )}
        </motion.div>

        <div className="font-mono text-[10px] tracking-[0.4em] text-sand/40 uppercase">
          TAROUDANT HERITAGE
        </div>
      </div>

      {!isStatic && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 h-px bg-sand/5 overflow-hidden">
          <motion.div
            className="h-full bg-copper-light/60"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => {
              // Fade out then unmount
              setIsVisible(false);
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default AppLoader;


