"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import type { WeatherMode } from "@/lib/weather";

interface WeatherBackgroundProps {
  mode: WeatherMode;
  enabled: boolean;
}

export default function WeatherBackground({ mode, enabled }: WeatherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flashOverlayRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // ==========================================
    // 1. PARTICLES & ACTORS DATA STRUCTURES
    // ==========================================

    // SUN DUST (Clear Day)
    interface SunDust {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      baseAlpha: number;
      phase: number;
    }

    // RAIN & THUNDERSTORM
    interface RainDrop {
      x: number;
      y: number;
      l: number;
      xs: number;
      ys: number;
      thickness: number;
      opacity: number;
      layer: "front" | "mid" | "back";
    }

    interface SplashRipple {
      x: number;
      y: number;
      r: number;
      maxR: number;
      alpha: number;
      speed: number;
    }

    interface GlassDroplet {
      x: number;
      y: number;
      r: number;
      speedY: number;
      isTrickling: boolean;
      trail: { x: number; y: number; r: number; alpha: number }[];
    }

    // LIGHTNING (Thunderstorm)
    interface LightningPoint {
      x: number;
      y: number;
    }

    interface LightningBranch {
      points: LightningPoint[];
      alpha: number;
      width: number;
    }

    // STARS & METEORS (Clear Night)
    interface Star {
      x: number;
      y: number;
      r: number;
      baseAlpha: number;
      pulseSpeed: number;
      phase: number;
      isCrossSparkle: boolean;
      color: string;
    }

    interface Meteor {
      x: number;
      y: number;
      len: number;
      vx: number;
      vy: number;
      alpha: number;
      active: boolean;
    }

    // SNOW (Snow)
    interface Snowflake {
      x: number;
      y: number;
      r: number;
      vy: number;
      swaySpeed: number;
      swayPhase: number;
      swayWidth: number;
      alpha: number;
      layer: "front" | "mid" | "back";
    }

    // CLOUD & FOG
    interface CloudBlob {
      x: number;
      y: number;
      rx: number;
      ry: number;
      vx: number;
      alpha: number;
    }

    interface WindWisp {
      x: number;
      y: number;
      len: number;
      vx: number;
      alpha: number;
    }

    interface MistBand {
      y: number;
      baseY: number;
      height: number;
      vx: number;
      offset: number;
      waveFreq: number;
      waveAmp: number;
      alpha: number;
    }

    // ==========================================
    // 2. INITIALIZE FOR CURRENT MODE
    // ==========================================

    const sunDust: SunDust[] = [];
    const rainDrops: RainDrop[] = [];
    const splashRipples: SplashRipple[] = [];
    const glassDroplets: GlassDroplet[] = [];
    const stars: Star[] = [];
    const meteors: Meteor[] = [];
    const snowflakes: Snowflake[] = [];
    const cloudBlobs: CloudBlob[] = [];
    const windWisps: WindWisp[] = [];
    const mistBands: MistBand[] = [];

    // --- CLEAR DAY: Golden Sun Motes & Soft Warmth ---
    if (mode === "clear-day") {
      const dustCount = Math.min(Math.floor(width / 24), 50);
      for (let i = 0; i < dustCount; i++) {
        sunDust.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 2.2 + 0.8,
          vx: (Math.random() - 0.45) * 0.35,
          vy: -Math.random() * 0.45 - 0.2,
          baseAlpha: Math.random() * 0.35 + 0.2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // --- CLEAR NIGHT: Twinkling Stars, Cross-Sparkles & Meteors ---
    if (mode === "clear-night") {
      const starCount = Math.min(Math.floor(width / 10), 140);
      const starColors = [
        "rgba(255, 255, 255,",
        "rgba(224, 231, 255,",
        "rgba(254, 240, 138,",
        "rgba(199, 210, 254,",
      ];

      for (let i = 0; i < starCount; i++) {
        const isSparkle = i % 8 === 0; // ~12% are 4-point sparkle cross stars
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.9),
          r: isSparkle ? Math.random() * 1.8 + 1.2 : Math.random() * 1.2 + 0.5,
          baseAlpha: Math.random() * 0.5 + 0.3,
          pulseSpeed: Math.random() * 2.2 + 0.8,
          phase: Math.random() * Math.PI * 2,
          isCrossSparkle: isSparkle,
          color: starColors[Math.floor(Math.random() * starColors.length)],
        });
      }

      // Meteors (shooting stars pool)
      for (let i = 0; i < 2; i++) {
        meteors.push({
          x: 0,
          y: 0,
          len: 0,
          vx: 0,
          vy: 0,
          alpha: 0,
          active: false,
        });
      }
    }

    // --- RAIN & THUNDERSTORM: Visible Streaks, Droplets on Glass & Splashes ---
    if (mode === "rain" || mode === "thunderstorm") {
      const isThunder = mode === "thunderstorm";
      const dropCount = Math.min(
        Math.floor(width / (isThunder ? 5.5 : 7)),
        isThunder ? 240 : 180
      );

      for (let i = 0; i < dropCount; i++) {
        const rand = Math.random();
        let layer: "front" | "mid" | "back" = "mid";
        let thickness = 1.2;
        let l = Math.random() * 16 + 18;
        let ys = Math.random() * 12 + 18;
        let opacity = Math.random() * 0.25 + 0.3;

        if (rand > 0.7) {
          // Front layer: thick, fast, bright, longer
          layer = "front";
          thickness = isThunder ? 1.8 : 1.5;
          l = Math.random() * 20 + 26;
          ys = Math.random() * 14 + 24;
          opacity = Math.random() * 0.25 + 0.45;
        } else if (rand < 0.3) {
          // Back layer: fine, misty
          layer = "back";
          thickness = 0.8;
          l = Math.random() * 10 + 12;
          ys = Math.random() * 8 + 14;
          opacity = Math.random() * 0.15 + 0.15;
        }

        const xs = isThunder ? -3.5 - Math.random() * 2.5 : -2.0 - Math.random() * 1.5;

        rainDrops.push({
          x: Math.random() * (width + 200),
          y: Math.random() * height,
          l,
          xs,
          ys,
          thickness,
          opacity,
          layer,
        });
      }

      // Realistic beaded water droplets on viewport glass (window effect)
      const glassCount = Math.min(Math.floor(width / 55), 24);
      for (let i = 0; i < glassCount; i++) {
        const isTrickle = i % 5 === 0;
        glassDroplets.push({
          x: Math.random() * (width - 40) + 20,
          y: Math.random() * (height - 60) + 30,
          r: Math.random() * 2.2 + 2.0,
          speedY: isTrickle ? Math.random() * 0.8 + 0.25 : 0,
          isTrickling: isTrickle,
          trail: [],
        });
      }
    }

    // --- SNOW: Multi-Layer Swaying Snowflakes ---
    if (mode === "snow") {
      const flakeCount = Math.min(Math.floor(width / 11), 110);
      for (let i = 0; i < flakeCount; i++) {
        const rand = Math.random();
        let layer: "front" | "mid" | "back" = "mid";
        let r = Math.random() * 1.8 + 1.6;
        let vy = Math.random() * 1.4 + 1.2;
        let alpha = Math.random() * 0.3 + 0.6;
        let swayWidth = Math.random() * 25 + 15;

        if (rand > 0.8) {
          // Front layer: large soft-focus bokeh flakes
          layer = "front";
          r = Math.random() * 2.5 + 3.5;
          vy = Math.random() * 1.6 + 1.8;
          alpha = Math.random() * 0.25 + 0.65;
          swayWidth = Math.random() * 35 + 25;
        } else if (rand < 0.3) {
          // Back layer: fine snow dust
          layer = "back";
          r = Math.random() * 1.0 + 0.8;
          vy = Math.random() * 0.8 + 0.8;
          alpha = Math.random() * 0.2 + 0.35;
          swayWidth = Math.random() * 15 + 8;
        }

        snowflakes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r,
          vy,
          swaySpeed: Math.random() * 1.6 + 0.8,
          swayPhase: Math.random() * Math.PI * 2,
          swayWidth,
          alpha,
          layer,
        });
      }
    }

    // --- CLOUDY: Volumetric Drifting Clouds & Breeze Wisps ---
    if (mode === "cloudy") {
      const cloudCount = 8;
      for (let i = 0; i < cloudCount; i++) {
        cloudBlobs.push({
          x: (i / cloudCount) * (width + 300) - 150,
          y: Math.random() * (height * 0.6),
          rx: Math.random() * 220 + 200,
          ry: Math.random() * 110 + 90,
          vx: Math.random() * 10 + 8,
          alpha: Math.random() * 0.08 + 0.08,
        });
      }

      // Subtle breeze lines drifting across
      for (let i = 0; i < 12; i++) {
        windWisps.push({
          x: Math.random() * width,
          y: Math.random() * height,
          len: Math.random() * 140 + 80,
          vx: Math.random() * 60 + 50,
          alpha: Math.random() * 0.1 + 0.05,
        });
      }
    }

    // --- FOG: Undulating Mist Bands & Moisture Drift ---
    if (mode === "fog") {
      const mistCount = 6;
      for (let i = 0; i < mistCount; i++) {
        const baseY = (i / mistCount) * height + Math.random() * 30;
        mistBands.push({
          baseY,
          y: baseY,
          height: Math.random() * 160 + 130,
          vx: Math.random() * 14 + 8,
          offset: Math.random() * width,
          waveFreq: Math.random() * 0.003 + 0.0015,
          waveAmp: Math.random() * 18 + 12,
          alpha: Math.random() * 0.07 + 0.06,
        });
      }
    }

    // ==========================================
    // 3. LIGHTNING GENERATOR FOR THUNDERSTORM
    // ==========================================
    let nextLightningTime = performance.now() + Math.random() * 4000 + 2500;
    let lightningBranches: LightningBranch[] = [];
    let lightningFlashAlpha = 0;

    const triggerLightningBolt = (now: number) => {
      lightningBranches = [];
      const startX = Math.random() * (width * 0.6) + width * 0.2;
      const startY = 0;
      const endX = startX + (Math.random() - 0.5) * 220;
      const endY = Math.random() * (height * 0.45) + height * 0.4;

      // Build main jagged bolt
      const mainPoints: LightningPoint[] = [{ x: startX, y: startY }];
      const segments = 12;
      for (let i = 1; i < segments; i++) {
        const progress = i / segments;
        const currentX =
          startX + (endX - startX) * progress + (Math.random() - 0.5) * 45;
        const currentY = startY + (endY - startY) * progress;
        mainPoints.push({ x: currentX, y: currentY });

        // Occasional branch off main bolt
        if (Math.random() > 0.65 && i > 3 && i < segments - 2) {
          const branchPoints: LightningPoint[] = [{ x: currentX, y: currentY }];
          const branchLen = 4;
          let bx = currentX;
          let by = currentY;
          for (let j = 0; j < branchLen; j++) {
            bx += (Math.random() - 0.3) * 35;
            by += Math.random() * 30 + 15;
            branchPoints.push({ x: bx, y: by });
          }
          lightningBranches.push({
            points: branchPoints,
            alpha: 0.85,
            width: 1.2,
          });
        }
      }
      mainPoints.push({ x: endX, y: endY });

      lightningBranches.push({
        points: mainPoints,
        alpha: 1.0,
        width: 2.2,
      });

      // Atmospheric flash
      lightningFlashAlpha = 0.45;
      nextLightningTime = now + Math.random() * 7000 + 4000;
    };

    // Meteor trigger timer for clear night
    let nextMeteorTime = performance.now() + Math.random() * 4000 + 2000;

    // ==========================================
    // 4. ANIMATION RENDER LOOP
    // ==========================================
    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // ------------------------------------------
      // MODE 1: CLEAR DAY (Sun Dust Motes)
      // ------------------------------------------
      if (mode === "clear-day") {
        // Sun Motes / Golden Floating Dust
        for (let i = 0; i < sunDust.length; i++) {
          const d = sunDust[i];
          d.phase += delta * 1.8;
          d.x += d.vx * 60 * delta;
          d.y += d.vy * 60 * delta;

          if (d.y < -10) d.y = height + 10;
          if (d.x < -10) d.x = width + 10;
          if (d.x > width + 10) d.x = -10;

          const currentAlpha = Math.max(
            0.05,
            d.baseAlpha + Math.sin(d.phase) * 0.15
          );

          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(250, 245, 230, ${currentAlpha * 0.5})`;
          ctx.fill();
        }
      }

      // ------------------------------------------
      // MODE 2: CLEAR NIGHT (Stars, Sparkles, Meteors)
      // ------------------------------------------
      if (mode === "clear-night") {
        // Twinkling stars with cross-sparkles
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.phase += delta * s.pulseSpeed;
          const currentAlpha = Math.max(
            0.15,
            s.baseAlpha + Math.sin(s.phase) * 0.35
          );

          if (s.isCrossSparkle) {
            // Draw 4-point sparkle cross
            const flareLen = s.r * (3.5 + Math.sin(s.phase) * 1.2);
            ctx.strokeStyle = `${s.color}${currentAlpha})`;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(s.x - flareLen, s.y);
            ctx.lineTo(s.x + flareLen, s.y);
            ctx.moveTo(s.x, s.y - flareLen);
            ctx.lineTo(s.x, s.y + flareLen);
            ctx.stroke();

            // Center glow core
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, currentAlpha * 1.3)})`;
            ctx.fill();
          } else {
            // Standard crisp star dot
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `${s.color}${currentAlpha})`;
            ctx.fill();
          }
        }

        // Shooting Star / Meteor logic
        if (time > nextMeteorTime) {
          const idleMeteor = meteors.find((m) => !m.active);
          if (idleMeteor) {
            idleMeteor.active = true;
            idleMeteor.x = Math.random() * (width * 0.7) + width * 0.2;
            idleMeteor.y = Math.random() * (height * 0.3);
            idleMeteor.len = Math.random() * 90 + 70;
            idleMeteor.vx = -Math.random() * 700 - 500;
            idleMeteor.vy = Math.random() * 400 + 300;
            idleMeteor.alpha = 1.0;
          }
          nextMeteorTime = time + Math.random() * 6000 + 4000;
        }

        for (let i = 0; i < meteors.length; i++) {
          const m = meteors[i];
          if (!m.active) continue;

          m.x += m.vx * delta;
          m.y += m.vy * delta;
          m.alpha -= delta * 1.6;

          if (m.alpha <= 0 || m.x < -100 || m.y > height + 100) {
            m.active = false;
            continue;
          }

          const angle = Math.atan2(m.vy, m.vx);
          const tailX = m.x - Math.cos(angle) * m.len;
          const tailY = m.y - Math.sin(angle) * m.len;

          const meteorGrad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          meteorGrad.addColorStop(0, `rgba(255, 255, 255, ${m.alpha})`);
          meteorGrad.addColorStop(
            0.3,
            `rgba(199, 210, 254, ${m.alpha * 0.8})`
          );
          meteorGrad.addColorStop(1, "rgba(139, 92, 246, 0)");

          ctx.strokeStyle = meteorGrad;
          ctx.lineWidth = 1.8;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        }
      }

      // ------------------------------------------
      // MODE 3 & 4: RAIN & THUNDERSTORM
      // ------------------------------------------
      if (mode === "rain" || mode === "thunderstorm") {
        ctx.lineCap = "round";

        // 1. Draw Falling Rain Streaks
        for (let i = 0; i < rainDrops.length; i++) {
          const d = rainDrops[i];

          ctx.lineWidth = d.thickness;
          ctx.strokeStyle =
            d.layer === "front"
              ? `rgba(219, 234, 254, ${d.opacity})`
              : `rgba(186, 215, 255, ${d.opacity})`;

          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.xs * (d.l / 14), d.y + d.l);
          ctx.stroke();

          d.x += d.xs * 60 * delta;
          d.y += d.ys * 60 * delta;

          // Impact at bottom: trigger splash ripple
          if (d.y > height - 15) {
            if (d.layer !== "back" && splashRipples.length < 35 && Math.random() > 0.4) {
              splashRipples.push({
                x: d.x,
                y: height - Math.random() * 20 - 5,
                r: 1,
                maxR: Math.random() * 12 + 8,
                alpha: 0.65,
                speed: Math.random() * 22 + 18,
              });
            }
            d.y = -d.l;
            d.x = Math.random() * (width + 250);
          }
          if (d.x < -40) {
            d.x = width + 40;
          }
        }

        // 2. Draw Splash Ripples on Impact
        for (let i = splashRipples.length - 1; i >= 0; i--) {
          const rip = splashRipples[i];
          rip.r += rip.speed * delta;
          rip.alpha -= delta * 1.8;

          if (rip.alpha <= 0 || rip.r >= rip.maxR) {
            splashRipples.splice(i, 1);
            continue;
          }

          ctx.strokeStyle = `rgba(191, 219, 254, ${rip.alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(
            rip.x,
            rip.y,
            rip.r,
            rip.r * 0.35,
            0,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }

        // 3. Draw Water Droplets on Viewport Glass (Window Pane Condensation)
        for (let i = 0; i < glassDroplets.length; i++) {
          const drop = glassDroplets[i];

          if (drop.isTrickling) {
            drop.y += drop.speedY * 60 * delta;
            // Record trickle trail
            if (Math.random() > 0.6) {
              drop.trail.push({
                x: drop.x,
                y: drop.y,
                r: drop.r * 0.5,
                alpha: 0.4,
              });
              if (drop.trail.length > 8) drop.trail.shift();
            }

            if (drop.y > height + 20) {
              drop.y = -10;
              drop.x = Math.random() * (width - 40) + 20;
              drop.trail = [];
            }
          }

          // Render trail
          for (let j = 0; j < drop.trail.length; j++) {
            const t = drop.trail[j];
            t.alpha -= delta * 0.2;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(186, 215, 255, ${Math.max(0, t.alpha)})`;
            ctx.fill();
          }

          // Drop shadow/refraction rim
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
          ctx.fill();

          // Glass droplet highlight (crescent reflection)
          ctx.beginPath();
          ctx.arc(
            drop.x - drop.r * 0.25,
            drop.y - drop.r * 0.25,
            drop.r * 0.5,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          ctx.fill();
        }

        // 4. Thunderstorm: Lightning Bolt Generation & Flash
        if (mode === "thunderstorm") {
          if (time > nextLightningTime) {
            triggerLightningBolt(time);
          }

          // Draw active lightning branches
          if (lightningBranches.length > 0) {
            for (let i = 0; i < lightningBranches.length; i++) {
              const b = lightningBranches[i];
              b.alpha -= delta * 2.5;

              if (b.alpha > 0) {
                // Outer glow stroke
                ctx.strokeStyle = `rgba(168, 85, 247, ${b.alpha * 0.7})`;
                ctx.lineWidth = b.width * 2.8;
                ctx.shadowColor = "#c084fc";
                ctx.shadowBlur = 16;
                ctx.beginPath();
                for (let p = 0; p < b.points.length; p++) {
                  if (p === 0) ctx.moveTo(b.points[p].x, b.points[p].y);
                  else ctx.lineTo(b.points[p].x, b.points[p].y);
                }
                ctx.stroke();

                // Bright inner core
                ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha * 0.95})`;
                ctx.lineWidth = b.width;
                ctx.stroke();
                ctx.shadowBlur = 0;
              }
            }
          }

          // Ambient Lightning Flash Overlay
          if (lightningFlashAlpha > 0) {
            lightningFlashAlpha = Math.max(
              0,
              lightningFlashAlpha - delta * 2.8
            );
            if (flashOverlayRef.current) {
              flashOverlayRef.current.style.opacity =
                lightningFlashAlpha.toFixed(3);
            }
          }
        }
      }

      // ------------------------------------------
      // MODE 5: SNOW (Multi-Layer Swaying Snowflakes)
      // ------------------------------------------
      if (mode === "snow") {
        for (let i = 0; i < snowflakes.length; i++) {
          const s = snowflakes[i];
          s.swayPhase += delta * s.swaySpeed;
          s.y += s.vy * 60 * delta;
          const swayX = s.x + Math.sin(s.swayPhase) * s.swayWidth;

          if (s.y > height + 15) {
            s.y = -15;
            s.x = Math.random() * width;
          }

          if (s.layer === "front") {
            // Large soft bokeh flake with gradient edge
            const flakeGrad = ctx.createRadialGradient(
              swayX,
              s.y,
              0,
              swayX,
              s.y,
              s.r
            );
            flakeGrad.addColorStop(0, `rgba(255, 255, 255, ${s.alpha})`);
            flakeGrad.addColorStop(
              0.5,
              `rgba(224, 242, 254, ${s.alpha * 0.6})`
            );
            flakeGrad.addColorStop(1, "rgba(224, 242, 254, 0)");

            ctx.fillStyle = flakeGrad;
            ctx.beginPath();
            ctx.arc(swayX, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Crisp snowflake
            ctx.beginPath();
            ctx.arc(swayX, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            ctx.fill();
          }
        }
      }

      // ------------------------------------------
      // MODE 6: CLOUDY (Drifting Cloud Volumes & Wisps)
      // ------------------------------------------
      if (mode === "cloudy") {
        // Cloud blobs
        for (let i = 0; i < cloudBlobs.length; i++) {
          const c = cloudBlobs[i];
          c.x += c.vx * delta;

          if (c.x - c.rx > width) {
            c.x = -c.rx;
            c.y = Math.random() * (height * 0.6);
          }

          const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.rx);
          grad.addColorStop(0, `rgba(148, 163, 184, ${c.alpha * 1.3})`);
          grad.addColorStop(0.5, `rgba(100, 116, 139, ${c.alpha * 0.7})`);
          grad.addColorStop(1, "rgba(15, 23, 42, 0)");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Breeze streamlines
        ctx.lineCap = "round";
        for (let i = 0; i < windWisps.length; i++) {
          const w = windWisps[i];
          w.x += w.vx * delta;
          if (w.x - w.len > width) {
            w.x = -w.len;
            w.y = Math.random() * height;
          }

          const wispGrad = ctx.createLinearGradient(
            w.x,
            w.y,
            w.x + w.len,
            w.y
          );
          wispGrad.addColorStop(0, "rgba(148, 163, 184, 0)");
          wispGrad.addColorStop(0.5, `rgba(203, 213, 225, ${w.alpha})`);
          wispGrad.addColorStop(1, "rgba(148, 163, 184, 0)");

          ctx.strokeStyle = wispGrad;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(w.x, w.y);
          ctx.lineTo(w.x + w.len, w.y);
          ctx.stroke();
        }
      }

      // ------------------------------------------
      // MODE 7: FOG (Sinusoidal Undulating Mist Waves)
      // ------------------------------------------
      if (mode === "fog") {
        for (let i = 0; i < mistBands.length; i++) {
          const m = mistBands[i];
          m.offset += m.vx * delta;
          if (m.offset > width) m.offset = 0;

          // Undulate height with time
          const currentY =
            m.baseY + Math.sin(time * 0.001 + i) * m.waveAmp;

          const grad = ctx.createLinearGradient(
            0,
            currentY,
            0,
            currentY + m.height
          );
          grad.addColorStop(0, "rgba(203, 213, 225, 0)");
          grad.addColorStop(0.5, `rgba(226, 232, 240, ${m.alpha * 1.4})`);
          grad.addColorStop(1, "rgba(203, 213, 225, 0)");

          ctx.fillStyle = grad;
          ctx.fillRect(0, currentY, width, m.height);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, enabled, reducedMotion]);

  if (!enabled) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050505]"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050505]"
    >

      {/* 2. Clear Night Cosmic Deep Nebula Glow */}
      {mode === "clear-night" && (
        <>
          <div className="absolute -top-24 left-1/3 h-[550px] w-[550px] rounded-full bg-indigo-900/30 blur-3xl transition-opacity duration-1000" />
          <div className="absolute top-1/2 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-950/20 blur-3xl transition-opacity duration-1000" />
        </>
      )}

      {/* 3. Cloudy Soft Moody Sky */}
      {mode === "cloudy" && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/35 via-zinc-900/15 to-[#050505] transition-opacity duration-1000" />
      )}

      {/* 4. Fog Rolling Mist Ambient Background */}
      {mode === "fog" && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-slate-800/20 to-transparent transition-opacity duration-1000" />
      )}

      {/* 5. Rain Cool Atmospheric Rainwash & Overcast Tint */}
      {mode === "rain" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-slate-950/25 to-[#050505] transition-opacity duration-1000" />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-blue-950/30 to-transparent blur-xl" />
        </>
      )}

      {/* 6. Snow Crisp Winter Atmosphere & Corner Frost */}
      {mode === "snow" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/25 via-indigo-950/15 to-[#050505] transition-opacity duration-1000" />
          <div className="absolute -bottom-20 inset-x-0 h-48 bg-gradient-to-t from-cyan-900/20 to-transparent blur-2xl" />
        </>
      )}

      {/* 7. Thunderstorm Deep Storm Tint & Flashing Skies */}
      {mode === "thunderstorm" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-purple-950/30 to-[#050505] transition-opacity duration-1000" />
          <div
            ref={flashOverlayRef}
            className="absolute inset-0 bg-purple-100/30 opacity-0 pointer-events-none transition-opacity duration-75"
          />
        </>
      )}

      {/* High-Performance Canvas for Particles, Raindrops & Lightning */}
      {!reducedMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full pointer-events-none"
        />
      )}
    </div>
  );
}
