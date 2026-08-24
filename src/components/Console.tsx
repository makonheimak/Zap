import { useState } from "react";
import Reveal from "./Reveal";

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setOk(true);
    setTimeout(() => setOk(false), 1400);
  };
  return (
    <button
      onClick={copy}
      className={`shrink-0 rounded-[4px] border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider transition-all duration-200 ${
        ok
          ? "border-live-500/60 bg-live-500/15 text-live-400"
          : "border-ink-600 bg-ink-800 text-mist-400 hover:-translate-y-0.5 hover:border-signal-500/60 hover:text-signal-400"
      }`}
    >
      {ok ? "✓ готово" : "копировать"}
    </button>
  );
}

function Cmd({ prompt, text }: { prompt: string; text: string }) {
  return (
    <div className="group flex items-center gap-3 rounded-md border border-ink-700 bg-ink-900 px-3.5 py-2.5 transition-colors hover:border-ink-600">
      <span className="select-none font-mono text-[12.5px] text-live-500">{prompt}</span>
      <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-paper">{text}</code>
      <CopyBtn text={text} />
    </div>
  );
}

const TREE: { ind: number; name: string; kind: "dir" | "file" | "bat"; note?: string }[] = [
  { ind: 0, name: "zapret-71.x", kind: "dir", note: "распакованная папка" },
  { ind: 1, name: "binaries", kind: "dir" },
  { ind: 2, name: "windows-x86_64", kind: "dir" },
  { ind: 3, name: "winws", kind: "dir" },
  { ind: 4, name: "winws.exe", kind: "file", note: "движок" },
  { ind: 4, name: "WinDivert.dll", kind: "file" },
  { ind: 4, name: "WinDivert64.sys", kind: "file" },
  { ind: 1, name: "docs", kind: "dir" },
  { ind: 1, name: "lists", kind: "dir", note: "если есть" },
  { ind: 1, name: "zapret-vse.bat", kind: "bat", note: "СЮДА" },
];

export default function Console() {
  const [path, setPath] = useState("C:\\zapret");
  const p = path.trim().replace(/\\+$/, "") || "C:\\zapret";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* commands */}
      <Reveal>
        <div className="term-scan relative overflow-hidden rounded-md border border-ink-600 bg-ink-900/85">
          <div className="flex items-center gap-2 border-b border-ink-600 bg-ink-850 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-danger-500/80" />
            <span className="h-2.5 w-2.5 rounded-[3px] bg-signal-500/80" />
            <span className="h-2.5 w-2.5 rounded-[3px] bg-live-500/80" />
            <span className="ml-3 font-mono text-[11px] tracking-wider text-mist-500">cmd.exe — запуск через консоль</span>
          </div>

          <div className="space-y-3 p-4 md:p-5">
            <div>
              <label
                htmlFor="zapath"
                className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist-500"
              >
                Твой путь к папке zapret
              </label>
              <input
                id="zapath"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                spellCheck={false}
                className="w-full rounded-md border border-ink-600 bg-ink-950 px-3.5 py-2.5 font-mono text-[13.5px] text-signal-300 outline-none transition-all focus:border-signal-500 focus:shadow-[0_0_0_4px_rgba(255,122,41,0.12)]"
              />
            </div>

            <div>
              <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist-500">
                Способ 1 — перейти и запустить
              </p>
              <div className="space-y-2">
                <Cmd prompt=">" text={`cd /d "${p}"`} />
                <Cmd prompt=">" text="zapret-vse.bat" />
              </div>
            </div>

            <div>
              <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist-500">
                Способ 2 — одной строкой, из любого места
              </p>
              <Cmd prompt=">" text={`"${p}\\zapret-vse.bat"`} />
            </div>

            <div className="rounded-md border border-ink-700 bg-ink-850 px-3.5 py-3 text-[12.5px] leading-relaxed text-mist-300">
              Консоль открывать <b className="text-paper">от админа не обязательно</b> — батник сам попросит права
              (выскочит окно UAC, жми «Да»). Быстрый путь:{" "}
              <kbd className="rounded-[3px] border border-ink-600 bg-ink-800 px-1.5 py-0.5 font-mono text-[11px] text-mist-300">Win+R</kbd>{" "}
              → <code className="font-mono text-signal-400">cmd</code> → Enter.
            </div>
          </div>
        </div>
      </Reveal>

      {/* folder tree */}
      <Reveal delay={120}>
        <div className="flex h-full flex-col rounded-md border border-ink-600 bg-ink-850/70">
          <div className="border-b border-ink-700 px-4 py-3">
            <h3 className="font-display text-[15px] font-bold text-paper">Куда класть файл</h3>
            <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-mist-500">
              структура папки zapret
            </p>
          </div>
          <div className="flex-1 overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[26px]">
            {TREE.map((r, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap" style={{ paddingLeft: r.ind * 18 }}>
                <span className="select-none text-ink-600">{r.ind > 0 ? "└─" : ""}</span>
                {r.kind === "bat" ? (
                  <span className="rounded-[3px] bg-signal-500/15 px-1.5 py-0.5 font-bold text-signal-400">
                    {r.name}
                  </span>
                ) : (
                  <span className={r.kind === "dir" ? "text-mist-400" : "text-mist-300"}>
                    {r.name}
                    {r.kind === "dir" ? "\\" : ""}
                  </span>
                )}
                {r.note && (
                  <span className={`text-[10.5px] ${r.kind === "bat" ? "font-bold text-signal-500" : r.kind === "file" ? "text-live-500" : "text-mist-500"}`}>
                    ← {r.note}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-ink-700 px-4 py-3.5 text-[12px] leading-relaxed text-mist-300">
            <b className="text-paper">Куда угодно — нельзя:</b> лаунчер ищет движок относительно своего места. Но можно
            собрать <b className="text-live-400">свою папку где угодно</b> (хоть на рабочем столе): скопируй в неё{" "}
            <code className="font-mono text-mist-300">winws.exe</code>,{" "}
            <code className="font-mono text-mist-300">WinDivert.dll</code>,{" "}
            <code className="font-mono text-mist-300">WinDivert64.sys</code> и батник — он найдёт движок рядом и
            запустится.
          </div>
        </div>
      </Reveal>
    </div>
  );
}
