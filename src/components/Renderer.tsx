
import { COLORS, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

// Pre-create an offscreen canvas for the logo to avoid redrawing paths every frame
let logoImage: HTMLImageElement | null = null;

export const drawCat = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, isJumping: boolean, velY: number) => {
  ctx.save();
  ctx.translate(x, y);
  
  // Tilt during jump
  if (isJumping) {
    const tilt = Math.max(-0.25, Math.min(0.25, velY * 0.04));
    ctx.rotate(tilt);
  }
  const baseGlow = 140; 
  const pulse = Math.sin(frame * 0.05) * 15;
  const glowSize = baseGlow + pulse; 
  
  const gradient = ctx.createRadialGradient(15, 15, 2, 15, 15, glowSize);
  gradient.addColorStop(0, `${COLORS.GLOW}99`); 
  gradient.addColorStop(0.3, `${COLORS.GLOW}44`);
  gradient.addColorStop(0.6, `${COLORS.GLOW}10`);
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(15, 15, glowSize, 0, Math.PI * 2);
  ctx.fill();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(15, 32, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  const tailOffset = Math.sin(frame * 0.1) * 4;
  ctx.fillStyle = COLORS.CAT;
  ctx.fillRect(-6, 15 + tailOffset, 12, 6);

  // Body
  ctx.fillStyle = COLORS.CAT;
  ctx.fillRect(0, 10, 32, 22);
  
  // Head
  ctx.fillRect(22, 0, 16, 16);
  // Ears
  ctx.beginPath();
  ctx.moveTo(22, 0); ctx.lineTo(27, -10); ctx.lineTo(31, 0); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(29, 0); ctx.lineTo(34, -10); ctx.lineTo(38, 0); ctx.fill();

  // Eyes
  ctx.fillStyle = '#f0ff00';
  ctx.fillRect(27, 4, 4, 4);
  ctx.fillRect(34, 4, 4, 4);

  // Legs
  const legOffset = isJumping ? 0 : Math.sin(frame * 0.2) * 6;
  ctx.fillStyle = COLORS.CAT;
  ctx.fillRect(5, 32, 5, 8 + (legOffset > 0 ? legOffset : 0));
  ctx.fillRect(23, 32, 5, 8 + (legOffset < 0 ? -legOffset : 0));

  ctx.restore();
};

export const drawHat = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = COLORS.HAT;
  // Rim
  ctx.fillRect(0, 30, 40, 5);
  // Cone
  ctx.beginPath();
  ctx.moveTo(5, 30);
  ctx.lineTo(20, 0);
  ctx.lineTo(35, 30);
  ctx.fill();
  // Band
  ctx.fillStyle = COLORS.GLOW;
  ctx.fillRect(10, 20, 20, 4);

  ctx.restore();
};

export const drawBook = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.save();
  ctx.translate(x, y);
  // Cover
  ctx.fillStyle = COLORS.BOOK;
  ctx.fillRect(0, 5, 35, 30);
  // Pages detail
  ctx.fillStyle = '#f0e68c';
  ctx.fillRect(5, 0, 25, 5);
  
  // Gold binding detail instead of logo
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(0, 8, 4, 4);
  ctx.fillRect(0, 28, 4, 4);

  ctx.restore();
};

export const drawElixir = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.save();
  ctx.translate(x, y);
  // Glass shards
  ctx.fillStyle = '#cccccc';
  ctx.beginPath();
  ctx.moveTo(0, 35); ctx.lineTo(10, 20); ctx.lineTo(20, 35); ctx.fill();
  // Glass shard 2
  ctx.beginPath();
  ctx.moveTo(25, 35); ctx.lineTo(35, 25); ctx.lineTo(40, 35); ctx.fill();
  
  // Spilled liquid glow
  ctx.fillStyle = COLORS.ELIXIR;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(-10, 32, 60, 4);
  ctx.restore();
};

export const drawBird = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) => {
  ctx.save();
  ctx.translate(x + 45, y); // Adjusted translate for left-facing offset
  ctx.scale(-1, 1); // Flip horizontally to face left
  
  const wingFlap = Math.sin(frame * 0.2) * 15;
  
  ctx.fillStyle = '#ffffff'; // White bird body for visibility in dark sky
  ctx.beginPath();
  ctx.ellipse(20, 15, 15, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Wings
  ctx.fillStyle = '#eeeeee';
  ctx.beginPath();
  ctx.moveTo(20, 15);
  ctx.lineTo(0, wingFlap);
  ctx.lineTo(0, wingFlap + 10);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(20, 15);
  ctx.lineTo(40, wingFlap);
  ctx.lineTo(40, wingFlap + 10);
  ctx.fill();
  
  // Beak
  ctx.fillStyle = '#d4af37'; // Gold beak
  ctx.beginPath();
  ctx.moveTo(33, 12);
  ctx.lineTo(45, 15);
  ctx.lineTo(33, 18);
  ctx.fill();

  // Eye
  ctx.fillStyle = COLORS.ELIXIR; // Glowing red eye
  ctx.beginPath();
  ctx.arc(30, 12, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

export const drawBackground = (ctx: CanvasRenderingContext2D, frame: number, logo?: HTMLImageElement | null) => {
  // 1. Draw drifting Logo Pattern at the very back
  if (logo && logo.complete) {
    ctx.save();
    ctx.globalAlpha = 0.3; // 30% transparency as requested
    const logoSize = 120;
    const spacing = 180;
    const scrollSpeed = 0.5;
    const offsetX = (frame * scrollSpeed) % spacing;
    
    for (let x = -spacing; x < CANVAS_WIDTH + spacing; x += spacing) {
      for (let y = -spacing; y < GROUND_Y + spacing; y += spacing) {
        ctx.drawImage(logo, x - offsetX, y, logoSize, logoSize);
      }
    }
    ctx.restore();
  }

  // 2. Starfield (Slow drift)
  ctx.fillStyle = '#ffffff';
  const starSpeed = 0.2;
  for(let i=0; i<30; i++) {
    const baseX = (i * 123);
    const x = (baseX - frame * starSpeed) % CANVAS_WIDTH;
    const finalX = x < 0 ? x + CANVAS_WIDTH : x;
    const y = (i * 77) % GROUND_Y;
    const opacity = Math.abs(Math.sin(frame * 0.01 + i)) * 0.7;
    ctx.globalAlpha = opacity;
    ctx.fillRect(finalX, y, 2, 2);
  }
  ctx.globalAlpha = 1.0;

  // 3. Moon (Static)
  ctx.fillStyle = '#eee';
  ctx.beginPath();
  ctx.arc(700, 50, 40, 0, Math.PI * 2);
  ctx.fill();
  
  // 4. Ground
  ctx.fillStyle = COLORS.GROUND;
  ctx.fillRect(0, GROUND_Y + 10, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

  // 5. Ritual Runes on floor
  ctx.strokeStyle = COLORS.RITUAL_CIRCLE;
  ctx.lineWidth = 2;
  const runeScroll = (frame * 2) % CANVAS_WIDTH;
  for(let i=-1; i<2; i++) {
    const startX = i * CANVAS_WIDTH + runeScroll;
    ctx.beginPath();
    ctx.moveTo(startX, GROUND_Y + 15);
    ctx.lineTo(startX + CANVAS_WIDTH, GROUND_Y + 15);
    ctx.stroke();
    
    // Tiny rune symbols
    ctx.fillStyle = COLORS.RITUAL_CIRCLE;
    ctx.font = "14px monospace";
    for(let j=0; j<10; j++) {
      ctx.fillText("᚛ ᚜", startX + (j * 80) + 20, GROUND_Y + 25);
    }
  }
};
