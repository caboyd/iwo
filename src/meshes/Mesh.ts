/*
    Base Mesh Class
    A Mesh Contains:
            
 */

import { AttributeType, Geometry, Group } from "geometry/Geometry";
import { DrawMode } from "graphics/WebglConstants";
import { IndexBuffer } from "graphics/IndexBuffer";
import { VertexBuffer } from "graphics/VertexBuffer";
import { SubMesh } from "./SubMesh";
import { BufferedGeometry, GeometryBuffer } from "geometry/BufferedGeometry";

export class Mesh {
    public readonly index_buffer: IndexBuffer | undefined;
    public readonly vertex_buffer: VertexBuffer;

    public draw_mode: DrawMode;
    public sub_meshes: SubMesh[];
    public count: number;

    public constructor(gl: WebGL2RenderingContext, geometry: Geometry | BufferedGeometry) {
        let buf_geom: BufferedGeometry = geometry as BufferedGeometry;
        if (geometry instanceof Geometry) {
            buf_geom =
                geometry.getBufferedGeometry !== undefined
                    ? geometry.getBufferedGeometry()
                    : BufferedGeometry.fromGeometry(geometry);
        }

        if (buf_geom.index_buffer !== undefined) this.index_buffer = new IndexBuffer(gl, buf_geom);
        this.vertex_buffer = new VertexBuffer(gl, buf_geom);

        this.sub_meshes = [];
        this.draw_mode = buf_geom.draw_mode ?? DrawMode.TRIANGLES;
        this.count = 0;

        if (buf_geom.groups === undefined || buf_geom.groups.length == 0) {
            //If a geometry has no groups we can assume:
            //  count is indices count or vertices count /3
            //  material is 0
            //  offset is 0
            this.count =
                buf_geom.index_buffer !== undefined
                    ? buf_geom.index_buffer.buffer.length
                    : buf_geom.buffers[buf_geom.attributes[AttributeType.Vertex].buffer_index].buffer.length / 3;
            this.sub_meshes.push(new SubMesh(0, 0, this.count, this.vertex_buffer, this.index_buffer));
        } else {
            for (const group of buf_geom.groups) {
                this.count += group.count;
                this.sub_meshes.push(
                    new SubMesh(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer)
                );
            }
        }
    }

    updateGeometryBuffer(gl:WebGL2RenderingContext, buf_geom:BufferedGeometry): void {
        // if (buf_geom.index_buffer !== undefined) {
        //     this.index_buffer?.bufferData(gl,buf_geom.index_buffer);
        // }
        this.vertex_buffer.updateBufferData(gl, buf_geom)
        

        // this.sub_meshes = [];
        // this.draw_mode = buf_geom.draw_mode ?? DrawMode.TRIANGLES;
        // this.count = 0;

        // if (buf_geom.groups === undefined || buf_geom.groups.length == 0) {
        //     //If a geometry has no groups we can assume:
        //     //  count is indices count or vertices count /3
        //     //  material is 0
        //     //  offset is 0
        //     this.count =
        //         buf_geom.index_buffer !== undefined
        //             ? buf_geom.index_buffer.buffer.length
        //             : buf_geom.buffers[buf_geom.attributes[AttributeType.Vertex].buffer_index].buffer.length / 3;
        //     this.sub_meshes.push(new SubMesh(0, 0, this.count, this.vertex_buffer, this.index_buffer));
        // } else {
        //     for (const group of buf_geom.groups) {
        //         this.count += group.count;
        //         this.sub_meshes.push(
        //             new SubMesh(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer)
        //         );
        //     }
        // }
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
