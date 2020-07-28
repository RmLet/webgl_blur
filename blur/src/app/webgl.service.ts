import { Injectable, ElementRef, NgZone } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class WebGlService {
    public ctx: WebGLRenderingContext
    private prog:WebGLProgram
    private vertex = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        uniform vec2 u_resolution;
        varying vec2 v_texCoord;
        
        void main() {
            vec2 zeroToOne = a_position / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            v_texCoord = a_texCoord;
        }
    `
    
    private fragment = `
        precision mediump float;
        uniform sampler2D u_image;
        uniform vec2 u_textureSize;
        uniform float iter;
        varying vec2 v_texCoord;

        void main() {
            vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
            vec4 Color;
            const int MAX_ITERATIONS = 20;
            if (iter > 0.0) { 
                int count = 5 + (4 * int(iter));
                Color = (texture2D(u_image, v_texCoord) + 
                    texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) + 
                    texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0)) + 
                    texture2D(u_image, v_texCoord + vec2(0.0, onePixel.y)) + 
                    texture2D(u_image, v_texCoord + vec2(0.0, -onePixel.y))
                );
                for (int i = 0; i <= MAX_ITERATIONS; i++) {
                    int iterator_plus = i + 1;
                    if (iterator_plus > int(iter)) {
                        break;
                    } else {
                        Color += texture2D(u_image, v_texCoord + vec2(onePixel.x * float(iterator_plus), 0.0)) + 
                        texture2D(u_image, v_texCoord + vec2(-onePixel.x * float(iterator_plus), 0.0)) + 
                        texture2D(u_image, v_texCoord + vec2(0.0, onePixel.y * float(iterator_plus))) + 
                        texture2D(u_image, v_texCoord + vec2(0.0, -onePixel.y * float(iterator_plus)));
                    }
                }
                Color = Color / float(count);
                gl_FragColor = vec4(Color.rgb,1.0);
            } else {
                gl_FragColor = texture2D(u_image,v_texCoord);
            }
        }
    `

    public initCanvasWebGl(canvas: ElementRef<HTMLCanvasElement>): void {
        this.ctx = canvas.nativeElement.getContext('webgl', {preserveDrawingBuffer: true});
        if (!this.ctx) {
            alert("Ваш браузер не поддержиывает webgl")
        }
        this.prepareProgram()
    }


    private prepareProgram() {
        const vertSh = this.ctx.createShader(this.ctx.VERTEX_SHADER);
        this.ctx.shaderSource(vertSh, this.vertex);
        this.ctx.compileShader(vertSh);
        const fragSh = this.ctx.createShader(this.ctx.FRAGMENT_SHADER);
        this.ctx.shaderSource(fragSh, this.fragment);
        this.ctx.compileShader(fragSh);
        this.prog = this.ctx.createProgram();
        this.ctx.attachShader(this.prog , vertSh);
        this.ctx.attachShader(this.prog , fragSh);
        this.ctx.linkProgram(this.prog );
        this.ctx.useProgram(this.prog );
    }


    private setRectangle(x, y, width, height) {
        const x1 = x;
        const x2 = x + width;
        const y1 = y;
        const y2 = y + height;
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2,
        ]), this.ctx.STATIC_DRAW);
    }


  

    public render(image:any, iterator:number) {
        var positionLocation = this.ctx.getAttribLocation(this.prog, "a_position");
        var texcoordLocation = this.ctx.getAttribLocation(this.prog, "a_texCoord");
        var positionBuffer = this.ctx.createBuffer();
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, positionBuffer);
        this.setRectangle(0, 0, image.width, image.height);
        var texcoordBuffer = this.ctx.createBuffer();
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, texcoordBuffer);
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array([
                0.0,  0.0,
                1.0,  0.0,
                0.0,  1.0,
                0.0,  1.0,
                1.0,  0.0,
                1.0,  1.0,
        ]), this.ctx.STATIC_DRAW);
        var texture = this.ctx.createTexture();
        this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture);
        this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_S, this.ctx.CLAMP_TO_EDGE);
        this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_T, this.ctx.CLAMP_TO_EDGE);
        this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MIN_FILTER, this.ctx.NEAREST);
        this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MAG_FILTER, this.ctx.NEAREST);
        this.ctx.texImage2D(this.ctx.TEXTURE_2D, 0, this.ctx.RGBA, this.ctx.RGBA, this.ctx.UNSIGNED_BYTE, image);
        var resolutionLocation = this.ctx.getUniformLocation(this.prog, "u_resolution");
        var textureSizeLocation = this.ctx.getUniformLocation(this.prog, "u_textureSize");
        var iteratorLocation = this.ctx.getUniformLocation(this.prog, "iter");
        this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.clearColor(0, 0, 0, 0);
        this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
        this.ctx.useProgram(this.prog);
        this.ctx.enableVertexAttribArray(positionLocation);
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, positionBuffer);
        var size = 2;  
        var type = this.ctx.FLOAT; 
        var normalize = false; 
        var stride = 0;       
        var offset = 0;      
        this.ctx.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);
        this.ctx.enableVertexAttribArray(texcoordLocation);
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, texcoordBuffer);
        this.ctx.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);
        this.ctx.uniform2f(resolutionLocation, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.uniform2f(textureSizeLocation, image.width, image.height);
        this.ctx.uniform1f(iteratorLocation, iterator);
        var primitiveType = this.ctx.TRIANGLES;
        var offset = 0;
        var count = 6;
        this.ctx.drawArrays(primitiveType, offset, count);
    }
}