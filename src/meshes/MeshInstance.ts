import { Mesh } from "./Mesh";
import { Material } from "../materials/Material";
import {mat4} from "gl-matrix";

export class MeshInstance {
    mesh: Mesh;
    materials: Material[];

    //Transform or Orientation
    model_matrix:mat4;
    

    constructor(mesh: Mesh, materials: Material[]) {
        this.mesh = mesh;
        this.materials = materials;
        
        this.model_matrix = mat4.create();
    }
}
