import { EventEmitter } from 'events';

type ExecutionEventsMap = {
  changed: {
    at: number;
  };
};

class ExecutionEvents {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(300);
  }

  emitChanged() {
    this.emitter.emit('changed', { at: Date.now() } satisfies ExecutionEventsMap['changed']);
  }

  subscribeChanged(handler: (payload: ExecutionEventsMap['changed']) => void): () => void {
    this.emitter.on('changed', handler);
    return () => {
      this.emitter.off('changed', handler);
    };
  }
}

const globalKey = '__executionEvents__';
const g = globalThis as unknown as Record<string, unknown>;
if (!g[globalKey]) {
  g[globalKey] = new ExecutionEvents();
}

export const executionEvents = g[globalKey] as ExecutionEvents;
