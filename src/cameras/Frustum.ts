import { glMatrix, mat4, vec3, vec4 } from "gl-matrix";

export type FrustumOptions = {
    clip_near: number;
    clip_far: number;
    fov: number;
};

export const DefaultFrustumOptions = {
    clip_near: 1,
    clip_far: 20,
    fov: 60,
} as const;

export class Frustum {
    private opt: FrustumOptions;

    private far_height!: number;
    private far_width!: number;
    private near_height!: number;
    private near_width!: number;

    private min_x: number = 0;
    private max_x: number = 0;
    private min_y: number = 0;
    private max_y: number = 0;
    private min_z: number = 0;
    private max_z: number = 0;

    constructor(gl: WebGL2RenderingContext, options?: Partial<FrustumOptions>) {
        this.opt = { ...DefaultFrustumOptions, ...options };
        this.calculateWidthsAndHeights(gl);
    }

    /**
     *
     * @param spacial_transform_matrix - This should be inverse_view_matrix
     */
    public update(spacial_transform_matrix: mat4) {
        const points = this.calculateFrustumCorners(spacial_transform_matrix);

        let first = true;
        for (let i = 0; i < 8; i++) {
            if (first) {
                this.min_x = points[i][0];
                this.max_x = points[i][0];
                this.min_y = points[i][1];
                this.max_y = points[i][1];
                this.min_z = points[i][2];
                this.max_z = points[i][2];
                first = false;
                continue;
            }
            if (points[i][0] > this.max_x) {
                this.max_x = points[i][0];
            } else if (points[i][0] < this.min_x) {
                this.min_x = points[i][0];
            }
            if (points[i][1] > this.max_y) {
                this.max_y = points[i][1];
            } else if (points[i][1] < this.min_y) {
                this.min_y = points[i][1];
            }
            if (points[i][2] > this.max_z) {
                this.max_z = points[i][2];
            } else if (points[i][2] < this.min_z) {
                this.min_z = points[i][2];
            }
        }
        //this.max_z += 7;
    }

    /**
     * Return the corners of the frustum first generated in camera space then multiplied by supplied spacial_transform_matrix
     * @param {mat4} spacial_transform_matrix - The matrix space you want the corners to be return in. ex. inverse_view_matrix for world space
     */
    public calculateFrustumCorners(spacial_transform_matrix: mat4): number[][] {
        const far_top_left = [-this.far_width / 2, this.far_height / 2, -this.opt.clip_far];
        const far_top_right = [this.far_width / 2, this.far_height / 2, -this.opt.clip_far];
        const far_bottom_left = [-this.far_width / 2, -this.far_height / 2, -this.opt.clip_far];
        const far_bottom_right = [this.far_width / 2, -this.far_height / 2, -this.opt.clip_far];
        const near_top_left = [-this.near_width / 2, this.near_height / 2, -this.opt.clip_near];
        const near_top_right = [this.near_width / 2, this.near_height / 2, -this.opt.clip_near];
        const near_bottom_left = [-this.near_width / 2, -this.near_height / 2, -this.opt.clip_near];
        const near_bottom_right = [this.near_width / 2, -this.near_height / 2, -this.opt.clip_near];

        const points = [
            far_top_left,
            far_top_right,
            far_bottom_left,
            far_bottom_right,
            near_top_left,
            near_top_right,
            near_bottom_left,
            near_bottom_right,
        ];

        for (const point of points) {
            //move point to camera space
            let point4f: vec4 = vec4.fromValues(point[0], point[1], point[2], 1.0);
            vec4.transformMat4(point4f, point4f, spacial_transform_matrix);

            //perspetive divite w component
            point[0] = point4f[0] / point4f[3];
            point[1] = point4f[1] / point4f[3];
            point[2] = point4f[2] / point4f[3];
        }

        return points;
    }

    public calculateWidthsAndHeights(gl: WebGL2RenderingContext): void {
        this.near_height = this.opt.clip_near * 2 * Math.tan(glMatrix.toRadian(this.opt.fov) / 2);
        this.near_width = this.near_height * (gl.drawingBufferWidth / gl.drawingBufferHeight);

        this.far_height = this.opt.clip_far * 2 * Math.tan(glMatrix.toRadian(this.opt.fov) / 2);
        this.far_width = this.far_height * (gl.drawingBufferWidth / gl.drawingBufferHeight);
    }

    /**
     * @return The width of the "view cuboid" (orthographic projection area).
     */
    public getWidth(): number {
        return this.max_x - this.min_x;
    }

    /**
     * @return The height of the "view cuboid" (orthographic projection area).
     */
    public getHeight(): number {
        return this.max_y - this.min_y;
    }

    /**
     * @return The length of the "view cuboid" (orthographic projection area).
     */
    public getLength(): number {
        return this.max_z - this.min_z;
    }

    /**
     *
     * @return The center of the "view cuboid" in world space.
     */
    public getCenter(): vec3 {
        const x = (this.min_x + this.max_x) / 2.0;
        const y = (this.min_y + this.max_y) / 2.0;
        const z = (this.min_z + this.max_z) / 2.0;
        const cen: vec3 = vec3.fromValues(x, y, z);
        return cen;
    }

    public getOrtho(out: mat4): mat4 {
        mat4.ortho(out, this.min_x, this.max_x, this.min_y, this.max_y, this.min_z, this.max_z);
        return out;
    }
}
