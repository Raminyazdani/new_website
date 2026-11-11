import { useId } from 'react';

const marks = Array.from({ length: 39 }, (_, i) => i);
const channels = Array.from({ length: 6 }, (_, i) => {
  const y = 36 + i * 30;
  const lensY = 72 + i * 15;
  return { y, lensY, path: `M13 ${y}H103C132 ${y} 133 ${lensY} 161 ${lensY}H543C573 ${lensY} 566 ${y} 605 ${y}H727` };
});

export function FlowChamber({ active, gate, enabled }: { active: number; gate: number; enabled: number }) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  return <svg className="fc-chamber-svg" viewBox="0 0 740 222" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={id('chamber')} x1="0" x2="0" y1="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#0b0f12" /><stop offset=".38" stopColor="#283035" /><stop offset=".7" stopColor="#182023" /><stop offset="1" stopColor="#090d0f" />
      </linearGradient>
      <linearGradient id={id('rail')} x1="0" x2="0" y1="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#9ca5a4" /><stop offset=".17" stopColor="#505b5d" /><stop offset=".5" stopColor="#272e31" /><stop offset=".8" stopColor="#485153" /><stop offset="1" stopColor="#181e21" />
      </linearGradient>
      <linearGradient id={id('signal')} x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox">
        <stop stopColor="#b04e2c" /><stop offset=".34" stopColor="#f29b5b" /><stop offset=".62" stopColor="#ffcc8d" /><stop offset="1" stopColor="#d17042" />
      </linearGradient>
      <linearGradient id={id('window')} x1="0" x2="0" y1="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#b6cfcc" stopOpacity=".14" /><stop offset=".36" stopColor="#b9c8cc" stopOpacity=".02" />
        <stop offset=".37" stopColor="#b5cacc" stopOpacity=".08" /><stop offset="1" stopColor="#0b1115" stopOpacity=".32" />
      </linearGradient>
      <pattern id={id('matrix')} width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.54" fill="#9fb2b5" opacity=".28" />
        <path d="M0 9.5H10" stroke="#010405" opacity=".4" strokeWidth=".55" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="740" height="222" rx="7" fill={url('chamber')} />
    <rect x="5" y="6" width="730" height="210" rx="3" fill={url('matrix')} stroke="#0a1012" strokeWidth="2" />
    <path d="M24 15H716M24 207H716" stroke="#a2adae" strokeOpacity=".46" />
    <path d="M81 16V206M659 16V206" stroke="#7c8b8f" strokeOpacity=".38" />
    <path d="M25 20H72V201H25ZM669 20H715V201H669Z" fill={url('rail')} stroke="#070d10" strokeWidth="2" />
    {marks.map((i) => <path key={i} d={`M${85 + i * 15} 16v${i % 5 === 0 ? 11 : 4}m0 ${i % 5 === 0 ? 169 : 183}v${i % 5 === 0 ? 11 : 4}`} stroke="#a7b3b3" strokeOpacity={i % 5 === 0 ? '.55' : '.30'} />)}
    <rect x="132" y="48" width="474" height="145" rx="8" fill="#12191b" stroke="#070a0c" strokeWidth="6" opacity=".85" />
    <rect x="132" y="45" width="474" height="142" rx="6" fill="#15252a" stroke="#5a6a6b" strokeWidth="1.2" />
    <rect x="143" y="55" width="451" height="121" rx="3" fill={url('matrix')} stroke="#35494b" />
    {channels.map(({ y, lensY, path }, i) => {
      const hot = i === active && i < enabled;
      return <g key={i} opacity={i < enabled ? 1 : .38}>
        <circle cx="13" cy={y} r="6.8" fill="#080e11" stroke="#869697" strokeWidth="1.2" />
        <circle cx="727" cy={y} r="6.8" fill="#080e11" stroke="#869697" strokeWidth="1.2" />
        <path d={path} fill="none" stroke="#0c1214" strokeWidth="13" strokeLinecap="round" />
        <path d={path} fill="none" stroke={hot ? '#a96843' : '#435a5b'} strokeWidth={hot ? 8 : 7} strokeLinecap="round" />
        <path d={path} fill="none" stroke={hot ? '#cb8152' : '#283b3f'} strokeWidth={hot ? 6 : 5} strokeLinecap="round" />
        <path d={path} fill="none" stroke={hot ? url('signal') : '#8ba5a2'} opacity={hot ? '.95' : '.7'} strokeWidth={hot ? 3.2 : 1.4} strokeLinecap="round" />
        <path d={path} fill="none" stroke={hot ? '#ffe6a9' : '#a5b7b9'} opacity={hot ? '.36' : '.1'} strokeWidth=".8" transform="translate(0 -2)" />
        {hot && <>
          <path className="fc-pulse" d={path} pathLength="100" fill="none" stroke="#ffcc82" strokeWidth="8" strokeLinecap="round" opacity=".65" />
          <path className="fc-pulse fc-pulse-core" d={path} pathLength="100" fill="none" stroke="#fff6da" strokeWidth="3" strokeLinecap="round" />
          <circle cx={[215, 365, 516][gate]} cy={lensY} r="5.2" fill="#ffe5a9" stroke="#ffe4b6" className="fc-gate-light" />
        </>}
      </g>;
    })}
    <rect x="132" y="45" width="474" height="142" rx="7" fill={url('window')} stroke="#7a9293" strokeOpacity=".46" />
    {[215, 365, 516].map((x, i) => (
      <g key={x} opacity={gate === i ? 1 : .42}>
        <path d={`M${x - 11} 60h22M${x - 11} 169h22M${x} 61V168`} stroke={gate === i ? '#e8a575' : '#c2d0ce'} strokeOpacity=".66" strokeWidth={gate === i ? '1.1' : '.7'} strokeDasharray="4 5" />
        <rect x={x - 4} y="35" width="8" height="8" rx="1" fill={gate === i ? '#ef9f68' : '#76898b'} />
      </g>
    ))}
    <path d="M146 56H592M147 175H591" stroke="#bfd8d2" strokeOpacity=".28" />
    <path d="M12 11h9m-9 0v9m716-9h-9m9 0v9M12 211h9m-9 0v-9m716 9h-9m9 0v-9" stroke="#9ba7a7" strokeWidth="1" />
  </svg>;
}
