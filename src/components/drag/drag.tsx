import { Component, Element, Event, EventEmitter, h, Prop, State, QueueApi } from '@stencil/core';


// custom imports
import './js/get-size';
import { Gesture, GestureDetail } from '../../utils/gesture/index';
import { createPressGesture } from '../../utils/gesture/press-gesture';


@Component({
  tag: 'lan-drag',
  styleUrl: 'drag.css',
  shadow: true
})
export class LanDrag {

  private _dragElement: HTMLElement;
  private _lastDropTarget: Element;
  private _size;
  private _style;
  private _imgOffset: { x: number, y: number };
  private _gesture?: Gesture;


  @Element() el: HTMLElement;

  @Prop() dropZones: string = '';
  @Prop() dragData: string = '';
  @Prop() delay: number = 251;
  @Prop() threshold: number = 9;

  private queue!: QueueApi;

  @Event() dragstart: EventEmitter;
  @Event() dragend: EventEmitter;

  @State() isDragging = false;


  private dragStart(p: { x: number, y: number }) {
    this.isDragging = true;

    // console.log(`dragstart: dropZones '${this.dropZones}'`);
    // console.log(`dragstart: dragData '${this.dragData}'`);

    let top: number, left: number;

    this._dragElement = document.createElement('div');

    if (this.el.firstElementChild.slot === 'drag-image') {
      this._dragElement.className = 'lan-drag-image';

      this._dragElement.appendChild(this.el.firstElementChild.cloneNode(true));
      console.log('windoow: ' + window);
      this._size = window['getSize'](this.el.firstElementChild);
      this._style = this._dragElement.style;

      left = p.x;
      top = p.y;

    } else {
      this._dragElement.className = 'lan-drag-clone';

      const clientRect = this.el.getBoundingClientRect();
      top = clientRect.top;
      left = clientRect.left;

      this._dragElement.innerHTML = this.el.innerHTML;
      // this.deepClone(this._dragElement, this.el);

      this._size = window['getSize'](this.el);
      this._style = this._dragElement.style;


      if (this._size.width > 0 || this._size.height > 0) {
        this._style.width = this._size.width + 'px';
        this._style.height = this._size.height + 'px';
      }
    }

    // console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    // console.log('new', this._dragElement);
    // console.log('getSize', this._size);
    // console.log('top', top, 'left', left);
    // console.log('style', this._style);
    // console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');


    this._imgOffset = { x: p.x - left, y: p.y - top };

    this._style.position = 'absolute';
    this._style.zIndex = '999999';
    this._style.left = '0px';
    this._style.top = '0px';
    this._style['-webkit-touch-callout'] = 'none'; /* iOS Safari */
    this._style['-webkit-user-select'] = 'none'; /* Safari */
    this._style['-khtml-user-select'] = 'none'; /* Konqueror HTML */
    this._style['-moz-user-select'] = 'none'; /* Firefox */
    this._style['-ms-user-select'] = 'none'; /* Internet Explorer/Edge */
    this._style['user-select'] = 'none';
    this._style.transform = `translate(${Math.round(p.x - this._imgOffset.x)}px,${Math.round(p.y - this._imgOffset.y)}px)`;

    document.body.appendChild(this._dragElement);

    this.dragstart.emit();
  }


  // private deepClone(target: Element, el: Element) {
  //   console.log('deepClone, el:', el);

  //   if (el.shadowRoot) {
  //     if (el === this.el) {
  //       target.attachShadow({ mode: 'open'});
  //       target.shadowRoot.innerHTML = el.shadowRoot.innerHTML;
  //     }
  //   }


  //   for (let i = 1; i <= el.attributes.length; i++) {
  //     const attribute: Attr = el.attributes.item(i-1);
  //     console.log('attribute', attribute.name, attribute.value);
  //     target[attribute.name] = attribute.value;
  //   }


  //   for (let i = 1; i <= el.children.length; i++) {
  //     const child: Element = el.children.item(i-1);
  //     target.append(child.cloneNode());

  //     if (child.children.length === 0 && child.textContent) {
  //       target.lastElementChild.textContent = child.textContent;
  //     }

  //     this.deepClone(target.lastElementChild, el.children.item(i-1));
  //   }
  // }


  // private cloneShadow(shadow) {
  //   const frag = document.createDocumentFragment();

  //   var nodes = [...shadow.childNodes];
  //   nodes.forEach(
  //     node => {
  //       node.remove();
  //       frag.appendChild(node.cloneNode(true));
  //       shadow.appendChild(node);
  //     }
  //   );

  //   return frag;
  // }

  private drag(p: { x: number, y: number }) {
    // console.log('LanDrag#drag; p:', p);

    if (p.x == 0 || p.y == 0) {
      return;
    }

    requestAnimationFrame(() => {
      if (this._dragElement) {
        this._style.transform = `translate(${Math.round(p.x - this._imgOffset.x)}px,${Math.round(p.y - this._imgOffset.y)}px)`;
      }
    });
  }

  private dragEnd() {
    if (this._dragElement) {
      // console.log('LanDrag#dragEnd');

      document.body.removeChild(this._dragElement);
      this._dragElement = undefined;
    }

    if (this.isDragging) {
      this.dragend.emit();
    }
  }

  private isEnabled(_ev: GestureDetail): boolean {
    // console.log('LanDrag#isEnabled; ev:', ev);

    return true;
}

  private onPress(ev: GestureDetail) {
    // console.log('LanDrag#onPress; ev:', ev);

    this.dragStart({ x: ev.startX, y: ev.startY });
  }

  private onMove(ev: GestureDetail) {
    // console.log('LanDrag#onMove; ev:', ev);

    this.drag({ x: ev.currentX, y: ev.currentY });

    const elementBehindCursor = this.getElementBehindCursor(ev.currentX, ev.currentY);

    const dropTarget: Element = this.findDropTarget(elementBehindCursor);
    const changed = dropTarget !== null && dropTarget !== this._lastDropTarget;

    if (changed || dropTarget === null) {
      if (this._lastDropTarget) {
        const event: CustomEvent = new CustomEvent("dragleave", {
          detail: {
            dragData: this.dragData,
            dropZones: this.dropZones
          }
        });

        this._lastDropTarget.dispatchEvent(event);
      }
      this._lastDropTarget = dropTarget;
      if (changed) {
        const event: CustomEvent = new CustomEvent("dragenter", {
          detail: {
            dragData: this.dragData,
            dropZones: this.dropZones
          }
        });

        dropTarget.dispatchEvent(event);
      }
  }

  }

  private onPressUp(ev: GestureDetail) {
    // console.log('LanDrag#onPressUp; ev:', ev);

    const elementBehindCursor = this.getElementBehindCursor(ev.currentX, ev.currentY);
    // console.log('LanDrag#onPressUp; elementBehindCursor:', elementBehindCursor);

    const dropTarget = this.findDropTarget(elementBehindCursor);

    // console.log('LanDrag#onPressUp; dropTarget:', dropTarget);
    if (dropTarget) {

      const event: CustomEvent = new CustomEvent("drop", {
        detail: {
          dragData: this.dragData
        }
      });

      // console.log('LanDrag#onPressUp; dispatchEvent event:', event);
      dropTarget.dispatchEvent(event);
    }

    this.dragEnd();
    this.reset();
  }

  private reset() {
    // console.log('LanDrag#reset');

    this.isDragging = false;
    this._dragElement = undefined;
    this._lastDropTarget = undefined;
  }

  private getElementBehindCursor(x, y): Element {
    const display = this._dragElement.style.display;

    this._dragElement.style.display = 'none';

    let element: Element = document.elementFromPoint(x, y);

    this._dragElement.style.display = display;

    return element;
}


  private findDropTarget(target: Element): Element {
    while (target && !this.isAccepted(target)) {
        target = this.getParent(target);
    }

    return target;
  }

  private isAccepted(target: Element): boolean {
    // console.log('tagName#onPressUp; target.tagName:', target.tagName);

    return (target.tagName === 'LAN-DROP');
  }

  private getParent(element: Element): Element {
    return element.parentElement === null ? null : element.parentElement;
  }

  componentDidLoad() {
    console.log('xxxxxxxxx');
    console.log(window);
    console.log('xxxxxxxxx');
    this._gesture = createPressGesture({
        el: this.el,
        queue: this.queue,
        gestureName: 'dragAndDrop',
        gesturePriority: 90,
        // threshold: 9,
        // time: 251,
        passive: false,
        isEnabled: (detail) => this.isEnabled(detail),
        onPress: (ev) => this.onPress(ev),
        onMove: (ev) => this.onMove(ev),
        onPressUp: (ev) => this.onPressUp(ev)
    });

    this._gesture.setDisabled(false);
  }

  disconnectedCallback() {
    this.dragEnd();
    this.reset();

    if (this._gesture) {
      this._gesture.destroy();
      this._gesture = undefined;
    }
  }

  hostData() {
    return {
      // draggable: (this.isTouch || this.delay === 0).toString(),
      class: {
        'lan-drag-start': this.isDragging
      }
    }
  }

  render() {
    return (
      <div class="container">
        <div id="drag-image-container">
          <slot name="drag-image"></slot>
        </div>
        <slot></slot>
      </div>
    );
  }
}