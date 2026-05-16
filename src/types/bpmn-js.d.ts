declare module 'bpmn-js/lib/Modeler' {
  const Modeler: any;
  export default Modeler;
}

declare module 'bpmn-js/lib/util/ModelUtil' {
  export function is(element: unknown, type: string): boolean;
  export function isAny(element: unknown, types: string[]): boolean;
  export function getBusinessObject(element: unknown): any;
}

declare module 'bpmn-js-properties-panel' {
  export const BpmnPropertiesPanelModule: any;
  export const BpmnPropertiesProviderModule: any;
  export const CamundaPlatformPropertiesProviderModule: any;
}

declare module 'diagram-js/lib/draw/BaseRenderer' {
  export default class BaseRenderer {
    constructor(eventBus: unknown, renderPriority?: number);
    canRender(element: unknown): boolean;
    drawShape(parent: SVGElement, element: unknown): SVGElement;
    getShapePath(shape: unknown): string;
  }
}
