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

  rat: `<g transform="translate(-20 -44) scale(1.2)"><path fill="D" d="M40 232 Q46 200 80 196 Q110 192 132 206 L150 200 Q164 198 168 210 L160 214 L162 222 Q150 230 132 228 Q100 236 60 236 Z"/>
    <circle fill="D" cx="146" cy="196" r="8"/><path fill="none" stroke="D" stroke-width="4" stroke-linecap="round" d="M42 230 Q20 220 18 196 Q16 176 34 168"/>${eyes(158, 158, 208, 1.8)}</g>`,

  vampire: `<path fill="D" d="M24 240 Q40 170 64 136 L82 112 L100 128 L118 112 L136 136 Q160 170 176 240 Z"/>
    <path fill="C" d="M58 240 Q66 180 80 146 L100 132 L120 146 Q134 180 142 240 Z"/>
    <path fill="D2" d="M74 240 L80 150 Q88 136 100 134 Q112 136 120 150 L126 240 Z"/>
    <path fill="#d9d0d6" d="M92 136 L100 162 L108 136 Z"/><circle fill="A" cx="100" cy="166" r="3.2"/>
    <path fill="D" d="M76 128 L60 82 L94 114 Z M124 128 L140 82 L106 114 Z"/><path fill="C" d="M78 122 L67 92 L90 115 Z M122 122 L133 92 L110 115 Z"/>
    <rect fill="SS" x="95" y="104" width="10" height="14"/>
    <path fill="S" d="M86 90 Q86 72 100 70 Q114 72 114 90 Q112 106 100 112 Q88 106 86 90 Z"/><path fill="SS" opacity=".7" d="M100 112 Q88 106 86 90 Q86 80 91 74 Q90 98 100 112 Z"/>
    <path fill="H" d="M84 90 Q80 62 100 58 Q120 62 116 90 L113 78 Q106 72 100 82 Q94 72 87 78 Z"/>
    <path fill="E" d="M89 90 L96 89 L95 92.5 Z M104 89 L111 90 L105 92.5 Z"/><path stroke="H" stroke-width="1.4" d="M88 86 L96 87.5 M104 87.5 L112 86"/>
    <path stroke="#5a1a22" stroke-width="1" d="M95 101 L105 101"/><path fill="#fff" d="M96.5 101 L97.5 104.5 L98.5 101 Z M101.5 101 L102.5 104.5 L103.5 101 Z"/>
    <path fill="none" stroke="L" stroke-width=".9" opacity=".5" d="M46 220 Q56 180 70 152 M154 220 Q144 180 130 152 M84 236 L86 168 M116 236 L114 168"/>`,

  vampiress: `<path fill="H" d="M80 84 Q76 56 100 54 Q124 56 120 84 L132 166 Q118 156 112 132 L100 120 L88 132 Q82 156 68 166 Z"/>
    <path fill="D2" d="M100 112 Q80 118 78 146 L52 240 L148 240 L122 146 Q120 118 100 112 Z"/>
    <path fill="C" d="M86 122 Q100 132 114 122 L116 152 Q100 158 84 152 Z"/>
    <path fill="D" d="M78 134 Q62 162 56 192 L66 194 Q72 166 86 148 Z M122 134 Q138 162 144 192 L134 194 Q128 166 114 148 Z"/>
    <circle fill="S" cx="61" cy="196" r="4.5"/><circle fill="S" cx="139" cy="196" r="4.5"/>
    <path fill="S" d="M82 120 Q100 110 118 120 L116 126 Q100 118 84 126 Z"/><path fill="SS" d="M97 98 L103 98 L104 116 L96 116 Z"/>
    <path fill="S" d="M88 82 Q88 66 100 64 Q112 66 112 82 Q110 96 100 100 Q90 96 88 82 Z"/><path fill="SS" opacity=".7" d="M100 100 Q90 96 88 82 Q88 72 92 68 Q91 90 100 100 Z"/>
    <path fill="H" d="M85 84 Q84 60 100 58 Q116 60 115 84 Q109 70 100 68 Q91 70 85 84 Z M86 78 Q80 102 82 124 L89 100 Z M114 78 Q120 102 118 124 L111 100 Z"/>
    <path fill="E" d="M91.5 83 L97 82 L96 85.5 Z M103 82 L108.5 83 L104 85.5 Z"/><path stroke="H" stroke-width="1" d="M91 81 L97 80.5 M103 80.5 L109 81"/>
    <path fill="#b0142e" d="M96.5 92 Q100 94.5 103.5 92 Q100 90.8 96.5 92 Z"/><circle fill="A" cx="100" cy="128" r="3"/>
    <path fill="none" stroke="L" stroke-width=".9" opacity=".45" d="M70 236 Q80 196 90 160 M130 236 Q120 196 110 160 M100 238 L100 160"/>`,

  gentleman: `<path fill="D2" d="M100 106 Q74 110 70 142 L64 240 L136 240 L130 142 Q126 110 100 106 Z"/>
    <path fill="#d9d0d6" d="M93 108 L100 136 L107 108 Z"/><path fill="C" d="M97 110 L100 124 L103 110 Z"/>
    <path fill="D" d="M88 110 L100 152 L82 142 L80 116 Z M112 110 L100 152 L118 142 L120 116 Z"/>
    <circle fill="A" cx="100" cy="164" r="1.8"/><circle fill="A" cx="100" cy="178" r="1.8"/>
    <rect fill="SS" x="96" y="96" width="8" height="12"/>
    <path fill="S" d="M89 84 Q89 70 100 68 Q111 70 111 84 Q110 97 100 100 Q90 97 89 84 Z"/><path fill="SS" opacity=".7" d="M100 100 Q90 97 89 84 Q89 76 93 71 Q92 90 100 100 Z"/>
    <path fill="H" d="M88 84 Q86 72 92 70 L108 70 Q114 72 112 84 Q108 76 100 76 Q92 76 88 84 Z"/>
    <rect fill="D" x="81" y="66" width="38" height="5" rx="2"/><rect fill="D" x="88" y="40" width="24" height="28" rx="2"/><rect fill="C" x="88" y="61" width="24" height="4"/>
    <path fill="E" d="M92 84 L97 83.5 L96 86 Z M103 83.5 L108 84 L104 86 Z"/><path stroke="#4a2a30" stroke-width=".9" d="M96 93 L104 93"/>
    <rect fill="D" x="142" y="140" width="4" height="100"/><circle fill="A" cx="144" cy="140" r="4.5"/><circle fill="S" cx="140" cy="150" r="5"/>
    <path fill="none" stroke="L" stroke-width=".9" opacity=".45" d="M76 236 L80 150 M124 236 L120 150 M100 236 L100 190"/>`,

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

  hooded: `<path fill="D" d="M56 240 L72 132 Q76 88 100 68 Q124 88 128 132 L144 240 Z"/>
    <path fill="C" opacity=".8" d="M66 240 L78 150 Q100 162 122 150 L134 240 Z"/>
    <path fill="#000" opacity=".8" d="M86 114 Q88 90 100 86 Q112 90 114 114 Q110 128 100 130 Q90 128 86 114 Z"/>
    <path fill="SS" opacity=".5" d="M92 114 Q94 100 100 98 Q106 100 108 114 Q105 124 100 125 Q95 124 92 114 Z"/>
    <path fill="E" d="M93 110 L98 109.5 L97 112 Z M102 109.5 L107 110 L103 112 Z"/>
    <path fill="A" d="M95 172 L105 172 L105 184 L116 184 L116 191 L105 191 L105 214 L95 214 L95 191 L84 191 L84 184 L95 184 Z" opacity=".85"/>
    <circle fill="S" cx="88" cy="196" r="4.5"/><circle fill="S" cx="112" cy="196" r="4.5"/>
    <path fill="none" stroke="L" stroke-width=".9" opacity=".45" d="M70 236 L82 150 M130 236 L118 150"/>`,

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

  pharaoh: `<path fill="D2" d="M60 240 Q66 170 78 140 Q88 120 100 118 Q112 120 122 140 Q134 170 140 240 Z"/>
    <path fill="A" opacity=".9" d="M80 128 Q100 140 120 128 L122 138 Q100 152 78 138 Z"/><path fill="C" d="M96 150 L104 150 L104 240 L96 240 Z"/>
    <path fill="#c9a24a" d="M74 120 L82 76 Q100 62 118 76 L126 120 L112 108 L88 108 Z"/>
    <path fill="none" stroke="#5a4214" stroke-width="2" d="M80 90 L120 90 M78 100 L122 100 M77 110 L88 108 M123 110 L112 108"/>
    <path fill="#3a2a3a" d="M88 86 Q88 76 100 74 Q112 76 112 86 Q111 100 100 104 Q89 100 88 86 Z"/>
    <path fill="E" d="M91 87 L97 86 L96 89 Z M103 86 L109 87 L104 89 Z"/><path stroke="E" stroke-width=".7" opacity=".7" d="M96 89 L95 93 M104 89 L105 93"/>
    <path fill="#c9a24a" d="M97 104 L103 104 L101 114 L99 114 Z"/>
    <rect fill="#c9a24a" x="144" y="80" width="4" height="160"/><path fill="A" d="M146 62 L156 80 L136 80 Z"/><circle fill="E" cx="146" cy="74" r="2"/>`,

  cthulhu: wings('M100 130 C88 100 60 84 30 92 C40 104 40 116 34 128 C50 126 62 132 68 144 C76 136 86 138 94 148 Z') +
    `<path fill="D" d="M50 240 Q60 176 76 148 Q86 130 100 128 Q114 130 124 148 Q140 176 150 240 Z"/>
    <ellipse fill="D" cx="100" cy="96" rx="26" ry="30"/>
    <path fill="none" stroke="#3a2a48" stroke-width="5.5" stroke-linecap="round" d="M84 114 Q76 136 86 152 Q90 158 84 162 M93 120 Q90 144 98 160 M107 120 Q110 144 102 160 M116 114 Q124 136 114 152 Q110 158 116 162"/>
    <path fill="none" stroke="L" stroke-width=".8" opacity=".5" d="M86 116 Q79 136 88 151 M95 122 Q93 144 99 158 M114 116 Q121 136 112 151"/>
    <path fill="none" stroke="L" stroke-width="1" opacity=".35" d="M78 84 Q100 70 122 84 M76 98 Q100 88 124 98"/>${eyes(90, 110, 94, 3)}`,

  wisp: `<defs><radialGradient id="__W"><stop offset="0" stop-color="#e9fbff"/><stop offset=".4" stop-color="#7fd6ff"/><stop offset="1" stop-color="#7fd6ff" stop-opacity="0"/></radialGradient></defs>
    <circle fill="url(#__W)" cx="100" cy="130" r="54"/><path fill="#bfefff" opacity=".85" d="M100 96 Q120 120 112 146 Q106 160 100 164 Q90 156 88 140 Q86 120 100 96 Z"/>
    <circle fill="#bfefff" opacity=".5" cx="60" cy="190" r="5"/><circle fill="#bfefff" opacity=".4" cx="146" cy="170" r="4"/>`,

  sheet: `<path fill="P" opacity=".88" d="M62 240 L62 122 Q62 70 100 70 Q138 70 138 122 L138 240 L126 224 L114 240 L100 224 L86 240 L74 224 Z"/>
    <path fill="none" stroke="#9aa6c8" stroke-width="1" opacity=".6" d="M72 130 Q76 180 70 220 M128 130 Q124 180 130 220 M100 160 Q104 196 100 224"/>
    <ellipse fill="#0a0612" cx="88" cy="112" rx="7" ry="10"/><ellipse fill="#0a0612" cx="112" cy="112" rx="7" ry="10"/><ellipse fill="#0a0612" cx="100" cy="140" rx="6" ry="9"/>`,
  ghost: `<g opacity=".9">
    <path fill="P" opacity=".35" d="M100 96 Q66 100 58 150 Q48 200 30 240 L170 240 Q152 200 142 150 Q134 100 100 96 Z"/>
    <path fill="P" opacity=".75" d="M100 104 Q78 110 74 150 Q70 196 58 240 L142 240 Q130 196 126 150 Q122 110 100 104 Z"/>
    <path fill="none" stroke="#fff" stroke-width=".9" opacity=".7" d="M84 140 Q80 190 70 236 M100 130 Q98 190 100 238 M116 140 Q120 190 130 236"/>
    <path fill="#dfe6ff" d="M88 86 Q88 70 100 68 Q112 70 112 86 Q110 100 100 104 Q90 100 88 86 Z"/>
    <path fill="#c4cde8" opacity=".8" d="M100 104 Q90 100 88 86 Q88 76 92 71 Q91 92 100 104 Z"/>
    <path fill="#1a1426" d="M86 88 Q82 60 100 58 Q118 60 114 88 Q122 120 136 150 Q122 140 114 120 L110 100 Q112 80 100 74 Q88 80 90 100 L86 120 Q78 140 64 150 Q78 120 86 88 Z"/>
    <path fill="none" stroke="#1a1426" stroke-width="2.2" stroke-linecap="round" d="M88 96 Q72 130 50 140 M112 96 Q128 130 150 140"/>
    <ellipse fill="#0a0612" cx="94.5" cy="86" rx="2.6" ry="3.2"/><ellipse fill="#0a0612" cx="105.5" cy="86" rx="2.6" ry="3.2"/>
    <circle fill="E" cx="94.5" cy="86.5" r=".9"/><circle fill="E" cx="105.5" cy="86.5" r=".9"/>
    <path fill="none" stroke="#7a86a8" stroke-width=".9" d="M97 96 Q100 98 103 96"/>
    <path fill="P" opacity=".75" d="M76 150 Q60 170 56 196 L64 196 Q68 174 82 160 Z M124 150 Q140 170 144 196 L136 196 Q132 174 118 160 Z"/>
  </g>`,

  raven: `<path fill="D" d="M20 214 L180 206 L180 212 L20 220 Z"/><path fill="D" d="M70 210 Q60 170 80 140 Q96 116 120 118 L140 110 L132 124 Q140 150 128 180 Q118 204 100 210 Z"/>
    <path fill="D" d="M70 196 L36 236 L58 232 L80 206 Z"/><circle fill="D" cx="122" cy="122" r="12"/>${eyes(126, 126, 120, 2)}`,

  banshee: `<path fill="P" opacity=".85" d="M100 80 Q130 82 132 120 L150 240 L120 210 L100 240 L80 210 L50 240 L68 120 Q70 82 100 80 Z"/>
    <path fill="P" opacity=".55" d="M78 92 Q40 80 16 110 Q44 102 70 116 Z M122 92 Q160 80 184 110 Q156 102 130 116 Z"/>
    <ellipse fill="#0a0612" cx="92" cy="108" rx="5" ry="7"/><ellipse fill="#0a0612" cx="108" cy="108" rx="5" ry="7"/><ellipse fill="#0a0612" cx="100" cy="128" rx="6" ry="10"/>`,

  mask: `<path fill="D" d="M26 240 Q48 170 72 138 Q86 118 100 116 Q114 118 128 138 Q152 170 174 240 Z"/>
    <path fill="C" d="M60 240 Q70 186 84 152 L100 138 L116 152 Q130 186 140 240 Z"/>
    <path fill="D2" d="M78 240 L84 156 Q92 142 100 140 Q108 142 116 156 L122 240 Z"/><path fill="#d9d0d6" d="M93 142 L100 168 L107 142 Z"/>
    <rect fill="SS" x="95" y="106" width="10" height="14"/>
    <path fill="S" d="M86 92 Q86 74 100 72 Q114 74 114 92 Q112 108 100 114 Q88 108 86 92 Z"/><path fill="SS" opacity=".7" d="M100 114 Q88 108 86 92 Q86 82 91 76 Q90 100 100 114 Z"/>
    <path fill="H" d="M84 92 Q80 66 100 62 Q120 66 116 92 Q114 76 100 74 Q88 76 84 92 Z"/>
    <rect fill="D" x="76" y="62" width="48" height="5" rx="2"/><path fill="D" d="M84 64 Q84 42 100 42 Q116 42 116 64 Z"/><rect fill="C" x="84" y="58" width="32" height="4"/>
    <path fill="#f2eef0" d="M100 78 Q114 78 115 92 Q113 106 100 110 Z"/><path fill="#0a0612" d="M104 89 L111 88 L109 92 Z"/>
    <path fill="E" d="M90 90 L96 89 L95 92 Z"/><path stroke="#5a1a22" stroke-width=".9" d="M93 102 L100 101"/>
    <path fill="none" stroke="L" stroke-width=".9" opacity=".45" d="M44 220 Q56 180 70 152 M156 220 Q144 180 130 152"/>`,

  rider: `<path fill="D" d="M28 240 L42 182 Q44 162 62 154 L118 150 Q128 122 138 106 L148 94 L160 98 L158 110 L168 122 L160 128 L148 122 Q144 142 142 162 L148 202 L144 240 L134 240 L134 206 L118 184 L68 186 L58 240 Z"/>
    <path fill="D" d="M84 152 L82 116 Q88 104 98 106 L104 152 Z"/><path fill="D" d="M84 112 Q58 98 30 116 Q56 120 82 132 Z"/>
    <circle fill="#ff8a2a" cx="116" cy="124" r="7"/><circle fill="#ff8a2a" opacity=".35" cx="116" cy="124" r="14"/>${eyes(153, 153, 104, 1.6)}`,

  reaper: `<path fill="D" d="M52 240 L70 130 Q74 86 100 68 Q126 86 130 130 L148 240 Z"/>
    <path fill="#000" opacity=".75" d="M84 112 Q86 88 100 84 Q114 88 116 112 Q112 128 100 130 Q88 128 84 112 Z"/>
    <path fill="#d8d0c8" d="M90 108 Q90 94 100 92 Q110 94 110 108 Q108 118 104 120 L96 120 Q92 118 90 108 Z"/>
    <circle fill="#0a0612" cx="95.5" cy="106" r="3.2"/><circle fill="#0a0612" cx="104.5" cy="106" r="3.2"/><circle fill="E" cx="95.5" cy="106" r="1.2"/><circle fill="E" cx="104.5" cy="106" r="1.2"/>
    <path fill="#0a0612" d="M98.5 111 L100 114 L101.5 111 Z"/><path stroke="#0a0612" stroke-width=".7" d="M96 118 L96 120 M98 118 L98 120.5 M100 118 L100 120.5 M102 118 L102 120.5 M104 118 L104 120"/>
    <path fill="none" stroke="L" stroke-width=".9" opacity=".45" d="M66 236 L80 150 M134 236 L120 150 M100 238 L100 150"/>
    <rect fill="#4a3424" x="142" y="62" width="5" height="178" transform="rotate(6 144 150)"/><path fill="#cfd4dc" d="M152 64 Q114 44 74 64 Q114 58 148 80 Z"/><path fill="none" stroke="#fff" stroke-width=".8" opacity=".7" d="M148 66 Q116 52 82 63"/>
    <path fill="#d8d0c8" d="M128 150 Q134 146 140 150 L140 156 Q134 158 128 156 Z"/>`,

  imp: `<path fill="none" stroke="P" stroke-width="3" opacity=".7" d="M84 70 L84 110 Q50 130 50 180 Q50 236 100 236 Q150 236 150 180 Q150 130 116 110 L116 70"/>
    <rect fill="P" opacity=".6" x="80" y="62" width="40" height="10" rx="3"/><path fill="A" opacity=".35" d="M54 180 Q54 232 100 232 Q146 232 146 180 Z"/>
    <path fill="D" d="M84 230 Q80 196 92 182 L90 168 L96 174 L100 164 L104 174 L110 168 L108 182 Q120 196 116 230 Z"/>${eyes(96, 104, 186, 1.6)}`,

  gargoyle: wings('M100 140 C92 112 70 96 44 98 C52 110 50 122 44 132 C58 130 68 136 74 148 Z') +
    `<path fill="D" d="M40 240 L40 222 L160 222 L160 240 Z"/><path fill="D" d="M62 222 Q60 182 78 160 Q90 146 100 146 Q110 146 122 160 Q140 182 138 222 Z"/>
    <circle fill="D" cx="100" cy="130" r="16"/><path fill="D" d="M88 120 L80 100 L94 116 Z M112 120 L120 100 L106 116 Z"/>${eyes(94, 106, 130, 1.8)}`,

  mandrake: `<path fill="D" d="M74 240 Q78 214 70 196 Q60 176 74 156 Q86 140 100 140 Q114 140 126 156 Q140 176 130 196 Q122 214 126 240 L116 240 L110 214 L100 230 L90 214 L84 240 Z"/>
    <path fill="#2f4a1c" d="M100 142 Q86 110 64 104 Q84 122 92 142 Z M100 142 Q114 106 138 98 Q118 120 108 142 Z M100 140 Q100 108 100 90 Q106 116 104 140 Z"/>
    <ellipse fill="E" cx="100" cy="176" rx="6" ry="9"/>${eyes(92, 108, 162, 2)}`,

  stitched: `<path fill="D2" d="M48 240 L56 150 Q60 120 100 114 Q140 120 144 150 L152 240 Z"/>
    <path fill="D" d="M56 150 L40 222 L54 226 L66 170 Z M144 150 L160 222 L146 226 L134 170 Z"/>
    <circle fill="S2" cx="47" cy="228" r="7"/><circle fill="S2" cx="153" cy="228" r="7"/>
    <path fill="D" d="M80 118 L100 150 L120 118 L112 116 L100 132 L88 116 Z"/>
    <rect fill="S2" x="92" y="100" width="16" height="16"/>
    <path fill="S2" d="M82 102 L82 74 Q100 64 118 74 L118 102 Q110 114 100 114 Q90 114 82 102 Z"/><path fill="#6f7f6a" opacity=".8" d="M100 114 Q90 114 82 102 L82 74 Q86 70 90 69 Q88 100 100 114 Z"/>
    <path fill="H" d="M80 82 Q78 62 100 60 Q122 62 120 82 L114 72 L108 78 L100 70 L92 78 L86 72 Z"/>
    <path fill="E" d="M88 90 L96 89 L95 92.5 Z M104 89 L112 90 L105 92.5 Z"/><path stroke="H" stroke-width="1.8" d="M87 86 L97 85 M103 85 L113 86"/>
    <path fill="none" stroke="#2a1a20" stroke-width="1.1" d="M85 80 L116 76 M89 77.5 L89 82 M95 77 L95 81.5 M101 76.5 L101 81 M107 76 L107 80.5 M113 75.5 L113 80 M94 104 L106 104 M100 120 L100 160 M96 128 L104 128 M96 140 L104 140 M96 152 L104 152"/>
    <path fill="none" stroke="L" stroke-width=".9" opacity=".45" d="M62 236 L66 160 M138 236 L134 160"/>`,

  bandage: `<path fill="D2" d="M100 108 Q74 112 70 142 L64 240 L136 240 L130 142 Q126 112 100 108 Z"/>
    <path fill="D" d="M88 112 L100 150 L82 142 L80 118 Z M112 112 L100 150 L118 142 L120 118 Z"/><path fill="C" d="M96 112 L100 128 L104 112 Z"/>
    <path fill="#e6e0d8" d="M87 92 Q87 74 100 72 Q113 74 113 92 Q112 106 100 110 Q88 106 87 92 Z"/>
    <path fill="none" stroke="#a49a92" stroke-width="1.3" d="M87 80 L113 84 M87 88 L113 90 M88 96 L112 98 M89 103 L111 104 M90 76 L110 74"/>
    <rect fill="D" x="80" y="70" width="40" height="5" rx="2"/><rect fill="D" x="88" y="48" width="24" height="24" rx="3"/><rect fill="C" x="88" y="66" width="24" height="3"/>
    <circle fill="#0a0612" stroke="A" stroke-width="1.6" cx="94" cy="90" r="4.5"/><circle fill="#0a0612" stroke="A" stroke-width="1.6" cx="106" cy="90" r="4.5"/><path stroke="A" stroke-width="1.2" d="M98.5 90 L101.5 90"/>
    <circle fill="#fff" opacity=".7" cx="92.5" cy="88.5" r="1"/><circle fill="#fff" opacity=".7" cx="104.5" cy="88.5" r="1"/>
    <path fill="#e6e0d8" d="M64 210 L70 196 L76 212 Z M136 210 L130 196 L124 212 Z"/>`,

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

  serpent: `<path fill="D2" d="M100 112 Q80 118 76 146 L60 240 L140 240 L124 146 Q120 118 100 112 Z"/>
    <path fill="C" d="M86 124 Q100 134 114 124 L116 150 Q100 156 84 150 Z"/><circle fill="A" cx="100" cy="132" r="3"/>
    <path fill="S2" d="M82 122 Q100 112 118 122 L116 128 Q100 120 84 128 Z"/><rect fill="#6f8a6a" x="96" y="100" width="8" height="14"/>
    <path fill="S2" d="M88 86 Q88 70 100 68 Q112 70 112 86 Q110 100 100 104 Q90 100 88 86 Z"/><path fill="#6f8a6a" opacity=".8" d="M100 104 Q90 100 88 86 Q88 76 92 72 Q91 94 100 104 Z"/>
    <g fill="none" stroke="#1d3a22" stroke-width="5" stroke-linecap="round">
      <path d="M88 80 Q70 70 74 52 Q78 44 86 48"/><path d="M94 72 Q88 52 98 40"/><path d="M106 72 Q118 54 130 58 Q134 64 128 68"/>
      <path d="M112 82 Q132 80 138 94"/><path d="M88 88 Q68 92 62 106"/><path d="M104 70 Q108 50 102 38"/></g>
    <g fill="none" stroke="#4f8a46" stroke-width="1.6" stroke-linecap="round" opacity=".9">
      <path d="M88 80 Q70 70 74 52 Q78 44 86 48"/><path d="M94 72 Q88 52 98 40"/><path d="M106 72 Q118 54 130 58 Q134 64 128 68"/>
      <path d="M112 82 Q132 80 138 94"/><path d="M88 88 Q68 92 62 106"/><path d="M104 70 Q108 50 102 38"/></g>
    <circle fill="E" cx="86" cy="48" r="1.4"/><circle fill="E" cx="98" cy="40" r="1.4"/><circle fill="E" cx="128" cy="68" r="1.4"/>
    <path fill="E" d="M91.5 86 L97 85 L96 88.5 Z M103 85 L108.5 86 L104 88.5 Z"/><path fill="#6a1a2a" d="M97 95 Q100 97 103 95 Q100 94 97 95 Z"/>
    <path fill="none" stroke="L" stroke-width=".9" opacity=".45" d="M70 236 L80 160 M130 236 L120 160"/>`,

  horned: `<path fill="D" d="M48 240 Q50 180 66 152 Q80 128 100 126 Q120 128 134 152 Q150 180 152 240 Z"/>
    <path fill="D" d="M76 112 Q76 86 100 82 Q124 86 124 112 Q122 130 100 134 Q78 130 76 112 Z"/>
    <path fill="D" d="M80 96 Q56 92 48 66 Q66 80 84 84 Z M120 96 Q144 92 152 66 Q134 80 116 84 Z"/>${eyes(91, 109, 106, 2.2)}<circle fill="A" cx="100" cy="124" r="3"/>`,

  witch: `<path fill="D2" d="M58 240 Q56 190 70 158 Q80 132 100 126 Q118 130 124 152 Q136 184 136 240 Z"/>
    <path fill="C" d="M70 136 Q100 118 124 140 L122 156 Q100 140 72 152 Z"/>
    <path fill="SS" d="M86 126 Q82 104 98 98 Q116 100 116 120 Q112 132 100 134 Q90 134 86 126 Z"/>
    <path fill="S" d="M92 124 Q90 106 100 102 Q112 104 114 118 Q110 128 100 130 Z"/>
    <path fill="SS" d="M112 114 L126 120 L112 122 Z"/><path fill="none" stroke="#5a4a4a" stroke-width=".8" d="M96 112 Q100 114 104 112 M98 124 Q104 126 108 122"/>
    <path fill="C" d="M80 120 Q80 92 100 90 Q122 92 120 116 L126 132 Q114 108 100 108 Q90 108 84 130 Z"/>
    <path fill="E" d="M101 113 L106 112.5 L105 115 Z"/>
    <path fill="D" d="M118 200 L156 200 L150 238 L124 238 Z"/><path fill="none" stroke="L" stroke-width=".8" opacity=".5" d="M122 210 L152 210 M124 222 L150 222"/>
    <rect fill="#5a3a24" x="136" y="150" width="4" height="56" transform="rotate(18 138 178)"/><circle fill="S" cx="126" cy="168" r="5"/>`,

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

/** Détails d'encrage (lumière lunaire L) ajoutés aux créatures. */
const ink = (d: string, w = 0.9, o = 0.55) => `<path fill="none" stroke="L" stroke-width="${w}" stroke-linecap="round" opacity="${o}" d="${d}"/>`;

export const DETAILS: Record<string, string> = {
  bat: ink('M84 118 L64 92 M84 118 L50 104 M84 124 L60 118 M116 118 L136 92 M116 118 L150 104 M116 124 L140 118') + ink('M96 116 Q100 120 104 116', 1.2, .8),
  batlord: ink('M84 124 L60 70 M84 124 L28 82 M84 128 L26 112 M116 124 L140 70 M116 124 L172 82 M116 128 L174 112') +
    ink('M84 160 Q92 200 88 236 M116 160 Q108 200 112 236 M92 140 Q100 150 108 140') + `<path fill="C" opacity=".85" d="M70 240 Q78 186 88 152 L100 146 L112 152 Q122 186 130 240 Z"/>`,
  wolf: ink('M70 200 Q74 180 84 168 M78 220 Q82 196 92 182 M120 190 Q126 172 122 150 M130 214 Q134 190 128 170 M104 96 L116 92 M100 112 Q108 116 118 112', 1, .6) +
    `<path fill="#fff" d="M126 92 L128 97 L130 92 Z M131 90 L132.5 95 L134 90 Z"/>`,
  hound: ink('M60 186 Q80 178 100 182 M84 168 Q104 164 124 168 M150 140 Q158 144 166 140 M50 200 L54 236 M150 200 L152 236', 1, .55) + `<path fill="#fff" d="M168 144 L169 148 L171 144 Z"/>`,
  antler: ink('M94 140 L106 140 M93 150 L107 150 M94 160 L106 160 M95 170 L105 170', 1.2, .6),
  fishman: ink('M80 170 Q90 176 100 170 Q110 176 120 170 M78 190 Q90 196 100 190 Q110 196 122 190 M76 210 Q90 216 100 210 Q110 216 124 210', .9, .55) + `<path fill="none" stroke="L" stroke-width=".8" opacity=".6" d="M118 114 L124 116 M118 118 L124 120"/>`,
  tentacle: `<g fill="L" opacity=".55"><circle cx="58" cy="168" r="2"/><circle cx="64" cy="152" r="1.8"/><circle cx="70" cy="132" r="1.5"/><circle cx="92" cy="150" r="2.4"/><circle cx="88" cy="126" r="2.2"/><circle cx="98" cy="100" r="2"/><circle cx="104" cy="76" r="1.6"/><circle cx="140" cy="178" r="2"/><circle cx="134" cy="150" r="1.8"/><circle cx="142" cy="124" r="1.5"/></g>`,
  cthulhu: ink('M84 130 L60 96 M84 130 L40 110 M84 136 L44 128 M116 130 L140 96 M116 130 L160 110 M116 136 L156 128') + ink('M84 76 Q100 66 116 76 M80 90 Q100 82 120 90', 1.1, .5) + ink('M70 200 Q80 170 92 154 M130 200 Q120 170 108 154'),
  wisp: '',
  raven: ink('M84 150 Q100 140 116 146 M80 166 Q98 158 114 164 M82 182 Q96 176 108 180', .9, .6) + `<path fill="#3a3a44" d="M140 110 L150 116 L138 120 Z"/>`,
  rider: ink('M70 170 Q90 166 110 168 M120 150 Q128 126 140 110 M44 190 L48 236 M144 206 L146 236', 1, .55),
  imp: '',
  gargoyle: ink('M84 140 L70 108 M84 140 L54 120 M116 140 L130 108 M116 140 L146 120') + ink('M72 200 L128 200 M76 186 L124 186', 1, .4),
  mandrake: ink('M80 180 Q90 186 96 200 M120 180 Q110 186 104 200 M86 160 Q100 170 114 160', 1, .5),
  golem: ink('M60 150 L80 160 M140 150 L120 160 M70 180 L90 176 M130 180 L110 176 M100 140 L100 190 M80 140 L120 140', 1.2, .5) + `<path fill="A" opacity=".8" d="M92 94 L96 94 L96 100 L92 100 Z M104 94 L108 94 L108 100 L104 100 Z"/>`,
  brute: ink('M70 170 Q90 160 112 166 M66 200 Q90 190 120 196 M100 118 Q108 124 116 118', 1, .55) + `<path fill="C" d="M96 132 L104 132 L100 150 Z"/>`,
  frame: '',
  harpy: ink('M84 130 L60 98 M84 130 L40 106 M84 134 L44 124 M116 130 L140 98 M116 130 L160 106 M116 134 L156 124'),
  horned: ink('M70 170 Q100 158 130 170 M64 200 Q100 188 136 200 M90 120 Q100 126 110 120', 1, .5) + `<path fill="#d8d0c8" d="M93 118 L95 124 L97 118 Z M103 118 L105 124 L107 118 Z"/>`,
  jackalope: ink('M80 196 Q96 186 112 190 M86 214 Q100 206 116 210', .9, .5),
  lizard: ink('M84 170 L116 170 M82 186 L118 186 M82 202 L118 202 M84 218 L116 218 M96 110 L104 110', .9, .55),
  winged: ink('M84 130 L66 96 M84 130 L48 108 M116 130 L134 96 M116 130 L152 108'),
  nessie: ink('M100 150 Q108 130 116 112 M60 220 Q100 214 140 220', 1, .5),
  ape: ink('M74 150 Q80 140 86 150 M114 150 Q120 140 126 150 M76 176 Q82 166 88 176 M112 176 Q118 166 124 176 M90 110 Q100 118 110 110', 1, .5),
  moth: `<circle fill="L" opacity=".35" cx="44" cy="100" r="9"/><circle fill="L" opacity=".35" cx="156" cy="100" r="9"/><circle fill="E" opacity=".5" cx="44" cy="100" r="3"/><circle fill="E" opacity=".5" cx="156" cy="100" r="3"/>`,
  rat: ink('M70 214 Q90 206 110 210 M140 200 L150 196', .9, .55),
  skull: ink('M76 160 L124 160 M74 172 L126 172 M76 184 L124 184 M100 136 L100 200', 1, .5),
  siren: ink('M110 190 Q120 200 116 212 M120 214 Q132 222 150 222', .9, .55) + `<path fill="S" d="M90 98 Q90 92 96 92 Q102 92 102 98 Q100 106 96 108 Q92 106 90 98 Z"/>`,
  ghost: '',
  banshee: `<path fill="none" stroke="#b8c4e8" stroke-width=".8" opacity=".6" d="M80 100 Q60 130 62 170 M120 100 Q140 130 138 170 M90 92 Q84 120 86 150 M110 92 Q116 120 114 150"/>`,
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
