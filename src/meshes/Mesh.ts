/*
    Base Mesh Class
    A Mesh Contains:
            
 */

import { Geometry } from "geometry/Geometry";
import { DrawMode } from "graphics/WebglConstants";
import { IndexBuffer } from "graphics/IndexBuffer";
import { VertexBuffer } from "graphics/VertexBuffer";
import { SubMesh } from "./SubMesh";
import { BufferedGeometry } from "geometry/BufferedGeometry";

export class Mesh {
    public readonly index_buffer: IndexBuffer | undefined;
    public readonly vertex_buffer: VertexBuffer;

    public draw_mode: DrawMode;
    public readonly sub_meshes: SubMesh[];
    public count: number;

    public constructor(gl: WebGL2RenderingContext, geometry: Geometry | BufferedGeometry) {
        let buf_geom: BufferedGeometry = geometry as BufferedGeometry;
        if (geometry instanceof Geometry) {
            buf_geom =
                geometry.getBufferedGeometry !== undefined
                    ? geometry.getBufferedGeometry()
                    : new BufferedGeometry(geometry as Geometry);
        }

        if (buf_geom.index_buffer !== undefined) this.index_buffer = new IndexBuffer(gl, buf_geom);
        this.vertex_buffer = new VertexBuffer(gl, buf_geom);
        this.sub_meshes = [];
        this.draw_mode = DrawMode.TRIANGLES;
        this.count = 0;

        for (const group of buf_geom.groups) {
            this.count += group.count;
            this.sub_meshes.push(
                new SubMesh(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer)
            );
        }
    }

    public setDrawMode(mode: DrawMode): void {
        this.draw_mode = mode;
    }

    public destroy(gl: WebGL2RenderingContext): void {
        for (const sub_mesh of this.sub_meshes) {
            sub_mesh.destroy();
        }

        if (this.index_buffer) this.index_buffer.destroy(gl);
        this.vertex_buffer.destroy(gl);
    }
}
