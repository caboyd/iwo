import { StandardAttribute } from "geometry/attribute/StandardAttribute";
import { BufferedGeometry } from "geometry/BufferedGeometry";
import { GL } from "graphics/WebglConstants";
import { Geometry } from "./Geometry";

export class SphereGeometry extends Geometry {
    public constructor(
        radius: number,
        horizontal_segments: number,
        vertical_segments: number,
        phi_start: number = 0,
        phi_length: number = 2 * Math.PI,
        theta_start = 0,
        theta_length: number = Math.PI
    ) {
        super();

        const flip_u = horizontal_segments < 0;
        const flip_v = vertical_segments < 0;

        let v_segments = Math.floor(Math.abs(vertical_segments));
        if (v_segments < 2) v_segments = 2;
        let h_segments = Math.floor(Math.abs(horizontal_segments));
        if (h_segments < 3) h_segments = 3;

        //180 theta should be full top to bottom
        //if theta is 90 then should be only top half of circle
        const theta_per_ring = (theta_length - theta_start) / v_segments;

        //360 phi should be full ring around
        const phi_per_quad = (phi_length - phi_start) / h_segments;

        const verts = [];
        const tex_coords = [];
        const indices = [];
        let index = 0;

        const start_y = theta_start - Math.PI / 2;
        for (let v = 0; v < v_segments; v++) {
            //theta is y
            const theta0 = start_y + theta_per_ring * v;
            const cos_theta0 = Math.cos(theta0);

            const theta1 = start_y + theta_per_ring * (v + 1);
            const cos_theta1 = Math.cos(theta1);

            const y0 = radius * Math.sin(theta0);
            const y1 = radius * Math.sin(theta1);

            //Draw a ring
            for (let h = 0; h <= h_segments; h++) {
                const phi = phi_start + phi_per_quad * h;
                const sin_phi = Math.sin(phi);
                const cos_phi = Math.cos(phi);

                //cos_theta0 determines distance from center;
                //top and bottom poles have x,z at 0.
                const x0 = cos_phi * cos_theta0 * radius;
                const z0 = sin_phi * cos_theta0 * radius;

                const x1 = cos_phi * cos_theta1 * radius;
                const z1 = sin_phi * cos_theta1 * radius;

                //Get the top left vertex
                verts.push(x0, y0, z0);

                //get bottom left vertex
                verts.push(x1, y1, z1);

                let u = phi / (2 * Math.PI);
                let v = theta0 / Math.PI + 0.5;
                tex_coords.push(flip_u ? 1.0 - u : u, flip_v ? 1.0 - v : v);

                u = phi / (2 * Math.PI);
                v = theta1 / Math.PI + 0.5;
                tex_coords.push(flip_u ? 1.0 - u : u, flip_v ? 1.0 - v : v);
            }

            for (let h = 0; h < h_segments; h++) {
                const i = index;
                indices.push(i, i + 1, i + 2, i + 2, i + 1, i + 3);
                index += 2;
            }
            index += 2;
        }

        const vert_buff = new Float32Array(verts);
        this.attributes.set(StandardAttribute.Type.Vertex, vert_buff);
        this.attributes.set(StandardAttribute.Type.Normal, vert_buff);
        this.attributes.set(StandardAttribute.Type.Tex_Coord, new Float32Array(tex_coords));
        if (verts.length >= 65536) this.indices = new Uint32Array(indices);
        else this.indices = new Uint16Array(indices);

        //this.groups?.push({ count: indices.length, offset: 0, material_index: 0 } as Group);
    }

    public getBufferedGeometry(): BufferedGeometry {
        const attrib = StandardAttribute.SingleBufferApproach();
        const verts = this.attributes.get(StandardAttribute.Type.Vertex)!;
        const tex_coords = this.attributes.get(StandardAttribute.Type.Tex_Coord)!;
        const index_buffer = { buffer: this.indices, target: GL.ELEMENT_ARRAY_BUFFER };

        const v_buf = new Float32Array(verts.length + tex_coords.length);
        v_buf.set(verts);
        v_buf.set(tex_coords, verts.length);

        attrib[1].byte_offset = verts.length * 4;

        return {
            attributes: attrib,
            index_buffer: index_buffer,
            buffers: [{ buffer: v_buf, target: GL.ARRAY_BUFFER }],
            groups: this.groups,
        } as BufferedGeometry;
    }
}
