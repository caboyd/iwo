import { AttributeType, Geometry, Group } from "./Geometry";

export class SphereGeometry implements Geometry {
    indices: Uint16Array | Uint32Array | undefined;
    attribute_flags: number;
    attributes: Map<AttributeType, ArrayBufferView>;
    groups: Group[];

    isInterleaved: boolean;
    interleaved_attributes: Float32Array;

    //Bounding Sphere

    //Bounding Box (AABB)

    constructor(
        radius: number,
        horizontal_segments: number,
        vertical_segments: number,
        phi_start: number = 0,
        phi_length: number = (2 * Math.PI),
        theta_start = 0,
        theta_length: number = Math.PI
    ) {
        this.attribute_flags = AttributeType.Vertex |AttributeType.Normals | AttributeType.Tex_Coords;
        this.attributes = new Map<AttributeType, ArrayBufferView>();
        this.groups = [];
        this.isInterleaved = false;
        this.interleaved_attributes = new Float32Array(1);

        let v_segments = Math.floor(vertical_segments);
        if (v_segments < 2) v_segments = 2;
        let h_segments = Math.floor(horizontal_segments);
        if (h_segments < 3) h_segments = 3;

        //180 theta should be full top to bottom
        //if theta is 90 then should be only top half of circle
        let theta_per_ring = (theta_length - theta_start) / v_segments;

        //360 phi should be full ring around
        let phi_per_quad = (phi_length - phi_start) / h_segments;

        let verts = [];
        let tex_coords = [];
        let indices = [];
        let index = 0;
        
        let start_y = theta_start - Math.PI/2;
        for (let v = 0; v < v_segments; v++) {
            //theta is y
            let theta0 = start_y + theta_per_ring * v;
            let cos_theta0 = Math.cos(theta0);
            
            let theta1 = start_y + theta_per_ring * (v + 1);
            let cos_theta1 = Math.cos(theta1);

            let y0 = radius * Math.sin(theta0);
            let y1 = radius * Math.sin(theta1);

            //Draw a ring
            for (let h = 0; h <= h_segments; h++) {
                let phi = phi_start + phi_per_quad * h;
                let sin_phi = Math.sin(phi);
                let cos_phi = Math.cos(phi);

                //sin_theta0 determins distance from center;
                //top and bottom poles have x,z at 0.
                let x0 = cos_phi * cos_theta0 * radius;
                let z0 = sin_phi * cos_theta0 * radius;
                
                let x1 = cos_phi * cos_theta1 * radius;
                let z1 = sin_phi * cos_theta1 * radius;

                //Get the topleft vertex
                verts.push(x0, y0, z0);
               
                //get bottom left vertex
                verts.push(x1, y1, z1);
                
                let u = phi / (2*Math.PI);
                let v = (theta0/Math.PI) + 0.5;
                tex_coords.push(u,v);

                let q = Math.atan2(x1/radius, z1/radius);
                u = phi / (2*Math.PI) ;
                v =  (theta1/Math.PI) + 0.5;
                tex_coords.push(u,v);
                
            }

            for (let h = 0; h < h_segments; h++) {
                let i = index;
                indices.push(i, i + 1, i + 2, i + 2, i + 1, i + 3);
                index += 2;
            }
            index += 2;
        }

        this.attributes.set(AttributeType.Vertex, new Float32Array(verts));
        this.attributes.set(AttributeType.Normals, new Float32Array(verts));
        this.attributes.set(AttributeType.Tex_Coords, new Float32Array(tex_coords));
        if (verts.length >= 65536) {
            this.indices = new Uint32Array(indices);
        }
        else this.indices = new Uint16Array(indices);
        
        this.groups.push({ count: indices.length, offset: 0, material_index: 0 } as Group);
    }
}
