// ============================================================
// УСТАНОВЩИК «ОДИН ФАЙЛ»: скачал → запустил → выбрал папку zapret
// → личная стратегия создана и запущена, автозапуск поставлен.
// Стратегия печётся из реальной 9-блочной структуры 1.10.1.
// ============================================================

import { mulberry32 } from "./strategy";

const QUIC_BINS = [
  "quic_initial_www_google_com",
  "quic_initial_4pda.to",
  "quic_initial_5ka_ru",
  "quic_initial_dbankcloud_ru",
  "quic_initial_rutube_ru",
  "quic_initial_steamcommunity_com",
  "quic_initial_tencent_com",
];
const TLS_BINS = [
  "tls_clienthello_www_google_com",
  "tls_clienthello_4pda_to",
  "tls_clienthello_5ka_ru",
  "tls_clienthello_max_ru",
];
const STUN_BINS = ["ACTIVE_DISCORD_UDP.bin", "stun.bin", "stun2.bin"];

export interface InstallerMeta {
  id: string;
  stratName: string;
  quic: string[];
  tls: string[];
  stun: string;
  repeats: number[];
  seqovl: number[];
  pos: number[];
}

/** Двойной процент для записи строк стратегии через echo из установщика. */
const esc = (s: string) => s.replace(/%/g, "%%");

export function buildInstaller(seed: number): { bat: string; meta: InstallerMeta } {
  const rand = mulberry32(seed);
  const id = "0x" + (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
  const stratName = `general (SVOI ${id}).bat`;
  const pick = (arr: string[]) => arr[Math.floor(rand() * arr.length)];
  const ri = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

  const quic = [pick(QUIC_BINS), pick(QUIC_BINS)];
  const tls = [pick(TLS_BINS), pick(TLS_BINS), pick(TLS_BINS), pick(TLS_BINS), pick(TLS_BINS)];
  const stun = pick(STUN_BINS);
  const repeats = [ri(3, 9), ri(3, 9), ri(3, 9), ri(8, 14)];
  const seqovl = [ri(300, 900), ri(300, 900), ri(300, 900), ri(300, 900), ri(300, 900)];
  const pos = [ri(1, 3), ri(1, 3), ri(1, 3), ri(1, 3), ri(1, 3)];

  // ---- тело личной стратегии (9 блоков, как в оригинале 1.10.1) ----
  const H =
    `--hostlist="%LISTS%list-general.txt" --hostlist="%LISTS%list-general-user.txt" ` +
    `--hostlist-exclude="%LISTS%list-exclude.txt" --hostlist-exclude="%LISTS%list-exclude-user.txt" ` +
    `--ipset-exclude="%LISTS%ipset-exclude.txt" --ipset-exclude="%LISTS%ipset-exclude-user.txt"`;
  const HE =
    `--hostlist-exclude="%LISTS%list-exclude.txt" --hostlist-exclude="%LISTS%list-exclude-user.txt" ` +
    `--ipset-exclude="%LISTS%ipset-exclude.txt" --ipset-exclude="%LISTS%ipset-exclude-user.txt"`;
  const IP = `--ipset="%LISTS%ipset-all.txt" ${HE}`;

  const args =
    `--wf-tcp=80,443,2053,2083,2087,2096,8443,%GameFilterTCP% --wf-udp=443,19294-19344,50000-50100,%GameFilterUDP% ` +
    `--filter-udp=443 ${H} --dpi-desync=fake --dpi-desync-repeats=${repeats[0]} --dpi-desync-fake-quic="%BIN%${quic[0]}.bin" --new ` +
    `--filter-udp=19294-19344,50000-50100 --filter-l7=discord,stun --dpi-desync=fake --dpi-desync-fake-discord="%BIN%ACTIVE_DISCORD_UDP.bin" --dpi-desync-fake-stun="%BIN%${stun}" --dpi-desync-repeats=${repeats[1]} --new ` +
    `--filter-tcp=2053,2083,2087,2096,8443 --hostlist-domains=discord.media --dpi-desync=multisplit --dpi-desync-split-seqovl=${seqovl[0]} --dpi-desync-split-pos=${pos[0]} --dpi-desync-split-seqovl-pattern="%BIN%${tls[0]}.bin" --new ` +
    `--filter-tcp=443 --hostlist="%LISTS%list-google.txt" --ip-id=zero --dpi-desync=multisplit --dpi-desync-split-seqovl=${seqovl[1]} --dpi-desync-split-pos=${pos[1]} --dpi-desync-split-seqovl-pattern="%BIN%${tls[1]}.bin" --new ` +
    `--filter-tcp=80,443 ${H} --dpi-desync=multisplit --dpi-desync-split-seqovl=${seqovl[2]} --dpi-desync-split-pos=${pos[2]} --dpi-desync-split-seqovl-pattern="%BIN%${tls[2]}.bin" --new ` +
    `--filter-udp=443 ${IP} --dpi-desync=fake --dpi-desync-repeats=${repeats[2]} --dpi-desync-fake-quic="%BIN%${quic[1]}.bin" --new ` +
    `--filter-tcp=80,443,8443 ${IP} --dpi-desync=multisplit --dpi-desync-split-seqovl=${seqovl[3]} --dpi-desync-split-pos=${pos[3]} --dpi-desync-split-seqovl-pattern="%BIN%${tls[3]}.bin" --new ` +
    `--filter-tcp=%GameFilterTCP% ${IP} --dpi-desync=multisplit --dpi-desync-any-protocol=1 --dpi-desync-cutoff=n3 --dpi-desync-split-seqovl=${seqovl[4]} --dpi-desync-split-pos=${pos[4]} --dpi-desync-split-seqovl-pattern="%BIN%${tls[4]}.bin" --new ` +
    `--filter-udp=%GameFilterUDP% ${IP} --dpi-desync=fake --dpi-desync-repeats=${repeats[3]} --dpi-desync-any-protocol=1 --dpi-desync-fake-unknown-udp="%BIN%ACTIVE_GAME_UDP.bin" --dpi-desync-cutoff=n2`;

  const stratLines = [
    "@echo off",
    "chcp 65001 > nul",
    "cd /d \"%~dp0\"",
    "call service.bat status_zapret",
    "call service.bat check_updates",
    "call service.bat load_game_filter",
    "call service.bat load_user_lists",
    "echo:",
    "set \"BIN=%~dp0bin\\\"",
    "set \"LISTS=%~dp0lists\\\"",
    "cd /d %BIN%",
    `start "zapret: %~n0" /min "%BIN%winws.exe" ${args}`,
  ];

  // ---- сам установщик ----
  const L: string[] = [];
  const p = (s = "") => L.push(s);

  p("@echo off");
  p("@echo off");
  p("chcp 65001 >nul");
  p("setlocal EnableDelayedExpansion");
  p(`title СВОЙ ЗАПРЕТ — установка личной стратегии ${id}`);
  p('cd /d "%~dp0"');
  p();
  p("echo.");
  p("echo  =====================================================");
  p(`echo   СВОЙ ЗАПРЕТ // УСТАНОВЩИК   ${id}`);
  p("echo   сам найдёт zapret, создаст стратегию и запустит");
  p("echo  =====================================================");
  p("echo.");
  p();
  p("net session >nul 2>&1");
  p("if %errorLevel% neq 0 (");
  p("  echo [i] Нужны права администратора — перезапускаюсь...");
  p("  powershell -NoProfile -Command \"Start-Process -FilePath '%~f0' -Verb RunAs\"");
  p("  exit /b");
  p(")");
  p();
  p("echo [1/4] Сейчас откроется окно выбора папки.");
  p("echo       Найди свою папку zapret ^(например zapret-discord-youtube-1.10.1^)");
  p("echo       и нажми OK. Внутри неё должна быть папка bin.");
  p("echo.");
  p('set "ZDIR="');
  p(
    "for /f \"usebackq delims=\" %%P in (`powershell -NoProfile -Command \"Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Выберите папку zapret (внутри которой папка bin)'; $d.SelectedPath = [Environment]::GetFolderPath('MyDocuments'); if ($d.ShowDialog() -eq 'OK') { $d.SelectedPath }\"`) do set \"ZDIR=%%P\""
  );
  p('if "!ZDIR!"=="" (');
  p("  echo [i] Диалог не открылся — введи путь вручную ^(например C:\\zapret^):");
  p('  set /p "ZDIR=Путь к папке zapret: "');
  p(")");
  p('if "!ZDIR!"=="" (');
  p("  echo [X] Папка не выбрана — установка отменена.");
  p("  pause");
  p("  exit /b 1");
  p(")");
  p();
  p(":: --- ищем движок ---");
  p('set "WINWS="');
  p('if exist "!ZDIR!\\bin\\winws.exe" set "WINWS=!ZDIR!\\bin\\winws.exe"');
  p('if not defined WINWS if exist "!ZDIR!\\binaries\\windows-x86_64\\winws\\winws.exe" set "WINWS=!ZDIR!\\binaries\\windows-x86_64\\winws\\winws.exe"');
  p('if not defined WINWS if exist "!ZDIR!\\winws.exe" set "WINWS=!ZDIR!\\winws.exe"');
  p("if not defined WINWS (");
  p("  echo [X] Не нашёл winws.exe в выбранной папке.");
  p("  echo     Это точно папка zapret? В ней должна быть папка bin\\.");
  p("  pause");
  p("  exit /b 1");
  p(")");
  p("echo.");
  p("echo [OK] Движок найден: !WINWS!");
  p();
  p("echo [2/4] Создаю личную стратегию...");
  stratLines.forEach((line, i) => {
    p(`${i === 0 ? ">" : ">>"} "!ZDIR!\\${stratName}" echo ${esc(line)}`);
  });
  p("echo [OK] Создан файл: !ZDIR!\\STRATNAME_PH");
  p();
  p("echo [3/4] Запускаю...");
  p("taskkill /f /im winws.exe >nul 2>&1");
  p("timeout /t 1 /nobreak >nul");
  p(`start "" /min "!ZDIR!\\${stratName}"`);
  p("timeout /t 6 /nobreak >nul");
  p();
  p("echo [4/4] Ставлю автозапуск при входе в Windows...");
  p(
    `schtasks /create /tn "SvoiZapret" /tr "\\"!ZDIR!\\${stratName}\\"" /sc onlogon /rl highest /f >nul 2>&1`
  );
  p();
  p('tasklist /fi "imagename eq winws.exe" | find /i "winws.exe" >nul');
  p("if !errorlevel! equ 0 (");
  p("  echo.");
  p("  echo  =====================================================");
  p("  echo   [OK] ГОТОВО! winws работает.");
  p(`  echo   Стратегия:  !ZDIR!\\${stratName}`);
  p("  echo   Автозапуск: включён.");
  p("  echo   Окно можно закрыть. Если когда-нибудь перестанет");
  p("  echo   работать — скачай новый установщик и запусти снова.");
  p("  echo  =====================================================");
  p(") else (");
  p("  echo.");
  p("  echo  [X] winws не поднялся.");
  p("  echo      1. Добавь папку zapret в исключения антивируса.");
  p("  echo      2. Запусти установщик ещё раз.");
  p("  echo      3. Windows 11 + Secure Boot: обнови WinDivert.");
  p(")");
  p("echo.");
  p("pause");

  let bat = "\uFEFF" + L.join("\r\n") + "\r\n";
  bat = bat.replace(/STRATNAME_PH/g, stratName);

  return {
    bat,
    meta: { id, stratName, quic, tls, stun, repeats, seqovl, pos },
  };
}
