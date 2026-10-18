import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc';

/**
 * Compile un fichier d'exercice (.vue ou .js) en module exécutable dans le navigateur.
 * Reproduit les auto-imports du projet : `ref`, `computed`, `useRoute`, `defineStore`…
 * utilisés sans import reçoivent l'import adéquat avant compilation.
 */

export const AUTO_IMPORTS: Record<string, string[]> = {
  vue: ['ref', 'reactive', 'computed', 'watch', 'watchEffect', 'onMounted', 'onBeforeUnmount', 'onUnmounted', 'onBeforeMount',
    'nextTick', 'toRef', 'toRefs', 'readonly', 'shallowRef', 'unref', 'isRef', 'provide', 'inject', 'h', 'useTemplateRef', 'useSlots', 'useAttrs'],
  'vue-router': ['useRoute', 'useRouter'],
  pinia: ['defineStore', 'storeToRefs'],
  'vue-i18n': ['useI18n'],
};

export class CompileError extends Error {
  constructor(public file: string, message: string, public line: number | null = null) {
    super(message);
    this.name = 'CompileError';
  }
}

export interface CompiledFile {
  /** Code CommonJS-like : utilise __req(spec) et __exports. */
  code: string;
  css: string;
  /** Contenu du bloc <route> (JSON), s'il existe. */
  route: Record<string, unknown> | null;
}

const ident = (s: string) => s.replace(/[^\w$]/g, '_');

/** Noms déjà importés explicitement dans un code source. */
function importedNames(src: string): Set<string> {
  const out = new Set<string>();
  for (const m of src.matchAll(/import\s+(?:type\s+)?([\s\S]*?)\s+from\s+['"][^'"]+['"]/g)) {
    const clause = m[1]!;
    const named = clause.match(/\{([\s\S]*)\}/)?.[1] ?? '';
    for (const part of named.split(',')) {
      const local = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (local) out.add(local);
    }
    const def = clause.replace(/\{[\s\S]*\}/, '').replace(/\*\s+as\s+/, '').split(',')[0]?.trim();
    if (def) out.add(def);
  }
  return out;
}

/** Ajoute les imports « automatiques » nécessaires (seulement ceux réellement utilisés). */
export function withAutoImports(src: string): string {
  const have = importedNames(src);
  // Retire chaînes et commentaires pour éviter les faux positifs.
  const bare = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
  const lines: string[] = [];
  for (const [mod, names] of Object.entries(AUTO_IMPORTS)) {
    const used = names.filter(n => !have.has(n) && new RegExp(`(?<![\\w$.])${n}\\s*\\(`).test(bare));
    if (used.length) lines.push(`import { ${used.join(', ')} } from '${mod}';`);
  }
  return lines.length ? lines.join('\n') + '\n' + src : src;
}

/** Transforme les import/export ESM en appels __req / __exports (exécution via new Function). */
export function toModuleBody(code: string): string {
  const exportsTail: string[] = [];
  let out = code
    // import X, { a as b } from 'm'
    .replace(/import\s+([\w$]+)\s*,\s*\{([\s\S]*?)\}\s*from\s*(['"])([^'"]+)\3;?/g, (_, def, named, _q, spec) =>
      `const ${def} = __req(${JSON.stringify(spec)}).default; const {${named.replace(/\s+as\s+/g, ': ')}} = __req(${JSON.stringify(spec)});`)
    // import { a as b } from 'm'
    .replace(/import\s*\{([\s\S]*?)\}\s*from\s*(['"])([^'"]+)\2;?/g, (_, named: string, _q, spec) =>
      `const {${named.split(',').filter(x => x.trim() && !/^\s*type\s/.test(x)).map(x => x.replace(/\s+as\s+/, ': ')).join(',')}} = __req(${JSON.stringify(spec)});`)
    // import * as N from 'm'
    .replace(/import\s*\*\s*as\s+([\w$]+)\s+from\s*(['"])([^'"]+)\2;?/g, (_, n, _q, spec) => `const ${n} = __req(${JSON.stringify(spec)});`)
    // import X from 'm'
    .replace(/import\s+([\w$]+)\s+from\s*(['"])([^'"]+)\2;?/g, (_, n, _q, spec) => `const ${n} = __req(${JSON.stringify(spec)}).default;`)
    // import 'm'
    .replace(/import\s*(['"])([^'"]+)\1;?/g, (_, _q, spec) => `__req(${JSON.stringify(spec)});`)
    .replace(/export\s+default\s+/g, '__exports.default = ')
    .replace(/export\s*\{([^}]*)\};?/g, (_, list: string) => list.split(',').filter(x => x.trim()).map(x => {
      const [local, as] = x.split(/\s+as\s+/).map(s => s.trim());
      return `__exports.${as ?? local} = ${local};`;
    }).join(' '));
  out = out.replace(/export\s+(const|let|var|function\*?|async\s+function|class)\s+([\w$]+)/g, (_, kind, name) => {
    exportsTail.push(`__exports.${name} = ${name};`);
    return `${kind} ${name}`;
  });
  return out + '\n' + exportsTail.join('\n');
}

export function compileFile(name: string, src: string): CompiledFile {
  if (name.endsWith('.js') || name.endsWith('.ts')) {
    return { code: toModuleBody(withAutoImports(src)), css: '', route: null };
  }
  // Imports automatiques insérés dans le texte source (le compilateur travaille sur les positions d'origine).
  const prepared = src.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g, (_, open: string, body: string, close: string) => {
    const injected = withAutoImports(body);
    return open + (injected === body ? body : '\n' + injected.slice(0, injected.length - body.length).replace(/\n$/, ' ') + body) + close;
  });
  const { descriptor, errors } = parse(prepared, { filename: name });
  if (errors.length) {
    const e = errors[0] as { message: string; loc?: { start: { line: number } } };
    throw new CompileError(name, e.message, e.loc?.start.line ?? null);
  }
  const id = 'x' + ident(name);
  let code: string;
  try {
    if (descriptor.scriptSetup || descriptor.script) {
      const d = descriptor;
      const s = compileScript(d, { id, inlineTemplate: !!d.scriptSetup, genDefaultAs: '__sfc__' });
      code = s.content;
      if (!d.scriptSetup && d.template) {
        const t = compileTemplate({ source: d.template.content, filename: name, id });
        if (t.errors.length) throw t.errors[0];
        code += '\n' + t.code.replace(/export function render/, 'function __render') + '\n__sfc__.render = __render;';
      }
    } else if (descriptor.template) {
      const t = compileTemplate({ source: descriptor.template.content, filename: name, id });
      if (t.errors.length) throw t.errors[0];
      code = t.code.replace(/export function render/, 'function __render') + '\nconst __sfc__ = { render: __render };';
    } else {
      throw new CompileError(name, 'Fichier vide : il faut au moins un <template>.');
    }
  } catch (e) {
    if (e instanceof CompileError) throw e;
    const err = e as { message?: string; loc?: { start: { line: number } } };
    throw new CompileError(name, String(err.message ?? e).split('\n')[0]!, err.loc?.start.line ?? null);
  }
  code += `\n__sfc__.__name = ${JSON.stringify(name.split('/').pop()!.replace(/\.vue$/, ''))};\nexport default __sfc__;`;
  const routeBlock = descriptor.customBlocks.find(b => b.type === 'route');
  let route: Record<string, unknown> | null = null;
  if (routeBlock) {
    try { route = JSON.parse(routeBlock.content); } catch { throw new CompileError(name, 'Bloc <route> : JSON invalide.', routeBlock.loc.start.line); }
  }
  return { code: toModuleBody(code), css: descriptor.styles.map(s => s.content).join('\n'), route };
}
