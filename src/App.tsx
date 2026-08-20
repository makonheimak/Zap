import { useEffect, useState } from "react";
import Constructor from "./components/Constructor";
import Diagnostics from "./components/Diagnostics";
import Inspector from "./components/Inspector";
import PacketField from "./components/PacketField";
import Reveal from "./components/Reveal";

const TICKER = [
  "двойной клик → автоподбор сигнатуры",
  "rabochaia.cfg помнит рабочую сборку",
  "ТСПУ учится за 48 часов",
  "публичный пресет = мёртвый пресет",
  "запустилось само → проверило само",
  "одна сборка — один компьютер",
  "wssize=1:65536 → видео без буфера",
  "не делись .bat'ом — сгорит",
];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(iv);
  }, []);
  return now;
}

function SectionHead({ num, title, intro }: { num: string; title: string; intro?: string }) {
  return (
    <Reveal className="mb-10">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[13px] font-bold tracking-widest text-signal-500">/{num}</span>
        <h2 className="font-display text-[clamp(20px,3vw,34px)] font-bold leading-tight text-paper">{title}</h2>
        <span className="hidden h-px flex-1 bg-gradient-to-r from-ink-600 to-transparent sm:block" />
      </div>
      {intro && <p className="mt-3 max-w-2xl pl-[52px] text-[14px] leading-relaxed text-mist-400">{intro}</p>}
    </Reveal>
  );
}

function TspuStub() {
  const [on, setOn] = useState(false);
  return (
    <Reveal delay={100}>
      <div
        onClick={() => setOn((v) => !v)}
        className={`group relative cursor-pointer overflow-hidden rounded-md border p-8 transition-all duration-300 ${
          on ? "border-danger-500/60 bg-danger-500/[0.05]" : "border-ink-600 bg-ink-850/70 hover:border-ink-600 hover:bg-ink-800"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-md">
            <div className="mb-3 flex items-center gap-3">
              <span
                className={`inline-block h-3 w-3 rounded-[3px] transition-colors ${on ? "bg-danger-500" : "bg-mist-500/50"}`}
              />
              <h3 className="font-display text-[19px] font-bold text-paper">ТСПУ не «банит» — он учится</h3>
            </div>
            <p className="text-[13.5px] leading-relaxed text-mist-400">
              Фильтр у провайдера видит поток пакетов. Когда миллион человек шлёт одинаковый фейк-мусор из публичного
              пресета, фильтр добавляет его «отпечаток» в базу — и стратегия умирает сразу у всех. Твоя личная сборка
              в базе не появится, пока ей пользуешься только ты.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-500 transition-colors group-hover:text-signal-400">
              [ клик — показать, как фильтр видит трафик ]
            </p>
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest">
              <span className="text-mist-500">база отпечатков фильтра</span>
              <span className={on ? "text-danger-400" : "text-live-400"}>{on ? "совпадение найдено" : "совпадений нет"}</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              {[
                { sig: "0x000000 · alt3-public", n: "4 812 009 устройств", dead: true },
                { sig: "0x000000 · alt11-public", n: "1 240 773 устройства", dead: true },
                { sig: "0x1a4f9e · твой-сид", n: on ? "0 устройств (пока)" : "0 устройств", dead: false },
              ].map((r) => (
                <div
                  key={r.sig}
                  className={`flex items-center justify-between rounded-[4px] border px-3 py-2 transition-all duration-300 ${
                    r.dead ? "border-danger-500/30 bg-danger-500/[0.04]" : on ? "border-danger-500/60 bg-danger-500/10" : "border-live-500/30 bg-live-500/[0.04]"
                  }`}
                >
                  <span className={r.dead ? "text-danger-400" : on ? "text-danger-400" : "text-live-400"}>{r.sig}</span>
                  <span className="text-mist-500">{r.n}</span>
                </div>
              ))}
            </div>
            {on && (
              <p className="mt-3 font-mono text-[11px] text-danger-400">
                ✗ профиль совпал — пакеты режутся. Мутируй сборку в конструкторе.
              </p>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function VpnBlock() {
  const [vpnOn, setVpnOn] = useState(true);
  const bars = [
    { label: "твой ПК", v: 12, c: "bg-mist-400" },
    { label: "роутер", v: 18, c: "bg-mist-400" },
    { label: "провайдер", v: 24, c: "bg-mist-400" },
    { label: "сервер VPN", v: vpnOn ? 88 : 34, c: vpnOn ? "bg-signal-500" : "bg-live-500" },
    { label: "youtube", v: vpnOn ? 100 : 40, c: vpnOn ? "bg-danger-500" : "bg-live-500" },
  ];
  return (
    <Reveal delay={120}>
      <div className="rounded-md border border-ink-600 bg-ink-850/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-[13.5px] leading-relaxed text-mist-400">
            Бесплатный ключ забит тысячами людей, трафик идёт двойным туннелем (VPN поверх VPN), маршрут выбирает
            «ближайший свободный», а не ближайший. Отсюда 3000 мс и разрывы. Zapret пакеты никуда не туннелирует — он
            только «маскирует» их по дороге, поэтому пинг остаётся прямым.
          </p>
          <button
            onClick={() => setVpnOn((v) => !v)}
            className={`rounded-[5px] border px-4 py-2.5 font-mono text-[12px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.97] ${
              vpnOn
                ? "border-signal-500 bg-signal-500/15 text-signal-400 hover:bg-signal-500/25"
                : "border-live-500/60 bg-live-500/10 text-live-400 hover:bg-live-500/20"
            }`}
          >
            {vpnOn ? "hiddify: вкл — 3000 мс" : "zapret: прямой путь — 38 мс"}
          </button>
        </div>
        <div className="mt-6 flex h-36 items-end gap-3 sm:gap-5">
          {bars.map((b, i) => (
            <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="font-mono text-[11px] text-mist-400">
                {vpnOn ? ["12", "19", "31", "2400", "3000"][i] : ["12", "19", "31", "34", "38"][i]} мс
              </span>
              <div
                className={`w-full max-w-[64px] rounded-t-[3px] ${b.c} transition-all duration-700 ease-out`}
                style={{ height: `${b.v}%`, opacity: 0.85 }}
              />
              <span className="text-center font-mono text-[10px] uppercase tracking-wider text-mist-500">{b.label}</span>
            </div>
          ))}
        </div>
        <ul className="mt-6 grid gap-2 text-[13px] text-mist-300 sm:grid-cols-2">
          {[
            "Если VPN необходим — выбирай сервер в ближайшей стране и протокол VLESS/Reality, а не OpenVPN",
            "Лучшая схема: zapret как основной канал, VPN — только запасной на случай, когда фильтр совсем лютует",
            "Discord-звонки через дешёвый VPN будут лагать всегда: голос чувствителен к джиттеру, а не только к пингу",
            "Проверь скорость: если VPN режет канал до 5 Мбит/с — YouTube 1080p будет буферизировать даже при 85 мс",
          ].map((t, i) => (
            <li key={i} className="flex gap-2.5 rounded-[4px] border border-ink-700/60 bg-ink-900/50 px-3 py-2.5">
              <span className="mt-0.5 font-mono text-[11px] font-bold text-signal-500">›</span>
              <span className="leading-snug">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

const INSTALL = [
  {
    t: "Достань движок",
    d: "Нужна папка zapret (зеркала из свежих гайдов или оригинальный bol-van/zapret), в которой есть bin\\winws.exe и lists\\.",
  },
  {
    t: "Скачай zapret-avto.bat",
    d: "В конструкторе вкладка «Из коробки» → «Скачать». Положи файл в корень папки zapret, рядом с service.bat.",
  },
  {
    t: "Двойной клик",
    d: "Файл сам попросит права администратора (жми «Да»), прихлопнет старые winws и проверит, работает ли интернет без него.",
  },
  {
    t: "Он подберёт сам",
    d: "Лаунчер пробует случайные сигнатуры одну за другой, после каждой тестируя YouTube. Рабочую записывает в rabochaia.cfg.",
  },
  {
    t: "Окно не закрывай",
    d: "winws работает в фоне. Включи «Автозапуск при входе в Windows» — и после перезагрузки всё поднимется само.",
  },
  {
    t: "Через неделю снова плохо?",
    d: "Просто запусти файл ещё раз: он увидит, что сохранённая сигнатура умерла, и подберёт новую без твоих действий.",
  },
];

function InstallBlock() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {INSTALL.map((s, i) => (
        <Reveal key={s.t} delay={i * 70}>
          <div className="group h-full rounded-md border border-ink-600 bg-ink-850/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-signal-500/50 hover:bg-ink-800 hover:shadow-[0_16px_40px_-18px_rgba(255,122,41,0.35)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-[26px] font-bold text-signal-500/90">{String(i + 1).padStart(2, "0")}</span>
              <span className="h-px w-8 bg-ink-600 transition-all duration-300 group-hover:w-14 group-hover:bg-signal-500/60" />
            </div>
            <h3 className="mb-1.5 text-[15px] font-bold text-paper">{s.t}</h3>
            <p className="text-[13px] leading-relaxed text-mist-400">{s.d}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function App() {
  const now = useClock();
  const time = now.toLocaleTimeString("ru-RU");

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* ======== шапка ======== */}
      <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-950/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#top" className="flex items-center gap-2.5">
            <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
              <rect width="32" height="32" rx="6" fill="#111c33" />
              <path d="M8 8h16v4H8zm0 10h16v4H8zm0 10h10v4H8z" fill="#ff7a29" />
              <circle cx="24" cy="26" r="4" fill="#3de89a" />
            </svg>
            <span className="font-display text-[15px] font-bold tracking-tight">
              СВОЙ<span className="text-signal-500">//</span>ЗАПРЕТ
            </span>
          </a>
          <nav className="hidden items-center gap-6 font-mono text-[11.5px] uppercase tracking-[0.14em] text-mist-400 md:flex">
            <a href="#constructor" className="transition-colors hover:text-signal-400">Конструктор</a>
            <a href="#diag" className="transition-colors hover:text-signal-400">Диагностика</a>
            <a href="#vpn" className="transition-colors hover:text-signal-400">Про VPN</a>
            <a href="#install" className="transition-colors hover:text-signal-400">Установка</a>
          </nav>
          <div className="flex items-center gap-3 font-mono text-[11.5px] text-mist-400">
            <span className="hidden items-center gap-1.5 sm:flex">
              <span className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-live-500" />
              <span className="text-live-400">zapret live</span>
            </span>
            <span className="tabular-nums text-mist-500">{time}</span>
          </div>
        </div>
        <div className="overflow-hidden border-t border-ink-700/60 bg-ink-900/70">
          <div className="ticker-track flex w-max whitespace-nowrap py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist-500">
            {[0, 1].map((k) => (
              <div key={k} className="flex">
                {TICKER.map((t, i) => (
                  <span key={i} className="flex items-center">
                    <span className="px-4">{t}</span>
                    <span className="text-signal-500">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ======== открывающий экран ======== */}
      <section id="top" className="relative">
        <PacketField />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-12 md:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
            <Reveal>
              <span className="mb-5 inline-flex items-center gap-2 rounded-[3px] border border-signal-500/40 bg-signal-500/10 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-signal-400">
                <span className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-signal-500" />
                авто-лаунчер личной стратегии // zapret / winws
              </span>
              <h1
                className="font-display text-[clamp(30px,4.8vw,62px)] leading-[1.04] tracking-tight"
                style={{ fontWeight: 800 }}
              >
                <span className="block text-paper">ОДИН ФАЙЛ.</span>
                <span className="anim-glitch block text-mist-400">ДВОЙНОЙ КЛИК.</span>
                <span className="block text-signal-500">РАБОТАЕТ.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-mist-300">
                Скачиваешь <span className="font-mono text-signal-400">zapret-avto.bat</span>, запускаешь — и он
                делает всё сам: просит права админа, проверяет, не идёт ли интернет и так (например, через твой
                ReductoVPN), затем <span className="font-semibold text-paper">перебирает случайные сигнатуры</span>,
                тестируя YouTube после каждой попытки. Рабочую запоминает в{" "}
                <span className="font-mono text-live-400">rabochaia.cfg</span> — следующий запуск стартует сразу с неё.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#constructor"
                  className="inline-flex items-center gap-2 rounded-[5px] border border-signal-500 bg-signal-500 px-6 py-3 font-mono text-[13px] font-bold uppercase tracking-wider text-ink-950 transition-all duration-200 hover:bg-signal-400 hover:shadow-[0_0_32px_-6px_rgba(255,122,41,0.8)] active:scale-[0.97]"
                >
                  ⭳ Собрать zapret-avto.bat
                </a>
                <a
                  href="#diag"
                  className="inline-flex items-center gap-2 rounded-[5px] border border-ink-600 bg-ink-800/70 px-5 py-3 font-mono text-[12px] font-bold uppercase tracking-wider text-mist-300 transition-all duration-200 hover:border-live-500/60 hover:text-live-400 active:scale-[0.97]"
                >
                  Почему не работает сейчас?
                </a>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <Inspector />
            </Reveal>
          </div>

          <Reveal delay={200}>
            <div className="mt-12 grid grid-cols-3 gap-3 border-t border-ink-700/70 pt-6">
              {[
                ["1", "файл — и всё"],
                ["8", "автопопыток подбора"],
                ["0", "ручных настроек"],
              ].map(([n, t], i) => (
                <div key={i} className="flex flex-col gap-1 px-2">
                  <span className="font-display text-[clamp(22px,3.4vw,40px)] font-bold text-signal-500">{n}</span>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mist-500">{t}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======== 01 конструктор ======== */}
      <section id="constructor" className="relative mx-auto max-w-6xl scroll-mt-28 px-5 py-16">
        <SectionHead
          num="01"
          title="Собери свой авто-лаунчер"
          intro="Вкладка «Из коробки» собирает умный .bat, который сам подбирает сигнатуру и проверяет связь. «Ручная сборка» — для тех, кто хочет крутить параметры под своего провайдера."
        />
        <Constructor />
      </section>

      {/* ======== 02 почему умирает ======== */}
      <section className="relative mx-auto max-w-6xl scroll-mt-28 px-5 py-16">
        <SectionHead
          num="02"
          title="Почему общий запрет умирает за дни"
          intro="Дело не в том, что «запрет сломался». Дело в том, что он у всех одинаковый."
        />
        <TspuStub />
      </section>

      {/* ======== 03 диагностика ======== */}
      <section id="diag" className="relative mx-auto max-w-6xl scroll-mt-28 px-5 py-16">
        <SectionHead
          num="03"
          title="Чек-лист: почему не работает прямо сейчас"
          intro="Прежде чем винить сигнатуру — пройдись по списку. В 80% случаев проблема здесь, и лаунчер часть этого делает сам."
        />
        <Diagnostics />
      </section>

      {/* ======== 04 vpn ======== */}
      <section id="vpn" className="relative mx-auto max-w-6xl scroll-mt-28 px-5 py-16">
        <SectionHead
          num="04"
          title="Почему hiddify даёт 3000 мс"
          intro="VPN туннелирует весь трафик через чужой сервер. Zapret так не умеет — и в этом его плюс."
        />
        <VpnBlock />
      </section>

      {/* ======== 05 установка ======== */}
      <section id="install" className="relative mx-auto max-w-6xl scroll-mt-28 px-5 py-16">
        <SectionHead
          num="05"
          title="От скачивания до «работает»"
          intro="Ничего настраивать не надо: лаунчер делает всю рутину сам — права, запуск, подбор, проверку и запоминание рабочей сигнатуры."
        />
        <InstallBlock />
      </section>

      {/* ======== подвал ======== */}
      <footer className="border-t border-ink-700/80 bg-ink-900/50">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-md">
              <div className="mb-2 font-display text-[15px] font-bold">
                СВОЙ<span className="text-signal-500">//</span>ЗАПРЕТ
              </div>
              <p className="text-[12.5px] leading-relaxed text-mist-500">
                Конструктор генерирует конфигурацию для открытого DPI-обходчика zapret (winws). Используется на
                свой страх и риск; автор не несёт ответственности за то, как ты распоряжаешься своим интернетом.
              </p>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist-500">
              <div className="mb-2 text-mist-400">правила выживания</div>
              <ul className="space-y-1.5">
                <li><span className="text-signal-500">01</span> не раздавай свой .bat</li>
                <li><span className="text-signal-500">02</span> мутируй, когда умирает</li>
                <li><span className="text-signal-500">03</span> держи списки свежими</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-mist-500">
              <span className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-live-500" />
              сборка {time} · все сигнатуры локальны
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
