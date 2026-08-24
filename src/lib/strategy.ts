// ============================================================
// Генератор личных стратегий и умных авто-лаунчеров для winws
// ============================================================

export type DesyncMode =
  | "fake,multisplit"
  | "fake,multidisorder"
  | "fake,fake"
  | "disorder"
  | "multisplit"
  | "multidisorder";

export interface StrategyFlags {
  youtube: boolean;
  discord: boolean;
  telegram: boolean;
}

export interface StrategyOptions {
  mode: DesyncMode;
  ttl: number;
  splitPos: number;
  seqovl: number;
  fooling: string[];
  badseqInc: number;
  fakeTls: string;
  fakeQuic: string;
  repeats: number;
  flags: StrategyFlags;
}

/** Детерминированный PRNG (mulberry32), чтобы сборку можно было воспроизвести по сиду. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HEX = "0123456789abcdef";

function randHex(rand: () => number, len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += HEX[Math.floor(rand() * 16)];
  return s;
}

export function generateStrategy(seed: number, flags: StrategyFlags): StrategyOptions {
  const rand = mulberry32(seed);
  const modes: DesyncMode[] = [
    "fake,multisplit",
    "fake,multidisorder",
    "fake,fake",
    "multisplit",
    "multidisorder",
  ];
  const mode = modes[Math.floor(rand() * modes.length)];
  const foolPool = ["badsum", "md5sig", "datanoack", "badseq"];
  const foolCount = 1 + Math.floor(rand() * 2);
  const shuffled = [...foolPool].sort(() => rand() - 0.5);
  const fooling = shuffled.slice(0, foolCount);
  if (rand() < 0.75 && !fooling.includes("md5sig")) fooling.push("md5sig");

  return {
    mode,
    ttl: 2 + Math.floor(rand() * 11),
    splitPos: 1 + Math.floor(rand() * 63),
    seqovl: 1 + Math.floor(rand() * 10),
    fooling,
    badseqInc: -(100000 + Math.floor(rand() * 900000)),
    fakeTls: "0x" + randHex(rand, 24),
    fakeQuic: "0x" + randHex(rand, 16),
    repeats: 2 + Math.floor(rand() * 4),
    flags,
  };
}

export function buildArgs(o: StrategyOptions): string[] {
  const a: string[] = ["--wf-l3=ipv4", "--wf-tcp=80,443"];
  if (o.flags.discord) a.push("--wf-udp=443,50000-65535");
  else a.push("--wf-udp=443");

  const hasFake = o.mode.includes("fake");
  a.push(`--dpi-desync=${o.mode}`);
  if (o.mode.includes("split") || o.mode.includes("disorder")) {
    a.push(`--dpi-desync-split-pos=${o.splitPos}`);
  }
  if (o.mode === "fake,fake") a.push(`--dpi-desync-split-seqovl=${o.seqovl}`);
  a.push(`--dpi-desync-ttl=${o.ttl}`);
  if (o.fooling.length) a.push(`--dpi-desync-fooling=${o.fooling.join(",")}`);
  if (o.fooling.includes("badseq")) a.push(`--dpi-desync-badseq-increment=${o.badseqInc}`);
  if (hasFake) {
    a.push(`--dpi-desync-fake-tls=${o.fakeTls}`);
    a.push(`--dpi-desync-fake-quic=${o.fakeQuic}`);
  }
  a.push(`--dpi-desync-repeats=${o.repeats}`);
  if (o.flags.youtube) {
    a.push("--dpi-desync-cutoff=d2");
    a.push("--dpi-desync-wssize=1:65536");
    a.push("--wssize=1:65536");
  }
  if (o.flags.discord) a.push("--dpi-desync-fake-quic=0x4d3c4b97");
  return a;
}

const BOM = "\uFEFF";

export function buildBat(o: StrategyOptions, buildId: string): string {
  const args = buildArgs(o).join(" ");
  const lines: string[] = [
    "@echo off",
    "chcp 65001 >nul",
    'cd /d "%~dp0"',
    "",
    ":: ========================================================",
    `::   СВОЙ ЗАПРЕТ — личная сборка ${buildId}`,
    "::   Сгенерирована конструктором svoi-zapret.",
    "::   НИКОМУ не передавай этот файл: он сгорит, как публичный.",
    ":: ========================================================",
    "",
    "echo [*] Запуск личной стратегии " + buildId + " ...",
    'echo [*] Если UAC спросит права — жми "Да".',
    "",
    'if not exist "bin\\winws.exe" (',
    "    echo [X] Не найден bin\\winws.exe — положи этот файл в корень папки zapret,",
    "    echo     рядом с service.bat, и запусти заново.",
    "    pause",
    "    exit /b 1",
    ")",
    "",
    "taskkill /f /im winws.exe >nul 2>&1",
    "",
    'set "HL="',
    'if exist "lists\\rkn-domains.txt" set HL=--hostlist=lists\\rkn-domains.txt',
    'if exist "lists\\rkn-user.txt" set HL=%HL% --hostlist=lists\\rkn-user.txt',
    'if "%HL%"=="" echo [!] Файлы списков не найдены — фильтруется весь трафик.',
    "",
    'start "" /min bin\\winws.exe ' + args + " %HL%",
    "",
    "timeout /t 2 /nobreak >nul",
    'tasklist /fi "imagename eq winws.exe" | find /i "winws.exe" >nul',
    "if errorlevel 1 (",
    "    echo [X] winws не запустился. Чаще всего виноват антивирус:",
    "    echo     добавь папку zapret в исключения и распакуй bin заново.",
    "    pause",
    "    exit /b 1",
    ")",
    "",
    "echo.",
    "echo [OK] Стратегия работает в фоне.",
    "echo      Проверь youtube.com и Discord, затем закрой это окно.",
    "pause",
  ];
  return BOM + lines.join("\r\n") + "\r\n";
}

export function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

// ============================================================
// УМНЫЙ АВТО-ЛАУНЧЕР: сам подбирает сигнатуру и проверяет сеть
// ============================================================

export interface AutoOptions {
  seed: number;
  maxAttempts: number;
  discord: boolean;
  telegram: boolean;
  autostart: boolean;
}

export function buildSmartLauncher(o: AutoOptions): string {
  const buildId = "0x" + (o.seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
  const ttlMax = 4 + (o.seed % 9); // 4..12 — диапазон случайного TTL
  const L: string[] = [];
  const p = (s = "") => L.push(s);

  p("@echo off");
  p("chcp 65001 >nul");
  p("setlocal EnableDelayedExpansion");
  p("title СВОЙ ЗАПРЕТ — автоподбор [" + buildId + "]");
  p('cd /d "%~dp0"');
  p();
  p("echo.");
  p("echo  ================================================");
  p("echo   СВОЙ ЗАПРЕТ // авто-лаунчер   сборка " + buildId);
  p("echo   сам подберёт сигнатуру и проверит соединение");
  p("echo  ================================================");
  p("echo.");
  p();
  p(":: --- права администратора ---");
  p("net session >nul 2>&1");
  p("if %errorLevel% neq 0 (");
  p("  echo [i] Нужны права администратора — перезапускаюсь...");
  p('  powershell -NoProfile -Command "Start-Process -FilePath \'%~f0\' -Verb RunAs"');
  p("  exit /b");
  p(")");
  p();
  p(":: --- проверка окружения ---");
  p('if not exist "bin\\winws.exe" (');
  p("  echo [X] ОШИБКА: файл bin\\winws.exe не найден!");
  p("  echo     Положи zapret-avto.bat в КОРЕНЬ папки zapret");
  p("  echo     ^(туда, где лежат папки bin\\ и lists\\^) и запусти заново.");
  p("  pause");
  p("  exit /b 1");
  p(")");
  p("taskkill /f /im winws.exe >nul 2>&1");
  p();
  p('set "HL="');
  p('if exist "lists\\rkn-domains.txt" (');
  p('  set "HL=--hostlist=lists\\rkn-domains.txt"');
  p(") else (");
  p("  echo [!] lists\\rkn-domains.txt нет — фильтрую весь трафик");
  p(")");
  p();
  p(":: --- а нужен ли вообще обход? ---");
  p('if not "%~1"=="/silent" (');
  p("  echo [i] Проверяю, работает ли YouTube без обхода...");
  p("  call :test_yt");
  p("  if !ERRORLEVEL! equ 0 (");
  p("    echo [i] YouTube уже открывается ^(видимо, включён VPN^).");
  p("    echo     Обход сейчас не обязателен. Любая клавиша — запустить zapret поверх,");
  p("    echo     либо просто закрой окно.");
  p("    pause >nul");
  p("  )");
  p(")");
  p();
  p("set /a TRY=0");
  p('set "MAX=' + o.maxAttempts + '"');
  p();
  p(":: --- сначала пробуем сохранённую рабочую сигнатуру ---");
  p('if exist "rabochaia.cfg" (');
  p("  set /p CFG=<rabochaia.cfg");
  p("  echo [i] Пробую сохранённую рабочую сигнатуру...");
  p("  call :run");
  p("  call :test_yt");
  p("  if !ERRORLEVEL! equ 0 goto :ok");
  p("  taskkill /f /im winws.exe >nul 2>&1");
  p("  echo [x] Сохранённая сигнатура умерла. Подбираю новую...");
  p(")");
  p();
  p(":next");
  p("set /a TRY+=1");
  p("if !TRY! gtr !MAX! goto :fail");
  p("call :gen");
  p("echo [i] Попытка !TRY!/!MAX! ^| !D! ^| ttl=!TTL! ^| fooling=!FN!");
  p("call :run");
  p("call :test_yt");
  p("if !ERRORLEVEL! equ 0 (");
  p("  >rabochaia.cfg echo !CFG!");
  p("  goto :ok");
  p(")");
  p("taskkill /f /im winws.exe >nul 2>&1");
  p("echo     ...БЛОК. Мутирую сигнатуру...");
  p("goto :next");
  p();
  p(":ok");
  p("echo.");
  p("echo  ================================================");
  p("echo   [OK] РАБОТАЕТ с попытки !TRY!");
  p("echo   Сигнатура сохранена в rabochaia.cfg —");
  p("echo   следующий запуск начнёт сразу с неё.");
  p("echo   winws работает в фоне: окно не закрывай.");
  p("echo  ================================================");
  if (o.discord) {
    p("echo.");
    p("echo [i] Проверяю Discord...");
    p('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference=\'SilentlyContinue\'; try { (Invoke-WebRequest -Uri \'https://discord.com\' -UseBasicParsing -TimeoutSec 12) | Out-Null; exit 0 } catch { exit 1 }"');
    p("if !ERRORLEVEL! equ 0 (");
    p("  echo     Discord: ОТКРЫВАЕТСЯ");
    p(") else (");
    p("  echo     Discord: пока не открылся. Закрой клиент, удали %appdata%\\discord\\Cache и запусти снова.");
    p(")");
  }
  if (o.telegram) {
    p("echo [i] Проверяю Telegram...");
    p('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference=\'SilentlyContinue\'; try { (Invoke-WebRequest -Uri \'https://telegram.org\' -UseBasicParsing -TimeoutSec 12) | Out-Null; exit 0 } catch { exit 1 }"');
    p('if !ERRORLEVEL! equ 0 ( echo     Telegram: ОТКРЫВАЕТСЯ ) else ( echo     Telegram: не открылся )');
  }
  if (o.autostart) {
    p();
    p('schtasks /create /tn "SvoiZapretAuto" /tr "\\"%~f0\\" /silent" /sc onlogon /rl highest /f >nul 2>&1');
    p("if !ERRORLEVEL! equ 0 (");
    p("  echo       [+] Автозапуск при входе в Windows включён ^(задача SvoiZapretAuto^)");
    p(")");
  }
  p("echo.");
  p("pause");
  p("exit /b 0");
  p();
  p(":fail");
  p("echo.");
  p("echo  ================================================");
  p("echo   [X] !MAX! попыток не хватило.");
  p("echo   Что сделать:");
  p("echo    1. service.bat -> 2. Update ^(обновить списки^)");
  p("echo    2. Пройти чек-лист на сайте");
  p("echo    3. Запустить этот файл ещё раз");
  p("echo  ================================================");
  p("pause");
  p("exit /b 1");
  p();
  p(":: ================= ГЕНЕРАЦИЯ СИГНАТУРЫ =================");
  p(":gen");
  p('set "HEX=0123456789ABCDEF"');
  p('set "J1=0x"');
  p('set "J2=0x"');
  p("for /L %%i in (1,1,10) do (");
  p("  set /a A=!RANDOM! %% 16");
  p("  set /a B=!RANDOM! %% 16");
  p('  for %%a in (!A!) do set "J1=!J1!!HEX:~%%a,1!"');
  p('  for %%b in (!B!) do set "J2=!J2!!HEX:~%%b,1!"');
  p(")");
  p("set /a TTL=2+!RANDOM! %% " + ttlMax);
  p("set /a POS=1+!RANDOM! %% 44");
  p("set /a OV=1+!RANDOM! %% 9");
  p("set /a SI=65536+!RANDOM!*2");
  p("set /a MD=!RANDOM! %% 3");
  p('if !MD! equ 0 ( set "D=fake,multisplit"   & set "SP=--dpi-desync-split-pos=!POS!" )');
  p('if !MD! equ 1 ( set "D=fake,multidisorder" & set "SP=--dpi-desync-split-pos=!POS!" )');
  p('if !MD! equ 2 ( set "D=fake,fake"          & set "SP=--dpi-desync-split-seqovl=!OV!" )');
  p("set /a MF=!RANDOM! %% 4");
  p('if !MF! equ 0 ( set "FOOL=--dpi-desync-fooling=badsum"     & set "FN=badsum" )');
  p('if !MF! equ 1 ( set "FOOL=--dpi-desync-fooling=md5sig"     & set "FN=md5sig" )');
  p('if !MF! equ 2 ( set "FOOL=--dpi-desync-fooling=datanoack"  & set "FN=datanoack" )');
  p('if !MF! equ 3 ( set "FOOL=--dpi-desync-fooling=badseq --dpi-desync-badseq-increment=-!SI!" & set "FN=badseq" )');
  p('set "CFG=--dpi-desync=!D! !SP! --dpi-desync-ttl=!TTL! !FOOL! --dpi-desync-fake-tls=!J1! --dpi-desync-fake-quic=!J2! --dpi-desync-repeats=2 --dpi-desync-wssize=1:65536 !HL!"');
  p("exit /b 0");
  p();
  p(":: ================= ЗАПУСК WINWS =================");
  p(":run");
  p('start "" /min bin\\winws.exe !CFG! --wf-l3=ipv4 --wf-tcp=80,443 --wf-udp=443,50000-65535');
  p("timeout /t 3 /nobreak >nul");
  p("exit /b 0");
  p();
  p(":: ================= ТЕСТ СОЕДИНЕНИЯ =================");
  p(":test_yt");
  p('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference=\'SilentlyContinue\'; try { $r=Invoke-WebRequest -Uri \'https://www.youtube.com\' -UseBasicParsing -TimeoutSec 12; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"');
  p("exit /b %ERRORLEVEL%");

  return BOM + L.join("\r\n") + "\r\n";
}

// ============================================================
// УНИВЕРСАЛЬНЫЙ ЛАУНЧЕР «ОДНА КНОПКА — ВЕСЬ ИНТЕРНЕТ»
// Фильтрует ВЕСЬ трафик (без списков доменов): ютуб, дискорд, тг
// и вообще всё. Сам ищет winws.exe, сам повышает права,
// сам подбирает сигнатуру, сам тестирует сеть, сам ставит автозапуск.
// ============================================================

export function buildUniversalLauncher(seed: number): string {
  const buildId = "0x" + (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
  const L: string[] = [];
  const p = (s = "") => L.push(s);

p("@echo off");
p("@echo off");
p("chcp 65001 >nul");
p("setlocal EnableDelayedExpansion");
p("title СВОЙ ЗАПРЕТ — ВЕСЬ ИНТЕРНЕТ [" + buildId + "]");
p('cd /d "%~dp0"');
p();  p("echo.");
  p("echo  =====================================================");
  p("echo   СВОЙ ЗАПРЕТ // ВЕСЬ СВОБОДНЫЙ ИНТЕРНЕТ   " + buildId);
  p("echo   одна кнопка: ютуб, дискорд, тг и ВСЁ остальное");
  p("echo  =====================================================");
  p("echo.");
  p();
  p(":: --- права администратора ---");
  p("net session >nul 2>&1");
  p("if %errorLevel% neq 0 (");
  p("  echo [i] Нужны права администратора — перезапускаюсь...");
  p('  powershell -NoProfile -Command "Start-Process -FilePath \'%~f0\' -Verb RunAs"');
  p("  exit /b");
  p(")");
  p();
  p(":: --- ищем winws.exe: рядом, в bin\\, либо в папке zapret выше ---");
  p('set "WINWS="');
  p('if exist "binaries\\windows-x86_64\\winws\\winws.exe" set "WINWS=binaries\\windows-x86_64\\winws\\winws.exe"');
  p('if exist "binaries\\win64\\winws\\winws.exe" set "WINWS=binaries\\win64\\winws\\winws.exe"');
  p('if exist "binaries\\win64\\winws.exe" set "WINWS=binaries\\win64\\winws.exe"');
  p('if exist "winws.exe" set "WINWS=winws.exe"');
  p('if exist "bin\\winws.exe" set "WINWS=bin\\winws.exe"');
  p('if exist "..\\bin\\winws.exe" ( cd .. & set "WINWS=bin\\winws.exe" )');
  p('if "%WINWS%"=="" (');
  p("  echo [X] ОШИБКА: winws.exe не найден!");
  p("  echo     Нужен движок: скачай github.com/bol-van/zapret/releases");
  p("  echo     Распакуй архив и положи zapret-vse.bat в корень папки");
  p("  echo     ^(рядом с bin\\ и lists\\^), затем запусти заново.");
  p("  pause");
  p("  exit /b 1");
  p(")");
  p();
  p("taskkill /f /im winws.exe >nul 2>&1");
  p();
  p(":: --- ВЕСЬ трафик: никаких списков доменов ---");
  p("echo [i] Режим: фильтрую ВЕСЬ трафик, а не отдельные сайты.");
  p();
  p("set /a TRY=0");
  p("set /a MAX=10");
  p();
  p(":next");
  p("set /a TRY+=1");
  p("if !TRY! gtr !MAX! goto :fail");
  p("call :gen");
  p("echo [i] Попытка !TRY!/!MAX! ^| !D! ^| ttl=!TTL! ^| fooling=!FN!");
p('start "" /min %WINWS% !CFG! --wf-l3=ipv4 --wf-tcp=80,443 --wf-udp=443,50000-65535');
p("timeout /t 4 /nobreak >nul");
p("call :test_net");
p("if !ERRORLEVEL! equ 0 goto :ok");
p("taskkill /f /im winws.exe >nul 2>&1");
p("echo     ...БЛОК. Мутирую сигнатуру...");  p("goto :next");
  p();
  p(":ok");
  p("echo.");
  p("echo  =====================================================");
  p("echo   [OK] ВЕСЬ ИНТЕРНЕТ ОТКРЫТ с попытки !TRY!");
  p("echo   Ютуб, дискорд, тг и любые другие сайты — работают.");
  p("echo   winws в фоне: окно не закрывай.");
  p("echo  =====================================================");
  p("echo.");
  p('schtasks /create /tn "SvoiZapretAll" /tr "\\"%~f0\\" /silent" /sc onlogon /rl highest /f >nul 2>&1');
  p("if !ERRORLEVEL! equ 0 echo [+] Автозапуск при входе в Windows включён.");
  p("echo.");
  p("pause");
  p("exit /b 0");
  p();
  p(":fail");
  p("echo.");
  p("echo  =====================================================");
  p("echo   [X] !MAX! попыток не хватило.");
  p("echo   1. Добавь папку zapret в исключения антивируса.");
  p("echo   2. service.bat -> 2. Update ^(обновить списки^).");
  p("echo   3. Запусти этот файл ещё раз.");
  p("echo  =====================================================");
  p("pause");
  p("exit /b 1");
  p();
  p(":: ============ ГЕНЕРАЦИЯ УНИКАЛЬНОЙ СИГНАТУРЫ ============");
  p(":gen");
  p('set "HEX=0123456789ABCDEF"');
  p('set "J1=0x"');
  p('set "J2=0x"');
  p("for /L %%i in (1,1,10) do (");
  p("  set /a A=!RANDOM! %% 16");
  p("  set /a B=!RANDOM! %% 16");
  p('  for %%a in (!A!) do set "J1=!J1!!HEX:~%%a,1!"');
  p('  for %%b in (!B!) do set "J2=!J2!!HEX:~%%b,1!"');
  p(")");
  p("set /a TTL=2+!RANDOM! %% 12");
  p("set /a POS=1+!RANDOM! %% 44");
  p("set /a OV=1+!RANDOM! %% 9");
  p("set /a SI=65536+!RANDOM!*2");
  p("set /a MD=!RANDOM! %% 3");
  p('if !MD! equ 0 ( set "D=fake,multisplit"   & set "SP=--dpi-desync-split-pos=!POS!" )');
  p('if !MD! equ 1 ( set "D=fake,multidisorder" & set "SP=--dpi-desync-split-pos=!POS!" )');
  p('if !MD! equ 2 ( set "D=fake,fake"          & set "SP=--dpi-desync-split-seqovl=!OV!" )');
  p("set /a MF=!RANDOM! %% 4");
  p('if !MF! equ 0 ( set "FOOL=--dpi-desync-fooling=badsum"     & set "FN=badsum" )');
  p('if !MF! equ 1 ( set "FOOL=--dpi-desync-fooling=md5sig"     & set "FN=md5sig" )');
  p('if !MF! equ 2 ( set "FOOL=--dpi-desync-fooling=datanoack"  & set "FN=datanoack" )');
  p('if !MF! equ 3 ( set "FOOL=--dpi-desync-fooling=badseq --dpi-desync-badseq-increment=-!SI!" & set "FN=badseq" )');
  p('set "CFG=--dpi-desync=!D! !SP! --dpi-desync-ttl=!TTL! !FOOL! --dpi-desync-fake-tls=!J1! --dpi-desync-fake-quic=!J2! --dpi-desync-repeats=2 --dpi-desync-wssize=1:65536"');
  p("exit /b 0");
  p();
  p(":: ============ ЗАПУСК WINWS (ВЕСЬ ТРАФИК) ============");
  p(":run");
  p('start "" /min %WINWS% !CFG! --wf-l3=ipv4 --wf-tcp=443 --wf-udp=443,50000-65535');
  p("timeout /t 3 /nobreak >nul");
  p("exit /b 0");
  p();
  p(":: ============ ТЕСТ: ОТКРЫЛСЯ ЛИ ИНТЕРНЕТ ============");
  p(":test_net");
  p('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference=\'SilentlyContinue\'; try { $r=Invoke-WebRequest -Uri \'https://www.youtube.com\' -UseBasicParsing -TimeoutSec 12; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"');
  p("exit /b %ERRORLEVEL%");

  return BOM + L.join("\r\n") + "\r\n";
}
