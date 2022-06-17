import { Component, Element, h, Listen, Prop, State } from '@stencil/core';


@Component({
  tag: 'lan-drop',
  styleUrl: 'drop.css',
  shadow: true
})
export class LanDrop {

  @Element() el: HTMLElement;

  @Prop() dropZones: string = '';

  @State() isDropAllowed: boolean = false;


  @Listen('dragenter')
  onDragEnter(ev: CustomEvent) {

    const d = ev.detail.dropZones;
    let dragElementDropZones: string[] = [];
    if (d) {
      dragElementDropZones = d.split(',');
    }

    const dropElementDropZones: string[] = (!this.dropZones || this.dropZones === '' ? [] : this.dropZones.split(','));

    // console.log('lan-drag dropZones', dragElementDropZones);
    // console.log('lan-drop dropZones', dropElementDropZones);

    if (dragElementDropZones.length === 0 && dropElementDropZones.length === 0) {
      this.isDropAllowed = true;
      return;
    }

    const isDropZone: string = dropElementDropZones.find((dropElementDropZone: string) => dragElementDropZones.includes(dropElementDropZone));
    if (isDropZone) {
      this.isDropAllowed = true;
      return;
    }

    this.isDropAllowed = false;
  }

  @Listen('dragleave')
  onDragLeave(_ev: DragEvent) {
    this.isDropAllowed = false;
  }

  @Listen('drop')
  onDrop(_ev: CustomEvent) {
    // console.log('LanDrop#drop; ev:', _ev);

    if (this.isDropAllowed) {
      // console.log('LanDrop#drop; ev:', _ev.detail.dragData);
    }

    this.isDropAllowed = false;
  }


  hostData() {
    return {
      class: {
        'lan-drag-over': this.isDropAllowed
      }
    }
  }

  render() {
    return (
      <div class="container">
        <slot></slot>
      </div>
    );
  }
}
