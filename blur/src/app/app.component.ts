import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { WebGlService } from './webgl.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  @ViewChild('canvas', { static: true })
  private canvas: ElementRef<HTMLCanvasElement>

  @ViewChild('save_canvas', { static: true })
  private save_canvas: ElementRef<HTMLCanvasElement>


  private ctx: CanvasRenderingContext2D;
  @ViewChild('file', { static: true })
  private file: ElementRef<HTMLElement>
  public sliderValue = 0
  value = 0
  max = 10
  min = 0
  step = 1
  private image:any;
  constructor (public service: WebGlService) {}


  ngOnInit(): void {
    this.ctx = this.save_canvas.nativeElement.getContext('2d');
    this.service.initCanvasWebGl(this.canvas);
  }


  preview(files:any) {
    if (files.length === 0) {
      return;
    }
    var mimeType = files[0].type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }
    var reader = new FileReader();
    reader.readAsDataURL(files[0]); 
    reader.onload = (_event) => { 
      this.image = new Image();
      this.image.src = reader.result;
      this.image.onload =  () => {
        this.canvas.nativeElement.width = this.image.width;
        this.canvas.nativeElement.height = this.image.height;
        this.save_canvas.nativeElement.width = this.image.width;
        this.save_canvas.nativeElement.height = this.image.height;
        this.service.render(this.image, 0);
      }
    }
  }

  save_image() {
    if (!this.image) {
      return;
    }
    this.ctx.drawImage(this.service.ctx.canvas, 0, 0);
    const url = this.save_canvas.nativeElement.toDataURL("image/png").replace("image/png", "image/octet-stream");
    window.location.href = url;
  }

  emit_input_click() {
    this.file.nativeElement.click();
  }

  onInput(event:any) {
    if (!this.image) {
      return;
    }
    this.sliderValue = event.target.value
    this.service.render(this.image, this.sliderValue)
  }
}
