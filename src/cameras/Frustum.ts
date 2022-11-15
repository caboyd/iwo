import { glMatrix, mat4, vec3, vec4 } from "gl-matrix";
import { Camera } from "./camera";

export type FrustumOptions = {
    clip_near: number;
    clip_far: number;
    fov: number;
};

export const DefaultFrustumOptions = {
    clip_near: 1,
    clip_far: 25,
    fov: 60,
} as const;

export class Frustum {
    private opt: FrustumOptions;

    private min_x: number = 0;
    private max_x: number = 0;
    private min_y: number = 0;
    private max_y: number = 0;
    private min_z: number = 0;
    private max_z: number = 0;
    private readonly light_view_matrix: mat4;
    private readonly camera: Readonly<Camera>;

    private far_height: number = 0;
    private far_width: number = 0;
    private near_height: number = 0;
    private near_width: number = 0;

    constructor(
        gl: WebGL2RenderingContext,
        light_view_matrix: mat4,
        camera: Readonly<Camera>,
        options?: Partial<FrustumOptions>
    ) {
        this.opt = { ...DefaultFrustumOptions, ...options };
        this.light_view_matrix = light_view_matrix;
        this.camera = camera;
        this.calculateWidthsAndHeights(gl);
    }

    /**
     * Updates the bounds of the shadow box based on the light direction and the
     * camera's view frustum, to make sure that the box covers the smallest area
     * possible while still ensuring that everything inside the camera's view
     * (within a certain range) will cast shadows.
     */
    public update() {
        let points: vec3[] = this.calculateFrustumVertices(this.light_view_matrix);

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
    }

    /**
     * Calculates the center of the "view cuboid" in light space first, and then
     * converts this to world space using the inverse light's view matrix.
     *
     * @return The center of the "view cuboid" in world space.
     */
    public getCenter(): vec3 {
        const x = (this.min_x + this.max_x) / 2.0;
        const y = (this.min_y + this.max_y) / 2.0;
        const z = (this.min_z + this.max_z) / 2.0;
        const cen: vec3 = vec3.fromValues(x, y, z);

        const inverted_light: mat4 = mat4.invert(mat4.create(), this.light_view_matrix);
        let result = vec3.transformMat4(vec3.create(), cen, inverted_light);
        return result;
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
     * Calculates the position of the vertex at each corner of the view frustum
     * in world space transformed to spatial_transofrm space (8 vertices in total, so this returns 8 positions).
     *
     * @param spatial_transform - the transform space to multiply the world space points
     *
     */
    public calculateFrustumVertices(spatial_transform: mat4 = mat4.create()): vec3[] {
        let forward_vector: vec3 = vec3.clone(this.camera.getForward());
        let up_vector: vec3 = vec3.clone(this.camera.getUp());
        let to_far: vec3 = vec3.scale(vec3.create(), forward_vector, this.opt.clip_far);
        let to_near: vec3 = vec3.scale(vec3.create(), forward_vector, this.opt.clip_near);
        let center_near: vec3 = vec3.add(vec3.create(), to_near, this.camera.position);
        let center_far: vec3 = vec3.add(vec3.create(), to_far, this.camera.position);

        const right_vector: vec3 = vec3.cross(vec3.create(), forward_vector, up_vector);
        const down_vector: vec3 = vec3.negate(vec3.create(), up_vector);
        const left_vector: vec3 = vec3.negate(vec3.create(), right_vector);
        const far_top: vec3 = vec3.scaleAndAdd(vec3.create(), center_far, up_vector, this.far_height);
        const far_bottom: vec3 = vec3.scaleAndAdd(vec3.create(), center_far, down_vector, this.far_height);
        const near_top: vec3 = vec3.scaleAndAdd(vec3.create(), center_near, up_vector, this.near_height);
        const near_bottom: vec3 = vec3.scaleAndAdd(vec3.create(), center_near, down_vector, this.near_height);

        let points: vec3[] = Array<vec3>(8);
        points[0] = this.calculateFrustumCorner(spatial_transform, far_top, right_vector, this.far_width);
        points[1] = this.calculateFrustumCorner(spatial_transform, far_top, left_vector, this.far_width);
        points[2] = this.calculateFrustumCorner(spatial_transform, far_bottom, right_vector, this.far_width);
        points[3] = this.calculateFrustumCorner(spatial_transform, far_bottom, left_vector, this.far_width);
        points[4] = this.calculateFrustumCorner(spatial_transform, near_top, right_vector, this.near_width);
        points[5] = this.calculateFrustumCorner(spatial_transform, near_top, left_vector, this.near_width);
        points[6] = this.calculateFrustumCorner(spatial_transform, near_bottom, right_vector, this.near_width);
        points[7] = this.calculateFrustumCorner(spatial_transform, near_bottom, left_vector, this.near_width);
        return points;
    }

    /**
     * Calculates one of the corner vertices of the view frustum in world space
     * and converts it to light space.
     *
     * @param start_point
     *            - the starting center point on the view frustum.
     * @param direction
     *            - the direction of the corner from the start point.
     * @param width
     *            - the distance of the corner from the start point.
     * @return - The relevant corner vertex of the view frustum in light space.
     */
    public calculateFrustumCorner(
        spacial_transform_matrix: mat4,
        start_point: vec3,
        direction: vec3,
        width: number
    ): vec3 {
        const point: vec3 = vec3.add(
            vec3.create(),
            start_point,
            vec3.fromValues(direction[0] * width, direction[1] * width, direction[2] * width)
        );
        let point4f: vec4 = vec4.fromValues(point[0], point[1], point[2], 1.0);
        point4f = vec4.transformMat4(point4f, point4f, spacial_transform_matrix);
        return [point4f[0], point4f[1], point4f[2]];
    }

    /**
     * Calculates the width and height of the near and far planes of the
     * camera's view frustum. However, this doesn't have to use the "actual" far
     * plane of the view frustum. It can use a shortened view frustum if desired
     * by bringing the far-plane closer, which would increase shadow resolution
     * but means that distant objects wouldn't cast shadows.
     */
    public calculateWidthsAndHeights(gl: WebGL2RenderingContext): void {
        this.far_width = this.opt.clip_far * Math.tan(glMatrix.toRadian(this.opt.fov));
        this.near_width = -this.opt.clip_near * Math.tan(glMatrix.toRadian(this.opt.fov));
        this.far_height = this.far_width / (gl.drawingBufferWidth / gl.drawingBufferHeight);
        this.near_height = this.near_width / (gl.drawingBufferWidth / gl.drawingBufferHeight);
    }

    public getOrtho(out: mat4): mat4 {
        mat4.ortho(out, this.min_x, this.max_x, this.min_y, this.max_y, this.min_z, this.max_z);
        return out;
    }

    public getOrthoVertices(spatial_transform: mat4 = mat4.create()): vec3[] {
        let points: vec3[] = Array<vec3>(8);

        points[0] = [this.min_x, this.max_y, this.max_z];
        points[1] = [this.max_x, this.max_y, this.max_z];
        points[2] = [this.min_x, this.min_y, this.max_z];
        points[3] = [this.max_x, this.min_y, this.max_z];
        points[4] = [this.min_x, this.max_y, this.min_z];
        points[5] = [this.max_x, this.max_y, this.min_z];
        points[6] = [this.min_x, this.min_y, this.min_z];
        points[7] = [this.max_x, this.min_y, this.min_z];

        for (const point of points) {
            let point4f: vec4 = vec4.fromValues(point[0], point[1], point[2], 1.0);
            point4f = vec4.transformMat4(point4f, point4f, spatial_transform);
            point[0] = point4f[0] / point4f[3];
            point[1] = point4f[1] / point4f[3];
            point[2] = point4f[2] / point4f[3];
        }
        return points;
    }
}
