import { useMemo, useState } from "react";
import Reveal from "./Reveal";
import { download, mulberry32 } from "../lib/strategy";
import {
  buildPersonalServiceBat,
  buildPersonalWindowBat,
  parseBat,
  randomizeFlags,
  toArgsLine,
} from "../lib/parseStrategy";

const KIND_LABEL: Record<string, string> = {
  hex: "HEX",
  num: "NUM",
  range: "RNG",
  path: "PATH",
  text: "TXT",
  none: "—",
};

const KIND_STYLE: Record<string, string> = {
  hex: "border-signal-500/50 text-signal-400",
  num: "border-live-500/50 text-live-400",
  range: "border-ink-600 text-mist-400",
  path: "border-ink-600 text-mist-400",
  text: "border-ink-600 text-mist-400",
  none: "border-ink-600 text-mist-500",
};

export default function StrategyLab() {
  const [text, setText] = useState("");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseBat(text), [text]);
  const shuffled = useMemo(
    () => (parsed.ok ? randomizeFlags(parsed.flags, mulberry32(seed)) : []),
    [parsed, seed]
  );

  const seedHex = "0x" + (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
  const mutableCount = shuffled.filter((f) => f.mutable).length;
  const argsLine = toArgsLine(shuffled);

  const reshuffle = () => setSeed(Math.floor(Math.random() * 0xffffffff));
  const dlWindow = () => download(`svoi-zapret-${seedHex}.bat`, buildPersonalWindowBat(shuffled, seedHex));
  const dlService = () => download(`zapret-service-${seedHex}.bat`, buildPersonalServiceBat(shuffled, seedHex));
  const copyCmd = () => {
    navigator.clipboard?.writeText("bin\\winws.exe " + argsLine).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* left: paste area */}
      <Reveal>
        <div className="flex h-full flex-col rounded-md border border-ink-600 bg-ink-850/80 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mist-500">вход: твой .bat</span>
            <span className="font-mono text-[10px] text-mist-500">{text.length} симв.</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder={
              '@echo off\n"%~dp0bin\\winws.exe" --wf-tcp=443 --dpi-desync=fake ... \n\nвставь сюда весь файл general.bat'
            }
            className="min-h-[260px] flex-1 resize-y rounded-[4px] border border-ink-600 bg-ink-900 p-3.5 font-mono text-[12px] leading-relaxed text-paper placeholder:text-mist-500/70 focus:border-signal-500/70 focus:outline-none"
          />
          <div className="mt-3.5 space-y-1.5 font-mono text-[11px] leading-relaxed text-mist-500">
            <p>
              <span className="text-signal-400">1.</span> в cmd:{" "}
              <code className="text-mist-300">type "general.bat"</code> → скопируй вывод сюда
            </p>
            <p>
              <span className="text-signal-400">2.</span> разберу строку <code className="text-mist-300">winws.exe …</code> по
              флагам
            </p>
            <p>
              <span className="text-signal-400">3.</span>{" "}
              <span className="text-live-400">HEX-мусор и ttl/pos/repeats перемешаю</span>, пути и режимы не трогаю
            </p>
          </div>
        </div>
      </Reveal>

      {/* right: result */}
      <Reveal delay={100}>
        {text.trim() === "" ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-ink-600 bg-ink-900/40 p-8 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5d6f95" strokeWidth="1.5" aria-hidden>
              <path d="M4 6h16M4 12h10M4 18h7" />
              <circle cx="19" cy="15" r="3.2" />
            </svg>
            <p className="font-display text-[15px] font-bold text-mist-400">Жду твой general.bat</p>
            <p className="max-w-sm text-[12.5px] leading-relaxed text-mist-500">
              Вставь содержимое — и увидишь свою стратегию, разобранную по флагам, с личной сигнатурой{" "}
              <span className="font-mono text-signal-400">{seedHex}</span>.
            </p>
          </div>
        ) : !parsed.ok ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-md border border-danger-500/40 bg-danger-500/[0.06] p-8 text-center">
            <span className="font-display text-[28px] font-bold text-danger-400">✗</span>
            <p className="max-w-sm text-[13px] leading-relaxed text-danger-400">{parsed.error}</p>
          </div>
        ) : (
          <div className="flex h-full flex-col rounded-md border border-ink-600 bg-ink-850/80 p-5">
            <div className="mb-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="font-mono text-[11px] text-mist-400">
                флагов: <b className="text-paper">{parsed.flags.length}</b>
              </span>
              <span className="font-mono text-[11px] text-mist-400">
                перемешано: <b className="text-live-400">{mutableCount}</b>
              </span>
              <span className="ml-auto font-mono text-[11px] tracking-wider text-signal-400">{seedHex}</span>
            </div>

            <div className="max-h-[300px] flex-1 space-y-1.5 overflow-y-auto pr-1">
              {shuffled.map((f, i) => (
                <div
                  key={i}
                  title={f.hint}
                  className={`flex items-center gap-3 rounded-[4px] border px-3 py-2 transition-colors ${
                    f.mutable
                      ? "border-live-500/25 bg-live-500/[0.05] hover:border-live-500/50"
                      : "border-ink-700/70 bg-ink-900/70 hover:border-ink-600"
                  }`}
                >
                  <span
                    className={`w-11 shrink-0 rounded-[3px] border px-1 py-0.5 text-center font-mono text-[9px] font-bold tracking-widest ${KIND_STYLE[f.kind]}`}
                  >
                    {KIND_LABEL[f.kind]}
                  </span>
                  <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-paper">
                    {f.name}
                    {f.form === "eq" ? "=" : f.form === "space" ? " " : ""}
                    <span className={f.mutable ? "text-live-400" : "text-mist-300"}>{f.value}</span>
                  </code>
                  {f.mutable && (
                    <span className="shrink-0 rounded-[3px] bg-live-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-live-400">
                      MIX
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-700 pt-4">
              <button
                onClick={reshuffle}
                className="rounded-[4px] border border-ink-600 bg-ink-800 px-3.5 py-2 font-mono text-[11.5px] text-mist-300 transition-all hover:-translate-y-0.5 hover:border-danger-500/60 hover:text-danger-400"
              >
                ⟳ перемешать снова
              </button>
              <button
                onClick={dlWindow}
                className="rounded-[4px] border border-signal-500/50 bg-signal-500/10 px-3.5 py-2 font-mono text-[11.5px] text-signal-400 transition-all hover:-translate-y-0.5 hover:bg-signal-500/20"
              >
                ↓ svoi-zapret-{seedHex}.bat <span className="text-mist-500">(в окне)</span>
              </button>
              <button
                onClick={dlService}
                className="rounded-[4px] border border-live-500/50 bg-live-500/10 px-3.5 py-2 font-mono text-[11.5px] text-live-400 transition-all hover:-translate-y-0.5 hover:bg-live-500/20"
              >
                ↓ zapret-service-{seedHex}.bat <span className="text-mist-500">(как служба)</span>
              </button>
              <button
                onClick={copyCmd}
                className="rounded-[4px] border border-ink-600 bg-ink-800 px-3.5 py-2 font-mono text-[11.5px] text-mist-300 transition-all hover:-translate-y-0.5 hover:border-ink-600 hover:text-paper"
              >
                {copied ? "✓ скопировано" : "⧉ копировать команду"}
              </button>
            </div>
          </div>
        )}
      </Reveal>
    </div>
  );
}
