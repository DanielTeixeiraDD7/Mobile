/**
 * Préfixe chaque sélecteur du CSS d'un exercice (ex. « .ex-root .carte ») :
 * les styles de l'aperçu ne débordent pas sur l'application.
 */
export function scopeCss(css: string, scope: string): string {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let out = '';
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i);
    if (open < 0) { out += src.slice(i); break; }
    const head = src.slice(i, open).trim();
    // Fin du bloc (accolades imbriquées pour @media / @supports).
    let depth = 1, j = open + 1;
    while (j < src.length && depth) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; }
    const body = src.slice(open + 1, j - 1);
    // Directives sans bloc (@import …;) placées avant la règle.
    const semi = head.lastIndexOf(';');
    const prelude = semi >= 0 ? head.slice(0, semi + 1) + '\n' : '';
    const sel = semi >= 0 ? head.slice(semi + 1).trim() : head;
    if (/^@(media|supports|container|layer)\b/.test(sel)) out += `${prelude}${sel} {${scopeCss(body, scope)}}\n`;
    else if (sel.startsWith('@')) out += `${prelude}${sel} {${body}}\n`;
    else {
      const scoped = sel.split(',').map(x => x.trim()).filter(Boolean).map(x => {
        const m = x.match(/^(:root|html|body)\b\s*(.*)$/);
        return m ? (m[2] ? `${scope} ${m[2]}` : scope) : `${scope} ${x}`;
      }).join(', ');
      out += `${prelude}${scoped} {${body}}\n`;
    }
    i = j;
  }
  return out;
}
