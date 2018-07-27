export class Texture2D {
    public texture_id: WebGLTexture;


    constructor(gl: WebGL2RenderingContext, image: HTMLImageElement | null, alpha: boolean = false, flip: boolean = true) {
        this.texture_id = gl.createTexture()!;
        //gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        let format = alpha ? gl.RGBA : gl.RGB;
        if (flip) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        
        
        if (image && image.complete && image.src) {
            Texture2D.load(gl,image,format);
        } else {
            if(image)
                image.addEventListener("load", () => {
                    Texture2D.load(gl,image,format);
                }, {once: true});
            // Fill the texture with a 16x16 pink/black checkerboard to denote missing texture.
            //prettier-ignore
            gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 16, 16,
                0, gl.RGBA, gl.UNSIGNED_BYTE, pink_black_checkerboard
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        }
    }

    public bind(gl: WebGL2RenderingContext, location: number): void {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
    }
    
    public setImage(gl:WebGL2RenderingContext, image:HTMLImageElement, alpha: boolean = false, flip: boolean = true):void{
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        let format = alpha ? gl.RGBA : gl.RGB;
        if (flip) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        Texture2D.load(gl, image, format);
    }

    private static load(gl:WebGL2RenderingContext, image:HTMLImageElement, format:number): void {
        gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
    

}

//prettier-ignore
let arr = [];
for(let i = 0; i < 16; i++){
    for(let j = 0; j < 8; j++) {
        if(i & 1)
            arr.push(
                0, 0, 0, 255,// black
                255, 0, 255, 255, //pink
            );
        else{
            arr.push(
                255, 0, 255, 255, //pink
                0, 0, 0, 255,// black
            );
        }
    }
}
let pink_black_checkerboard = new Uint8Array(arr);