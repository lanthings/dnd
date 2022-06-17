import { Component, h } from '@stencil/core';


@Component({
  tag: 'lan-drag-image',
  styleUrl: 'drag-image.css',
  shadow: true
})
export class LanDragImage {

  render() {
    return (
      <div class="container">
        <ion-icon name="hand"></ion-icon>
      </div>
    );
  }
}
