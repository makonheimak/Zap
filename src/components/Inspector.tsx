import { useEffect, useRef, useState } from "react";

const LOG: { t: string; c: string }[] = [
  { t: "C:\\zapret-discord-youtube> service.bat   [публичный пресет ALT3, v1.10.1]", c: "text-mist-500" },
  { t: "[winws] старт: --dpi-desync=fake,multisplit --dpi-desync-ttl=6", c: "text-mist-400" },
  { t: "TCP 443 → youtube.com     fake-tls 0x000000…     отправлен", c: "text-mist-300" },
  { t: "[ТСПУ] сигнатура 0x000000… уже есть в базе        ✗ БЛОК", c: "text-danger-400" },
  { t: "TCP 443 → discord.com     тот же мусор             ✗ БЛОК", c: "text-danger-400" },
  { t: "[winws] процесс жив, но пакеты режутся. 0 из 12.   ✗ БЛОК", c: "text-danger-400" },
  { t: " ", c: "" },
  { t: "C:\\moi-zapret> zapret-avto.bat   [личная сборка, автоподбор]", c: "text-mist-500" },
  { t: "[avto] попытка 1…  БЛОК. Мутирую: новый мусор, ttl=4, pos=21", c: "text-mist-400" },
  { t: "[avto] попытка 2…  БЛОК. Мутирую: disorder, badsum+md5sig", c: "text-mist-400" },
  { t: "[avto] попытка 3…  TCP 443 → youtube.com           ✓ ОК  38 мс", c: "text-live-400" },
  { t: "[avto] UDP 50017 → discord.gg    fake-quic ×7      ✓ ОК  51 мс", c: "text-live-400" },
  { t: "[avto] сохранено в rabochaia.cfg. Следующий запуск — сразу с неё.", c: "text-live-400" },
];

/** Терминал-инспектор: печатает сессию построчно, посимвольно. */
export default function Inspector() {
  const [pos, setPos] = useState({ line: 0, ch: 0 });
  const [started, setStarted] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (reduced.current) {
      setPos({ line: LOG.length, ch: 0 });
      return;
    }
    let li = 0;
    let ch = 0;
    let pause = 0;
    const iv = window.setInterval(() => {
      if (pause > 0) {
        pause--;
        return;
      }
      if (li >= LOG.length) {
        window.clearInterval(iv);
        return;
      }
      const line = LOG[li].t;
      ch += 2;
      if (ch >= line.length) {
        ch = 0;
        li++;
        pause = line.trim() === "" ? 2 : 6;
      }
      setPos({ line: li, ch });
    }, 24);
    return () => window.clearInterval(iv);
  }, [started]);

  const done = pos.line >= LOG.length;

  return (
    <div
      ref={boxRef}
      className="term-scan relative overflow-hidden rounded-md border border-ink-600 bg-ink-900/90 shadow-[0_20px_60px_-20px_rgba(7,11,22,0.9)]"
    >
      <div className="flex items-center gap-2 border-b border-ink-600 bg-ink-850 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-[3px] bg-danger-500/80" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-signal-500/80" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-live-500/80" />
        <span className="ml-3 font-mono text-[11px] tracking-wider text-mist-500">
          packet-inspector — live-лог автоподбора
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-danger-400">
          <span className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-danger-500" />
          live
        </span>
      </div>
      <div className="h-[330px] overflow-hidden px-4 py-3 font-mono text-[12.5px] leading-[22px]">
        {LOG.map((l, i) => {
          if (i > pos.line) return null;
          const text = i === pos.line && !done ? l.t.slice(0, pos.ch) : l.t;
          return (
            <div key={i} className={`whitespace-pre-wrap break-all ${l.c}`}>
              {text || "\u00A0"}
              {i === pos.line && !done && <span className="anim-blink text-signal-500">▌</span>}
            </div>
          );
        })}
        {done && (
          <div className="text-mist-500">
            <span className="anim-blink text-live-400">▌</span>
          </div>
        )}
      </div>
    </div>
  );
}
