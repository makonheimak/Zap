import { useEffect, useRef } from "react";

/** Живой фон: пакеты текут по проводам к фильтру ТСПУ — часть блокируется, часть проходит. */
export default function PacketField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;

    interface Pkt {
      lane: number;
      x: number;
      y: number;
      speed: number;
      len: number;
      ttl: number;
      kind: "tls" | "quic";
      blocked: boolean;
      deathAt: number;
      dead: boolean;
      passed: boolean;
    }

    const LANE_N = 5;
    const lanes = () => Array.from({ length: LANE_N }, (_, i) => (h / (LANE_N + 1)) * (i + 1));
    const filterX = () => w * 0.64;
    let pkts: Pkt[] = [];
    let sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

    const resize = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * DPR;
      cv.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const spawn = (): Pkt => {
      const lane = Math.floor(Math.random() * LANE_N);
      const quic = Math.random() < 0.35;
      return {
        lane,
        x: rand(-80, -10),
        y: lanes()[lane] + rand(-2, 2),
        speed: rand(1.1, 2.6),
        len: rand(9, 22),
        ttl: Math.random() < 0.5 ? 0 : Math.floor(rand(2, 12)),
        kind: quic ? "quic" : "tls",
        blocked: false,
        deathAt: 0,
        dead: false,
        passed: false,
      };
    };

    for (let i = 0; i < 30; i++) {
      const p = spawn();
      p.x = rand(-w * 0.2, filterX() - 20);
      pkts.push(p);
    }

    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 16.7, 2.4);
      last = now;
      ctx.clearRect(0, 0, w, h);

      // провода
      const ls = lanes();
      for (let i = 0; i < LANE_N; i++) {
        ctx.strokeStyle = "rgba(139,153,186,0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, ls[i]);
        ctx.lineTo(w, ls[i]);
        ctx.stroke();
      }

      // фильтр ТСПУ
      const fx = filterX();
      ctx.save();
      ctx.strokeStyle = "rgba(255,84,112,0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.moveTo(fx, h * 0.06);
      ctx.lineTo(fx, h * 0.94);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "rgba(255,84,112,0.55)";
      ctx.font = "700 9px JetBrains Mono, monospace";
      ctx.fillText("ТСПУ", fx + 6, h * 0.085);

      // пакеты
      if (pkts.length < 44 && Math.random() < 0.09) pkts.push(spawn());
      for (const p of pkts) {
        if (p.dead) continue;
        p.x += p.speed * dt;

        if (!p.blocked && !p.passed && p.x >= fx) {
          // фильтр видит публичную сигнатуру (ttl=0) и режет её
          if (p.ttl === 0 && Math.random() < 0.6) {
            p.blocked = true;
            p.deathAt = fx;
            for (let s = 0; s < 6; s++) {
              sparks.push({ x: fx, y: p.y, vx: rand(-1.4, 1.4), vy: rand(-1.6, 1.6), life: 1 });
            }
          } else {
            p.passed = true;
          }
        }
        if (p.blocked) {
          p.deathAt += 0.4 * dt;
          if (p.deathAt > fx + 26) p.dead = true;
        }
        if (p.x > w + 40) p.dead = true;

        const col = p.blocked
          ? "rgba(255,84,112,0.9)"
          : p.passed
            ? "rgba(61,232,154,0.85)"
            : "rgba(170,182,209,0.75)";
        ctx.fillStyle = col;
        if (p.kind === "quic") {
          ctx.fillRect(p.x, p.y - 2, 3.5, 3.5);
        } else {
          ctx.fillRect(p.x, p.y - 1.5, p.len, 3);
        }
        if (p.passed && p.ttl > 0) {
          ctx.fillStyle = "rgba(61,232,154,0.28)";
          ctx.font = "600 8px JetBrains Mono, monospace";
          ctx.fillText(`ttl${p.ttl}`, p.x + 2, p.y - 5);
        }
      }
      pkts = pkts.filter((p) => !p.dead);

      // искры от заблокированных
      for (const s of sparks) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= 0.045 * dt;
        ctx.fillStyle = `rgba(255,84,112,${Math.max(0, s.life)})`;
        ctx.fillRect(s.x, s.y, 2, 2);
      }
      sparks = sparks.filter((s) => s.life > 0);

      raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      // статичный кадр
      for (const p of pkts) {
        ctx.fillStyle = p.ttl === 0 ? "rgba(170,182,209,0.5)" : "rgba(61,232,154,0.6)";
        ctx.fillRect(p.x, p.y - 1.5, p.len, 3);
      }
    } else {
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="bg-blueprint absolute inset-0" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-80" />
    </div>
  );
}
