import { useState } from "react";
import Reveal from "./Reveal";

interface Item {
  id: string;
  tag: "ZAPRET" | "СИСТЕМА" | "СЕТЬ";
  title: string;
  body: string;
  cmd?: string;
}

const ITEMS: Item[] = [
  {
    id: "lists",
    tag: "ZAPRET",
    title: "Обнови списки блокировок",
    body: "Самая частая причина «умер». winws применяет стратегию только к доменам из lists\\rkn-domains.txt, а списки устаревают. Запусти service.bat → пункт «2. Update (hosts + domains)» и дождись зелёной надписи.",
    cmd: "service.bat → 2. Update (hosts + domains)",
  },
  {
    id: "single",
    tag: "ZAPRET",
    title: "Только один winws.exe в системе",
    body: "Если осталось открытым старое окно zapret, а поверх запустился авто-лаунчер — два процесса дерутся за одни пакеты и ломают друг друга. Лаунчер убивает старые сам, но если что-то пошло не так — сделай это вручную.",
    cmd: "taskkill /f /im winws.exe",
  },
  {
    id: "av",
    tag: "СИСТЕМА",
    title: "Антивирус съедает bin\\winws.exe",
    body: "Windows Defender обожает помечать winws.exe как троян — это известный ложный позитив, о нём прямо написано в README оригинального zapret. Добавь всю папку zapret в исключения (или временно выключи защиту в реальном времени) и распакуй бинарник заново.",
  },
  {
    id: "clean",
    tag: "ZAPRET",
    title: "Чистая установка, а не обновление поверх",
    body: "Не кидай новые файлы в старую папку — конфиги от разных версий смешиваются и молча ломают запуск. Полностью удали старую папку и распакуй свежую начисто.",
  },
  {
    id: "dns",
    tag: "СЕТЬ",
    title: "Сбрось DNS и убери мёртвые VPN-адаптеры",
    body: "После hiddify часто остаётся активный TAP/TUN-адаптер, который перехватывает трафик. Отключи его в сетевых подключениях, сбрось кэш DNS и перезапусти сетевую карту.",
    cmd: "ipconfig /flushdns",
  },
  {
    id: "burned",
    tag: "ZAPRET",
    title: "Работало, потом сломалось → сигнатуру выучили",
    body: "Если стратегия жила день-два и умерла — ТСПУ запомнил профиль. Ничего чинить вручную не надо: просто запусти zapret-avto.bat ещё раз, он подберёт новую сигнатуру сам.",
  },
  {
    id: "discord",
    tag: "СЕТЬ",
    title: "Discord всё ещё не коннектится",
    body: "Discord кэширует мёртвые маршруты. Закрой его полностью, удали папки Cache, GPUCache и Code Cache из %appdata%\\discord, запусти заново и залогинься.",
    cmd: "Win+R → %appdata%\\discord",
  },
  {
    id: "distro",
    tag: "ZAPRET",
    title: "Где взять дистрибутив, если GitHub отдаёт 404",
    body: "Репозиторий Flowseal/zapret-discord-youtube скрыт на GitHub с 10 июля 2026 (проверено: API отвечает 404). Варианты: зеркала из свежих гайдов (ALT-ссылки, GoogleDrive-архивы) или оригинальный bol-van/zapret с Windows-сборкой winws.exe и своими списками. Главное, чтобы в папке были bin\\winws.exe и lists\\.",
  },
];

const TAG_STYLE: Record<Item["tag"], string> = {
  ZAPRET: "border-signal-500/50 text-signal-400",
  СИСТЕМА: "border-danger-500/50 text-danger-400",
  СЕТЬ: "border-live-500/50 text-live-400",
};

export default function Diagnostics() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>("lists");

  const toggleDone = (id: string) =>
    setDone((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const pct = Math.round((done.size / ITEMS.length) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <Reveal>
        <div className="mb-5 flex items-center gap-4 rounded-md border border-ink-600 bg-ink-850 px-4 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-400">Прогресс</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-signal-500 to-live-500 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`font-mono text-sm font-bold ${pct === 100 ? "text-live-400" : "text-paper"}`}>
            {done.size}/{ITEMS.length}
          </span>
        </div>
      </Reveal>

      <div className="space-y-2.5">
        {ITEMS.map((it, i) => {
          const isOpen = open === it.id;
          const isDone = done.has(it.id);
          return (
            <Reveal key={it.id} delay={i * 45}>
              <div
                className={`overflow-hidden rounded-md border transition-all duration-300 ${
                  isDone ? "border-live-500/40 bg-live-500/[0.04]" : "border-ink-600 bg-ink-850/80 hover:bg-ink-800"
                } ${isOpen ? "border-signal-500/50" : ""}`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    className="chk chk-mint"
                    checked={isDone}
                    onChange={() => toggleDone(it.id)}
                    aria-label={`Отметить: ${it.title}`}
                  />
                  <span
                    className={`hidden shrink-0 rounded-[3px] border px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-widest sm:inline-block ${TAG_STYLE[it.tag]}`}
                  >
                    {it.tag}
                  </span>
                  <button
                    onClick={() => setOpen(isOpen ? null : it.id)}
                    className={`flex flex-1 items-center justify-between gap-3 text-left text-[14.5px] font-semibold transition-colors ${
                      isDone ? "text-mist-500 line-through decoration-mist-500/50" : "text-paper"
                    }`}
                  >
                    <span>
                      <span className="mr-2 font-mono text-[11px] text-mist-500">{String(i + 1).padStart(2, "0")}</span>
                      {it.title}
                    </span>
                    <span className={`font-mono text-signal-400 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} aria-hidden>
                      +
                    </span>
                  </button>
                </div>
                <div
                  className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-ink-700/60 px-4 py-3 pl-[52px]">
                      <p className="text-[13.5px] leading-relaxed text-mist-300">{it.body}</p>
                      {it.cmd && (
                        <code className="mt-2.5 inline-block rounded-[4px] border border-ink-600 bg-ink-900 px-3 py-1.5 font-mono text-[12px] text-live-400">
                          {it.cmd}
                        </code>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {pct === 100 && (
        <div className="mt-4 rounded-md border border-live-500/50 bg-live-500/10 px-4 py-3 font-mono text-[13px] text-live-400">
          ✓ Чек-лист закрыт. Если всё ещё не работает — просто запусти zapret-avto.bat ещё раз: он подберёт новую сигнатуру.
        </div>
      )}
    </div>
  );
}
