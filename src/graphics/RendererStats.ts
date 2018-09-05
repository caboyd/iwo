export class RendererStats{
    
    shader_bind_count:number = 0;
    material_bind_count:number = 0;
    index_buffer_bind_count:number = 0;
    vertex_buffer_bind_count:number = 0;
    
    index_draw_count:number = 0;
    vertex_draw_count:number = 0;
    
    draw_calls:number = 0;
    
    constructor(){
        this.reset();
    }
    
    reset(){
        this.shader_bind_count = 0;
        this.material_bind_count = 0;
        this.index_buffer_bind_count = 0;
        this.vertex_buffer_bind_count = 0;
        this.index_draw_count = 0;
        this.vertex_draw_count = 0;
        this.draw_calls = 0;
    }
}