import type { Faction } from '@nocturne/shared';

/**
 * Silhouettes originales (viewBox 200×240). Jetons remplacés au rendu :
 * D = ombre, P = spectre pâle, E = yeux luisants, A = accent de rareté.
 */
const wings = (path: string) => `<path fill="D" d="${path}"/><path fill="D" transform="matrix(-1 0 0 1 200 0)" d="${path}"/>`;
const eyes = (x1: number, x2: number, y: number, r = 1.8) => `<circle fill="E" cx="${x1}" cy="${y}" r="${r}"/><circle fill="E" cx="${x2}" cy="${y}" r="${r}"/>`;
const cloak = 'M48 240 Q58 170 74 138 Q84 116 100 112 Q116 116 126 138 Q142 170 152 240 Z';

export const SILHOUETTES: Record<string, string> = {
  bat: wings('M100 118 C88 98 64 86 30 92 C44 102 44 114 38 126 C54 122 66 128 72 140 C80 130 90 130 100 136 Z') +
    `<ellipse fill="D" cx="100" cy="124" rx="10" ry="16"/><path fill="D" d="M92 112 L88 96 L98 108 Z M108 112 L112 96 L102 108 Z"/>${eyes(96, 104, 118, 1.6)}`,

  skull: `<path fill="D" d="M56 240 Q60 200 70 186 Q62 170 66 150 Q72 128 96 122 L104 122 Q128 128 134 150 Q138 170 130 186 Q140 200 144 240 Z"/>
    <path fill="D" d="M70 180 L40 214 L46 218 L76 192 Z M130 180 L160 214 L154 218 L124 192 Z"/>
    <path fill="D" d="M80 118 Q78 92 100 88 Q122 92 120 118 Q116 132 100 134 Q84 132 80 118 Z"/>${eyes(92, 108, 112, 2.6)}
    <path fill="E" opacity=".7" d="M92 124 L108 124 L106 128 L94 128 Z"/>`,

  rat: `<path fill="D" d="M40 232 Q46 200 80 196 Q110 192 132 206 L150 200 Q164 198 168 210 L160 214 L162 222 Q150 230 132 228 Q100 236 60 236 Z"/>
    <circle fill="D" cx="146" cy="196" r="8"/><path fill="none" stroke="D" stroke-width="4" stroke-linecap="round" d="M42 230 Q20 220 18 196 Q16 176 34 168"/>${eyes(158, 158, 208, 1.8)}`,

  vampire: `<path fill="D" d="M26 240 Q44 168 66 134 L84 104 L100 120 L116 104 L134 134 Q156 168 174 240 Z"/>
    <path fill="D" d="M76 124 L64 86 L94 112 Z M124 124 L136 86 L106 112 Z"/>
    <circle fill="D" cx="100" cy="90" r="16"/><path fill="D" d="M84 86 Q86 66 100 64 Q114 66 116 86 L108 80 L100 88 L92 80 Z"/>${eyes(94, 106, 90)}`,

  vampiress: `<path fill="D" d="M100 100 Q78 108 74 140 L52 240 L148 240 L126 140 Q122 108 100 100 Z"/>
    <path fill="D" d="M84 90 Q80 64 100 64 Q120 64 116 90 L126 150 L114 126 L100 108 L86 126 L74 150 Z"/>
    <circle fill="D" cx="100" cy="86" r="14"/><path fill="D" d="M74 140 Q56 160 50 186 L60 184 Q66 164 80 150 Z M126 140 Q144 160 150 186 L140 184 Q134 164 120 150 Z"/>${eyes(94, 106, 86, 1.6)}`,

  gentleman: `<path fill="D" d="M100 106 Q76 110 72 140 L64 240 L136 240 L128 140 Q124 110 100 106 Z"/>
    <circle fill="D" cx="100" cy="92" r="13"/><rect fill="D" x="82" y="76" width="36" height="5" rx="2"/><rect fill="D" x="89" y="50" width="22" height="28" rx="2"/>
    <rect fill="A" opacity=".8" x="89" y="72" width="22" height="3"/><rect fill="D" x="140" y="146" width="4" height="94"/><circle fill="A" cx="142" cy="146" r="4"/>${eyes(95, 105, 94, 1.3)}`,

  batlord: wings('M100 124 C82 82 42 58 4 66 C22 84 20 104 10 124 C32 118 46 128 54 146 C64 132 78 134 86 148 Z') +
    `<path fill="D" d="M60 240 Q70 170 82 140 Q90 118 100 114 Q110 118 118 140 Q130 170 140 240 Z"/>
    <path fill="D" d="M84 96 L80 70 L92 88 Z M116 96 L120 70 L108 88 Z"/><ellipse fill="D" cx="100" cy="100" rx="15" ry="18"/>${eyes(94, 106, 98, 2.2)}
    <path fill="E" d="M96 110 L98 116 L100 110 L102 116 L104 110 Z"/>`,

  wolf: `<path fill="D" d="M56 240 Q52 190 70 164 Q78 146 90 136 L94 112 L104 90 L114 78 L132 66 L126 82 L138 88 L122 98 Q116 118 122 138 Q138 168 142 240 Z"/>
    <path fill="D" d="M102 92 L100 70 L112 84 Z M112 84 L114 64 L120 80 Z"/><path fill="D" d="M70 200 Q40 206 30 230 Q50 220 72 222 Z"/>${eyes(118, 118, 86, 2)}`,

  hound: `<path fill="D" d="M36 240 L46 192 Q48 168 70 160 L128 156 Q138 140 148 132 L154 118 L162 130 L178 138 L172 150 L156 152 Q152 170 150 192 L156 240 L144 240 L138 198 L82 198 L72 240 L58 240 L58 202 Z"/>
    <path fill="D" d="M46 172 Q24 160 20 136 Q36 152 52 160 Z"/>${eyes(164, 164, 138, 2)}`,

  antler: `<path fill="D" d="M86 240 L90 150 Q84 128 100 116 Q116 128 110 150 L114 240 Z"/>
    <ellipse fill="D" cx="100" cy="104" rx="12" ry="15"/>
    <path fill="none" stroke="D" stroke-width="4" stroke-linecap="round" d="M94 94 L82 68 L66 58 M82 68 L78 50 M88 80 L72 76 M106 94 L118 68 L134 58 M118 68 L122 50 M112 80 L128 76"/>
    <path fill="none" stroke="D" stroke-width="5" stroke-linecap="round" d="M92 132 L64 196 L58 214 M108 132 L136 196 L142 214"/>${eyes(95, 105, 104, 1.8)}`,

  hooded: `<path fill="D" d="M58 240 L74 132 Q78 90 100 70 Q122 90 126 132 L142 240 Z"/>
    <path fill="#000" opacity=".6" d="M88 112 Q100 92 112 112 Q108 124 100 126 Q92 124 88 112 Z"/>${eyes(95, 105, 112, 1.6)}
    <path fill="A" opacity=".7" d="M96 150 L104 150 L104 160 L114 160 L114 166 L104 166 L104 186 L96 186 L96 166 L86 166 L86 160 L96 160 Z"/>`,

  fishman: `<path fill="D" d="M60 240 Q62 180 78 150 Q86 128 100 124 Q120 122 126 142 Q138 172 136 240 Z"/>
    <ellipse fill="D" cx="106" cy="112" rx="20" ry="15"/><path fill="D" d="M94 102 L104 78 L116 102 Z M80 150 L56 186 L64 190 L84 166 Z"/>
    <circle fill="E" cx="98" cy="108" r="3"/><circle fill="E" cx="116" cy="108" r="3"/>`,

  siren: `<ellipse fill="D" cx="110" cy="236" rx="80" ry="14"/>
    <path fill="D" d="M100 160 Q140 178 130 208 Q124 228 160 224 L172 214 L172 236 L148 236 Q108 236 110 208 Q114 186 88 172 Z"/>
    <path fill="D" d="M88 116 Q84 140 90 168 L110 168 Q114 140 106 116 Z"/><circle fill="D" cx="96" cy="104" r="12"/>
    <path fill="D" d="M84 104 Q82 82 98 84 Q116 84 110 104 Q122 130 118 154 L104 132 Z"/>${eyes(92, 100, 104, 1.4)}`,

  tentacle: `<path fill="none" stroke="D" stroke-linecap="round" stroke-width="16" d="M50 240 Q30 190 60 160 Q80 140 66 112"/>
    <path fill="none" stroke="D" stroke-linecap="round" stroke-width="20" d="M100 240 Q110 180 90 140 Q78 112 100 84 Q114 66 108 50"/>
    <path fill="none" stroke="D" stroke-linecap="round" stroke-width="14" d="M150 240 Q170 196 142 168 Q124 150 138 124 Q146 110 160 108"/>
    <path fill="none" stroke="D" stroke-linecap="round" stroke-width="10" d="M128 240 Q132 214 118 200"/>
    <circle fill="E" cx="98" cy="140" r="3"/><circle fill="E" cx="70" cy="180" r="2"/><circle fill="E" cx="146" cy="160" r="2"/>`,

  pharaoh: `<path fill="D" d="M60 240 Q66 170 78 140 Q88 120 100 118 Q112 120 122 140 Q134 170 140 240 Z"/>
    <path fill="D" d="M74 120 L82 78 Q100 64 118 78 L126 120 L112 108 L88 108 Z"/><circle fill="D" cx="100" cy="98" r="13"/>
    <path fill="A" opacity=".85" d="M84 84 L116 84 L114 88 L86 88 Z"/><rect fill="D" x="144" y="80" width="4" height="160"/><path fill="A" d="M146 66 L154 80 L138 80 Z"/>${eyes(95, 105, 98, 1.4)}`,

  cthulhu: wings('M100 130 C88 100 60 84 30 92 C40 104 40 116 34 128 C50 126 62 132 68 144 C76 136 86 138 94 148 Z') +
    `<path fill="D" d="M50 240 Q60 176 76 148 Q86 130 100 128 Q114 130 124 148 Q140 176 150 240 Z"/>
    <ellipse fill="D" cx="100" cy="96" rx="26" ry="30"/>
    <path fill="none" stroke="D" stroke-width="5" stroke-linecap="round" d="M86 116 Q80 136 88 150 M94 120 Q92 142 98 156 M106 120 Q108 142 102 156 M114 116 Q120 136 112 150"/>${eyes(90, 110, 94, 3)}`,

  wisp: `<defs><radialGradient id="__W"><stop offset="0" stop-color="#e9fbff"/><stop offset=".4" stop-color="#7fd6ff"/><stop offset="1" stop-color="#7fd6ff" stop-opacity="0"/></radialGradient></defs>
    <circle fill="url(#__W)" cx="100" cy="130" r="54"/><path fill="#bfefff" opacity=".85" d="M100 96 Q120 120 112 146 Q106 160 100 164 Q90 156 88 140 Q86 120 100 96 Z"/>
    <circle fill="#bfefff" opacity=".5" cx="60" cy="190" r="5"/><circle fill="#bfefff" opacity=".4" cx="146" cy="170" r="4"/>`,

  ghost: `<path fill="P" opacity=".88" d="M62 240 L62 122 Q62 70 100 70 Q138 70 138 122 L138 240 L126 224 L114 240 L100 224 L86 240 L74 224 Z"/>
    <ellipse fill="#0a0612" cx="88" cy="112" rx="7" ry="10"/><ellipse fill="#0a0612" cx="112" cy="112" rx="7" ry="10"/><ellipse fill="#0a0612" cx="100" cy="140" rx="6" ry="9"/>`,

  raven: `<path fill="D" d="M20 214 L180 206 L180 212 L20 220 Z"/><path fill="D" d="M70 210 Q60 170 80 140 Q96 116 120 118 L140 110 L132 124 Q140 150 128 180 Q118 204 100 210 Z"/>
    <path fill="D" d="M70 196 L36 236 L58 232 L80 206 Z"/><circle fill="D" cx="122" cy="122" r="12"/>${eyes(126, 126, 120, 2)}`,

  banshee: `<path fill="P" opacity=".85" d="M100 80 Q130 82 132 120 L150 240 L120 210 L100 240 L80 210 L50 240 L68 120 Q70 82 100 80 Z"/>
    <path fill="P" opacity=".55" d="M78 92 Q40 80 16 110 Q44 102 70 116 Z M122 92 Q160 80 184 110 Q156 102 130 116 Z"/>
    <ellipse fill="#0a0612" cx="92" cy="108" rx="5" ry="7"/><ellipse fill="#0a0612" cx="108" cy="108" rx="5" ry="7"/><ellipse fill="#0a0612" cx="100" cy="128" rx="6" ry="10"/>`,

  mask: `<path fill="D" d="M30 240 Q50 170 74 138 Q86 118 100 116 Q114 118 126 138 Q150 170 170 240 Z"/>
    <circle fill="D" cx="100" cy="96" r="18"/><rect fill="D" x="78" y="76" width="44" height="5" rx="2"/><path fill="D" d="M86 78 Q86 56 100 56 Q114 56 114 78 Z"/>
    <path fill="P" d="M100 84 Q114 84 116 96 Q114 110 100 112 Z"/><circle fill="E" cx="108" cy="94" r="1.8"/><circle fill="E" cx="92" cy="96" r="1.4"/>`,

  rider: `<path fill="D" d="M28 240 L42 182 Q44 162 62 154 L118 150 Q128 122 138 106 L148 94 L160 98 L158 110 L168 122 L160 128 L148 122 Q144 142 142 162 L148 202 L144 240 L134 240 L134 206 L118 184 L68 186 L58 240 Z"/>
    <path fill="D" d="M84 152 L82 116 Q88 104 98 106 L104 152 Z"/><path fill="D" d="M84 112 Q58 98 30 116 Q56 120 82 132 Z"/>
    <circle fill="#ff8a2a" cx="116" cy="124" r="7"/><circle fill="#ff8a2a" opacity=".35" cx="116" cy="124" r="14"/>${eyes(153, 153, 104, 1.6)}`,

  reaper: `<path fill="D" d="M54 240 L72 130 Q76 88 100 70 Q124 88 128 130 L146 240 Z"/>
    <path fill="#000" opacity=".7" d="M88 110 Q100 90 112 110 Q108 124 100 126 Q92 124 88 110 Z"/>${eyes(95, 105, 110, 1.8)}
    <rect fill="D" x="142" y="64" width="5" height="176" transform="rotate(6 144 150)"/><path fill="A" d="M150 66 Q116 48 80 66 Q116 60 146 80 Z"/>`,

  imp: `<path fill="none" stroke="P" stroke-width="3" opacity=".7" d="M84 70 L84 110 Q50 130 50 180 Q50 236 100 236 Q150 236 150 180 Q150 130 116 110 L116 70"/>
    <rect fill="P" opacity=".6" x="80" y="62" width="40" height="10" rx="3"/><path fill="A" opacity=".35" d="M54 180 Q54 232 100 232 Q146 232 146 180 Z"/>
    <path fill="D" d="M84 230 Q80 196 92 182 L90 168 L96 174 L100 164 L104 174 L110 168 L108 182 Q120 196 116 230 Z"/>${eyes(96, 104, 186, 1.6)}`,

  gargoyle: wings('M100 140 C92 112 70 96 44 98 C52 110 50 122 44 132 C58 130 68 136 74 148 Z') +
    `<path fill="D" d="M40 240 L40 222 L160 222 L160 240 Z"/><path fill="D" d="M62 222 Q60 182 78 160 Q90 146 100 146 Q110 146 122 160 Q140 182 138 222 Z"/>
    <circle fill="D" cx="100" cy="130" r="16"/><path fill="D" d="M88 120 L80 100 L94 116 Z M112 120 L120 100 L106 116 Z"/>${eyes(94, 106, 130, 1.8)}`,

  mandrake: `<path fill="D" d="M74 240 Q78 214 70 196 Q60 176 74 156 Q86 140 100 140 Q114 140 126 156 Q140 176 130 196 Q122 214 126 240 L116 240 L110 214 L100 230 L90 214 L84 240 Z"/>
    <path fill="#2f4a1c" d="M100 142 Q86 110 64 104 Q84 122 92 142 Z M100 142 Q114 106 138 98 Q118 120 108 142 Z M100 140 Q100 108 100 90 Q106 116 104 140 Z"/>
    <ellipse fill="E" cx="100" cy="176" rx="6" ry="9"/>${eyes(92, 108, 162, 2)}`,

  stitched: `<path fill="D" d="M50 240 L58 150 Q62 122 100 116 Q138 122 142 150 L150 240 Z"/>
    <path fill="D" d="M82 108 L82 78 Q100 70 118 78 L118 108 Q110 118 100 118 Q90 118 82 108 Z"/>
    <path fill="none" stroke="A" stroke-width="1.6" d="M86 92 L114 88 M90 89 L90 95 M96 88 L96 94 M102 88 L102 93 M108 87 L108 92 M100 120 L100 160 M96 128 L104 128 M96 140 L104 140 M96 152 L104 152"/>${eyes(93, 107, 100, 1.8)}`,

  bandage: `<path fill="D" d="M100 108 Q76 112 72 140 L64 240 L136 240 L128 140 Q124 112 100 108 Z"/>
    <ellipse fill="P" cx="100" cy="92" rx="13" ry="15"/><path fill="none" stroke="#9a9fb0" stroke-width="1.4" d="M88 84 L112 88 M87 94 L113 96 M88 102 L112 100"/>
    <rect fill="D" x="80" y="74" width="40" height="5" rx="2"/><rect fill="D" x="88" y="54" width="24" height="22" rx="3"/>
    <circle fill="#0a0612" stroke="A" stroke-width="1.4" cx="94" cy="92" r="4"/><circle fill="#0a0612" stroke="A" stroke-width="1.4" cx="106" cy="92" r="4"/>`,

  golem: `<path fill="D" d="M44 240 L50 170 Q48 140 70 128 L130 128 Q152 140 150 170 L156 240 L124 240 L118 196 L82 196 L76 240 Z"/>
    <rect fill="D" x="78" y="84" width="44" height="46" rx="8"/><path fill="D" d="M50 150 L30 214 L48 218 L64 164 Z M150 150 L170 214 L152 218 L136 164 Z"/>
    <path fill="none" stroke="A" stroke-width="2" d="M90 94 L96 94 L96 100 M102 94 L110 94 M104 94 L104 100"/>${eyes(92, 108, 110, 2.2)}`,

  brute: `<path fill="D" d="M54 240 Q50 180 64 150 Q76 122 106 120 Q134 124 140 156 L150 240 Z"/>
    <path fill="D" d="M64 156 L36 220 L48 226 L74 176 Z M138 160 L160 222 L148 228 L128 178 Z"/>
    <circle fill="D" cx="106" cy="106" r="15"/><rect fill="D" x="88" y="90" width="34" height="5" rx="2" transform="rotate(-14 106 92)"/><rect fill="D" x="94" y="68" width="22" height="24" rx="2" transform="rotate(-14 106 80)"/>${eyes(101, 112, 108, 2)}`,

  frame: `<rect fill="none" stroke="A" stroke-width="10" x="46" y="56" width="108" height="150" rx="4"/><rect fill="none" stroke="D" stroke-width="4" x="40" y="50" width="120" height="162" rx="6"/>
    <rect fill="#140a10" x="52" y="62" width="96" height="138"/>
    <path fill="D" d="M100 92 Q78 96 76 124 Q76 148 90 160 L84 200 L116 200 L110 160 Q124 148 124 124 Q122 96 100 92 Z"/>
    <path fill="none" stroke="E" stroke-width="1.4" opacity=".8" d="M84 120 L94 128 M106 126 L118 116 M90 146 Q100 140 112 148"/>${eyes(92, 108, 124, 2)}`,

  harpy: wings('M100 130 C86 100 56 82 20 88 C34 100 34 112 26 126 C46 124 58 132 64 146 C74 136 86 140 92 152 Z') +
    `<path fill="D" d="M86 200 Q80 160 88 138 Q94 126 100 126 Q106 126 112 138 Q120 160 114 200 Z"/>
    <path fill="D" d="M88 200 L82 226 L90 220 L94 230 L96 202 Z M112 200 L118 226 L110 220 L106 230 L104 202 Z"/>
    <circle fill="D" cx="100" cy="114" r="12"/><path fill="D" d="M88 112 Q86 92 100 94 Q114 92 112 112 L118 136 L100 120 L82 136 Z"/>${eyes(96, 104, 114, 1.5)}`,

  serpent: `<path fill="D" d="M100 108 Q80 114 76 142 L60 240 L140 240 L124 142 Q120 114 100 108 Z"/><circle fill="D" cx="100" cy="94" r="14"/>
    <path fill="none" stroke="D" stroke-width="5" stroke-linecap="round" d="M88 86 Q74 70 80 56 Q84 50 90 54 M96 82 Q92 62 102 50 M106 84 Q118 66 128 70 Q132 74 128 78 M112 90 Q130 88 136 100 M86 94 Q70 96 64 108 M110 80 Q116 60 110 48"/>
    ${eyes(95, 105, 96, 2)}`,

  horned: `<path fill="D" d="M48 240 Q50 180 66 152 Q80 128 100 126 Q120 128 134 152 Q150 180 152 240 Z"/>
    <path fill="D" d="M76 112 Q76 86 100 82 Q124 86 124 112 Q122 130 100 134 Q78 130 76 112 Z"/>
    <path fill="D" d="M80 96 Q56 92 48 66 Q66 80 84 84 Z M120 96 Q144 92 152 66 Q134 80 116 84 Z"/>${eyes(91, 109, 106, 2.2)}<circle fill="A" cx="100" cy="124" r="3"/>`,

  witch: `<path fill="D" d="M62 240 Q60 190 72 160 Q80 134 100 128 Q114 130 120 150 Q132 180 132 240 Z"/>
    <path fill="D" d="M80 132 Q76 104 98 98 Q118 100 118 124 L128 136 L114 132 Q104 140 92 138 Z"/><path fill="D" d="M118 116 L134 122 L118 124 Z"/>
    <path fill="D" d="M120 200 L156 200 L150 236 L126 236 Z"/><rect fill="D" x="138" y="150" width="4" height="56" transform="rotate(18 140 178)"/>${eyes(106, 106, 116, 1.8)}`,

  jackalope: `<path fill="D" d="M60 240 Q54 204 74 180 Q90 162 112 168 Q126 150 132 136 Q144 128 148 140 Q152 156 140 170 Q150 196 142 240 Z"/>
    <path fill="D" d="M130 140 L126 104 L134 132 Z M140 138 L148 100 L144 134 Z"/>
    <path fill="none" stroke="D" stroke-width="3" stroke-linecap="round" d="M130 108 L120 88 M124 98 L112 94 M146 104 L156 84 M150 94 L164 92"/>
    <circle fill="D" cx="58" cy="216" r="10"/>${eyes(140, 140, 150, 1.8)}`,

  lizard: `<path fill="D" d="M70 240 Q66 196 76 166 Q84 140 100 136 Q116 140 122 162 Q130 196 126 240 Z"/>
    <path fill="D" d="M80 104 Q86 86 104 88 Q126 92 124 110 Q120 128 100 130 Q82 128 80 104 Z"/>
    <path fill="D" d="M124 220 Q160 214 176 236 L174 240 Q154 228 124 234 Z M80 160 L56 196 L64 200 L86 174 Z M118 160 L140 194 L132 198 L112 174 Z"/>${eyes(94, 112, 104, 2)}`,

  winged: wings('M100 130 C90 100 66 84 34 88 C46 100 46 112 40 124 C56 122 66 130 72 142 C80 134 88 136 94 146 Z') +
    `<path fill="D" d="M80 240 L84 200 Q78 170 88 150 Q94 138 100 138 Q110 138 116 152 Q124 172 116 200 L120 240 L108 240 L104 206 L96 206 L92 240 Z"/>
    <path fill="D" d="M88 120 Q90 100 104 98 Q120 100 118 116 L112 134 L94 134 Z"/><path fill="D" d="M94 104 L86 86 L98 100 Z M110 102 L118 84 L108 100 Z"/>
    <path fill="none" stroke="D" stroke-width="4" stroke-linecap="round" d="M110 200 Q150 210 160 236 L166 230"/>${eyes(98, 110, 112, 1.6)}`,

  nessie: `<path fill="#0b2a36" opacity=".9" d="M0 206 Q50 196 100 206 Q150 216 200 206 L200 240 L0 240 Z"/>
    <path fill="D" d="M60 210 Q70 160 96 140 Q112 128 116 108 Q118 90 132 88 Q148 88 146 102 L136 104 Q130 120 128 140 Q118 176 120 210 Z"/>
    <path fill="D" d="M134 210 Q146 186 160 210 Z M30 212 Q42 194 54 212 Z"/>${eyes(138, 138, 96, 1.8)}`,

  ape: `<path fill="D" d="M60 240 L70 200 Q58 170 66 140 Q74 112 100 108 Q130 110 136 140 Q142 170 128 200 L140 240 L122 240 L114 206 L90 206 L80 240 Z"/>
    <path fill="D" d="M68 146 L46 200 L58 206 L76 164 Z M134 146 L156 196 L144 204 L126 164 Z"/>
    <path fill="D" d="M82 104 Q82 78 102 76 Q122 78 120 104 Q116 120 100 122 Q86 120 82 104 Z"/>${eyes(94, 108, 98, 1.8)}`,

  moth: `<path fill="D" opacity=".95" d="M100 120 C80 70 30 50 6 70 C20 96 30 124 60 140 C40 156 34 186 48 206 C70 196 88 170 100 150 Z"/>
    <path fill="D" opacity=".95" transform="matrix(-1 0 0 1 200 0)" d="M100 120 C80 70 30 50 6 70 C20 96 30 124 60 140 C40 156 34 186 48 206 C70 196 88 170 100 150 Z"/>
    <path fill="none" stroke="A" stroke-width="1.2" opacity=".6" d="M100 126 C76 92 40 76 20 78 M100 140 C78 150 58 170 50 196 M100 126 C124 92 160 76 180 78 M100 140 C122 150 142 170 150 196"/>
    <path fill="D" d="M88 240 L90 150 Q94 120 100 116 Q106 120 110 150 L112 240 Z"/><ellipse fill="D" cx="100" cy="104" rx="11" ry="14"/>
    <circle fill="E" cx="94" cy="102" r="4"/><circle fill="E" cx="106" cy="102" r="4"/>`,
};

/** Décors lointains par faction. */
export const BACKDROPS: Record<Faction, string> = {
  SANG: 'M0 240 L0 196 L20 196 L20 176 L28 168 L36 176 L36 196 L56 196 L56 150 L62 140 L68 150 L68 196 L84 190 L140 190 L140 160 L146 150 L152 160 L152 186 L170 186 L170 170 L178 160 L186 170 L186 200 L200 200 L200 240 Z',
  CROC: 'M0 240 L0 200 L10 170 L20 200 L28 180 L40 140 L52 180 L60 200 L72 160 L84 200 L96 190 L120 200 L132 150 L144 200 L156 176 L168 200 L180 160 L192 200 L200 190 L200 240 Z',
  ABIME: 'M0 240 L0 210 Q25 200 50 210 Q75 220 100 210 Q125 200 150 210 Q175 220 200 210 L200 240 Z M120 210 L126 160 L132 156 L136 210 Z',
  SPECTRE: 'M0 240 L0 214 L200 210 L200 240 Z M30 214 L30 196 Q36 186 42 196 L42 214 Z M150 210 L150 188 L146 188 L146 182 L150 182 L150 176 L156 176 L156 182 L160 182 L160 188 L156 188 L156 210 Z M74 212 L74 200 Q80 192 86 200 L86 212 Z',
  ALCHIMIE: 'M0 240 L0 196 L20 196 L30 180 L40 196 L52 196 L52 170 L60 170 L60 160 L66 160 L66 196 L90 196 L100 178 L110 196 L130 196 L130 176 L148 176 L148 196 L170 196 L180 184 L190 196 L200 196 L200 240 Z',
  CRYPTIDE: 'M0 240 L0 206 L14 176 L26 206 L36 186 L48 150 L60 190 L74 206 L88 170 L100 206 L140 206 L152 176 L162 206 L176 166 L190 206 L200 196 L200 240 Z',
  MYTHE: 'M0 240 L0 206 L200 206 L200 240 Z M24 206 L24 156 L34 156 L34 206 Z M50 206 L50 168 L60 168 L60 206 Z M140 206 L140 150 L150 150 L150 206 Z M166 206 L166 172 L176 172 L176 206 Z M18 152 L66 152 L66 158 L18 158 Z',
};

export const MOON: Record<Faction, string> = {
  SANG: '#c9283c', CROC: '#efe2bd', ABIME: '#7fd0c2', SPECTRE: '#d9e4ff', ALCHIMIE: '#c8e07a', CRYPTIDE: '#c6a0ff', MYTHE: '#f0c86a',
};
