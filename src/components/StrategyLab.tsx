import { useMemo, useState } from "react";
import Reveal from "./Reveal";
import { download, mulberry32 } from "../lib/strategy";
import {
  blockLabel,
  buildStrategyBat,
  displayValue,
  parseBat,
  randomizeStrategy,
  strategyFileName,
  toCommand,
  type StratFlag,
} from "../lib/parseStrategy";

function FlagChip({ f }: { f: StratFlag }) {
  const changed = f.swappable || f.mutable;
  return (
    <span
      title={f.hint}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-[4px] border px-2 py-1 font-mono text-[11px] leading-tight transition-transform duration-150 hover:-translate-y-0.5 ${
        f.swappable
          ? "border-signal-500/50 bg-signal-500/[0.07] text-signal-300"
          : f.mutable
            ? "border-live-500/40 bg-live-500/[0.06] text-live-400"
            : "border-ink-600 bg-ink-900/80 text-mist-300"
      }`}
    >
      <span className="text-mist-400">{f.name.replace(/^--/, "")}</span>
      {f.form !== "alone" && (
        <>
          <span className="text-mist-500">=</span>
          <span className={`truncate ${changed ? "" : "text-paper/80"}`}>{displayValue(f)}</span>
        </>
      )}
      {f.swappable && (
        <span className="rounded-[2px] bg-signal-500/20 px-1 text-[8.5px] font-bold tracking-widest text-signal-400">BIN</span>
      )}
      {f.mutable && (
        <span className="rounded-[2px] bg-live-500/20 px-1 text-[8.5px] font-bold tracking-widest text-live-400">NUM</span>
      )}
    </span>
  );
}

export default function StrategyLab() {
  const [text, setText] = useState("");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [swapBins, setSwapBins] = useState(true);
  const [randNums, setRandNums] = useState(true);
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseBat(text), [text]);
  const randomized = useMemo(() => {
    if (!parsed.ok) return null;
    return randomizeStrategy(parsed.global, parsed.blocks, mulberry32(seed), {
      nums: randNums,
      bins: swapBins,
    });
  }, [parsed, seed, randNums, swapBins]);

  const seedHex = "0x" + (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");

  const totalFlags = randomized ? randomized.global.length + randomized.blocks.reduce((s, b) => s + b.flags.length, 0) : 0;
  const changedCount = randomized
    ? [...randomized.global, ...randomized.blocks.flatMap((b) => b.flags)].filter((f) => f.swappable || f.mutable).length
    : 0;

  const reshuffle = () => setSeed(Math.floor(Math.random() * 0xffffffff));
  const dlStrategy = () => {
    if (!randomized) return;
    download(strategyFileName(seedHex), buildStrategyBat(randomized.global, randomized.blocks, seedHex));
  };
  const copyCmd = () => {
    if (!randomized) return;
    navigator.clipboard?.writeText('"%BIN%winws.exe" ' + toCommand(randomized.global, randomized.blocks)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* left: input */}
      <Reveal>
        <div className="flex h-full flex-col rounded-md border border-ink-600 bg-ink-850/80 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mist-500">вход: твой general.bat</span>
            <span className="font-mono text-[10px] text-mist-500">{text.length} симв.</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder={'вставь сюда вывод команды:\n\ntype "general.bat"\n\n(целиком, со строкой start "" /min "%BIN%winws.exe" ...)'}
            className="min-h-[240px] flex-1 resize-y rounded-[4px] border border-ink-600 bg-ink-900 p-3.5 font-mono text-[11.5px] leading-relaxed text-paper placeholder:text-mist-500/70 focus:border-signal-500/70 focus:outline-none"
          />

          <div className="mt-4 space-y-2.5 border-t border-ink-700 pt-4">
            <label className="flex cursor-pointer items-center gap-3 text-[13px] text-mist-300 transition-colors hover:text-paper">
              <input type="checkbox" className="chk" checked={swapBins} onChange={(e) => setSwapBins(e.target.checked)} />
              <span>
                <b className="text-signal-400">Подменять фейк-.bin файлы</b>
                <span className="block font-mono text-[10.5px] text-mist-500">
                  7 quic + 4 tls + 2 stun из твоей папки bin\ — самая сильная персонализация
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-[13px] text-mist-300 transition-colors hover:text-paper">
              <input type="checkbox" className="chk chk-mint" checked={randNums} onChange={(e) => setRandNums(e.target.checked)} />
              <span>
                <b className="text-live-400">Случайные числовые параметры</b>
                <span className="block font-mono text-[10.5px] text-mist-500">repeats, split-seqovl, split-pos в каждом блоке</span>
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={reshuffle}
                className="rounded-[4px] border border-danger-500/50 bg-danger-500/10 px-3.5 py-2 font-mono text-[11.5px] text-danger-400 transition-all hover:-translate-y-0.5 hover:bg-danger-500/20"
              >
                ⟳ перемешать · {seedHex}
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* right: result */}
      <Reveal delay={100}>
        {text.trim() === "" ? (
          <div className="flex h-full min-h-[340px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-ink-600 bg-ink-900/40 p-8 text-center">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#5d6f95" strokeWidth="1.5" aria-hidden>
              <path d="M4 6h16M4 12h10M4 18h7" />
              <circle cx="19" cy="15" r="3.2" />
            </svg>
            <p className="font-display text-[15px] font-bold text-mist-400">Жду твой general.bat</p>
            <p className="max-w-sm text-[12.5px] leading-relaxed text-mist-500">
              Разберу multi-block стратегию (блоки через <code className="text-mist-300">--new</code>), покажу каждый флаг
              и соберу личную версию с твоей сигнатурой <span className="font-mono text-signal-400">{seedHex}</span>.
            </p>
          </div>
        ) : !parsed.ok ? (
          <div className="flex h-full min-h-[340px] flex-col items-center justify-center gap-3 rounded-md border border-danger-500/40 bg-danger-500/[0.06] p-8 text-center">
            <span className="font-display text-[28px] font-bold text-danger-400">✗</span>
            <p className="max-w-sm text-[13px] leading-relaxed text-danger-400">{parsed.error}</p>
          </div>
        ) : randomized ? (
          <div className="flex h-full flex-col rounded-md border border-ink-600 bg-ink-850/80 p-5">
            <div className="mb-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="font-mono text-[11px] text-mist-400">
                блоков: <b className="text-paper">{randomized.blocks.length}</b>
              </span>
              <span className="font-mono text-[11px] text-mist-400">
                флагов: <b className="text-paper">{totalFlags}</b>
              </span>
              <span className="font-mono text-[11px] text-mist-400">
                персонализировано: <b className="text-live-400">{changedCount}</b>
              </span>
              <span className="ml-auto font-mono text-[11px] tracking-wider text-signal-400">{seedHex}</span>
            </div>

            <div className="max-h-[340px] flex-1 space-y-2.5 overflow-y-auto pr-1">
              {randomized.global.length > 0 && (
                <div className="rounded-[5px] border border-ink-600 bg-ink-900/80 p-3">
                  <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-mist-400">
                    Глобальный фильтр (wf-tcp / wf-udp)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {randomized.global.map((f, i) => (
                      <FlagChip key={i} f={f} />
                    ))}
                  </div>
                </div>
              )}
              {randomized.blocks.map((b, bi) => (
                <div key={bi} className="rounded-[5px] border border-ink-600 bg-ink-900/80 p-3 transition-colors hover:border-ink-600 hover:bg-ink-800/80">
                  <p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
                    <span className="rounded-[3px] bg-signal-500/15 px-1.5 py-0.5 text-signal-400">БЛОК {bi + 1}</span>
                    <span className="text-mist-400">{blockLabel(b.flags)}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {b.flags.map((f, i) => (
                      <FlagChip key={i} f={f} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-ink-700 pt-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={dlStrategy}
                  className="rounded-[4px] border border-signal-500/60 bg-signal-500/15 px-4 py-2.5 font-mono text-[12px] font-bold text-signal-400 transition-all hover:-translate-y-0.5 hover:bg-signal-500/25"
                >
                  ↓ {strategyFileName(seedHex)}
                </button>
                <button
                  onClick={copyCmd}
                  className="rounded-[4px] border border-ink-600 bg-ink-800 px-3.5 py-2.5 font-mono text-[11.5px] text-mist-300 transition-all hover:-translate-y-0.5 hover:text-paper"
                >
                  {copied ? "✓ скопировано" : "⧉ копировать команду winws"}
                </button>
              </div>
              <p className="mt-3 font-mono text-[10.5px] leading-relaxed text-mist-500">
                кинь файл в папку zapret → работает по <span className="text-mist-300">двойному клику</span>, либо{" "}
                <span className="text-mist-300">service.bat → 1. Install Service</span> → выбери его — будет службой с
                автозапуском, как оригинал.
              </p>
            </div>
          </div>
        ) : null}
      </Reveal>
    </div>
  );
}
