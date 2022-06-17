import { QueueApi } from '@stencil/core';

import { Gesture, GestureCallback, GestureDetail, calcGestureData, now, updateDetail } from './index';
import { GESTURE_CONTROLLER } from './gesture-controller';
import { createPointerEvents } from './pointer-events';
import { createPressRecognizer } from './press-recognizers';

export function createPressGesture(config: PressGestureConfig): Gesture {
  const finalConfig: PressGestureConfig = {
    gesturePriority: 0,
    passive: true,
    threshold: 9,
    time: 251,

    ...config
  };

  const isEnabled = finalConfig.isEnabled;
  const onPress = finalConfig.onPress;
  const onMove = finalConfig.onMove;
  const onPressUp = finalConfig.onPressUp;
  const notCaptured = finalConfig.notCaptured;
  const threshold = (finalConfig.threshold > 0 ? finalConfig.threshold : 0);
  const time = (finalConfig.time >= 251 ? finalConfig.time : 251);
  const queue = finalConfig.queue;


  const detail: GestureDetail = {
    type: 'press',
    startX: 0,
    startY: 0,
    startTimeStamp: 0,
    currentX: 0,
    currentY: 0,
    velocityX: 0,
    velocityY: 0,
    deltaX: 0,
    deltaY: 0,
    timeStamp: 0,
    event: undefined as any,
    data: undefined
  };

  const pointerEvents = createPointerEvents(
    finalConfig.el,
    pointerDown,
    pointerMove,
    pointerUp,
    {
      capture: false,
    }
  );

  const press = createPressRecognizer(threshold, time);

  const gesture = GESTURE_CONTROLLER.createGesture({
    name: config.gestureName,
    priority: config.gesturePriority
  });

  let hasCapturedMouseDown = false;
  let hasCapturedPress = false;
  let hasFiredPress = false;


  function pointerDown(ev: MouseEvent | TouchEvent): boolean {
    if (hasCapturedMouseDown) {
      return false;
    }

    if (ev instanceof MouseEvent) {
      if (ev.button !== 0) {
        return false;
      }
    }

    if (ev instanceof TouchEvent) {
      if (ev.touches.length !== 1) {
        return false;
      }
    }

    const timeStamp = now(ev);
    updateDetail(ev, detail);
    detail.startX = detail.currentX;
    detail.startY = detail.currentY;
    detail.startTimeStamp = detail.timeStamp = timeStamp;
    detail.velocityX = detail.velocityY = detail.deltaX = detail.deltaY = 0;
    detail.event = ev;

    // Check if gesture can start
    if (isEnabled && isEnabled(detail) === false) {
      return false;
    }
    // Release fallback
    gesture.release();

    // Start gesture
    if (!gesture.start()) {
      return false;
    }

    hasCapturedMouseDown = true;
    press.timer(() => {
        if (!tryToCapturePress()) {
          abortGesture();

          return;
        }

        hasCapturedPress = true;
    });

    press.start(detail.startX, detail.startY);
    return true;
  }


  function pointerMove(ev: UIEvent) {
    if (!hasCapturedMouseDown) {
      return;
    }

    calcGestureData(detail, ev);

    if (!hasCapturedPress) {
      if (!press.detect(detail.currentX, detail.currentY)) {
        abortGesture();
        return;
      }
    }

    queue.write(fireOnMove);

    return;
  }

  function fireOnMove() {
    // Since fireOnMove is called inside a RAF, onEnd() might be called,
    // we must double check hasCapturedPress
    if (!hasCapturedPress) {
      return;
    }
    if (onMove) {
      onMove(detail);
    }
  }

  function tryToCapturePress(): boolean {
    if (gesture && !gesture.capture()) {
      return false;
    }
    hasCapturedPress = true;
    hasFiredPress = false;

    // reset start position since the real user-land event starts here
    // If the pan detector threshold is big, not resetting the start position
    // will cause a jump in the animation equal to the detector threshold.
    // the array of positions used to calculate the gesture velocity does not
    // need to be cleaned, more points in the positions array always results in a
    // more accurate value of the velocity.
    detail.startX = detail.currentX;
    detail.startY = detail.currentY;
    detail.startTimeStamp = detail.timeStamp;

    fireOnPress();

    return true;
  }

  function fireOnPress() {
    if (onPress) {
      onPress(detail);
    }
    hasFiredPress = true;
  }

  function abortGesture() {
    reset();
    pointerEvents.stop();
    if (notCaptured) {
      notCaptured(detail);
    }
  }

  function reset() {
    hasCapturedMouseDown = false;
    hasCapturedPress = false;
    hasFiredPress = false;

    press.destroy();

    gesture.release();
  }

  // END *************************

  function pointerUp(ev: UIEvent) {
    const tmpHasCaptured = hasCapturedPress;
    const tmpHasFiredPress = hasFiredPress;
    reset();

    if (!tmpHasFiredPress) {
      return;
    }
    calcGestureData(detail, ev);

    // Try to capture press
    if (tmpHasCaptured) {
      if (onPressUp) {
        onPressUp(detail);
      }
      return;
    }

    // Not captured any event
    if (notCaptured) {
      notCaptured(detail);
    }
  }

  return {
    setDisabled(disabled: boolean) {
      pointerEvents.setDisabled(disabled);
    },
    destroy() {
      gesture.destroy();
      pointerEvents.destroy();
    }
  };
}

export interface PressGestureConfig {
  el: Node;

  queue: QueueApi;
  gestureName: string;
  gesturePriority?: number;
  passive?: boolean;
  threshold?: number;
  time?: number;

  isEnabled?: GestureCallback;
  onPress?: GestureCallback;
  onMove?: GestureCallback;
  onPressUp?: GestureCallback;
  notCaptured?: GestureCallback;
}
