
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAccount, useConnect, useDisconnect, useSendTransaction, useWaitForTransactionReceipt, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Wallet, LogOut, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ritualSymphony } from './web3Config';
import { Entity, GameState, Particle, LeaderboardEntry } from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GROUND_Y, 
  GRAVITY, 
  JUMP_STRENGTH, 
  INITIAL_SPEED, 
  SPEED_INCREMENT,
  MAX_SPEED,
  SPAWN_MIN_INTERVAL,
  SPAWN_MAX_INTERVAL,
  COLORS,
  GAME_NAME
} from './constants';
import { 
  drawCat, 
  drawHat, 
  drawBook, 
  drawElixir, 
  drawBird,
  drawBackground 
} from './components/Renderer';
import { getRitualMessage } from './services/geminiService';

const Footer: React.FC = () => (
  <footer className="w-full py-8 mt-12 flex flex-col items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
    <div className="flex items-center gap-3 group">
      <div className="relative w-10 h-10 rounded-full border-2 border-[#226b48] overflow-hidden shadow-[0_0_15px_rgba(34,107,72,0.4)] group-hover:border-[#76e891] group-hover:shadow-[0_0_20px_rgba(118,232,145,0.6)] transition-all duration-500">
        <img 
          src="https://pbs.twimg.com/profile_images/1801955577763094529/5qtIvl5X_400x400.jpg" 
          alt="aliorbz" 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-[#76e891]/10 pointer-events-none"></div>
      </div>
      <p className="text-green-200/50 text-sm sm:text-lg tracking-[0.2em] uppercase font-mono italic">
        Evoked from the void by{' '}
        <a 
          href="https://x.com/aliorbz" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative inline-block text-[#76e891] font-bold no-underline group/link lowercase"
        >
          aliorbz
          <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#226b48] group-hover/link:bg-[#76e891] transition-all duration-300"></span>
          <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#76e891] group-hover/link:w-full transition-all duration-500 shadow-[0_0_10px_#76e891]"></span>
          <span className="absolute -top-4 -right-2 opacity-0 group-hover/link:opacity-100 group-hover/link:animate-bounce transition-opacity duration-300">✨</span>
        </a>
      </p>
    </div>
    <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#226b48] to-transparent opacity-30"></div>
  </footer>
);

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const [appState, setAppState] = useState<'LANDING' | 'GAME'>('LANDING');
  const [gameState, setGameState] = useState<GameState>('START');
  const [playerName] = useState('Siggy');
  const [score, setScore] = useState(0);
  
  // Web3 state
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: ritualSymphony.id,
  });
  const { sendTransaction, data: hash, error: txError, isPending: isTxSending } = useSendTransaction();
  const { isLoading: isTxConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // High score tracking - per wallet if connected
  const highScoreKey = useMemo(() => 
    isConnected && address ? `siggy_ritual_best_${address}` : 'siggy_ritual_best_local'
  , [isConnected, address]);

  const [highScore, setHighScore] = useState(0);

  // Initialize/Update high score when wallet context or local key changes
  useEffect(() => {
    const stored = localStorage.getItem(highScoreKey);
    setHighScore(stored ? Number(stored) : 0);
  }, [highScoreKey]);
  
  const isCorrectChain = currentChainId === ritualSymphony.id;
  
  const [isPaid, setIsPaid] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const RITUAL_ALTAR_ADDRESS = '0x2483e02233bd992ac1B8Ec5006320C726B6377fA'; // User Wallet Address
  const ENTRY_FEE = '0.0001';

  // Debugging
  useEffect(() => {
    if (txError) {
      console.error("Web3 Error:", txError);
    }
  }, [txError]);

  // Authoritative game start
  const startGame = useCallback(() => {
    gameVars.current = {
      speed: INITIAL_SPEED,
      frame: 0,
      nextSpawn: 100,
      player: { x: 50, y: GROUND_Y - 35, width: 35, height: 35, type: 'PLAYER' },
      playerVelY: 0,
      isJumping: false,
      obstacles: [],
      particles: [],
    };
    setScore(0);
    setGameState('PLAYING');
    setRitualMessage("The cycle repeats...");
    lastTimeRef.current = performance.now();
  }, []);

  const resetGame = startGame; // Alias for compatibility

  // Monitor transaction success
  useEffect(() => {
    if (isSuccess) {
      setIsPaid(true);
      setRitualMessage("Selection approved. Preparing ritual...");
      
      let count = 3;
      setCountdown(count);
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(timer);
          setCountdown(null);
          startGame();
        }
      }, 1000);
    }
  }, [isSuccess, startGame]);

  // Reset states if account changes
  useEffect(() => {
    setIsPaid(false);
    setCountdown(null);
  }, [address]);

  const [ritualMessage, setRitualMessage] = useState("The ritual awaits its familiar...");
  const [gameOverCooldown, setGameOverCooldown] = useState(false);
  
  const lastTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const gameVars = useRef({
    speed: INITIAL_SPEED,
    frame: 0,
    nextSpawn: 100,
    player: { x: 50, y: GROUND_Y - 35, width: 35, height: 35, type: 'PLAYER' } as Entity,
    playerVelY: 0,
    isJumping: false,
    obstacles: [] as Entity[],
    particles: [] as Particle[],
  });

  // Preload Logo
  useEffect(() => {
    const img = new Image();
    // User provided URL
    img.src = "https://pbs.twimg.com/profile_images/1912582510631858176/-Xbw2AcT_400x400.jpg";
    img.crossOrigin = "anonymous";
    img.onload = () => { logoRef.current = img; };
  }, []);

  const commitToLeaderboard = useCallback((finalScore: number) => {
    const roundedScore = Math.floor(finalScore);
    if (roundedScore > highScore) {
      setHighScore(roundedScore);
      localStorage.setItem(highScoreKey, roundedScore.toString());
      console.log(`New High Score Saved to ${highScoreKey}:`, roundedScore);
    }
  }, [highScore, highScoreKey]);

  const createParticles = (x: number, y: number, color: string) => {
    for(let i=0; i<15; i++) {
      gameVars.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1.0,
        color
      });
    }
  };

  const handleGameOver = useCallback(async (finalScore: number) => {
    setGameState('GAMEOVER');
    setIsPaid(false); // Reset payment for next round
    setGameOverCooldown(true);
    commitToLeaderboard(finalScore);
    setTimeout(() => setGameOverCooldown(false), 800);
    const msg = await getRitualMessage(Math.floor(finalScore), 'LOSS');
    setRitualMessage(msg);
  }, [commitToLeaderboard]);

  const update = useCallback(() => {
    const v = gameVars.current;
    
    // Scale updates for consistent feel
    v.frame++;
    
    // Gradual speed increase with cap
    if (v.speed < MAX_SPEED) {
      v.speed += SPEED_INCREMENT;
    }

    let currentScore = 0;
    setScore(prev => {
      const added = v.speed * 0.015;
      currentScore = prev + added;
      return currentScore;
    });

    // Jump Physics
    if (v.isJumping) {
      // If jumping up and button NOT held, apply extra gravity for variable jump height
      // This makes short taps feel snappy and holds feel floaty/higher
      const jumpKeyHeld = keysPressed.current['Space'] || keysPressed.current['ArrowUp'] || keysPressed.current['PointerDown'];
      
      // Stronger extra gravity when falling or when button is released early
      let gravityMultiplier = 1.0;
      if (v.playerVelY < 0 && !jumpKeyHeld) {
        gravityMultiplier = 2.2; // Fast fall on early release
      } else if (v.playerVelY > 0) {
        gravityMultiplier = 1.2; // Slightly faster descent for "weight"
      }
      
      v.playerVelY += GRAVITY * gravityMultiplier;
      v.player.y += v.playerVelY;

      if (v.player.y >= GROUND_Y - v.player.height) {
        v.player.y = GROUND_Y - v.player.height;
        v.playerVelY = 0;
        v.isJumping = false;
      }
    }

    // Dynamic Obstacle Spawning based on distance
    // We want the gap in pixels to be somewhat stable
    // gap_in_pixels = frames_until_next * speed
    if (v.frame >= v.nextSpawn) {
      const rand = Math.random();
      let type: 'HAT' | 'BOOK' | 'ELIXIR' | 'BIRD';
      
      // BIRD is rare (15% chance after speed reaches 8)
      if (v.speed > 8 && rand < 0.15) {
        type = 'BIRD';
      } else {
        const types: Array<'HAT' | 'BOOK' | 'ELIXIR'> = ['HAT', 'BOOK', 'ELIXIR'];
        type = types[Math.floor(Math.random() * types.length)];
      }
      
      const isBird = type === 'BIRD';
      
      v.obstacles.push({
        x: CANVAS_WIDTH,
        y: isBird ? GROUND_Y - 110 : GROUND_Y - 35,
        width: type === 'HAT' || type === 'ELIXIR' ? 40 : (type === 'BOOK' ? 35 : 45),
        height: isBird ? 25 : 35,
        type
      });

      // Calculate next spawn frames based on current speed to maintain minimum gap
      // Difficulty increases as baseGap shrinks with speed
      const baseGap = Math.max(220, 380 - (v.speed * 12)); 
      const variableGap = Math.random() * 250; 
      const framesToNext = (baseGap + variableGap) / v.speed;
      
      v.nextSpawn = v.frame + Math.max(framesToNext, 25); // Minimum 25 frames gap
    }

    // Move obstacles and collision check
    for (let i = v.obstacles.length - 1; i >= 0; i--) {
      v.obstacles[i].x -= v.speed;
      const p = v.player;
      const o = v.obstacles[i];
      
      // Tighter hitbox for better feel (circular distance or smaller rectangles)
      const padX = 10;
      const padY = 5;
      
      if (
        p.x + padX < o.x + o.width - padX && 
        p.x + p.width - padX > o.x + padX && 
        p.y + padY < o.y + o.height - padY && 
        p.y + p.height - padY > o.y + padY
      ) {
        createParticles(p.x + p.width/2, p.y + p.height/2, COLORS.ELIXIR);
        handleGameOver(currentScore);
        return false;
      }

      if (v.obstacles[i].x < -100) v.obstacles.splice(i, 1);
    }
    for (let i = v.particles.length - 1; i >= 0; i--) {
      const p = v.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
      if (p.life <= 0) v.particles.splice(i, 1);
    }
    return true;
  }, [handleGameOver]);

  const gameLoop = useCallback((time: number) => {
    if (gameState !== 'PLAYING') return;
    const deltaTime = time - lastTimeRef.current;
    const targetInterval = 1000 / 60;
    let shouldContinue = true;
    if (deltaTime >= targetInterval) {
      const updates = Math.min(Math.floor(deltaTime / targetInterval), 3);
      for (let i = 0; i < updates; i++) {
        if (!update()) {
          shouldContinue = false;
          break;
        }
      }
      lastTimeRef.current = time;
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const v = gameVars.current;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawBackground(ctx, v.frame, logoRef.current);
      v.obstacles.forEach(o => {
        if (o.type === 'HAT') drawHat(ctx, o.x, o.y);
        else if (o.type === 'BOOK') drawBook(ctx, o.x, o.y);
        else if (o.type === 'ELIXIR') drawElixir(ctx, o.x, o.y);
        else if (o.type === 'BIRD') drawBird(ctx, o.x, o.y, v.frame);
      });
      drawCat(ctx, v.player.x, v.player.y, v.frame, v.isJumping, v.playerVelY);
      v.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1.0;
    }
    if (shouldContinue) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, update]);

  const handleInput = useCallback((e?: React.SyntheticEvent | KeyboardEvent | PointerEvent) => {
    // If it's a pointer event from the global listener, we only want it to trigger in certain conditions
    if (e && e.target instanceof HTMLElement) {
      const tagName = e.target.tagName.toLowerCase();
      // Ignore clicks on buttons/inputs to avoid double-triggering or unintended actions
      if (tagName === 'button' || tagName === 'input' || e.target.closest('button')) {
        // However, if the event was triggered by the button itself (onClick), we SHOULD proceed
        // We can check if it's a synthetic event (from React) vs a native pointer event (from global listener)
        if (!('nativeEvent' in e)) { 
          // If it's a native PointerEvent from the window listener, and it's hitting a button, ignore it.
          // The button's own onClick will handle it.
          return;
        }
      }
    }

    if (gameState === 'PLAYING') {
      if (!gameVars.current.isJumping) {
        gameVars.current.playerVelY = JUMP_STRENGTH;
        gameVars.current.isJumping = true;
      }
    } else if (gameState === 'START' || (gameState === 'GAMEOVER' && !gameOverCooldown)) {
      if (appState === 'GAME' && countdown === null) {
        if (!isPaid) {
          if (!isConnected) {
            setRitualMessage("Connect your wallet to offer essence.");
            connect({ connector: connectors[0] });
            return;
          }
          if (!isCorrectChain) {
            setRitualMessage("Switch to Ritual Symphony to offer essence.");
            if (switchChain) switchChain({ chainId: ritualSymphony.id });
            return;
          }
          console.log("Initiating payment ritual...");
          sendTransaction({
            to: RITUAL_ALTAR_ADDRESS as `0x${string}`,
            value: parseEther(ENTRY_FEE),
            chainId: ritualSymphony.id,
          });
          return;
        }
        resetGame();
      }
    }
  }, [gameState, gameOverCooldown, resetGame, appState, isPaid, isConnected, isCorrectChain, connect, connectors, sendTransaction, switchChain]);


  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput(e);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      keysPressed.current['PointerDown'] = true;
      // ONLY trigger handleInput from global pointer if we are already playing
      // This prevents clicking "outside" buttons in menus from triggering actions
      if (gameState === 'PLAYING') {
        handleInput(e);
      }
    };
    const onPointerUp = () => {
      keysPressed.current['PointerDown'] = false;
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [handleInput]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      requestRef.current = requestAnimationFrame(gameLoop);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, gameLoop]);

  if (appState === 'LANDING') {
    return (
      <div className="flex flex-col items-center min-h-screen p-4 bg-[#051611] text-[#76e891] animate-in fade-in duration-1000">
        <div className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full text-center space-y-6 sm:space-y-12">
          <div className="relative inline-block px-4">
            <h1 className="text-6xl sm:text-8xl md:text-[8rem] mb-4 tracking-tighter drop-shadow-[0_0_25px_#76e891] select-none animate-pulse font-bold leading-none">{GAME_NAME}</h1>
            <div className="absolute -top-6 sm:-top-10 -right-2 sm:-right-10 text-2xl sm:text-4xl opacity-40 rotate-12">✨</div>
            <div className="absolute -bottom-6 sm:-bottom-10 -left-2 sm:-left-10 text-2xl sm:text-4xl opacity-40 -rotate-12">🌙</div>
          </div>
          <p className="text-xl sm:text-2xl text-green-200 opacity-80 leading-relaxed italic max-w-xl mx-auto px-4">A familiar awakens... <br className="hidden sm:block"/>The cosmic circle calls for your agility. <br className="hidden sm:block"/>Will you complete the ritual?</p>
          <button onClick={() => setAppState('GAME')} className="group relative inline-block px-8 sm:px-12 py-3 sm:py-5 text-xl sm:text-3xl border-4 border-[#226b48] bg-black hover:bg-[#226b48] hover:text-white transition-all cursor-pointer rounded-2xl shadow-[0_0_20px_rgba(34,107,72,0.6)] active:scale-95"><span className="relative z-10 uppercase tracking-widest font-bold">Invoke Magic</span></button>
        </div>
        <div className="w-full">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen pt-16 pb-8 px-2 sm:p-4 sm:pt-6 bg-[#051611] relative">
      {/* Wallet Connection & Info */}
      <div className="absolute top-4 right-4 z-[60] flex items-center gap-2 group">
        {!isConnected ? (
          <button 
            onClick={() => connect({ connector: connectors[0] })}
            className="flex items-center gap-2 px-4 py-2 bg-black border-2 border-[#226b48] text-[#76e891] rounded-xl hover:bg-[#226b48] hover:text-white transition-all text-lg font-bold shadow-[0_0_15px_rgba(34,107,72,0.2)] active:scale-95"
          >
            <Wallet size={16} />
            <span>Connect Wallet</span>
          </button>
        ) : (
          <>
            {/* Balance / Network Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 bg-black/60 border rounded-xl transition-colors duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${isCorrectChain ? 'border-[#226b48]/30' : 'border-red-500/50 animate-pulse'}`}>
              {!isCorrectChain ? (
                <button 
                  onClick={() => switchChain({ chainId: ritualSymphony.id })}
                  className="flex items-center gap-2 text-[8px] sm:text-[10px] text-red-400 uppercase tracking-widest font-bold hover:text-red-300 transition-colors"
                >
                  <RefreshCw size={12} className="animate-[spin_3s_linear_infinite]" />
                  <span>Switch to Ritualnet</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles size={12} className="text-[#76e891]" />
                  <span className="text-[10px] sm:text-xs text-green-200 font-mono font-bold">
                    {isBalanceLoading ? '...' : (balanceData ? `${parseFloat(formatEther(balanceData.value)).toFixed(4)} RITUAL` : '0.0000 RITUAL')}
                  </span>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-[#226b48]/30 rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <div className="w-2 h-2 rounded-full bg-[#76e891] animate-pulse"></div>
              <span className="text-[10px] sm:text-xs text-green-200 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button 
                onClick={() => disconnect()}
                className="p-1 hover:bg-white/10 rounded-md transition-colors text-green-400 ml-1"
                title="Disconnect"
              >
                <LogOut size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Back Button */}
      <button 
        onClick={() => {
          setAppState('LANDING');
          setGameState('START');
        }}
        className="absolute top-4 left-4 z-[60] flex items-center gap-2 px-3 py-1.5 border-2 border-[#226b48] bg-black/40 hover:bg-[#226b48] text-[#76e891] hover:text-white transition-all rounded-xl uppercase tracking-widest text-[10px] sm:text-xs font-bold active:scale-95 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        <span>Back</span>
      </button>

      {/* HEADER SECTION - SIGGY RUN TITLE AT TOP */}
      <header className="w-full max-w-[850px] text-center mb-6 sm:mb-10 animate-in fade-in duration-1000">
        <h1 className="text-5xl sm:text-8xl text-[#76e891] tracking-[0.1em] drop-shadow-[0_0_20px_rgba(118,232,145,0.6)] animate-pulse font-bold leading-none select-none">
          {GAME_NAME}
        </h1>
        <p className="text-[10px] sm:text-sm text-green-200 opacity-40 mt-2 sm:mt-3 italic uppercase tracking-[0.3em]">The Eternal Familiar</p>
      </header>

      {/* GAME WINDOW */}
      <div className="w-full max-w-[850px] px-0 sm:px-6 mb-8 sm:mb-10">
        <div className="relative border-4 border-[#226b48] shadow-[0_0_60px_rgba(34,107,72,0.4)] bg-black rounded-2xl overflow-hidden select-none touch-none w-full">
          
          {/* Top In-Game HUD - Hidden ritualMessage during START and GAMEOVER screens */}
          <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-start z-50 pointer-events-none">
            <div className="max-w-[140px] sm:max-w-[400px] text-[10px] sm:text-base italic text-green-100 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-tight opacity-95">
              {gameState === 'PLAYING' && `"${ritualMessage}"`}
            </div>
            <div className="text-xs sm:text-2xl font-bold font-mono text-[#76e891] drop-shadow-[0_1px_2px_rgba(0,0,0,1)] bg-black/60 px-2 py-0.5 sm:py-1 rounded-sm border border-[#226b48]/30">
              <span className="opacity-50 text-[9px] sm:text-lg uppercase mr-1 sm:mr-2">MANA</span>{Math.floor(score)}
            </div>
          </div>

          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="cursor-pointer w-full h-auto block" />

          {/* Start Screen Overlay */}
          {gameState === 'START' && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center p-4 transition-all z-40">
              <div className="flex flex-col items-center max-w-full">
                {countdown !== null ? (
                  <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="text-8xl sm:text-9xl font-black text-[#76e891] animate-bounce drop-shadow-[0_0_30px_rgba(118,232,145,0.5)]">
                      {countdown}
                    </div>
                    <p className="text-xl sm:text-2xl font-mono text-green-400 uppercase tracking-[0.3em] font-bold animate-pulse">Ritual Commencement</p>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInput(e);
                      }}
                      className={`px-8 sm:px-12 py-2 sm:py-4 border-4 border-[#226b48] bg-black hover:bg-[#226b48] hover:text-white transition-all cursor-pointer rounded-xl text-xl sm:text-2xl font-bold tracking-widest uppercase shadow-[0_4px_0_#0b2d20] active:translate-y-1 active:shadow-none flex items-center gap-3 ${isTxSending || isTxConfirming ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                      {(isTxSending || isTxConfirming) && <Loader2 size={24} className="animate-spin" />}
                      {!isConnected ? 'Connect Wallet' : (!isCorrectChain ? 'Switch Network' : (!isPaid ? `Offer ${ENTRY_FEE} RITUAL` : 'Preparing Ritual...'))}
                    </button>
                    {txError && (
                      <p className="mt-4 text-xs text-red-500 font-mono flex items-center gap-1">
                        <AlertCircle size={12} />
                        Sacrifice Failed: Balance Low or Rejected
                      </p>
                    )}
                    {isTxConfirming && (
                      <p className="mt-4 text-[10px] text-green-400 font-mono animate-pulse uppercase tracking-widest">
                        Ritual Essence in Transit...
                      </p>
                    )}
                    <p className="mt-4 sm:mt-6 text-[8px] sm:text-xs opacity-40 uppercase tracking-[0.2em] font-mono">[ Costs {ENTRY_FEE} RITUAL per circle ]</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-3 sm:p-4 z-40 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center max-w-full space-y-3 sm:space-y-6">
                <h2 className="text-2xl sm:text-5xl leading-none !mb-0 sm:mb-4 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] tracking-tighter uppercase font-black italic">Broken</h2>
                <p className="text-sm !mt-0 !mb-2 sm:text-xl text-green-200 opacity-80">Final Essence: <span className="text-[#76e891] font-mono font-bold">{Math.floor(score)}</span></p>
                {countdown !== null ? (
                  <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="text-6xl sm:text-8xl font-black text-[#76e891] animate-bounce">
                      {countdown}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInput(e);
                    }}
                    className={`px-4 mt-2 sm:mt-4 sm:px-8 py-2 sm:py-3 border-4 border-[#76e891] bg-black hover:bg-[#76e891] hover:text-black transition-all cursor-pointer rounded-xl text-lg sm:text-xl font-bold tracking-widest uppercase shadow-[0_3px_0_#0b2d20] flex items-center gap-3 ${gameOverCooldown || isTxSending || isTxConfirming ? 'opacity-50 cursor-wait pointer-events-none' : 'animate-bounce active:translate-y-1 active:shadow-none'}`}
                  >
                    {(isTxSending || isTxConfirming) && <Loader2 size={20} className="animate-spin" />}
                    {gameOverCooldown ? 'Restoring...' : (isTxSending || isTxConfirming ? 'Offering...' : (!isPaid ? `Offer ${ENTRY_FEE} RITUAL` : 'Preparing...'))}
                  </button>
                )}
                {txError && (
                  <p className="text-[10px] text-red-500 font-mono uppercase tracking-tighter">Poor soul, you lack the essence...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BEST SCORE SECTION */}
      <div className="w-full max-w-[850px] px-2 sm:px-6 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
        <div className="flex items-center justify-center gap-4 py-4 border-y border-[#226b48]/30 bg-black/20 backdrop-blur-sm rounded-2xl group">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-[#226b48]/50"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.4em] text-green-200/40 font-mono mb-1">Ritual Record</span>
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-3xl text-[#76e891] font-mono font-bold drop-shadow-[0_0_10px_rgba(118,232,145,0.4)] group-hover:drop-shadow-[0_0_15px_rgba(118,232,145,0.6)] transition-all duration-500">
                {highScore}
              </span>
              <div className="w-2 h-2 rounded-full bg-[#76e891] animate-pulse shadow-[0_0_8px_#76e891]"></div>
            </div>
            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-green-200/20 mt-1">Maximum Essence Contained</span>
          </div>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-[#226b48]/50"></div>
        </div>
      </div>

      <div className="mt-auto w-full">
        <Footer />
      </div>
    </div>
  );
};

export default App;
