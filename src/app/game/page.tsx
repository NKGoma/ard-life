'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AvatarConfig, GameState, GamePhase } from '@/types';
import {
  initGame, movePlayer, processSpaceArrival,
  answerQuestion, chooseEventOption, acknowledgeMilestone,
  endTurn, checkAllFinished, saveGame, loadGame, clearSave,
} from '@/lib/gameState';
import ScoreBar from '@/components/hud/ScoreBar';
import SpinWheel from '@/components/spinner/SpinWheel';
import QuestionCard from '@/components/questions/QuestionCard';
import EventCard from '@/components/events/EventCard';
import MilestoneCard from '@/components/milestone/MilestoneCard';
import ResultScreen from '@/components/result/ResultScreen';
import AvatarEditor from '@/components/avatar/AvatarEditor';
import { useBgm } from '@/hooks/useBgm';
import pkg from '../../../package.json';

// Dynamic import for Three.js (SSR disabled)
const GameWorld3D = dynamic(() => import('@/components/world/GameWorld3D'), { ssr: false });

// --- Setup Phase (collect player avatars) ---
function SetupScreen({ onStart }: { onStart: (avatars: AvatarConfig[]) => void }) {
  const [playerCount, setPlayerCount] = useState(0);
  const [avatars, setAvatars] = useState<AvatarConfig[]>([]);
  const [editingIndex, setEditingIndex] = useState(0);

  if (playerCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎲</div>
          <h1 className="text-3xl font-bold text-white mb-2">ARD Life – Medienedition</h1>
          <p className="text-slate-400 mb-8">Wie viele Spieler?</p>
          <div className="flex gap-3 justify-center">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-600 text-white text-2xl font-bold hover:border-blue-400 hover:bg-slate-700 transition-all"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (editingIndex < playerCount) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <p className="text-center text-slate-400 text-sm mb-4">
            Spieler {editingIndex + 1} von {playerCount}
          </p>
          {/* key={editingIndex} forces a fresh AvatarEditor for each player */}
          <AvatarEditor
            key={editingIndex}
            playerIndex={editingIndex}
            onSave={(cfg) => {
              setAvatars((prev) => [...prev, cfg]);
              setEditingIndex((prev) => prev + 1);
            }}
          />
        </div>
      </div>
    );
  }

  // All avatars collected -> confirm & start
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Alle bereit?</h2>
        <div className="flex justify-center gap-4 mb-6 flex-wrap">
          {avatars.map((a, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center text-xl font-bold text-white">
                {a.name.charAt(0)}
              </div>
              <p className="text-xs text-slate-400 mt-1">{a.name}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => onStart(avatars)}
          className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-lg hover:from-green-400 hover:to-emerald-500 transition-all shadow-xl transform hover:scale-105 active:scale-95"
        >
          🚀 Spiel starten!
        </button>
      </div>
    </div>
  );
}

// --- Main Game Page ---
export default function GamePage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<'setup' | 'game'>('setup');
  const { muted, toggleMute } = useBgm('/bgm/ard_life_instrumental.mp3', 0.25);
  const [showBoostToast, setShowBoostToast] = useState<string | null>(null);
  const [spinnerVisible, setSpinnerVisible] = useState(true);
  const [landedTileId, setLandedTileId] = useState<number | null>(null);
  const turnProcessedRef = useRef(false);

  // Try load saved game
  useEffect(() => {
    const saved = loadGame();
    if (saved && saved.phase !== 'finished') {
      setGameState(saved);
      setPhase('game');
    }
  }, []);

  // Auto-save on state change
  useEffect(() => {
    if (gameState && phase === 'game') saveGame(gameState);
  }, [gameState, phase]);

  // --- Handle start ---
  const handleStart = useCallback((avatars: AvatarConfig[]) => {
    const state = initGame(avatars);
    setGameState(state);
    setPhase('game');
  }, []);

  // --- Handle spin result (move player tile-by-tile) ---
  const handleSpin = useCallback((steps: number) => {
    if (!gameState) return;

    // 1. Hide spinner immediately – board is now the star
    setSpinnerVisible(false);
    setLandedTileId(null);

    // 2. Brief pause so the player sees the board before movement begins
    setTimeout(() => {
      setGameState((prev) => {
        if (!prev) return prev;
        return { ...prev, spinResult: steps, phase: 'moving' as GamePhase };
      });

      const player = gameState.players[gameState.currentPlayerIndex];
      const startPos = player.position;
      const maxPos = gameState.board.length - 1;
      // The rolled value is the single source of truth for movement distance
      const endPos = Math.min(startPos + steps, maxPos);
      const totalSteps = endPos - startPos;

      let currentStep = 0;

      const moveNextTile = () => {
        currentStep++;
        const newPos = startPos + currentStep;

        // Update only the position of the moving player
        setGameState((prev) => {
          if (!prev) return prev;
          const updatedPlayers = prev.players.map((p, i) =>
            i === prev.currentPlayerIndex ? { ...p, position: newPos } : p
          );
          return { ...prev, players: updatedPlayers, animatingToPosition: newPos };
        });

        if (currentStep < totalSteps) {
          setTimeout(moveNextTile, 450);
        } else {
          // ── Movement complete ──
          // Show the landing tile effect immediately
          setLandedTileId(newPos);

          // Step 1 (after 800ms): Finalise position, update stage, show
          // boost/setback toasts. The tile glow is now clearly visible.
          setTimeout(() => {
            setGameState((prev) => {
              if (!prev) return prev;
              const p = prev.players[prev.currentPlayerIndex];
              const stage = prev.board[p.position]?.stage ?? p.currentStage;
              return {
                ...prev,
                animatingToPosition: null,
                players: prev.players.map((pl, i) =>
                  i === prev.currentPlayerIndex ? { ...pl, currentStage: stage } : pl
                ),
              };
            });

            // Show boost/setback toasts during the landing pause
            setGameState((prev) => {
              if (!prev) return prev;
              const space = prev.board[prev.players[prev.currentPlayerIndex].position];
              if (space?.type === 'boost' && space.boostText) {
                setShowBoostToast(`🚀 ${space.boostText}`);
                setTimeout(() => setShowBoostToast(null), 3000);
              } else if (space?.type === 'setback' && space.setbackText) {
                setShowBoostToast(`⚠️ ${space.setbackText}`);
                setTimeout(() => setShowBoostToast(null), 3000);
              }
              return prev;
            });

            // Step 2 (after additional 1000ms): Process arrival — this is
            // where the question/event/milestone popup actually appears.
            // The extra delay lets the player see the tile reaction first.
            setTimeout(() => {
              setGameState((prev) => {
                if (!prev) return prev;
                return processSpaceArrival(prev);
              });
            }, 1000);
          }, 800);
        }
      };

      if (totalSteps > 0) {
        setTimeout(moveNextTile, 500);
      } else {
        // Rolled but can't move (already at end) – still process arrival
        setLandedTileId(startPos);
        setTimeout(() => {
          setGameState((prev) => {
            if (!prev) return prev;
            return { ...prev, animatingToPosition: null };
          });
          setTimeout(() => {
            setGameState((prev) => {
              if (!prev) return prev;
              return processSpaceArrival(prev);
            });
          }, 1000);
        }, 800);
      }
    }, 600);
  }, [gameState]);

  // --- Handle question answer ---
  const handleAnswer = useCallback((answerIndex: number) => {
    setGameState((prev) => {
      if (!prev) return prev;
      return answerQuestion(prev, answerIndex);
    });
    setLandedTileId(null);
    turnProcessedRef.current = false;
  }, []);

  // --- Handle event choice ---
  const handleEventChoice = useCallback((choiceIndex: number) => {
    setGameState((prev) => {
      if (!prev) return prev;
      return chooseEventOption(prev, choiceIndex);
    });
    setLandedTileId(null);
    turnProcessedRef.current = false;
  }, []);

  // --- Handle milestone acknowledge ---
  const handleMilestone = useCallback(() => {
    setGameState((prev) => {
      if (!prev) return prev;
      return acknowledgeMilestone(prev);
    });
    setLandedTileId(null);
    turnProcessedRef.current = false;
  }, []);

  // --- Auto-advance turn when phase returns to 'playing' after interaction ---
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase !== 'playing') {
      turnProcessedRef.current = false;
      return;
    }
    if (turnProcessedRef.current) return;
    if (gameState.spinResult === null) return;

    if (checkAllFinished(gameState)) {
      setGameState((prev) => {
        if (!prev) return prev;
        return { ...prev, phase: 'finished' as GamePhase };
      });
      return;
    }

    turnProcessedRef.current = true;
    const timer = setTimeout(() => {
      setGameState((prev) => {
        if (!prev) return prev;
        return endTurn(prev);
      });
      setLandedTileId(null);
      setSpinnerVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [gameState?.phase, gameState?.spinResult, gameState]);

  // --- Handle restart ---
  const handleRestart = useCallback(() => {
    clearSave();
    setGameState(null);
    setPhase('setup');
  }, []);

  // --- Render ---
  if (phase === 'setup' || !gameState) {
    return <SetupScreen onStart={handleStart} />;
  }

  if (gameState.phase === 'finished') {
    return <ResultScreen players={gameState.players} onRestart={handleRestart} />;
  }

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const canSpin = gameState.phase === 'playing' && gameState.spinResult === null && spinnerVisible;
  const isMoving = gameState.phase === 'moving';
  const showQuestion = !!(gameState.phase === 'question' && gameState.currentQuestion);
  const showEvent = !!(gameState.phase === 'event' && gameState.currentEvent);
  const showMilestone = !!(gameState.phase === 'milestone' && gameState.currentMilestone);
  const showContentOverlay = showQuestion || showEvent || showMilestone;
  const showSpinnerOverlay = canSpin && !isMoving && !showContentOverlay;
  const showLandingBadge = landedTileId !== null && !isMoving && !showContentOverlay && gameState.phase === 'playing';
  const showTurnTransition = gameState.phase === 'playing' && gameState.spinResult !== null && !showLandingBadge;

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: '#87CEEB' }}>

      {/* ═══════ LAYER 0: 3D Board — ALWAYS MOUNTED, ALWAYS VISIBLE ═══════ */}
      <div className="absolute inset-0 z-0">
        <GameWorld3D
          board={gameState.board}
          players={gameState.players}
          activePlayerIndex={gameState.currentPlayerIndex}
          animatingToPosition={gameState.animatingToPosition}
          landedTileId={landedTileId}
        />
      </div>

      {/* ═══════ LAYER 1: HUD — always visible, non-blocking ═══════ */}
      <div className="absolute top-0 left-0 right-0 z-30 p-2 pointer-events-none">
        <div className="pointer-events-auto max-w-2xl mx-auto">
          <ScoreBar players={gameState.players} currentPlayerIndex={gameState.currentPlayerIndex} />
        </div>
      </div>

      {/* ═══════ LAYER 2: Spinner — board remains fully visible behind it ═══════ */}
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center
          transition-all duration-500 ease-out
          ${showSpinnerOverlay
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'}`}
      >
        {showSpinnerOverlay && (
          <div className="bg-slate-900/85 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-2xl animate-spinner-enter">
            <p className="text-center text-white text-lg font-bold mb-3">
              🎲 {activePlayer.name} ist dran!
            </p>
            <SpinWheel onResult={handleSpin} disabled={!canSpin} />
          </div>
        )}
      </div>

      {/* ═══════ LAYER 3: Movement badge — bottom pill during walking ═══════ */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 px-6 py-2
          bg-blue-600/90 backdrop-blur text-white rounded-full font-bold text-sm shadow-xl
          transition-all duration-300
          ${isMoving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        🏃 {activePlayer.name} bewegt sich… ({gameState.spinResult ?? 0} Felder)
      </div>

      {/* ═══════ LAYER 3b: Landing badge — shows briefly after arriving ═══════ */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 px-6 py-2
          bg-amber-600/90 backdrop-blur text-white rounded-full font-bold text-sm shadow-xl
          transition-all duration-300
          ${showLandingBadge ? 'opacity-100 animate-land-pulse' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        📍 Feld {(landedTileId ?? 0) + 1} erreicht!
      </div>

      {/* ═══════ LAYER 4: Content overlay — question / event / milestone ═══════
          Board stays visible behind a very light tint.
          Cards animate upward ("emerge from tile" feel). */}
      <div
        className={`absolute inset-0 z-50 flex items-center justify-center p-4
          transition-all duration-500 ease-out
          ${showContentOverlay
            ? 'opacity-100 bg-black/20 backdrop-blur-[1px] pointer-events-auto'
            : 'opacity-0 pointer-events-none'}`}
      >
        {showQuestion && gameState.currentQuestion && (
          <div className="animate-emerge">
            <QuestionCard question={gameState.currentQuestion} onAnswer={handleAnswer} />
          </div>
        )}

        {showEvent && gameState.currentEvent && (
          <div className="animate-emerge">
            <EventCard event={gameState.currentEvent} onChoose={handleEventChoice} />
          </div>
        )}

        {showMilestone && gameState.currentMilestone && (
          <div className="animate-emerge">
            <MilestoneCard space={gameState.currentMilestone} onAcknowledge={handleMilestone} />
          </div>
        )}
      </div>

      {/* ═══════ LAYER 5: Boost / setback toast ═══════ */}
      <div
        className={`absolute top-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3
          bg-slate-800/95 backdrop-blur border border-slate-600 rounded-xl text-white font-bold text-lg shadow-2xl
          transition-all duration-300
          ${showBoostToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        {showBoostToast ?? ''}
      </div>

      {/* ═══════ LAYER 6: Turn transition badge ═══════ */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-30 px-4 py-2
          bg-slate-800/90 backdrop-blur text-slate-300 rounded-full text-xs shadow-lg
          transition-all duration-300
          ${showTurnTransition ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        ⏭ Nächster Spieler gleich…
      </div>

      {/* ═══════ LAYER 7: Bottom bar — always visible ═══════ */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-2 flex items-center justify-between pointer-events-none">
        <div className="text-xs text-white/60 drop-shadow">
          Runde {Math.floor(gameState.turnCount / gameState.players.length) + 1} · Zug {gameState.turnCount + 1}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 drop-shadow">v{pkg.version}</span>
          <button
            onClick={toggleMute}
            title={muted ? 'Musik einschalten' : 'Musik ausschalten'}
            className="pointer-events-auto text-base w-8 h-8 flex items-center justify-center rounded-lg bg-black/20 hover:bg-black/40 text-white/60 hover:text-white transition-all drop-shadow"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleRestart}
            className="pointer-events-auto text-xs text-white/60 hover:text-red-400 transition-colors px-3 py-1 rounded-lg hover:bg-black/30 drop-shadow"
          >
            🔄 Neu starten
          </button>
        </div>
      </div>
    </div>
  );
}
