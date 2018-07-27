

export class UniformBuffer{
    id: WebGLBuffer;
    
    constructor(gl:WebGL2RenderingContext){
        this.id = gl.createBuffer()!;
    }
    
}