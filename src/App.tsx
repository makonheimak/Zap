import { useEffect, useRef, useState } from "react";
import PacketField from "./components/PacketField";
import Inspector from "./components/Inspector";
import Reveal from "./components/Reveal";
import Console from "./components/Console";
import StrategyLab from "./components/StrategyLab";
import PingLab from "./components/PingLab";
import { buildInstaller } from "./lib/installer";
import {
  buildSmartLauncher,
  buildUniversalLauncher,
  generateStrategy,
  buildBat,
  download,
} from "./lib/strategy";

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span className="font-mono text-[11px] tabular-nums tracking-wider text-mist-500">
      {now.toLocaleTimeString("ru-RU")}
    </span>
  );
}

function buildHex(seed: number) {
  return "0x" + (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

const STEPS = [
  {
    n: "01",
    t: "Скачай установщик",
    d: "Одна кнопка — один файл zapret-ustanovshik.bat. В нём уже запечена твоя личная стратегия: 9 блоков как в 1.10.1, но со своими числами и своими фейк-файлами.",
    c: "text-signal-400 border-signal-500/50",
  },
  {
    n: "02",
    t: "Запусти и выбери папку zapret",
    d: "Двойной клик → «Да» на права → откроется обычное окно выбора папки. Укажи свою zapret-discord-youtube-1.10.1. Ничего никуда перетаскивать не надо.",
    c: "text-live-400 border-live-500/50",
  },
  {
    n: "03",
    t: "Готово — и навсегда",
    d: "Установщик сам создаст general (SVOI …).bat внутри твоей папки, запустит winws и поставит автозапуск. После перезагрузки всё поднимется само. Перестало работать — скачал новый установщик, запустил, выбрал папку.",
    c: "text-danger-400 border-danger-500/50",
  },
];

const DUMPS = [
  {
    n: "01",
    title: "Полная опись файлов",
    cmds: ['cd /d "C:\\Users\\Максим\\Documents\\zapret-discord-youtube-1.9.9c"', "dir /s /b"],
    hint: "Вижу всю структуру: где у тебя bin\\, lists\\, какие .bat лежат и как называются пресеты.",
  },
  {
    n: "02",
    title: "Главные файлы — целиком",
    cmds: ["type service.bat", "type general.bat"],
    hint: "Самое важное: здесь точные команды запуска winws в твоей сборке. Нет general.bat — сделай dir *.bat и пришли то, что есть (alt*.bat, youtube.bat…).",
  },
  {
    n: "03",
    title: "Списки — только опись",
    cmds: ["dir lists"],
    hint: "Только имена и размеры. Сам rkn-domains.txt целиком НЕ сливай — там десятки тысяч строк, мне достаточно знать, что он есть.",
  },
];

function DumpCard({ n, title, hint, cmds }: { n: string; title: string; hint: string; cmds: string[] }) {
  const [copied, setCopied] = useState<number | null>(null);
  const copy = (i: number, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };
  return (
    <div className="group flex flex-col rounded-md border border-ink-600 bg-ink-850/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-signal-500/50 hover:bg-ink-800">
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-[4px] border border-signal-500/50 px-2 py-1 font-mono text-[12px] font-bold text-signal-400">{n}</span>
        <h3 className="font-display text-[15px] font-bold tracking-tight text-paper">{title}</h3>
      </div>
      <div className="space-y-2">
        {cmds.map((c, i) => (
          <div key={i} className="flex items-start gap-2 rounded-[4px] border border-ink-700 bg-ink-950/70 px-3 py-2">
            <span className="mt-px font-mono text-[12px] text-signal-500">›</span>
            <code className="flex-1 break-all font-mono text-[11.5px] leading-relaxed text-mist-300">{c}</code>
            <button
              onClick={() => copy(i, c)}
              className={`shrink-0 rounded-[3px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-all ${
                copied === i
                  ? "border-live-500/60 bg-live-500/10 text-live-400"
                  : "border-ink-600 bg-ink-800 text-mist-400 hover:border-signal-500/60 hover:text-signal-400"
              }`}
            >
              {copied === i ? "✓ скопир." : "copy"}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-mist-500">{hint}</p>
    </div>
  );
}

export default function App() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [fired, setFired] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [floatDone, setFloatDone] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const hex = buildHex(seed);

  const launchAll = () => {
    setPressing(true);
    setTimeout(() => setPressing(false), 260);
    download("zapret-ustanovshik.bat", buildInstaller(seed).bat);
    setFired(true);
  };

  const launchVse = () => {
    download("zapret-vse.bat", buildUniversalLauncher(seed));
    setFired(true);
  };

  const launchAuto = () => {
    download("zapret-avto.bat", buildSmartLauncher({ seed, maxAttempts: 10, discord: true, telegram: true, autostart: true }));
    setFired(true);
  };

  const launchManual = () => {
    const s = generateStrategy(seed, { youtube: true, discord: true, telegram: true });
    download("svoi-zapret-" + hex + ".bat", buildBat(s, hex));
    setFired(true);
  };

  const reshuffle = () => {
    setSeed(Math.floor(Math.random() * 0xffffffff));
    setFired(false);
  };

  const floatDownload = () => {
    download("zapret-ustanovshik.bat", buildInstaller(seed).bat);
    setFired(true);
    setFloatDone(true);
    setTimeout(() => setFloatDone(false), 3200);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && mainRef.current && e.target === document.body) {
        e.preventDefault();
        launchAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return (
    <div className="relative min-h-screen overflow-x-hidden font-body text-paper">
      <PacketField />

      {/* ===== header ===== */}
      <header className="relative z-10 border-b border-ink-700/70 bg-ink-950/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
              <rect width="32" height="32" rx="7" fill="#111c33" />
              <path d="M8 8h16v4H8zm0 10h16v4H8zm0 10h10v4H8z" fill="#FF7A29" />
              <circle cx="24" cy="26" r="4" fill="#3DE89A" />
            </svg>
            <span className="font-display text-[15px] font-bold tracking-tight">
              СВОЙ<span className="text-signal-500">//</span>ЗАПРЕТ
            </span>
          </div>
          <span className="ml-1 hidden rounded-[3px] border border-live-500/40 bg-live-500/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-live-400 sm:inline-block">
            весь интернет
          </span>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden font-mono text-[11px] text-mist-500 md:inline">{hex}</span>
            <Clock />
          </div>
        </div>
      </header>

      {/* ===== launch console ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-12 md:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* left: copy */}
          <div>
            <Reveal>
              <span className="mb-5 inline-flex items-center gap-2 rounded-[3px] border border-signal-500/40 bg-signal-500/10 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-signal-400">
                <span className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-signal-500" />
                авто-установщик · один файл · zapret / winws
              </span>
              <h1
                className="font-display text-[clamp(30px,4.6vw,58px)] leading-[1.05] tracking-tight"
                style={{ fontWeight: 800 }}
              >
                <span className="block text-paper">СКАЧАЛ, ЗАПУСТИЛ,</span>
                <span className="anim-glitch block text-mist-400">ВЫБРАЛ ПАПКУ —</span>
                <span className="block text-signal-500">РАБОТАЕТ</span>
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-mist-300">
                Скачиваешь один файл <span className="font-mono text-signal-400">zapret-ustanovshik.bat</span>. Он сам
                спросит, где лежит твой zapret, сам создаст внутри{" "}
                <span className="text-paper">личную стратегию на основе версии 1.10.1</span>, сам запустит и поставит
                автозапуск. Перетаскивать и настраивать ничего не нужно.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11.5px] text-mist-400">
                <span><b className="text-live-400">9</b> блоков — как в твоём 1.10.1</span>
                <span><b className="text-signal-400">13</b> фейк-файлов из твоего bin</span>
                <span><b className="text-danger-400">0</b> настроек и перетаскиваний</span>
              </div>
            </Reveal>
          </div>

          {/* right: the big button console */}
          <Reveal delay={80}>
            <div
              ref={mainRef}
              className="relative overflow-hidden rounded-lg border border-ink-600 bg-ink-900/85 p-6 shadow-[0_30px_80px_-30px_rgba(7,11,22,1)] md:p-8"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mist-500">
                  твой установщик
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-live-400">
                  <span className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-live-500" />
                  готов
                </span>
              </div>

              {/* THE BUTTON */}
              <div className="flex justify-center py-4">
                <button
                  onClick={launchAll}
                  aria-label="Скачать установщик zapret"
                  className={`group relative flex h-44 w-44 items-center justify-center rounded-full outline-none transition-transform duration-150 md:h-52 md:w-52 ${
                    pressing ? "scale-95" : "hover:scale-[1.04] active:scale-95"
                  }`}
                >
                  {/* rings */}
                  <span className="absolute inset-0 rounded-full border border-signal-500/25 transition-transform duration-300 group-hover:scale-110" />
                  <span className="absolute inset-3 rounded-full border border-signal-500/40" />
                  <span className="absolute inset-6 rounded-full bg-signal-500/10 blur-md transition-opacity group-hover:opacity-100" />
                  <span className="absolute inset-6 flex items-center justify-center rounded-full bg-gradient-to-br from-signal-600 via-signal-500 to-signal-400 shadow-[0_0_50px_rgba(255,122,41,0.45)] transition-shadow duration-300 group-hover:shadow-[0_0_70px_rgba(255,122,41,0.7)]">
                    <span className="flex flex-col items-center gap-1.5 text-ink-950">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 3v11m0 0l-5-5m5 5l5-5" />
                        <path d="M4 19h16" />
                      </svg>
                      <span className="font-display text-[15px] font-bold tracking-[0.08em]">СКАЧАТЬ</span>
                    </span>
                  </span>
                </button>
              </div>

              <p className="mt-3 text-center font-mono text-[11px] text-mist-500">
                файл <span className="text-signal-400">zapret-ustanovshik.bat</span> · вместо клика —{" "}
                <kbd className="rounded-[3px] border border-ink-600 bg-ink-800 px-1.5 py-0.5 text-mist-300">Space</kbd>
              </p>

              {fired && (
                <div className="mt-5 rounded-md border border-live-500/45 bg-live-500/10 px-4 py-3 font-mono text-[12px] leading-relaxed text-live-400">
                  ✓ Установщик скачан. Запусти его → «Да» на права → выбери папку zapret. Он сам создаст личную
                  стратегию <span className="text-paper">general (SVOI {hex}).bat</span> и всё запустит.
                </div>
              )}

              {/* other builds */}
              <div className="mt-6 border-t border-ink-700 pt-4">
                <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-500">
                  запасные варианты
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={launchVse}
                    className="rounded-[4px] border border-ink-600 bg-ink-800 px-3.5 py-2 font-mono text-[11.5px] text-mist-300 transition-all hover:-translate-y-0.5 hover:border-live-500/60 hover:text-live-400"
                  >
                    ↓ zapret-vse.bat <span className="text-mist-500">(весь трафик, без списков)</span>
                  </button>
                  <button
                    onClick={launchAuto}
                    className="rounded-[4px] border border-ink-600 bg-ink-800 px-3.5 py-2 font-mono text-[11.5px] text-mist-300 transition-all hover:-translate-y-0.5 hover:border-live-500/60 hover:text-live-400"
                  >
                    ↓ zapret-avto.bat <span className="text-mist-500">(ютуб+дискорд+тг, по спискам)</span>
                  </button>
                  <button
                    onClick={launchManual}
                    className="rounded-[4px] border border-ink-600 bg-ink-800 px-3.5 py-2 font-mono text-[11.5px] text-mist-300 transition-all hover:-translate-y-0.5 hover:border-signal-500/60 hover:text-signal-400"
                  >
                    ↓ ручная сборка {hex}
                  </button>
                  <button
                    onClick={reshuffle}
                    className="rounded-[4px] border border-ink-600 bg-ink-800 px-3.5 py-2 font-mono text-[11.5px] text-mist-300 transition-all hover:-translate-y-0.5 hover:border-danger-500/60 hover:text-danger-400"
                  >
                    ⟳ перемешать сигнатуру
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== how it works ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
        <Reveal>
          <h2 className="mb-6 font-display text-[clamp(20px,2.6vw,30px)] font-bold tracking-tight text-paper">
            Три шага — и интернет <span className="text-signal-500">свободен</span>
          </h2>
        </Reveal>
        <div className="space-y-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 70}>
              <div className="group flex gap-4 rounded-md border border-ink-600 bg-ink-850/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-600 hover:bg-ink-800 md:items-center md:gap-6 md:p-5">
                <span className={`shrink-0 self-start rounded-[4px] border px-2.5 py-1.5 font-mono text-[13px] font-bold md:self-center ${s.c}`}>
                  {s.n}
                </span>
                <div>
                  <h3 className="font-display text-[15.5px] font-bold text-paper">{s.t}</h3>
                  <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-mist-300">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== zapret vs hiddify ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
        <Reveal>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-[clamp(20px,2.6vw,30px)] font-bold tracking-tight text-paper">
              <span className="text-live-400">zapret</span> или <span className="text-danger-400">hiddify</span>?
            </h2>
            <span className="font-mono text-[11px] text-mist-500">почему у VPN пинг 500+, а у zapret ~0</span>
          </div>
        </Reveal>
        <PingLab />
      </section>

      {/* ===== strategy lab ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
        <Reveal>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-[clamp(20px,2.6vw,30px)] font-bold tracking-tight text-paper">
              Разбор <span className="text-signal-400">твоей стратегии</span>
            </h2>
            <span className="font-mono text-[11px] text-mist-500">
              multi-block 1.10.x → личный general (SVOI).bat
            </span>
          </div>
        </Reveal>
        <StrategyLab />
      </section>

      {/* ===== console launch ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
        <Reveal>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-[clamp(20px,2.6vw,30px)] font-bold tracking-tight text-paper">
              Запуск <span className="text-live-400">через консоль</span>
            </h2>
            <span className="font-mono text-[11px] text-mist-500">введи свой путь — команды обновятся</span>
          </div>
        </Reveal>
        <Console />
      </section>

      {/* ===== dump structure for analysis ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
        <Reveal>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-[clamp(20px,2.6vw,30px)] font-bold tracking-tight text-paper">
              Дамп файлов: соберу <span className="text-signal-500">под твою сборку</span>
            </h2>
            <span className="font-mono text-[11px] text-mist-500">3 команды → вывод в чат</span>
          </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {DUMPS.map((d, i) => (
            <Reveal key={d.n} delay={i * 80}>
              <DumpCard {...d} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={160}>
          <div className="mt-4 flex items-start gap-3 rounded-md border border-live-500/35 bg-live-500/[0.06] px-5 py-4">
            <span className="anim-pulse-dot mt-1.5 h-2 w-2 shrink-0 rounded-full bg-live-500" />
            <p className="text-[13px] leading-relaxed text-mist-300">
              Скинь вывод всех трёх команд <b className="text-paper">одним сообщением в чат</b>. Я разберу точный
              синтаксис флагов твоей версии winws, пути и списки — и сгенерирую личный лаунчер{" "}
              <b className="text-live-400">один в один под твою папку</b>, включая автообновление списков.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ===== live inspector ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <Reveal>
            <Inspector />
          </Reveal>
          <Reveal delay={120}>
            <div className="flex h-full flex-col justify-center gap-4 rounded-md border border-ink-600 bg-ink-850/70 p-6">
              <h3 className="font-display text-[18px] font-bold text-paper">Что делает кнопка внутри</h3>
              <ul className="space-y-3 text-[13.5px] leading-relaxed text-mist-300">
                <li className="flex gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-500" />
                  <span><b className="text-paper">Фильтрует весь трафик</b> — не списки доменов, поэтому открывается вообще всё, а не только три сайта.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-live-500" />
                  <span><b className="text-paper">Генерирует случайную сигнатуру</b> прямо в bat-нике — фейк-мусор, TTL, позицию разреза. У каждого запуска она своя, поэтому ТСПУ её не знает.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-danger-500" />
                  <span><b className="text-paper">Если заблокировали — мутирует</b> и пробует снова, до 10 попыток. Рабочую сигнатуру запоминает и ставит автозапуск при входе в Windows.</span>
                </li>
              </ul>
              <p className="mt-1 border-t border-ink-700 pt-3 font-mono text-[11.5px] text-mist-500">
                Единственное требование: батник лежит в папке zapret — движок{" "}
                <span className="text-mist-300">winws.exe</span> он найдёт сам, даже в{" "}
                <span className="text-mist-300">binaries\windows-x86_64\winws\</span>.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== floating download — всегда видна ===== */}
      <button
        onClick={floatDownload}
        aria-label="Скачать установщик zapret"
        className={`group fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full border px-5 py-3.5 shadow-[0_14px_44px_-10px_rgba(255,122,41,0.55)] transition-all duration-200 hover:-translate-y-1 active:scale-95 ${
          floatDone
            ? "border-live-500/70 bg-ink-850 text-live-400"
            : "border-signal-400/60 bg-gradient-to-br from-signal-600 via-signal-500 to-signal-400 text-ink-950"
        }`}
      >
        <span className="anim-pulse-dot absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-ink-950 bg-live-500" />
        {floatDone ? (
          <>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
              <path d="M4 12.5l5.5 5.5L20 6.5" />
            </svg>
            <span className="font-mono text-[12.5px] font-bold tracking-wide">СКАЧАНО!</span>
          </>
        ) : (
          <>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
              <path d="M12 3v12m0 0l-5-5m5 5l5-5" />
              <path d="M4 19h16" />
            </svg>
            <span className="font-display text-[13px] font-bold tracking-wide">
              установщик.bat
            </span>
          </>
        )}
      </button>

      {/* ===== footer ===== */}
      <footer className="relative z-10 border-t border-ink-700/70 bg-ink-950/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[11px] text-mist-500">
            СВОЙ//ЗАПРЕТ · конструктор личной стратегии · {new Date().getFullYear()}
          </p>
          <p className="font-mono text-[11px] text-mist-500">
            Не передавай свой .bat — он сгорит, как публичный.
          </p>
        </div>
      </footer>
    </div>
  );
}
