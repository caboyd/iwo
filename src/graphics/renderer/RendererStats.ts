export class RendererStats {
    public shader_bind_count: number = 0;
    public material_bind_count: number = 0;
    public index_buffer_bind_count: number = 0;
    public vertex_buffer_bind_count: number = 0;

    public index_draw_count: number = 0;
    public vertex_draw_count: number = 0;

    public draw_calls: number = 0;

    public constructor() {
        this.reset();
    }

    public reset(): void {
        this.shader_bind_count = 0;
        this.material_bind_count = 0;
        this.index_buffer_bind_count = 0;
        this.vertex_buffer_bind_count = 0;
        this.vertex_draw_count = 0;
        this.index_draw_count = 0;
        this.draw_calls = 0;
    }
}
