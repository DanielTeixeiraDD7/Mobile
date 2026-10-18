/** Coloration syntaxique légère (Vue, JS, SQL) pour les blocs de code des leçons. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const JS_KW = new Set(['const', 'let', 'var', 'function', 'return', 'if', 'else', 'async', 'await', 'import', 'from', 'export', 'default', 'new', 'try', 'catch', 'finally', 'for', 'of', 'in', 'while', 'true', 'false', 'null', 'undefined', 'this', 'typeof']);
const SQL_KW = new Set(['SELECT', 'FROM', 'WHERE', 'BEGIN', 'END', 'DECLARE', 'EXCEPTION', 'WHEN', 'THEN', 'OTHERS', 'LOOP', 'EXIT', 'CREATE', 'VIEW', 'AS', 'PROCEDURE', 'FUNCTION', 'IN', 'OUT', 'DEFAULT', 'NUMBER', 'BOOLEAN', 'VARCHAR2', 'INTO', 'LIKE', 'LOWER', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'RETURN', 'TRUE', 'FALSE']);

const TOKEN = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|<!--[\s\S]*?-->|--[^\n]*)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w-]*|\/?>)|([@:#]?[a-zA-Z_][\w.:-]*(?==))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

export function highlight(code: string, lang: 'vue' | 'js' | 'sql' = 'vue'): string {
  let out = '';
  let last = 0;
  for (const m of code.matchAll(TOKEN)) {
    const i = m.index!;
    out += esc(code.slice(last, i));
    last = i + m[0].length;
    const [all, comment, str, tag, attr, num, word] = m;
    if (comment !== undefined && !(lang === 'js' && comment.startsWith('--')) && !(lang === 'vue' && comment.startsWith('--'))) out += `<span class="hl-c">${esc(all)}</span>`;
    else if (comment !== undefined) out += esc(all);
    else if (str !== undefined) out += `<span class="hl-s">${esc(all)}</span>`;
    else if (tag !== undefined && lang !== 'sql') out += `<span class="hl-t">${esc(all)}</span>`;
    else if (attr !== undefined && lang === 'vue') out += `<span class="hl-a">${esc(all)}</span>`;
    else if (num !== undefined) out += `<span class="hl-n">${esc(all)}</span>`;
    else if (word !== undefined && ((lang !== 'sql' && JS_KW.has(word)) || (lang === 'sql' && SQL_KW.has(word.toUpperCase())))) out += `<span class="hl-k">${esc(all)}</span>`;
    else if (word !== undefined && lang !== 'sql' && /^(ref|computed|watch|reactive|onMounted|onBeforeUnmount|defineProps|defineEmits|defineExpose|defineModel|defineStore|storeToRefs|useRoute|useRouter|useI18n|toRefs|nextTick)$/.test(word)) out += `<span class="hl-f">${esc(all)}</span>`;
    else out += esc(all);
  }
  return out + esc(code.slice(last));
}

/** Texte de leçon : `code` en ligne et **gras**, échappés. */
export function inline(text: string): string {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
