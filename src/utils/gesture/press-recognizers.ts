export interface PressRecognizer {
  start(x: number, y: number): void;
  detect(x: number, y: number): boolean;
  timer(callback: any);
  destroy();
}

export function createPressRecognizer(thresh: number, time: number): PressRecognizer {
  const threshold = thresh * thresh;

  let startX = 0;
  let startY = 0;

  let dirty = false;

  let callback;

  let timeout;

  return {
    start(x: number, y: number) {
      startX = x;
      startY = y;
      dirty = true;

      clearTimeout(timeout);
      setTimeout(() => {
        if (callback) {
          callback();
        }
      }, time);
    },

    detect(x: number, y: number): boolean {
      if (!dirty) {
        return false;
      }

      const deltaX = (x - startX);
      const deltaY = (y - startY);
      const distance = deltaX * deltaX + deltaY * deltaY;

      if (distance > threshold) {
        return false;
      }

      dirty = false;
      return true;
    },
    timer(cb) {
      callback = cb;
    },
    destroy() {
      clearTimeout(timeout);
      callback = undefined;
    }
  };
}
