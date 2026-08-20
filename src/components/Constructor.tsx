import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildArgs,
  buildBat,
  buildSmartLauncher,
  download,
  generateStrategy,
  type DesyncMode,
} from "../lib/strategy";
import Reveal from "./Reveal";

// ---------- маленькие контролы ----------

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
  lock,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  lock?: boolean;
}) {
  return (
    <label
      className={`group flex cursor-pointer items-start gap-3 rounded-[5px] border px-3 py-2.5 transition-all duration-200 ${
        checked ? "border-signal-500/60 bg-signal-500/[0.07]" : "border-ink-600 bg-ink-900/60 hover:border-ink-600 hover:bg-ink-800"
      } ${disabled ? "cursor-default opacity-70" : ""}`}
    >
      <input type="checkbox" className="chk mt-0.5" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className={`block text-[13.5px] font-semibold leading-tight ${checked ? "text-paper" : "text-mist-300"}`}>
          {label}
          {lock && <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-signal-400">всегда</span>}
        </span>
        {hint && <span className="mt-0.5 block text-[11.5px] leading-snug text-mist-500">{hint}</span>}
      </span>
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-mist-400">{label}</span>
        <span className="font-mono text-[13px] font-bold text-signal-400">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--fill" as never]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-[4px] border px-2.5 py-1.5 font-mono text-[11px] transition-all duration-150 ${
            value === o.v
              ? "border-signal-500 bg-signal-500 text-ink-950 shadow-[0_0_18px_-4px_rgba(255,122,41,0.6)]"
              : "border-ink-600 text-mist-400 hover:border-signal-500/60 hover:text-paper"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-ink-600 bg-ink-850/80 p-4">
      <h4 className="mb-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-500">{title}</h4>
      {children}
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = "ghost",
  className = "",
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost" | "mint";
  className?: string;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[5px] border font-mono text-[12px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.97]";
  const styles = {
    primary: "border-signal-500 bg-signal-500 px-5 py-3 text-ink-950 hover:bg-signal-400 hover:shadow-[0_0_30px_-6px_rgba(255,122,41,0.7)]",
    mint: "border-live-500/60 bg-live-500/10 px-5 py-3 text-live-400 hover:bg-live-500/20 hover:shadow-[0_0_30px_-8px_rgba(61,232,154,0.5)]",
    ghost: "border-ink-600 bg-ink-800/70 px-4 py-2.5 text-mist-300 hover:border-signal-500/70 hover:text-paper",
  }[variant];
  return (
    <button onClick={onClick} title={title} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

function SeedRow({ seed, onReseed }: { seed: number; onReseed: () => void }) {
  const hex = "0x" + (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return (
    <div className="flex items-center justify-between rounded-[5px] border border-ink-600 bg-ink-900/70 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="anim-pulse-dot h-2 w-2 rounded-full bg-signal-500" />
        <span className="text-[11px] uppercase tracking-[0.16em] text-mist-400">сид сборки</span>
        <span className="font-mono text-[13px] font-bold text-signal-400">{hex}</span>
      </div>
      <button
        onClick={onReseed}
        className="rounded-[4px] border border-ink-600 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-mist-300 transition-all hover:rotate-180 hover:border-signal-500 hover:text-signal-400"
        style={{ transitionDuration: "400ms" }}
        title="Новая случайная сигнатура"
      >
        ⟳ перемешать
      </button>
    </div>
  );
}

function Preview({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard недоступен — молча */
    }
  };
  return (
    <div className="term-scan relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-md border border-ink-600 bg-ink-900/90">
      <div className="flex items-center gap-2 border-b border-ink-600 bg-ink-850 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-[3px] bg-danger-500/80" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-signal-500/80" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-live-500/80" />
        <span className="ml-3 font-mono text-[11px] tracking-wider text-mist-500">{title}</span>
        <button
          onClick={copy}
          className="ml-auto rounded-[4px] border border-ink-600 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-mist-400 transition-colors hover:border-live-500/60 hover:text-live-400"
        >
          {copied ? "✓ скопировано" : "копировать"}
        </button>
      </div>
      <pre className="flex-1 overflow-auto px-4 py-3 font-mono text-[11.5px] leading-[19px] text-mist-300">{text}</pre>
    </div>
  );
}

// ---------- анимация цикла автоподбора ----------

const FLOW = [
  { k: "t1", label: "попытка 1", res: "✗ блок", tone: "danger" },
  { k: "m1", label: "мутация", res: "новые фейк-пакеты", tone: "signal" },
  { k: "t2", label: "попытка 2", res: "✗ блок", tone: "danger" },
  { k: "m2", label: "мутация", res: "ttl · pos · мусор", tone: "signal" },
  { k: "t3", label: "попытка 3", res: "✓ работает", tone: "live" },
  { k: "s", label: "rabochaia.cfg", res: "запомнил рабочую", tone: "live" },
] as const;

function FlowStrip() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const iv = window.setInterval(() => setStep((s) => (s + 1) % (FLOW.length + 1)), 1100);
    return () => window.clearInterval(iv);
  }, []);
  return (
    <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
      {FLOW.map((f, i) => {
        const active = step === i;
        const past = step > i;
        const tone =
          f.tone === "danger"
            ? active || past ? "border-danger-500/60 text-danger-400" : "border-ink-600 text-mist-500"
            : f.tone === "signal"
              ? active || past ? "border-signal-500/60 text-signal-400" : "border-ink-600 text-mist-500"
              : active || past ? "border-live-500/70 text-live-400" : "border-ink-600 text-mist-500";
        return (
          <div
            key={f.k}
            className={`rounded-[4px] border px-2 py-1.5 text-center transition-all duration-300 ${tone} ${
              active ? "scale-[1.04] bg-ink-800 shadow-[0_0_16px_-6px_rgba(255,122,41,0.5)]" : "bg-ink-900/50"
            }`}
          >
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider">{f.label}</div>
            <div className="font-mono text-[9px] opacity-70">{f.res}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- пресеты ручной сборки ----------

type PresetKey = "none" | "universal" | "youtube" | "voice";
const PRESETS: { k: PresetKey; label: string; hint: string }[] = [
  { k: "universal", label: "Универсал", hint: "YouTube + Discord, самый живучий" },
  { k: "youtube", label: "YouTube", hint: "скорость видео, wssize" },
  { k: "voice", label: "Голос", hint: "Discord-звонки, UDP" },
];

export default function Constructor() {
  const [tab, setTab] = useState<"auto" | "manual">("auto");
  const [seed, setSeed] = useState(() => (Math.floor(Math.random() * 0xffffffff) >>> 0));
  const resync = () => setSeed((Math.floor(Math.random() * 0xffffffff) >>> 0));

  // авто-лаунчер
  const [maxAttempts, setMaxAttempts] = useState(8);
  const [autoDiscord, setAutoDiscord] = useState(true);
  const [autoTelegram, setAutoTelegram] = useState(false);
  const [autostart, setAutostart] = useState(false);

  // ручная сборка
  const [flags, setFlags] = useState({ youtube: true, discord: true, telegram: false });
  const [preset, setPreset] = useState<PresetKey>("universal");
  const [mode, setMode] = useState<DesyncMode>("fake,multisplit");
  const [ttl, setTtl] = useState(6);
  const [splitPos, setSplitPos] = useState(33);
  const [seqovl, setSeqovl] = useState(4);
  const [repeats, setRepeats] = useState(3);
  const [fooling, setFooling] = useState<string[]>(["badsum", "md5sig"]);
  const [badseq, setBadseq] = useState(-411522);
  const [fakeTls, setFakeTls] = useState("0x00000000");
  const [fakeQuic, setFakeQuic] = useState("0xb68b2a9c7e49");
  const lastFlags = useRef(flags);

  useEffect(() => {
    if (lastFlags.current === flags) return;
    lastFlags.current = flags;
    const o = generateStrategy(seed, flags);
    setMode(o.mode);
    setTtl(o.ttl);
    setSplitPos(o.splitPos);
    setSeqovl(o.seqovl);
    setRepeats(o.repeats);
    setFooling(o.fooling);
    setBadseq(o.badseqInc);
    setFakeTls(o.fakeTls);
    setFakeQuic(o.fakeQuic);
    setPreset("none");
  }, [seed, flags]);

  const applyPreset = (k: PresetKey) => {
    setPreset(k);
    const f = { youtube: k !== "voice", discord: k !== "youtube", telegram: false };
    const o = generateStrategy((Math.random() * 0xffffffff) >>> 0, f);
    setFlags(f);
    setMode(o.mode);
    setTtl(o.ttl);
    setSplitPos(o.splitPos);
    setSeqovl(o.seqovl);
    setRepeats(o.repeats);
    setFooling(o.fooling);
    setBadseq(o.badseqInc);
    setFakeTls(o.fakeTls);
    setFakeQuic(o.fakeQuic);
  };

  const toggleFool = (f: string) =>
    setFooling((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  const buildId = "0x" + (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");

  const manualText = useMemo(
    () => buildBat({ mode, ttl, splitPos, seqovl, fooling, badseqInc: badseq, fakeTls, fakeQuic, repeats, flags }, buildId),
    [mode, ttl, splitPos, seqovl, fooling, badseq, fakeTls, fakeQuic, repeats, flags, buildId]
  );

  const autoText = useMemo(
    () => buildSmartLauncher({ seed, maxAttempts, discord: autoDiscord, telegram: autoTelegram, autostart }),
    [seed, maxAttempts, autoDiscord, autoTelegram, autostart]
  );

  const manualArgs = useMemo(
    () => buildArgs({ mode, ttl, splitPos, seqovl, fooling, badseqInc: badseq, fakeTls, fakeQuic, repeats, flags }).join(" "),
    [mode, ttl, splitPos, seqovl, fooling, badseq, fakeTls, fakeQuic, repeats, flags]
  );

  const foolOpts = [
    { v: "badsum", d: "битая контрольная сумма" },
    { v: "md5sig", d: "поддельная md5-подпись" },
    { v: "datanoack", d: "мусор без подтверждения" },
    { v: "badseq", d: "сломанная seq-нумерация" },
  ];

  return (
    <div>
      {/* переключатель режимов */}
      <Reveal>
        <div className="mb-5 inline-flex rounded-md border border-ink-600 bg-ink-900 p-1">
          {(
            [
              { k: "auto", label: "◆ Из коробки — авто-лаунчер" },
              { k: "manual", label: "Ручная сборка" },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-[5px] px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-wider transition-all duration-200 ${
                tab === t.k ? "bg-signal-500 text-ink-950 shadow-[0_0_20px_-6px_rgba(255,122,41,0.8)]" : "text-mist-400 hover:text-paper"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      {tab === "auto" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <Reveal delay={60} className="space-y-4">
            <div className="rounded-md border border-live-500/40 bg-live-500/[0.06] px-4 py-3">
              <p className="text-[13px] leading-relaxed text-mist-300">
                <span className="font-mono font-bold text-live-400">zapret-avto.bat</span> — двойной клик, и всё: сам
                попросит права админа, проверит, не работает ли интернет и так (через твой VPN), затем переберёт
                случайные сигнатуры, тестируя YouTube после каждой. Рабочую сохранит в{" "}
                <span className="font-mono text-live-400">rabochaia.cfg</span> — следующий запуск стартует сразу с неё.
              </p>
            </div>

            <Panel title="Поведение лаунчера">
              <div className="space-y-3">
                <Slider label="Попыток автоподбора" value={maxAttempts} min={3} max={12} onChange={setMaxAttempts} />
                <div className="grid gap-2">
                  <Toggle label="YouTube" hint="основная проверка — всегда включена" checked disabled lock onChange={() => {}} />
                  <Toggle
                    label="Проверять Discord"
                    hint="после подбора проверит discord.com и подскажет про кэш"
                    checked={autoDiscord}
                    onChange={setAutoDiscord}
                  />
                  <Toggle
                    label="Проверять Telegram"
                    hint="дополнительный тест telegram.org"
                    checked={autoTelegram}
                    onChange={setAutoTelegram}
                  />
                  <Toggle
                    label="Автозапуск при входе в Windows"
                    hint="создаёт задачу SvoiZapretAuto — internet чинится сам при старте ПК"
                    checked={autostart}
                    onChange={setAutostart}
                  />
                </div>
              </div>
            </Panel>

            <SeedRow seed={seed} onReseed={resync} />

            <div className="flex flex-wrap gap-2.5">
              <Btn variant="primary" onClick={() => download("zapret-avto.bat", autoText)} className="flex-1 py-3.5 text-[13px]">
                ⭳ Скачать zapret-avto.bat
              </Btn>
            </div>

            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mist-500">
              сборка {buildId} · каждый «перемешать» — новый отпечаток
            </p>

            <FlowStrip />
          </Reveal>

          <Reveal delay={140}>
            <Preview title={"zapret-avto.bat — " + buildId} text={autoText} />
          </Reveal>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <Reveal delay={60} className="space-y-4">
            <Panel title="Быстрая база">
              <div className="grid gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.k}
                    onClick={() => applyPreset(p.k)}
                    className={`flex items-center justify-between rounded-[5px] border px-3 py-2.5 text-left transition-all duration-200 ${
                      preset === p.k
                        ? "border-signal-500 bg-signal-500/[0.08]"
                        : "border-ink-600 bg-ink-900/60 hover:border-ink-600 hover:bg-ink-800"
                    }`}
                  >
                    <span className="text-[13.5px] font-semibold text-paper">{p.label}</span>
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-mist-500">{p.hint}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Цели">
              <div className="grid gap-2">
                <Toggle
                  label="YouTube"
                  hint="режим скорости видео, cutoff d2"
                  checked={flags.youtube}
                  onChange={(v) => setFlags((f) => ({ ...f, youtube: v }))}
                />
                <Toggle
                  label="Discord — голос и текст"
                  hint="UDP 50000–65535, фейк-QUIC для звонков"
                  checked={flags.discord}
                  onChange={(v) => setFlags((f) => ({ ...f, discord: v }))}
                />
                <Toggle
                  label="Telegram"
                  hint="добавить телегу в маршрут"
                  checked={flags.telegram}
                  onChange={(v) => setFlags((f) => ({ ...f, telegram: v }))}
                />
              </div>
            </Panel>

            <SeedRow seed={seed} onReseed={resync} />

            <Panel title="Десинхронизация DPI">
              <div className="space-y-3.5">
                <Seg<DesyncMode>
                  options={[
                    { v: "fake,multisplit", label: "fake+split" },
                    { v: "fake,multidisorder", label: "fake+disorder" },
                    { v: "fake,fake", label: "2×fake" },
                    { v: "multisplit", label: "split" },
                    { v: "multidisorder", label: "disorder" },
                  ]}
                  value={mode}
                  onChange={(v) => {
                    setMode(v);
                    setPreset("none");
                  }}
                />
                <Slider label="TTL фейк-пакетов" value={ttl} min={2} max={12} onChange={setTtl} />
                <Slider label="Позиция разреза" value={splitPos} min={1} max={64} unit=" б." onChange={setSplitPos} />
                {mode === "fake,fake" && (
                  <Slider label="Seq-перекрытие" value={seqovl} min={1} max={10} unit=" б." onChange={setSeqovl} />
                )}
                <Slider label="Повторы сегментов" value={repeats} min={1} max={6} onChange={setRepeats} />
                <div>
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-mist-400">Обманки (fooling)</div>
                  <div className="grid grid-cols-2 gap-2">
                    {foolOpts.map((f) => {
                      const on = fooling.includes(f.v);
                      return (
                        <button
                          key={f.v}
                          onClick={() => toggleFool(f.v)}
                          className={`rounded-[5px] border px-2.5 py-2 text-left transition-all duration-150 ${
                            on ? "border-signal-500/70 bg-signal-500/[0.08]" : "border-ink-600 bg-ink-900/60 hover:border-ink-600"
                          }`}
                        >
                          <span className={`block font-mono text-[12px] font-bold ${on ? "text-signal-400" : "text-mist-300"}`}>
                            {on ? "✓ " : ""}
                            {f.v}
                          </span>
                          <span className="block text-[10.5px] leading-tight text-mist-500">{f.d}</span>
                        </button>
                      );
                    })}
                  </div>
                  {fooling.includes("badseq") && (
                    <div className="mt-3">
                      <Slider label="badseq increment" value={badseq} min={-999999} max={-1000} step={137} onChange={setBadseq} />
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <Panel title="Мусор в фейк-пакетах">
              <div className="grid gap-2 font-mono text-[12px]">
                <label className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] uppercase tracking-widest text-mist-500">TLS</span>
                  <input
                    value={fakeTls}
                    onChange={(e) => setFakeTls(e.target.value)}
                    className="w-full rounded-[4px] border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-live-400 outline-none transition-colors focus:border-signal-500"
                    spellCheck={false}
                  />
                  <button
                    onClick={() => setFakeTls("0x" + [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join(""))}
                    className="shrink-0 rounded-[4px] border border-ink-600 px-2 py-1.5 text-[10px] uppercase tracking-widest text-mist-400 hover:border-signal-500 hover:text-signal-400"
                  >
                    rnd
                  </button>
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] uppercase tracking-widest text-mist-500">QUIC</span>
                  <input
                    value={fakeQuic}
                    onChange={(e) => setFakeQuic(e.target.value)}
                    className="w-full rounded-[4px] border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-live-400 outline-none transition-colors focus:border-signal-500"
                    spellCheck={false}
                  />
                  <button
                    onClick={() => setFakeQuic("0x" + [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, "0")).join(""))}
                    className="shrink-0 rounded-[4px] border border-ink-600 px-2 py-1.5 text-[10px] uppercase tracking-widest text-mist-400 hover:border-signal-500 hover:text-signal-400"
                  >
                    rnd
                  </button>
                </label>
                <p className="text-[10.5px] normal-case tracking-normal text-mist-500" style={{ fontFamily: "var(--font-body)" }}>
                  Именно этот мусор делает твою сборку непохожей на публичные пресеты.
                </p>
              </div>
            </Panel>

            <div className="flex flex-wrap gap-2.5">
              <Btn variant="primary" onClick={() => download(`svoi-zapret-${buildId}.bat`, manualText)}>
                ⭳ Скачать .bat
              </Btn>
              <Btn
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(manualArgs);
                  } catch {
                    /* noop */
                  }
                }}
                title="Скопировать строку параметров winws"
              >
                Копировать аргументы
              </Btn>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <Preview title={"svoi-zapret-" + buildId + ".bat"} text={manualText} />
          </Reveal>
        </div>
      )}
    </div>
  );
}
