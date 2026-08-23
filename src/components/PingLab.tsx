import { useState, type CSSProperties } from "react";
import Reveal from "./Reveal";

const PROTOCOLS = [
  { id: "wg", name: "WireGuard", ov: 6 },
  { id: "hy2", name: "Hysteria2 / TUIC (QUIC)", ov: 12 },
  { id: "vless", name: "VLESS-Reality", ov: 22 },
  { id: "ss", name: "Shadowsocks", ov: 28 },
  { id: "obfs", name: "XRay + TCP-обфускация (часто по умолчанию)", ov: 45 },
  { id: "ovpn", name: "OpenVPN", ov: 70 },
];

export default function PingLab() {
  const [base, setBase] = useState(30); // твой пинг до сайта без всего
  const [rtt, setRtt] = useState(180); // пинг до VPN-сервера
  const [proto, setProto] = useState("obfs");

  const ov = PROTOCOLS.find((p) => p.id === proto)?.ov ?? 45;
  const vpnPing = base + rtt + ov;
  const ratio = Math.round((vpnPing / base) * 10) / 10;
  const max = Math.max(vpnPing, 120);

  const fill = (pct: number) =>
    ({ "--fill": `${Math.min(pct, 100)}%` } as CSSProperties);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* controls */}
      <Reveal>
        <div className="h-full rounded-md border border-ink-600 bg-ink-850/80 p-5">
          <p className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-mist-500">
            подкрути под себя
          </p>

          <label className="mb-1.5 flex items-baseline justify-between font-mono text-[12px] text-mist-300">
            <span>Твой пинг до YouTube без всего</span>
            <b className="text-[14px] text-paper">{base} мс</b>
          </label>
          <input
            type="range"
            min={10}
            max={80}
            value={base}
            onChange={(e) => setBase(+e.target.value)}
            className="w-full"
            style={fill(((base - 10) / 70) * 100)}
          />
          <div className="mb-5 mt-1 flex justify-between font-mono text-[9.5px] text-mist-500">
            <span>10</span>
            <span>обычно 20–40</span>
            <span>80</span>
          </div>

          <label className="mb-1.5 flex items-baseline justify-between font-mono text-[12px] text-mist-300">
            <span>Пинг до VPN-сервера hiddify</span>
            <b className="text-[14px] text-paper">{rtt} мс</b>
          </label>
          <input
            type="range"
            min={20}
            max={500}
            value={rtt}
            onChange={(e) => setRtt(+e.target.value)}
            className="w-full"
            style={fill(((rtt - 20) / 480) * 100)}
          />
          <div className="mb-5 mt-1 flex justify-between font-mono text-[9.5px] text-mist-500">
            <span>20</span>
            <span>у тебя сейчас ≈ 400–500</span>
            <span>500</span>
          </div>

          <p className="mb-2 font-mono text-[12px] text-mist-300">Протокол в hiddify</p>
          <div className="flex flex-wrap gap-1.5">
            {PROTOCOLS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProto(p.id)}
                className={`rounded-[4px] border px-2.5 py-1.5 font-mono text-[10.5px] transition-all hover:-translate-y-0.5 ${
                  proto === p.id
                    ? "border-signal-500/70 bg-signal-500/15 text-signal-400"
                    : "border-ink-600 bg-ink-800 text-mist-400 hover:text-paper"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* result */}
      <Reveal delay={100}>
        <div className="flex h-full flex-col rounded-md border border-ink-600 bg-ink-850/80 p-5">
          <div className="space-y-5">
            {/* zapret */}
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="font-display text-[13px] font-bold text-live-400">zapret (winws)</span>
                <span className="font-mono text-[22px] font-bold tabular-nums text-live-400">
                  ~{base} <span className="text-[12px] font-medium text-mist-400">мс</span>
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-[3px] bg-ink-700">
                <div
                  className="h-full rounded-[3px] bg-gradient-to-r from-live-500 to-live-300 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max((base / max) * 100, 3)}%` }}
                />
              </div>
              <p className="mt-1 font-mono text-[10px] text-mist-500">
                туннеля нет — пакеты идут как обычно, добавка ≈ 0 мс
              </p>
            </div>

            {/* hiddify */}
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="font-display text-[13px] font-bold text-danger-400">hiddify (VPN)</span>
                <span className="font-mono text-[22px] font-bold tabular-nums text-danger-400">
                  ~{vpnPing} <span className="text-[12px] font-medium text-mist-400">мс</span>
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-[3px] bg-ink-700">
                <div
                  className="h-full rounded-[3px] bg-gradient-to-r from-danger-500 to-signal-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max((vpnPing / max) * 100, 3)}%` }}
                />
              </div>
              <p className="mt-1 font-mono text-[10px] text-mist-500">
                {base} (сайт) + {rtt} (сервер) + {ov} (протокол)
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-[4px] border border-ink-600 bg-ink-900 px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-mist-500">итог</span>
            <span className="font-display text-[17px] font-bold text-paper">
              VPN медленнее в <span className="text-danger-400">×{ratio}</span>
            </span>
            <span className="ml-auto rounded-[3px] bg-live-500/15 px-2 py-1 font-mono text-[10px] font-bold tracking-wider text-live-400">
              zapret выигрывает пинг всегда
            </span>
          </div>

          <ul className="mt-4 space-y-1.5 font-mono text-[11px] leading-relaxed text-mist-400">
            <li><span className="text-signal-400">→</span> для игр/звонков/видео — zapret: задержка не добавляется вообще</li>
            <li><span className="text-signal-400">→</span> hiddify держи как запасной на случай, если zapret умрёт</li>
            <li><span className="text-signal-400">→</span> в hiddify выбери WireGuard/Hysteria2 и сервер поближе (Стамбул/Хельсинки) — с 500+ упадёт до ~150</li>
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
