import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { getTag, isTaggable, TAGS, type TagInfo } from './tags';

const HIGH_PRIORITY = 1500;
const SVG_NS = 'http://www.w3.org/2000/svg';

class TagRenderer extends BaseRenderer {
  static $inject = ['eventBus', 'bpmnRenderer'];

  private readonly bpmnRenderer: any;

  constructor(eventBus: unknown, bpmnRenderer: any) {
    super(eventBus, HIGH_PRIORITY);
    this.bpmnRenderer = bpmnRenderer;
  }

  override canRender(element: any): boolean {
    return isTaggable(element);
  }

  override drawShape(parent: SVGElement, element: any): SVGElement {
    const shape = this.bpmnRenderer.drawShape(parent, element);
    const tag = getTag(element);
    if (tag) {
      const info = TAGS.find((t) => t.id === tag);
      if (info) {
        paintBadge(parent, element, info);
      }
    }
    return shape;
  }

  override getShapePath(shape: any): string {
    return this.bpmnRenderer.getShapePath(shape);
  }
}

function paintBadge(parent: SVGElement, element: any, info: TagInfo): void {
  const width = Number(element.width) || 100;
  const charWidth = 6.6;
  const padding = 9;
  const badgeWidth = Math.ceil(info.label.length * charWidth + padding * 2);
  const badgeHeight = 18;
  const x = width - badgeWidth + 6;
  const y = -10;

  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'bpmn-tag-badge');
  group.setAttribute('transform', `translate(${x},${y})`);
  group.setAttribute('pointer-events', 'none');

  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('width', String(badgeWidth));
  rect.setAttribute('height', String(badgeHeight));
  rect.setAttribute('rx', '9');
  rect.setAttribute('ry', '9');
  rect.setAttribute('fill', info.color);
  rect.setAttribute('stroke', '#ffffff');
  rect.setAttribute('stroke-width', '1.5');

  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', String(badgeWidth / 2));
  text.setAttribute('y', String(badgeHeight / 2 + 0.5));
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('fill', '#ffffff');
  text.setAttribute('font-size', '10.5');
  text.setAttribute('font-weight', '700');
  text.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
  text.setAttribute('letter-spacing', '0.3');
  text.textContent = info.label;

  group.appendChild(rect);
  group.appendChild(text);
  parent.appendChild(group);
}

export default {
  __init__: ['tagRenderer'],
  tagRenderer: ['type', TagRenderer]
};
