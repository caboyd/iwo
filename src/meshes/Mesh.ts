/*
    Base Mesh Class
    A Mesh Contains:
            
 */

import { Geometry } from "src/geometry/Geometry";
import { DrawMode } from "../webgl2/Webgl2Constants";
import { VertexBuffer } from "./VertexBuffer";
import { IndexBuffer } from "./IndexBuffer";
import { Webgl2IndexBuffer } from "src/webgl2/Webgl2IndexBuffer";
import { Webgl2VertexBuffer } from "src/webgl2/Webgl2VertexBuffer";
import { SubMesh } from "./SubMesh";

export class Mesh {
    public readonly index_buffer: IndexBuffer | undefined;
    public readonly vertex_buffer: VertexBuffer;

    public draw_mode: DrawMode;
    public readonly sub_meshes: SubMesh[];

    constructor(gl: WebGL2RenderingContext, geometry: Geometry) {
        if (geometry.indices) this.index_buffer = new Webgl2IndexBuffer(gl, geometry);
        this.vertex_buffer = new Webgl2VertexBuffer(gl, geometry);
        this.sub_meshes = [];
        this.draw_mode = DrawMode.TRIANGLES;

        for (let group of geometry.groups) {
            this.sub_meshes.push(
                new SubMesh(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer)
            );
        }
    }

    public setDrawMode(mode: DrawMode): void {
        this.draw_mode = mode;
    }

    public destroy(gl: WebGL2RenderingContext):void {
        for (let sub_mesh of this.sub_meshes) {
            sub_mesh.destroy();
        }

        if (this.index_buffer) this.index_buffer.destroy(gl);
        this.vertex_buffer.destroy(gl);
    }
}
