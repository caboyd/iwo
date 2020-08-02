import { Mesh } from "./Mesh";
import { Material } from "materials/Material";
import { mat3, mat4 } from "gl-matrix";
import { Renderer } from "../graphics/Renderer";

export class MeshInstance {
    public mesh: Mesh;
    public materials: Material[] | Material;

    public model_matrix: mat4;

    public constructor(mesh: Mesh, materials: Material[] | Material) {
        this.mesh = mesh;
        this.materials = materials;

        this.model_matrix = mat4.create();
    }

    public render(renderer: Renderer, view_matrix: mat4, proj_matrix: mat4): void {
        renderer.setPerModelUniforms(this.model_matrix, view_matrix, proj_matrix);

        if (Array.isArray(this.materials)) {
            for (const i of this.materials.keys()) {
                const mat = this.materials[i];
                for (const submesh of this.mesh.sub_meshes) {
                    if (submesh.material_index === i) {
                        renderer.draw(
                            this.mesh.draw_mode,
                            submesh.count,
                            submesh.offset,
                            submesh.index_buffer,
                            submesh.vertex_buffer,
                            mat
                        );
                    }
                }
            }
        } else {
            renderer.draw(
                this.mesh.draw_mode,
                this.mesh.count,
                0,
                this.mesh.index_buffer,
                this.mesh.vertex_buffer,
                this.materials
            );
        }
    }
}
