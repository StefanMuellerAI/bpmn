import { is } from 'bpmn-js/lib/util/ModelUtil';

export type TagId = 'KI' | 'RPA' | 'HYBRID' | 'MANUELL';

export interface TagInfo {
  id: TagId;
  label: string;
  description: string;
  color: string;
}

export const TAGS: TagInfo[] = [
  { id: 'KI', label: 'KI', description: 'KI-gestützter Schritt', color: '#7c3aed' },
  { id: 'RPA', label: 'RPA', description: 'Robotic Process Automation', color: '#0891b2' },
  { id: 'HYBRID', label: 'KI+RPA', description: 'Hybrid: KI + RPA', color: '#db2777' },
  { id: 'MANUELL', label: 'Manuell', description: 'Manueller Schritt', color: '#d97706' }
];

export const TAG_ELEMENT_TYPE = 'tags:Tag';

export function isTaggable(element: unknown): boolean {
  if (!element || typeof element !== 'object') return false;
  const el = element as { businessObject?: unknown; labelTarget?: unknown };
  if (!el.businessObject || el.labelTarget) return false;
  return (
    is(element, 'bpmn:Task') ||
    is(element, 'bpmn:CallActivity') ||
    is(element, 'bpmn:SubProcess') ||
    is(element, 'bpmn:Gateway')
  );
}

export function getTag(element: any): TagId | null {
  const bo = element?.businessObject;
  const values = bo?.extensionElements?.values;
  if (!Array.isArray(values)) return null;
  const found = values.find((v: any) => v?.$type === TAG_ELEMENT_TYPE);
  const type = found?.type as TagId | undefined;
  if (!type) return null;
  return TAGS.some((t) => t.id === type) ? type : null;
}

export function setTag(modeler: any, element: any, tag: TagId | null): void {
  const moddle = modeler.get('moddle');
  const modeling = modeler.get('modeling');
  const bo = element.businessObject;

  const previous: any[] = Array.isArray(bo.extensionElements?.values)
    ? [...bo.extensionElements.values]
    : [];
  const filtered = previous.filter((v) => v?.$type !== TAG_ELEMENT_TYPE);

  if (tag) {
    const tagElem = moddle.create(TAG_ELEMENT_TYPE, { type: tag });
    filtered.push(tagElem);
  }

  if (filtered.length === 0) {
    if (!bo.extensionElements) return;
    modeling.updateProperties(element, { extensionElements: null });
    return;
  }

  const next = moddle.create('bpmn:ExtensionElements', { values: filtered });
  modeling.updateProperties(element, { extensionElements: next });
}

export function setupTagPanel(modeler: any, container: HTMLElement): void {
  const eventBus = modeler.get('eventBus');
  const selection = modeler.get('selection');

  const render = (elements: any[]): void => {
    container.innerHTML = '';
    const target = elements.find(isTaggable);

    if (!target) {
      container.classList.add('empty');
      const hint = document.createElement('p');
      hint.className = 'tag-panel-hint';
      hint.textContent =
        'Wähle einen Task, ein Gateway oder einen Subprozess, um einen Automatisierungs-Tag zu setzen.';
      container.appendChild(hint);
      return;
    }

    container.classList.remove('empty');

    const heading = document.createElement('div');
    heading.className = 'tag-panel-title';
    heading.textContent = 'Automatisierungs-Tag';
    container.appendChild(heading);

    const meta = document.createElement('div');
    meta.className = 'tag-panel-meta';
    meta.textContent = describeElement(target);
    container.appendChild(meta);

    const list = document.createElement('div');
    list.className = 'tag-options';

    const currentTag = getTag(target);

    const noneBtn = makeOptionButton('Ohne', null, currentTag === null);
    noneBtn.style.borderColor = 'var(--border)';
    noneBtn.addEventListener('click', () => setTag(modeler, target, null));
    list.appendChild(noneBtn);

    for (const t of TAGS) {
      const btn = makeOptionButton(t.label, t.color, currentTag === t.id);
      btn.title = t.description;
      btn.addEventListener('click', () => setTag(modeler, target, t.id));
      list.appendChild(btn);
    }

    container.appendChild(list);

    if (currentTag) {
      const info = TAGS.find((t) => t.id === currentTag)!;
      const note = document.createElement('div');
      note.className = 'tag-panel-current';
      note.innerHTML = `Aktuell: <strong style="color:${info.color}">${info.label}</strong> — ${info.description}`;
      container.appendChild(note);
    }
  };

  eventBus.on('selection.changed', (e: { newSelection: any[] }) => render(e.newSelection));
  eventBus.on('element.changed', (e: { element: any }) => {
    const sel = selection.get();
    if (sel.some((s: { id: string }) => s.id === e.element.id)) {
      render(sel);
    }
  });
  eventBus.on('import.done', () => render(selection.get()));

  render(selection.get());
}

function makeOptionButton(label: string, color: string | null, active: boolean): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'tag-option' + (active ? ' active' : '');
  btn.textContent = label;
  if (color) {
    btn.style.borderColor = color;
    if (active) {
      btn.style.backgroundColor = color;
      btn.style.color = 'white';
    } else {
      btn.style.color = color;
    }
  }
  return btn;
}

function describeElement(element: any): string {
  const bo = element.businessObject;
  const name = (bo?.name || '').trim();
  const type = humanType(element);
  return name ? `${type}: ${name}` : type;
}

function humanType(element: any): string {
  if (is(element, 'bpmn:SubProcess')) return 'Subprozess';
  if (is(element, 'bpmn:CallActivity')) return 'Aufruf-Aktivität';
  if (is(element, 'bpmn:Gateway')) return 'Gateway';
  if (is(element, 'bpmn:UserTask')) return 'User Task';
  if (is(element, 'bpmn:ServiceTask')) return 'Service Task';
  if (is(element, 'bpmn:ScriptTask')) return 'Script Task';
  if (is(element, 'bpmn:ManualTask')) return 'Manual Task';
  if (is(element, 'bpmn:BusinessRuleTask')) return 'Business Rule Task';
  if (is(element, 'bpmn:SendTask')) return 'Send Task';
  if (is(element, 'bpmn:ReceiveTask')) return 'Receive Task';
  if (is(element, 'bpmn:Task')) return 'Task';
  return 'Element';
}
