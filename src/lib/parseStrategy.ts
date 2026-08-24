// ============================================================
// Разбор реальной multi-block стратегии zapret (формат 1.10.x)
// и генерация личной версии: general (SVOI 0x...).bat
// ============================================================

const QUIC_BINS = [
  "quic_initial_4pda_to.bin",
  "quic_initial_5ka_ru.bin",
  "quic_initial_dbankcloud_ru.bin",
  "quic_initial_rutube_ru.bin",
  "quic_initial_steamcommunity_com.bin",
  "quic_initial_tencent_com.bin",
  "quic_initial_www_google_com.bin",
];
const TLS_BINS = [
  "tls_clienthello_4pda_to.bin",
  "tls_clienthello_5ka_ru.bin",
  "tls_clienthello_max_ru.bin",
  "tls_clienthello_www_google_com.bin",
];
const STUN_BINS = ["stun.bin", "stun2.bin"];

const NUMERIC_MUTABLE = new Set([
  "--dpi-desync-repeats",
  "--dpi-desync-split-seqovl",
  "--dpi-desync-split-pos",
]);

const BIN_POOLS: Record<string, string[]> = {
  "--dpi-desync-fake-quic": QUIC_BINS,
  "--dpi-desync-split-seqovl-pattern": TLS_BINS,
  "--dpi-desync-fake-stun": STUN_BINS,
};

export interface StratFlag {
  name: string;
  value: string; // как в файле, с кавычками и %VAR%
  form: "eq" | "space" | "alone";
  mutable: boolean; // числовой параметр — рандомизируется
  swappable: boolean; // фейк-.bin — подменяется из пула
  pool?: string[];
  hint: string;
}

export interface StratBlock {
  flags: StratFlag[];
}

export interface ParseResult {
  ok: boolean;
  error?: string;
  global: StratFlag[];
  blocks: StratBlock[];
}

export interface RandomOpts {
  nums: boolean;
  bins: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function classify(name: string, value: string): StratFlag {
  const mutable = NUMERIC_MUTABLE.has(name);
  const pool = BIN_POOLS[name];
  const swappable = !!pool && /%BIN%/.test(value);
  const hint = swappable
    ? "фейк-пакет: можно подменить на другой .bin из твоей папки bin"
    : mutable
      ? "числовой параметр: персонализируется"
      : "фиксированный параметр (фильтр/список/режим)";
  return { name, value, form: "eq", mutable, swappable, pool, hint };
}

export function parseBat(input: string): ParseResult {
  const m = input.match(/winws\.exe"?\s+([\s\S]+)/i);
  if (!m) {
    return {
      ok: false,
      error: "Не нашёл строку запуска winws.exe. Вставь весь general.bat (или хотя бы строку с флагами после winws.exe).",
      global: [],
      blocks: [],
    };
  }

  let raw = m[1];
  // склейка переносов строк через ^
  raw = raw.replace(/\^\s*\r?\n/g, " ");
  // склейка флагов, разорванных переносом консоли: "--dpi- desync=..." -> "--dpi-desync=..."
  raw = raw.replace(/(\S-)\s+(\S+=)/g, "$1$2");

  // токены с учётом кавычек
  const tokens: string[] = [];
  const re = /"([^"]*)"|(\S+)/g;
  let t: RegExpExecArray | null;
  while ((t = re.exec(raw))) {
    tokens.push(t[1] !== undefined ? `"${t[1]}"` : t[2]);
  }

  const groups: StratFlag[][] = [[]];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok === "--new") {
      groups.push([]);
      continue;
    }
    if (!tok.startsWith("--")) continue; // мусор (например, строка приглашения cmd)
    const eq = tok.indexOf("=");
    if (eq > 0) {
      groups[groups.length - 1].push(classify(tok.slice(0, eq), tok.slice(eq + 1)));
    } else {
      const nxt = tokens[i + 1];
      if (nxt && !nxt.startsWith("--")) {
        groups[groups.length - 1].push({ ...classify(tok, nxt), form: "space" });
        i++;
      } else {
        groups[groups.length - 1].push({ ...classify(tok, ""), form: "alone" });
      }
    }
  }

  const nonEmpty = groups.filter((g) => g.length > 0);
  if (nonEmpty.length === 0) {
    return { ok: false, error: "Строка winws.exe найдена, но флаги не распозналиcь. Проверь, что скопировалась вся команда.", global: [], blocks: [] };
  }

  if (nonEmpty.length === 1) {
    return { ok: true, global: [], blocks: [{ flags: nonEmpty[0] }] };
  }
  return {
    ok: true,
    global: nonEmpty[0],
    blocks: nonEmpty.slice(1).map((flags) => ({ flags })),
  };
}

export function displayValue(f: StratFlag): string {
  return f.value.replace(/^"|"$/g, "").replace(/^%BIN%/, "bin\\").replace(/^%LISTS%/, "lists\\");
}

export function serializeFlag(f: StratFlag): string {
  if (f.form === "alone") return f.name;
  if (f.form === "space") return `${f.name} ${f.value}`;
  return `${f.name}=${f.value}`;
}

export function randomizeStrategy(
  global: StratFlag[],
  blocks: StratBlock[],
  rand: () => number,
  opts: RandomOpts
): { global: StratFlag[]; blocks: StratBlock[] } {
  const map = (f: StratFlag): StratFlag => {
    if (f.mutable && opts.nums && /^\d+$/.test(f.value)) {
      const base = parseInt(f.value, 10);
      let v = base;
      if (f.name === "--dpi-desync-repeats") v = clamp(Math.round(base * (0.6 + rand() * 0.9)), 2, 16);
      if (f.name === "--dpi-desync-split-seqovl") v = clamp(Math.round(base * (0.55 + rand() * 0.9)), 64, 1400);
      if (f.name === "--dpi-desync-split-pos") v = 1 + Math.floor(rand() * 3);
      return { ...f, value: String(v) };
    }
    if (f.swappable && opts.bins && f.pool) {
      const pick = f.pool[Math.floor(rand() * f.pool.length)];
      return { ...f, value: `"%BIN%${pick}"` };
    }
    return f;
  };
  return {
    global: global.map(map),
    blocks: blocks.map((b) => ({ flags: b.flags.map(map) })),
  };
}

export function toCommand(global: StratFlag[], blocks: StratBlock[]): string {
  const parts: string[] = [];
  if (global.length) parts.push(global.map(serializeFlag).join(" "));
  for (const b of blocks) parts.push(b.flags.map(serializeFlag).join(" "));
  return parts.join(" --new ");
}

export function blockLabel(flags: StratFlag[]): string {
  const val = (n: string) => flags.find((f) => f.name === n)?.value ?? "";
  const l7 = val("--filter-l7");
  const dom = val("--hostlist-domains");
  const hl = val("--hostlist");
  const ftcp = val("--filter-tcp");
  const fudp = val("--filter-udp");
  const ipset = val("--ipset");
  if (l7.includes("discord")) return "Discord UDP + STUN";
  if (dom.includes("discord")) return "Discord TCP (альт. порты)";
  if (hl.includes("list-google")) return "YouTube / Google";
  if (fudp.includes("%GameFilter")) return "Игры (UDP)";
  if (ftcp.includes("%GameFilter")) return "Игры (TCP)";
  if (fudp === "443" && ipset) return "QUIC по ipset";
  if (fudp === "443") return "QUIC общий (hostlist)";
  if (ipset) return "TCP по ipset";
  return "TCP общий (hostlist)";
}

const BOM = "\uFEFF";

/** Личная стратегия в нативном формате — встаёт в меню service.bat (Install Service) и работает по двойному клику. */
export function buildStrategyBat(global: StratFlag[], blocks: StratBlock[], seedHex: string): string {
  const L: string[] = [];
  const p = (s = "") => L.push(s);
  p("@echo off");
  p("@echo off");
  p("chcp 65001 > nul");
  p(":: 65001 - UTF-8");
  p(`:: ============================================================`);
  p(`::   СВОЙ ЗАПРЕТ — личная стратегия ${seedHex}`);
  p(`::   Сделана из твоего general.bat: структура сохранена,`);
  p(`::   числовые параметры и фейк-.bin файлы персонализированы.`);
  p(`::   НИКОМУ не передавай этот файл: он сгорит, как публичный.`);
  p(`:: ============================================================`);
  p();
  p('cd /d "%~dp0"');
  p("call service.bat status_zapret");
  p("call service.bat check_updates");
  p("call service.bat load_game_filter");
  p("call service.bat load_user_lists");
  p("echo:");
  p();
  p('set "BIN=%~dp0bin\\"');
  p('set "LISTS=%~dp0lists\\"');
  p("cd /d %BIN%");
  p();
  const lines: string[] = [];
  if (global.length) lines.push(global.map(serializeFlag).join(" "));
  for (const b of blocks) lines.push(b.flags.map(serializeFlag).join(" "));
  p('start "zapret: %~n0" /min "%BIN%winws.exe" ' + lines.join(" --new ^\n") );
  return BOM + L.join("\r\n") + "\r\n";
}

export function strategyFileName(seedHex: string): string {
  return `general (SVOI ${seedHex}).bat`;
}
