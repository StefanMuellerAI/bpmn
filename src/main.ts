import './style.css';

import BpmnModeler from 'bpmn-js/lib/Modeler';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule
} from 'bpmn-js-properties-panel';

import { EMPTY_DIAGRAM, SWIMLANE_DIAGRAM } from './diagrams';

const canvasEl = document.querySelector<HTMLDivElement>('#canvas')!;
const propertiesEl = document.querySelector<HTMLDivElement>('#properties')!;
const statusEl = document.querySelector<HTMLSpanElement>('#status')!;

const modeler = new BpmnModeler({
  container: canvasEl,
  propertiesPanel: { parent: propertiesEl },
  additionalModules: [BpmnPropertiesPanelModule, BpmnPropertiesProviderModule],
  keyboard: { bindTo: document }
});

let currentFileName = 'diagramm.bpmn';

function setStatus(message: string, isError = false): void {
  statusEl.textContent = message;
  statusEl.style.color = isError ? 'var(--danger)' : 'var(--muted)';
}

async function openDiagram(xml: string): Promise<void> {
  try {
    await modeler.importXML(xml);
    const canvas = modeler.get('canvas') as { zoom: (level: string | number, center?: string) => void };
    canvas.zoom('fit-viewport', 'auto');
    setStatus('Diagramm geladen.');
  } catch (err) {
    console.error('Import fehlgeschlagen', err);
    setStatus('Import fehlgeschlagen: ' + (err as Error).message, true);
  }
}

async function saveXml(): Promise<void> {
  try {
    const { xml } = await modeler.saveXML({ format: true });
    download(currentFileName, xml ?? '', 'application/bpmn20-xml');
    setStatus('BPMN-Datei gespeichert.');
  } catch (err) {
    console.error('Speichern fehlgeschlagen', err);
    setStatus('Speichern fehlgeschlagen: ' + (err as Error).message, true);
  }
}

async function exportSvg(): Promise<void> {
  try {
    const { svg } = await modeler.saveSVG();
    const fileName = currentFileName.replace(/\.(bpmn|xml)$/i, '') + '.svg';
    download(fileName, svg ?? '', 'image/svg+xml');
    setStatus('SVG exportiert.');
  } catch (err) {
    console.error('SVG-Export fehlgeschlagen', err);
    setStatus('SVG-Export fehlgeschlagen: ' + (err as Error).message, true);
  }
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function wireToolbar(): void {
  document.querySelector<HTMLButtonElement>('#btn-new')!.addEventListener('click', () => {
    currentFileName = 'diagramm.bpmn';
    void openDiagram(EMPTY_DIAGRAM);
  });

  document.querySelector<HTMLButtonElement>('#btn-new-pool')!.addEventListener('click', () => {
    currentFileName = 'diagramm.bpmn';
    void openDiagram(SWIMLANE_DIAGRAM);
  });

  const fileInput = document.querySelector<HTMLInputElement>('#input-open')!;
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    currentFileName = file.name.endsWith('.bpmn') ? file.name : file.name.replace(/\.[^.]+$/, '') + '.bpmn';
    try {
      const xml = await readFile(file);
      await openDiagram(xml);
    } finally {
      fileInput.value = '';
    }
  });

  document.querySelector<HTMLButtonElement>('#btn-save-xml')!.addEventListener('click', () => void saveXml());
  document.querySelector<HTMLButtonElement>('#btn-export-svg')!.addEventListener('click', () => void exportSvg());

  const editorActions = modeler.get('editorActions') as { trigger: (action: string, opts?: unknown) => void };
  const canvas = modeler.get('canvas') as {
    zoom: (level: string | number, center?: string) => number;
    viewbox: () => { scale: number };
  };

  document.querySelector<HTMLButtonElement>('#btn-undo')!.addEventListener('click', () => editorActions.trigger('undo'));
  document.querySelector<HTMLButtonElement>('#btn-redo')!.addEventListener('click', () => editorActions.trigger('redo'));
  document.querySelector<HTMLButtonElement>('#btn-zoom-in')!.addEventListener('click', () => {
    const next = Math.min(canvas.viewbox().scale * 1.2, 4);
    canvas.zoom(next);
  });
  document.querySelector<HTMLButtonElement>('#btn-zoom-out')!.addEventListener('click', () => {
    const next = Math.max(canvas.viewbox().scale / 1.2, 0.2);
    canvas.zoom(next);
  });
  document.querySelector<HTMLButtonElement>('#btn-zoom-fit')!.addEventListener('click', () => canvas.zoom('fit-viewport', 'auto'));

  window.addEventListener('keydown', (e) => {
    const isMod = e.ctrlKey || e.metaKey;
    if (!isMod) return;
    const key = e.key.toLowerCase();
    if (key === 's') {
      e.preventDefault();
      void saveXml();
    } else if (key === 'o') {
      e.preventDefault();
      fileInput.click();
    }
  });

  window.addEventListener('beforeunload', (e) => {
    const commandStack = modeler.get('commandStack') as { _stackIdx: number };
    if (commandStack._stackIdx > -1) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

modeler.on('commandStack.changed', () => {
  setStatus('Ungespeicherte Änderungen.');
});

modeler.on('import.done', (event: { error?: Error; warnings?: unknown[] }) => {
  if (event.error) {
    setStatus('Import-Fehler: ' + event.error.message, true);
  }
});

wireToolbar();
void openDiagram(EMPTY_DIAGRAM);
