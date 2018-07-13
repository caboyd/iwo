export class AttributeBuffer{
    public buffer:WebGLBuffer;
    public component_size:GLint;
    public type:GLenum;
    public normalized:GLboolean;
    
    constructor(buffer:WebGLBuffer,component_size:GLint, type:GLenum, normalized:GLboolean){
        this.buffer = buffer;
        this.component_size = component_size;
        this.type = type;
        this.normalized = normalized;

    }
}