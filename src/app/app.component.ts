import { Component, OnInit, Inject } from '@angular/core';
import { fabric } from 'fabric';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public imageSrc: string;
  public canvas: any;
  public lastSelectedPicture = null;
  public isInsertingCropRectangle = false;
  public target = null;
  public mask = null;
  public crop_rect;
  public isDown;
  public origX;
  public origY;
  public done = false;
  private url = '';
  public colorCode;
  public selectMode = true;

  ngOnInit() {
    this.canvas = new fabric.Canvas('canvas', {
      selectionBorderColor: 'blue',
      selection: true,
      preserveObjectStacking: true,
      backgroundColor: '#333'
    });

    this.canvas.on({
      'mouse:move': (e) => { this.onMove(e); },
      'mouse:down': (e) => { this.onMouseDown(e); },
      'mouse:up': () => { this.onMouseUp(); },
      'object:added': () => { this.onObjectAdded(); },
      'object:modified': (e) => { this.onObjectModified(e); },
      'selection:created': (e) => { this.onSelectionCreated(e); },
      'selection:updated': (e) => { this.onSelectionUpdated(e); }
    });
    this.addImageOnCanvas();
  }

  rasterize() {
    const group = new fabric.Group(this.target.canvas.getObjects(), {
      originX: 'center',
      originY: 'center'
    });
    const link = document.createElement('a');
    link.innerHTML = 'download image';
    link.addEventListener('click', (ev) => {

      link.href = group.toDataURL();
      link.download = 'mypainting.png';
    }, false);
    link.click();
    document.body.appendChild(link);
  }

  addText() {
    var textOptions = {
      fontSize: 16,
      left: this.canvas.getWidth() / 2,
      top: this.canvas.getHeight() / 2,
      radius: 10,
      borderRadius: '25px',
      hasRotatingPoint: true
    };

    var textObject = new fabric.IText('Enter text here...', textOptions);

    this.canvas.add(textObject).setActiveObject(textObject);
  }

  readUrl(event) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        this.url = event.target['result'];
      }
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  switchModeClick() {
    if (this.canvas.isDrawingMode === true) {
      this.canvas.isDrawingMode = false;
      return;
    }
    this.canvas.isDrawingMode = true;
  }

  colorChange() {
    this.canvas.freeDrawingBrush.color = this.colorCode;
  }

  addImageOnCanvas() {
    fabric.Image.fromURL('https://pbs.twimg.com/media/EA02knLWsAAhpbE?format=jpg&name=4096x4096', (img) => {
      img.selectable = true;
      img.id = 'target';
      this.canvas.add(img);
      this.canvas.setHeight(img.height);
      this.canvas.setWidth(img.width);
    });
  }

  onMove(event) {
    if (this.isInsertingCropRectangle === true) {
      if (this.done) {
        this.canvas.renderAll();
        return;
      }
      if (!this.isDown) { return; }
      let pointer = this.canvas.getPointer(event);

      if (this.origX > pointer.x) {
        this.crop_rect.set({
          left: Math.abs(pointer.x)
        });
      }
      if (this.origY > pointer.y) {
        this.crop_rect.set({
          top: Math.abs(pointer.y)
        });
      }

      this.crop_rect.set({
        width: Math.abs(this.origX - pointer.x)
      });
      this.crop_rect.set({
        height: Math.abs(this.origY - pointer.y)
      });


      this.crop_rect.setCoords();
      this.canvas.renderAll();
    } else {

    }
  }

  onMouseDown(event) {

    if (this.canvas.getActiveObject() != null && this.canvas.getActiveObject().get('type') === 'i-text') {
      this.selectMode = false;
    } else {
      this.selectMode = true;
    }

    if (this.isInsertingCropRectangle === true && this.canvas.isDrawingMode === false && this.selectMode === true) {

      if (this.done) {
        this.canvas.renderAll();
        return;
      }
      this.isDown = true;
      const pointer = this.canvas.getPointer(event);
      this.origX = pointer.x;
      this.origY = pointer.y;
      this.crop_rect = new fabric.Rect({
        left: this.origX,
        top: this.origY,
        width: pointer.x - this.origX,
        height: pointer.y - this.origY,
        opacity: .3,
        transparentCorners: false,
        selectable: true,
        id: 'mask'
      });
      this.canvas.add(this.crop_rect);
      this.canvas.renderAll();
    } else {

    }
  }

  onMouseUp() {
    if ((this.canvas.getActiveObject() == null || this.canvas.getActiveObject().get('type') !== 'i-text')
      && (this.crop_rect.width === 0 || this.crop_rect.height === 0)) {
      this.canvas.remove(this.crop_rect);
      return;
    }

    if (this.isInsertingCropRectangle === true && this.canvas.isDrawingMode === false
      && this.selectMode === true) {
      if (this.done) {
        this.canvas.renderAll();
        return;
      }
      this.isDown = false;
      this.crop_rect.set({
        selectable: true
      });
      this.done = true;
    } else {

    }
    console.log(this.crop_rect);
  }

  onObjectAdded() {
    this.target = null;
    this.mask = null;
    this.canvas.forEachObject((obj) => {
      const id = obj.get('id');
      if (id === 'target') {
        this.target = obj;
        this.canvas.setActiveObject(obj);
      }
      if (id === 'mask') {
        this.mask = obj;
      }
    });
  }

  onObjectModified(event) {
    event.target.setCoords();
    this.canvas.renderAll();
  }

  onSelectionCreated(event) {
    this.selectionChanged(event);
  }

  onSelectionUpdated(event) {
    this.selectionChanged(event);
  }

  selectionChanged(event) {
    switch (event.target.type) {
      case 'textbox':
        break;
      case 'image':
        this.lastSelectedPicture = event.target;
        this.lastSelectedPicture.selectable = false;
        this.lastSelectedPicture.setCoords();
        this.lastSelectedPicture.dirty = true;
        this.canvas.renderAll();
        this.canvas.discardActiveObject();
        this.isInsertingCropRectangle = true;
        break;
      case 'rect':
        break;
      case 'group':
        break;
      default:
        break;
    }

  }

  cropClick() {
    if (this.target !== null && this.mask !== null) {
      this.target.setCoords();
      this.mask = this.rescaleMask(this.target, this.mask);
      this.mask.setCoords();
      this.target.clipPath = this.mask;
      this.target.dirty = true;
      this.canvas.setActiveObject(this.target);
      this.target.selectable = true;
      this.canvas.remove(this.mask);
      this.canvas.renderAll();
    }
  }

  rescaleMask(target, mask) {
    mask.scaleX = 1;
    mask.scaleY = 1;

    mask.scaleX /= target.scaleX;
    mask.scaleY /= target.scaleY;

    const targetCenterX = target.width * target.scaleX / 2;
    const targetCenterY = target.height * target.scaleY / 2;

    const maskOverlapX = mask.left - target.left;
    const maskOverlapY = mask.top - target.top;
    let centerBasedX = maskOverlapX - targetCenterX;
    let centerBasedY = maskOverlapY - targetCenterY;

    if (maskOverlapX >= targetCenterX) {
      centerBasedX = (maskOverlapX - targetCenterX) / target.scaleX;
    } else {

      centerBasedX = (-(targetCenterX) + maskOverlapX) / target.scaleX;
    }

    if (maskOverlapY >= targetCenterY) {
      centerBasedY = (maskOverlapY - targetCenterY) / target.scaleY;
    } else {
      centerBasedY = (-(targetCenterY) + maskOverlapY) / target.scaleY;
    }

    mask.left = centerBasedX;
    mask.top = centerBasedY;
    mask.originX = 'left';
    mask.originY = 'top';

    mask.setCoords();
    mask.dirty = true;
    this.canvas.renderAll();

    return (mask);
  }

  changeBrush(event) {
    this.canvas.freeDrawingBrush.width = parseInt(event.value, 10) || 0;
  }

}
