// ============================================================
// Разбор чужой стратегии (general.bat и т.п.) и генерация
// личной версии на её основе
// ============================================================

export type FlagKind = "hex" | "num" | "range" | "path" | "text" | "none";
export type FlagForm = "eq" | "space" | "bare" | "pos";

export interface ParsedFlag {
  name: string;
  value: string;
  kind: FlagKind;
  form: FlagForm;
  mutable: boolean;
  hint: string;
}

export interface ParseResult {
  ok: boolean;
  error: string;
  flags: ParsedFlag[];
}

const BOM = "\uFEFF";
const HEXC = "0123456789ABCDEF";

function tokenize(s: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const ch of s) {
    if (ch === '"') {
      q = !q;
      cur += ch;
      continue;
    }
    if (/\s/.test(ch) && !q) {
      if (cur) {
        out.push(cur);
        cur = "";
      }
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

function classify(raw: string): FlagKind {
  const s = raw.replace(/^"|"$/g, "");
  if (s === "") return "none";
  if (/^0x[0-9a-fA-F]+$/i.test(s)) return "hex";
  if (/^-?\d+$/.test(s)) return "num";
  if (/^\d+:\d+$/.test(s)) return "range";
  if (/[\\/]/.test(s)) return "path";
  return "text";
}

/** Какие числовые параметры безопасно перемешивать (порты не трогаем!). */
function numRange(name: string): [number, number] | null {
  const n = name.toLowerCase();
  if (n.includes("ttl")) return [2, 14];
  if (n.includes("split-pos") || n.endsWith("-pos")) return [1, 60];
  if (n.includes("seqovl") || n.includes("ovl")) return [1, 10];
  if (n.includes("repeats")) return [2, 6];
  if (n.includes("increment") || n.includes("badseq")) return [-999999, -100000];
  if (n.includes("tls-mod") || n.endsWith("-mod")) return [0, 8];
  return null;
}

function hintFor(kind: FlagKind, mutable: boolean): string {
  if (kind === "hex") return "фейк-мусор — перемешивается";
  if (mutable) return "числовой параметр — перемешивается";
  if (kind === "path") return "путь к файлу — не трогаю";
  if (kind === "text") return "режим/методы — не трогаю";
  if (kind === "range") return "диапазон — не трогаю";
  if (kind === "num") return "число (порт и т.п.) — не трогаю";
  return "";
}

function makeFlag(name: string, value: string, form: FlagForm): ParsedFlag {
  const kind = classify(value);
  const mutable = kind === "hex" || (kind === "num" && numRange(name) !== null);
  return { name, value, kind, form, mutable, hint: hintFor(kind, mutable) };
}

export function parseBat(text: string): ParseResult {
  // склеиваем переносы строк через ^
  const joined = text.replace(/\^\s*\r?\n/g, " ");
  const lines = joined.split(/\r?\n/);
  let target = "";

  for (const ln of lines) {
    const low = ln.toLowerCase();
    const idx = low.indexOf("winws.exe");
    if (idx === -1) continue;
    // пропускаем строки вида tasklist /FI "IMAGENAME eq winws.exe"
    if (low.includes("imagename") || low.includes("tasklist") || low.includes("taskkill")) continue;
    target = ln.slice(idx + "winws.exe".length);
    target = target.replace(/^["\s]+/, "");
    // обрезаем редиректы и пайпы
    target = target.replace(/\s*(?:&&|\|\||\||1?>|2>).*$/, "");
    target = target.trim();
    break;
  }

  if (!target) {
    return {
      ok: false,
      error: "строка с winws.exe не найдена — вставь файл стратегии целиком (type \"general.bat\")",
      flags: [],
    };
  }

  const tokens = tokenize(target);
  const flags: ParsedFlag[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith("--")) {
      const eq = t.indexOf("=");
      if (eq !== -1) {
        flags.push(makeFlag(t.slice(0, eq), t.slice(eq + 1), "eq"));
      } else {
        const nxt = tokens[i + 1];
        if (nxt !== undefined && !nxt.startsWith("--")) {
          flags.push(makeFlag(t, nxt, "space"));
          i++;
        } else {
          flags.push(makeFlag(t, "", "bare"));
        }
      }
    } else {
      flags.push({
        name: "(позиционный)",
        value: t,
        kind: classify(t),
        form: "pos",
        mutable: false,
        hint: "",
      });
    }
  }

  if (flags.length === 0) {
    return { ok: false, error: "winws.exe нашёлся, но флагов после него нет", flags: [] };
  }
  return { ok: true, error: "", flags };
}

export function randomizeFlags(flags: ParsedFlag[], rand: () => number): ParsedFlag[] {
  return flags.map((f) => {
    if (!f.mutable) return f;
    const plain = f.value.replace(/^"|"$/g, "");
    if (f.kind === "hex") {
      const len = Math.max(plain.length - 2, 8);
      let v = "0x";
      for (let i = 0; i < len; i++) v += HEXC[Math.floor(rand() * 16)];
      return { ...f, value: v };
    }
    const r = numRange(f.name);
    if (r) {
      const n = r[0] + Math.floor(rand() * (r[1] - r[0] + 1));
      return { ...f, value: String(n) };
    }
    return f;
  });
}

export function toArgsLine(flags: ParsedFlag[]): string {
  return flags
    .map((f) => {
      if (f.form === "pos") return f.value;
      if (f.form === "bare") return f.name;
      if (f.form === "space") return `${f.name} ${f.value}`;
      return `${f.name}=${f.value}`;
    })
    .join(" ");
}

/** Для службы: относительные пути делаем абсолютными (%~dp0) и экранируем кавычки под sc. */
function serviceArgs(flags: ParsedFlag[]): string {
  return flags
    .map((f) => {
      if (f.form === "pos") return f.value;
      if (f.form === "bare") return f.name;
      let v = f.value;
      if (f.kind === "path") {
        const stripped = v.replace(/^"|"$/g, "");
        const hadQuotes = v.startsWith('"');
        const abs = /^[a-zA-Z]:\\/.test(stripped) || stripped.startsWith("%") ? stripped : "%~dp0" + stripped;
        v = hadQuotes ? `"${abs}"` : abs;
      }
      return f.form === "space" ? `${f.name} ${v}` : `${f.name}=${v}`;
    })
    .join(" ")
    .replace(/"/g, '\\"');
}

export function buildPersonalWindowBat(flags: ParsedFlag[], seedHex: string): string {
  const args = toArgsLine(flags);
  const L: string[] = [
    "@echo off",
    "@echo off",
    "chcp 65001 >nul",
    "setlocal EnableDelayedExpansion",
    "title СВОЙ ЗАПРЕТ — личная стратегия [" + seedHex + "]",
    'cd /d "%~dp0"',
    "",
    "echo.",
    "echo  =====================================================",
    "echo   СВОЙ ЗАПРЕТ // личная стратегия   " + seedHex,
    "echo   собрана на базе твоего general.bat, сигнатура своя",
    "echo  =====================================================",
    "echo.",
    "",
    "net session >nul 2>&1",
    "if %errorLevel% neq 0 (",
    "  echo [i] Нужны права администратора — перезапускаюсь...",
    "  powershell -NoProfile -Command \"Start-Process -FilePath '%~f0' -Verb RunAs\"",
    "  exit /b",
    ")",
    "",
    'if not exist "bin\\winws.exe" (',
    "  echo [X] bin\\winws.exe не найден.",
    "  echo     Положи этот файл в корень папки zapret и запусти заново.",
    "  pause",
    "  exit /b 1",
    ")",
    "",
    "sc query zapret >nul 2>&1 && (",
    "  echo [i] Останавливаю службу zapret, чтобы не было двух winws...",
    "  net stop zapret >nul 2>&1",
    ")",
    "taskkill /f /im winws.exe >nul 2>&1",
    "",
    "echo [i] Запускаю личную стратегию " + seedHex + " ...",
    'start "" /min bin\\winws.exe ' + args,
    "timeout /t 3 /nobreak >nul",
    'tasklist /fi "imagename eq winws.exe" | find /i "winws.exe" >nul',
    "if errorlevel 1 (",
    "  echo [X] winws не запустился.",
    "  echo     Скорее всего антивирус: добавь папку zapret в исключения.",
    "  pause",
    "  exit /b 1",
    ")",
    "",
    "echo.",
    "echo  =====================================================",
    "echo   [OK] Личная стратегия работает в фоне.",
    "echo   Окно можно закрыть — winws останется.",
    "echo   Сигнатура " + seedHex + ": никому не передавай этот файл.",
    "echo  =====================================================",
    "echo.",
    "pause",
  ];
  return BOM + L.join("\r\n") + "\r\n";
}

export function buildPersonalServiceBat(flags: ParsedFlag[], seedHex: string): string {
  const args = serviceArgs(flags);
  const L: string[] = [
    "@echo off",
    "@echo off",
    "chcp 65001 >nul",
    "setlocal EnableDelayedExpansion",
    "title СВОЙ ЗАПРЕТ — служба [" + seedHex + "]",
    'cd /d "%~dp0"',
    "",
    "echo.",
    "echo  =====================================================",
    "echo   СВОЙ ЗАПРЕТ // личная стратегия как служба   " + seedHex,
    "echo   переживёт перезагрузку, окна не будет",
    "echo  =====================================================",
    "echo.",
    "",
    "net session >nul 2>&1",
    "if %errorLevel% neq 0 (",
    "  echo [i] Нужны права администратора — перезапускаюсь...",
    "  powershell -NoProfile -Command \"Start-Process -FilePath '%~f0' -Verb RunAs\"",
    "  exit /b",
    ")",
    "",
    'if not exist "bin\\winws.exe" (',
    "  echo [X] bin\\winws.exe не найден. Положи файл в корень папки zapret.",
    "  pause",
    "  exit /b 1",
    ")",
    "",
    "taskkill /f /im winws.exe >nul 2>&1",
    "sc query zapret >nul 2>&1 && ( net stop zapret >nul 2>&1 & sc delete zapret >nul 2>&1 )",
    'netsh interface tcp show global | findstr /i "timestamps" | findstr /i "enabled" >nul || netsh interface tcp set global timestamps=enabled >nul 2>&1',
    "",
    'set "ARGS=' + args + '"',
    "echo [i] Создаю службу zapret...",
    'sc create zapret binPath= "\\"%~dp0bin\\winws.exe\\" !ARGS!" DisplayName= "zapret" start= auto',
    'sc description zapret "Zapret DPI bypass — личная сборка ' + seedHex + '"',
    "sc start zapret",
    'reg add "HKLM\\System\\CurrentControlSet\\Services\\zapret" /v zapret-discord-youtube /t REG_SZ /d "svoi-' +
      seedHex +
      '" /f >nul',
    "",
    "echo.",
    "echo  =====================================================",
    "echo   [OK] Служба zapret установлена и запущена.",
    "echo   Переживёт перезагрузку — поднимется сама.",
    "echo   Удаление: service.bat -> 2. Remove Services.",
    "echo  =====================================================",
    "echo.",
    "pause",
  ];
  return BOM + L.join("\r\n") + "\r\n";
}
