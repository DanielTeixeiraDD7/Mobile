<script setup lang="ts">
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, type Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { vue } from '@codemirror/lang-vue';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

/**
 * Éditeur CodeMirror 6. Un état par fichier (`fileKey`) : l'historique d'annulation
 * de chaque onglet est conservé quand on passe de l'un à l'autre.
 */
const props = defineProps<{ modelValue: string; fileKey: string; readonly?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string]; run: [] }>();

const hote = useTemplateRef<HTMLDivElement>('hote');
let view: EditorView | null = null;
const etats = new Map<string, EditorState>();

const theme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'var(--ve-code-bg)' },
  '.cm-gutters': { backgroundColor: 'var(--ve-code-bg)', borderRight: '1px solid #1d2b27', color: '#4d6a61' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'rgba(66,184,131,.07)' },
  '.cm-content': { padding: '10px 0 40px' },
  '&.cm-focused .cm-cursor': { borderLeftColor: '#42b883' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(66,184,131,.25) !important' },
}, { dark: true });

function creerEtat(doc: string, nom: string): EditorState {
  const ext: Extension[] = [
    basicSetup,
    nom.endsWith('.vue') ? vue() : javascript(),
    oneDark,
    theme,
    EditorState.tabSize.of(2),
    keymap.of([indentWithTab, { key: 'Mod-Enter', run: () => { emit('run'); return true; } }, { key: 'Mod-s', preventDefault: true, run: () => { emit('run'); return true; } }]),
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ 'aria-label': `Code de ${nom}`, autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
    EditorView.updateListener.of(u => { if (u.docChanged) emit('update:modelValue', u.state.doc.toString()); }),
  ];
  if (props.readonly) ext.push(EditorState.readOnly.of(true), EditorView.editable.of(false));
  return EditorState.create({ doc, extensions: ext });
}

function etatPour(key: string, doc: string) {
  const e = etats.get(key);
  // Contenu remplacé de l'extérieur (solution, réinitialisation) : nouvel état.
  if (e && e.doc.toString() === doc) return e;
  return creerEtat(doc, key);
}

onMounted(() => {
  view = new EditorView({ parent: hote.value!, state: etatPour(props.fileKey, props.modelValue) });
});

watch(() => props.fileKey, (nouveau, ancien) => {
  if (!view) return;
  if (ancien) etats.set(ancien, view.state);
  view.setState(etatPour(nouveau, props.modelValue));
});

watch(() => props.modelValue, v => {
  if (view && v !== view.state.doc.toString()) view.setState(creerEtat(v, props.fileKey));
});

watch(() => props.readonly, () => { if (view) view.setState(creerEtat(view.state.doc.toString(), props.fileKey)); });

onBeforeUnmount(() => { view?.destroy(); view = null; });

defineExpose({ focus: () => view?.focus() });
</script>

<template>
  <div ref="hote" class="code-editor" :class="{ ro: readonly }" />
</template>

<style scoped>
.code-editor { height: 100%; min-height: 0; overflow: hidden; background: var(--ve-code-bg); }
.code-editor :deep(.cm-editor) { height: 100%; }
.code-editor.ro :deep(.cm-content) { opacity: .8; }
</style>
