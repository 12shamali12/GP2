"use client";

/**
 * Tooth Defender 3D — endless bacteria-shooter built on react-three-fiber.
 *
 * A pearly molar floats in the center of the scene. Bacteria (red spheres
 * with wobbly geometry) spawn on a sphere around it and crawl inward. Click
 * a bacteria to vaporize it; let it touch the tooth and you lose a life.
 * Start with 3 lives. Bacteria health, speed, and spawn rate climb with the
 * patient's streak level AND elapsed game time, so a 30-second run plays
 * very differently from a 90-second one.
 *
 * Score model:
 *   - kill          → base 25 × levelMult × healthBonus
 *   - perfect kill  → first-shot kills get +10
 *   - lose a life   → -50 (penalty stings but is recoverable)
 *
 * The component owns its own rAF loop; on game-over it calls `onFinish` with
 * the final score so the games hub can submit it to the backend.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles, Stars } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { HudChip } from "@/features/arcade/components/hud-chip";

type GameProps = {
  /** 1..10 — increases spawn rate, bacteria HP, and movement speed. */
  level: number;
  onFinish: (score: number, durationMs: number) => void;
  onCancel: () => void;
  /** Top-bar portal target for the focus-mode HUD. */
  hudSlot?: HTMLElement | null;
};

const TOOTH_RADIUS = 0.85;
const SPAWN_RADIUS = 6;
const KILL_RADIUS = 1.15; // distance at which a bacteria "hits" the tooth

type Bacteria = {
  id: number;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  maxHp: number;
  hp: number;
  color: THREE.Color;
  scale: number;
  /** Tracks how many shots have hit it — first-shot kill = +10 bonus. */
  hits: number;
};

function levelTuning(level: number, elapsedSec = 0) {
  // Lv 11 is endless. Starts at Lv 2 (slow spawns, 1-HP bacteria) and
  // climbs ~1 level every 15 seconds:
  //   0s  → Lv 2     (gentle warmup, lots of kill chains)
  //   30s → Lv 4     (faster spawns)
  //   60s → Lv 6     (tougher bacteria)
  //   120s → Lv 10   (Lv 10-equivalent intensity)
  //   180s → Lv 14   (beyond fixed-level peak)
  const endless = level >= 11;
  const baseLv = endless ? 2 : Math.max(1, Math.min(10, level));
  const escalation = endless ? Math.min(12, elapsedSec / 15) : 0;
  const lv = baseLv + escalation;
  // Eased across the board: slower spawns, slower bacteria, lower HP wall.
  // Old Lv 10 = 6 HP bacteria + 1.23 u/s; new peak = 4 HP + 0.95 u/s.
  return {
    // Slower cadence — gives the player breathing room to land hits.
    spawnIntervalMs: Math.max(380, Math.round(1300 - (lv - 1) * 60)),
    // Gentler speed curve so even endless stays clickable.
    bacteriaSpeed: 0.45 + (lv - 1) * 0.05,
    // HP grows every 3 levels instead of every 2, capped at 4. Way fewer
    // shots-per-kill at high levels.
    bacteriaHp: Math.min(4, 1 + Math.floor((lv - 1) / 3)),
    scoreMult: 1 + (lv - 1) * 0.12,
  };
}

export function ToothDefenderGame({
  level,
  onFinish,
  onCancel,
  hudSlot,
}: GameProps) {
  void onCancel; // Quit is owned by the parent's Exit button.
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [killCount, setKillCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [running, setRunning] = useState(true);
  // Screen-space pointer FX (DOM-overlay on top of the Canvas). Each entry
  // is positioned absolutely in % units so it survives canvas resizes.
  const [tapFx, setTapFx] = useState<
    Array<{
      id: number;
      xPct: number;
      yPct: number;
      kind: "kill" | "miss";
      text?: string;
      color: string;
    }>
  >([]);
  // Red flash overlay — pulses each time the tooth gets breached.
  const [hitFlashId, setHitFlashId] = useState(0);
  const fxIdRef = useRef(0);
  const lastKillAtRef = useRef(0);
  const startedAtRef = useRef<number>(performance.now());
  const finishedRef = useRef(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setRunning(false);
    const duration = performance.now() - startedAtRef.current;
    setTimeout(() => onFinish(scoreRef.current, Math.round(duration)), 60);
  }, [onFinish]);

  useEffect(() => {
    if (lives <= 0) finish();
  }, [lives, finish]);

  /**
   * Emit a screen-space FX overlay (popup / ripple). xPct/yPct are 0..100
   * percentages relative to the canvas wrapper so resizes don't break the
   * position.
   */
  const popFx = useCallback(
    (
      xPct: number,
      yPct: number,
      kind: "kill" | "miss",
      text: string,
      color: string,
    ) => {
      fxIdRef.current += 1;
      const id = fxIdRef.current;
      setTapFx((prev) => [...prev, { id, xPct, yPct, kind, text, color }]);
      setTimeout(() => {
        setTapFx((prev) => prev.filter((f) => f.id !== id));
      }, 900);
    },
    [],
  );

  const handleKill = useCallback(
    (bonus: number, xPct: number, yPct: number) => {
      // Rapid kills (within 1.6s) extend combo — pure visual sugar, doesn't
      // change scoring, just makes the chain feel hot.
      const now = performance.now();
      const next = now - lastKillAtRef.current < 1600 ? combo + 1 : 1;
      lastKillAtRef.current = now;
      setCombo(next);
      setScore((s) => s + bonus);
      setKillCount((c) => c + 1);
      const text = next >= 3 ? `+${bonus} ×${next}` : `+${bonus}`;
      popFx(xPct, yPct, "kill", text, "rgba(94,234,212,0.95)");
    },
    [combo, popFx],
  );

  const handleHit = useCallback(() => {
    setLives((l) => l - 1);
    setScore((s) => Math.max(0, s - 50));
    setCombo(0);
    setHitFlashId((n) => n + 1);
  }, []);

  /** Empty-space click — show a small "miss" ripple, break combo. */
  const handleMissClick = useCallback(
    (xPct: number, yPct: number) => {
      if (combo > 0) setCombo(0);
      popFx(xPct, yPct, "miss", "·", "rgba(255,255,255,0.85)");
    },
    [combo, popFx],
  );

  const hud = (
    <>
      <HudChip label="Score" value={score} variant="score" />
      <HudChip label="Kills" value={killCount} variant="neutral" />
      {combo >= 2 ? (
        <HudChip label="Combo" value={`×${combo}`} variant="combo" urgent />
      ) : null}
      <HudChip
        label="Lives"
        value={"❤".repeat(Math.max(0, lives)) || "—"}
        variant={lives <= 1 ? "danger" : "lives"}
        urgent={lives <= 1}
      />
      <HudChip label="Level" value={level} variant="level" />
    </>
  );

  return (
    <div className="flex h-full w-full flex-col items-center gap-3">
      {hudSlot ? createPortal(hud, hudSlot) : null}

      <div
        className="relative w-full overflow-hidden rounded-[24px] border border-white/14 shadow-[0_28px_70px_rgba(7,18,34,0.32)]"
        style={{
          aspectRatio: "16 / 10",
          maxHeight: "100%",
        }}
      >
        <Canvas
          // Camera is higher and tilted slightly downward so bacteria
          // approaching from "behind" the tooth (from camera's POV) are
          // still visible above and to the sides instead of hidden.
          camera={{ position: [0, 4.2, 7], fov: 55 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#06141f"]} />
          <fog attach="fog" args={["#06141f", 6, 16]} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[3, 5, 4]} intensity={1.4} castShadow />
          <pointLight position={[-4, -2, -4]} intensity={0.6} color="#67e8f9" />
          <Stars
            radius={40}
            depth={60}
            count={1800}
            factor={2}
            saturation={0}
            fade
            speed={0.4}
          />
          <Sparkles
            count={50}
            scale={[8, 5, 8]}
            size={1.5}
            speed={0.3}
            color="#bef264"
          />
          <Tooth />
          {running ? (
            <Swarm
              level={level}
              onKill={handleKill}
              onHit={handleHit}
              onMissClick={handleMissClick}
              running={running}
            />
          ) : null}
        </Canvas>

        {/* Red flash overlay on tooth-breach. Re-keyed so the animation
            replays on each subsequent hit. */}
        <span
          key={hitFlashId}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={
            hitFlashId > 0
              ? {
                  background:
                    "radial-gradient(circle at center, rgba(244,63,94,0.55), transparent 65%)",
                  animation: "denty-blast-flash 700ms ease-out forwards",
                }
              : undefined
          }
        />

        {/* Screen-space FX layer — kill popups, miss markers. Positioned in
            percent so it scales with the canvas. */}
        <div className="pointer-events-none absolute inset-0">
          {tapFx.map((fx) => (
            <span
              key={fx.id}
              aria-hidden
              className="absolute font-extrabold tabular-nums drop-shadow-[0_4px_14px_rgba(7,18,34,0.55)]"
              style={{
                left: `${fx.xPct}%`,
                top: `${fx.yPct}%`,
                color: fx.color,
                fontSize:
                  fx.kind === "miss"
                    ? "1.25rem"
                    : "clamp(1.4rem, 2.5vw, 2.2rem)",
                textShadow:
                  "0 0 14px currentColor, 0 2px 6px rgba(0,0,0,0.5)",
                WebkitTextStroke:
                  fx.kind === "kill" ? "1px rgba(255,255,255,0.55)" : undefined,
                animation:
                  "denty-blast-pop 900ms cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards",
              }}
            >
              {fx.text}
            </span>
          ))}
        </div>

        {!running ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(6,20,31,0.55)] backdrop-blur-[6px]">
            <div
              className="rounded-[24px] border border-rose-200/40 bg-[linear-gradient(135deg,rgba(124,45,18,0.92),rgba(76,29,149,0.92))] px-7 py-5 text-center text-white shadow-[0_30px_80px_rgba(7,18,34,0.55)]"
              style={{
                animation:
                  "denty-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-rose-100/85">
                Tooth breached
              </p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums sm:text-5xl">
                {score}
              </p>
              <p className="mt-2 text-xs text-white/80">
                {killCount} bacteria vaporized
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <p className="px-1 text-[11px] text-white/70">
        Click bacteria to vaporize them before they reach the tooth. Tougher
        bacteria need multiple shots — first-shot kills get a bonus. Lose 50
        points and a heart on every breach.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tooth                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Tooth model — built from primitives to look like an actual molar:
 *   - Crown: rounded sphere flattened slightly, with 4 cusp bumps on top
 *   - Two root cones extending downward
 *   - Subtle gum-line gradient via a darker base ring
 *
 * The whole group bobs gently via <Float>; the crown rotates so the cusps
 * catch the directional light.
 */
function Tooth() {
  const crownRef = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (crownRef.current) crownRef.current.rotation.y += dt * 0.25;
  });
  return (
    <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.45}>
      <group>
        {/* Crown — wide flattened sphere */}
        <mesh
          ref={crownRef}
          castShadow
          receiveShadow
          scale={[1.05, 0.85, 1.05]}
        >
          <sphereGeometry args={[TOOTH_RADIUS, 36, 28]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.28}
            metalness={0.16}
            emissive="#e0f2fe"
            emissiveIntensity={0.12}
          />
        </mesh>
        {/* Cusps — four little bumps on top of the crown */}
        {[
          [0.42, 0.55, 0.42],
          [-0.42, 0.55, 0.42],
          [0.42, 0.55, -0.42],
          [-0.42, 0.55, -0.42],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <sphereGeometry args={[0.22, 20, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              roughness={0.25}
              emissive="#dbeafe"
              emissiveIntensity={0.18}
            />
          </mesh>
        ))}
        {/* Roots — two cones extending downward */}
        <mesh position={[0.32, -0.85, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.32, 0.85, 18]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.45} />
        </mesh>
        <mesh position={[-0.32, -0.85, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.32, 0.85, 18]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.45} />
        </mesh>
        {/* Gum-line band — subtle pinkish ring around the base of the crown */}
        <mesh position={[0, -0.35, 0]} scale={[1.04, 0.18, 1.04]}>
          <sphereGeometry args={[TOOTH_RADIUS, 28, 12]} />
          <meshStandardMaterial
            color="#fb7185"
            roughness={0.6}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>
    </Float>
  );
}

/* -------------------------------------------------------------------------- */
/* Swarm — spawn loop + per-frame motion + click handling                     */
/* -------------------------------------------------------------------------- */

type SwarmProps = {
  level: number;
  running: boolean;
  onKill: (bonus: number, xPct: number, yPct: number) => void;
  onHit: () => void;
  onMissClick: (xPct: number, yPct: number) => void;
};

/** Toothpaste droplet flying from the tooth to a bacteria's position. */
type Projectile = {
  id: number;
  origin: THREE.Vector3;
  target: THREE.Vector3;
  startMs: number;
  durationMs: number;
};

function Swarm({ level, onKill, onHit, onMissClick, running }: SwarmProps) {
  const { camera, gl } = useThree();
  const [, force] = useState(0);
  const swarmRef = useRef<Bacteria[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const idRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const startedAtRef = useRef(performance.now());
  // Re-tune every 2s in endless mode so spawn cadence / HP escalate.
  const [tuningTick, setTuningTick] = useState(0);
  useEffect(() => {
    if (level < 11) return;
    const id = setInterval(() => setTuningTick((n) => n + 1), 2000);
    return () => clearInterval(id);
  }, [level]);
  const tuning = useMemo(() => {
    const elapsedSec = (performance.now() - startedAtRef.current) / 1000;
    return levelTuning(level, elapsedSec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, tuningTick]);

  // Click handling — raycast from canvas pointer to the swarm group.
  useEffect(() => {
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const handler = (ev: PointerEvent) => {
      if (!running) return;
      const rect = dom.getBoundingClientRect();
      const xPct = ((ev.clientX - rect.left) / rect.width) * 100;
      const yPct = ((ev.clientY - rect.top) / rect.height) * 100;
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      // Closest bacteria within a small angular tolerance from the pointer
      // ray gets hit. We can't use scene.children directly because each
      // bacteria is a separate React-managed mesh, so we test by sphere.
      let bestIdx = -1;
      let bestT = Infinity;
      const tmpSphere = new THREE.Sphere();
      swarmRef.current.forEach((b, i) => {
        tmpSphere.set(b.position, 0.32 * b.scale);
        const target = new THREE.Vector3();
        if (raycaster.ray.intersectSphere(tmpSphere, target)) {
          const t = target.distanceTo(camera.position);
          if (t < bestT) {
            bestT = t;
            bestIdx = i;
          }
        }
      });
      if (bestIdx === -1) {
        onMissClick(xPct, yPct);
        return;
      }
      const b = swarmRef.current[bestIdx];
      // Spawn a toothpaste droplet from the tooth toward the bacteria's
      // current position so the player sees the tooth fire back.
      idRef.current += 1;
      projectilesRef.current.push({
        id: idRef.current,
        origin: new THREE.Vector3(0, 0, 0),
        target: b.position.clone(),
        startMs: performance.now(),
        durationMs: 220,
      });
      b.hp -= 1;
      b.hits += 1;
      if (b.hp <= 0) {
        const firstShotBonus = b.hits === 1 ? 10 : 0;
        const base = Math.round(25 * tuning.scoreMult);
        onKill(
          base + firstShotBonus + (b.maxHp - 1) * 5,
          xPct,
          yPct,
        );
        swarmRef.current.splice(bestIdx, 1);
      } else {
        // Flash the surviving bacteria toward white so the player sees the hit.
        b.color.lerp(new THREE.Color("#fef9c3"), 0.6);
      }
      force((n) => n + 1);
    };
    dom.addEventListener("pointerdown", handler);
    return () => dom.removeEventListener("pointerdown", handler);
  }, [camera, gl, onKill, onMissClick, running, tuning.scoreMult]);

  useFrame((_, dt) => {
    if (!running) return;

    // Spawn cadence
    const now = performance.now();
    if (now - lastSpawnRef.current > tuning.spawnIntervalMs) {
      lastSpawnRef.current = now;
      // Spawn on a dome/horseshoe around the tooth — front + sides + above,
      // but never directly behind. Camera looks from (0, 4.2, 7) toward
      // origin, so bacteria with z < -0.5 of the radius can be hidden by
      // the tooth. We restrict spawn to z > -0.2 (front-facing hemisphere).
      const phi = Math.random() * Math.PI * 2;
      // Tilt vertical spread upward — most bacteria come from above and
      // around, never from directly below.
      const cosT = -0.2 + Math.random() * 1.2; // y component in [-0.2, 1.0]
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      let zComp = sinT * Math.sin(phi);
      // Reflect to the front hemisphere if needed so the player always
      // sees the bacteria approaching.
      if (zComp < -0.2) zComp = Math.abs(zComp) + 0.1;
      const dir = new THREE.Vector3(
        sinT * Math.cos(phi),
        cosT,
        zComp,
      ).normalize();
      const pos = dir.clone().multiplyScalar(SPAWN_RADIUS);
      const towardCenter = pos.clone().negate().normalize();
      const scale = 0.85 + Math.random() * 0.5;
      idRef.current += 1;
      swarmRef.current.push({
        id: idRef.current,
        position: pos,
        direction: towardCenter,
        speed: tuning.bacteriaSpeed * (0.85 + Math.random() * 0.3),
        maxHp: tuning.bacteriaHp,
        hp: tuning.bacteriaHp,
        color: new THREE.Color().setHSL(
          0.95 + Math.random() * 0.04, // crimson → magenta
          0.7,
          0.5,
        ),
        scale,
        hits: 0,
      });
    }

    // Per-frame: advance position; if it crosses the kill radius → tooth hit.
    let killed = false;
    for (let i = swarmRef.current.length - 1; i >= 0; i -= 1) {
      const b = swarmRef.current[i];
      b.position.addScaledVector(b.direction, b.speed * dt);
      if (b.position.length() <= KILL_RADIUS + 0.32 * b.scale) {
        swarmRef.current.splice(i, 1);
        onHit();
        killed = true;
      }
    }
    // Cull expired projectiles.
    const cutoff = now;
    if (projectilesRef.current.length > 0) {
      const survivors = projectilesRef.current.filter(
        (p) => cutoff - p.startMs < p.durationMs,
      );
      if (survivors.length !== projectilesRef.current.length) {
        projectilesRef.current = survivors;
      }
    }
    if (killed || swarmRef.current.length > 0 || projectilesRef.current.length > 0) {
      force((n) => n + 1);
    }
  });

  return (
    <group>
      {swarmRef.current.map((b) => (
        <BacteriaMesh key={b.id} bacteria={b} />
      ))}
      {projectilesRef.current.map((p) => (
        <Projectile key={p.id} projectile={p} />
      ))}
    </group>
  );
}

/**
 * Bacteria mesh — wobbly red icosahedron with little antenna spikes around
 * it so it reads as a microbe rather than a flat sphere.
 */
function BacteriaMesh({ bacteria }: { bacteria: Bacteria }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.position.copy(bacteria.position);
      ref.current.rotation.x += dt * 1.5;
      ref.current.rotation.y += dt * 1.1;
    }
  });
  // Spike positions on a unit cube's corners — adds personality.
  const spikes: [number, number, number][] = [
    [0.3, 0.3, 0],
    [-0.3, 0.3, 0],
    [0, 0.32, 0.3],
    [0, 0.32, -0.3],
    [0.25, -0.25, 0.2],
    [-0.25, -0.25, -0.2],
  ];
  return (
    <group ref={ref} scale={bacteria.scale}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.34, 1]} />
        <meshStandardMaterial
          color={bacteria.color}
          roughness={0.45}
          metalness={0.18}
          emissive={bacteria.color}
          emissiveIntensity={0.4}
        />
      </mesh>
      {spikes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshStandardMaterial
            color={bacteria.color}
            emissive={bacteria.color}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Toothpaste droplet — small mint-colored sphere with a glowing trail that
 * lerps from the tooth (origin) to where the bacteria was when shot.
 */
function Projectile({ projectile }: { projectile: Projectile }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = Math.min(
      1,
      (performance.now() - projectile.startMs) / projectile.durationMs,
    );
    // Eased lerp for snappy launch.
    const ease = 1 - Math.pow(1 - t, 2);
    const x = projectile.origin.x + (projectile.target.x - projectile.origin.x) * ease;
    const y = projectile.origin.y + (projectile.target.y - projectile.origin.y) * ease;
    const z = projectile.origin.z + (projectile.target.z - projectile.origin.z) * ease;
    ref.current.position.set(x, y, z);
    ref.current.scale.setScalar(0.18 + t * 0.12);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial
        color="#bef264"
        emissive="#bef264"
        emissiveIntensity={1.2}
        toneMapped={false}
      />
    </mesh>
  );
}
