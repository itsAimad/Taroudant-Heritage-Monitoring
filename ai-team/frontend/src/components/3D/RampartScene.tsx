import { useRef, useEffect } from 'react';

const RampartScene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; s: number; vy: number; o: number }[] = [];
    
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        s: Math.random() * 2 + 0.5,
        vy: -(Math.random() * 0.3 + 0.1),
        o: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Draw rampart silhouette
      ctx.fillStyle = '#3D322A';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      // Wall with crenellations
      const wallY = h * 0.55;
      const crenH = h * 0.04;
      ctx.lineTo(0, wallY);
      for (let x = 0; x < w; x += 40) {
        ctx.lineTo(x, wallY);
        ctx.lineTo(x, wallY - crenH);
        ctx.lineTo(x + 20, wallY - crenH);
        ctx.lineTo(x + 20, wallY);
      }
      // Towers
      ctx.lineTo(w * 0.2, wallY);
      ctx.lineTo(w * 0.2, wallY - h * 0.15);
      ctx.lineTo(w * 0.25, wallY - h * 0.15);
      ctx.lineTo(w * 0.25, wallY);
      
      ctx.lineTo(w * 0.75, wallY);
      ctx.lineTo(w * 0.75, wallY - h * 0.18);
      ctx.lineTo(w * 0.8, wallY - h * 0.18);
      ctx.lineTo(w * 0.8, wallY);
      
      ctx.lineTo(w, wallY);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Ground gradient
      const grd = ctx.createLinearGradient(0, h * 0.65, 0, h);
      grd.addColorStop(0, '#4A3D32');
      grd.addColorStop(1, '#2B2520');
      ctx.fillStyle = grd;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // Particles (dust)
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 167, 131, ${p.o})`;
        ctx.fill();
        p.y += p.vy;
        p.x += Math.sin(p.y * 0.01) * 0.2;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-charcoal">
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
    </div>
  );
};

export default RampartScene;
