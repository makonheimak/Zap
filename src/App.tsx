import { useEffect, useRef, useState } from "react";
import PacketField from "./components/PacketField";
import Inspector from "./components/Inspector";
import Reveal from "./components/Reveal";
import Console from "./components/Console";
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
    t: "Скачай движок zapret",
    d: "Распакуй архив zapret: в папке должны быть bin\\winws.exe и lists\\. GitHub Flowseal отдаёт 404 — бери зеркала из свежих гайдов или оригинальный bol-van/zapret.",
    c: "text-signal-400 border-signal-500/50",
  },
  {
    n: "02",
    t: "Положи zapret-vse.bat в корень",
    d: "Скопируй скачанный файл в корень распакованной папки zapret — туда, где лежит binaries\\. Движок он найдёт сам.",
    c: "text-live-400 border-live-500/50",
  },
  {
    n: "03",
    t: "Двойной клик → «Да»",
    d: "Запусти файл. Он сам попросит права администратора — жми «Да». Дальше всё происходит без тебя: подбор сигнатуры, тест сети, автозапуск.",
    c: "text-danger-400 border-danger-500/50",
  },
  {
    n: "04",
    t: "Весь интернет открыт",
    d: "Ютуб, дискорд, тг и любые другие сайты работают, как будто блокировок нет. Окно не закрывай — winws в фоне. После перезагрузки поднимется сам.",
    c: "text-signal-400 border-signal-500/50",
  },
];

export default function App() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [fired, setFired] = useState(false);
  const [pressing, setPressing] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const hex = buildHex(seed);

  const launchAll = () => {
    setPressing(true);
    setTimeout(() => setPressing(false), 260);
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
                одна кнопка // zapret / winws
              </span>
              <h1
                className="font-display text-[clamp(30px,4.6vw,58px)] leading-[1.05] tracking-tight"
                style={{ fontWeight: 800 }}
              >
                <span className="block text-paper">ЖМИ КНОПКУ.</span>
                <span className="anim-glitch block text-mist-400">БЛОКИРОВОК</span>
                <span className="block text-signal-500">КАК НЕ БЫЛО.</span>
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-mist-300">
                Скачиваешь один файл <span className="font-mono text-signal-400">zapret-vse.bat</span>, кидаешь в папку
                zapret, запускаешь — и он чинит <span className="text-paper">весь свободный интернет</span>: ютуб,
                дискорд, тг и всё остальное. Сам подберёт сигнатуру, проверит сеть и поставит автозапуск.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11.5px] text-mist-400">
                <span><b className="text-live-400">ВЕСЬ</b> трафик, не только ютуб/дискорд/тг</span>
                <span><b className="text-signal-400">10</b> автопопыток подбора</span>
                <span><b className="text-danger-400">0</b> настроек</span>
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
                  пульт запуска
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
                  aria-label="Запустить zapret — открыть весь интернет"
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
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M7 4.5v15l13-7.5-13-7.5z" />
                      </svg>
                      <span className="font-display text-[15px] font-bold tracking-[0.08em]">ЗАПУСТИТЬ</span>
                    </span>
                  </span>
                </button>
              </div>

              <p className="mt-3 text-center font-mono text-[11px] text-mist-500">
                скачает <span className="text-signal-400">zapret-vse.bat</span> · или жми{" "}
                <kbd className="rounded-[3px] border border-ink-600 bg-ink-800 px-1.5 py-0.5 text-mist-300">Space</kbd>
              </p>

              {fired && (
                <div className="mt-5 rounded-md border border-live-500/45 bg-live-500/10 px-4 py-3 font-mono text-[12px] leading-relaxed text-live-400">
                  ✓ Файл скачан. Теперь: 1) положи его в корень папки zapret → 2) двойной клик → 3) «Да» на UAC.
                  Сигнатура {hex} — твоя личная, никому не передавай.
                </div>
              )}

              {/* other builds */}
              <div className="mt-6 border-t border-ink-700 pt-4">
                <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-500">
                  другие сборки
                </p>
                <div className="flex flex-wrap gap-2">
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
            От нажатия до «<span className="text-signal-500">работает всё</span>»
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
