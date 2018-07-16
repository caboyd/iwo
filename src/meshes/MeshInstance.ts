import { Mesh } from "./Mesh";
import { Material } from "src/materials/Material";
import {mat4} from "gl-matrix";
import {Renderer} from "../graphics/Renderer";

export class MeshInstance {
    mesh: Mesh;
    materials: Material[];

    model_matrix:mat4;
    normal_matrix:mat4;
    
    constructor(mesh: Mesh, materials: Material[]) {
        this.mesh = mesh;
        this.materials = materials;
        
        this.model_matrix = mat4.create();
        this.normal_matrix = mat4.create();
    }
    
    
    render(gl:WebGL2RenderingContext,renderer:Renderer){
        if( this.materials[0].albedo){
            
            this.materials[0].albedo!.bind(gl,0);
            this.materials[0].shader.setIntByName("albedo", 0);
        }
        
        renderer.draw(this.mesh.draw_mode,this.mesh.count,0,this.mesh.index_buffer,this.mesh.vertex_buffer, this.materials[0].shader);
    }
}
