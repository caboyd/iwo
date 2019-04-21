import {Mesh} from "./Mesh";
import {Material} from "src/materials/Material";
import {mat3, mat4} from "gl-matrix";
import {Renderer} from "../graphics/Renderer";

export class MeshInstance {
    mesh: Mesh;
    materials: Material[] | Material;

    model_matrix: mat4;

    constructor(mesh: Mesh, materials: Material[] | Material) {
        this.mesh = mesh;
        this.materials = materials;

        this.model_matrix = mat4.create();
    }

    render(renderer: Renderer, view_matrix: mat4, proj_matrix: mat4) {
           renderer.setPerModelUniforms(this.model_matrix,view_matrix,proj_matrix);

        if (Array.isArray(this.materials)) {
            for (let i of this.materials.keys()) {
                let mat = this.materials[i];
                for (let submesh of this.mesh.sub_meshes) {
                    if (submesh.material_index === i) {
                        renderer.draw(this.mesh.draw_mode, submesh.count, submesh.offset, submesh.index_buffer, submesh.vertex_buffer, mat);
                    }

                }
            }
        } else {
            renderer.draw(this.mesh.draw_mode, this.mesh.count, 0, this.mesh.index_buffer, this.mesh.vertex_buffer, this.materials);
        }
    }
}
