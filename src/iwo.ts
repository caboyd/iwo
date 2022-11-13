export { WebGL } from "./graphics/WebglHelper";
export { ReferenceCounter } from "./helpers/ReferenceCounter";

export { Camera } from "./cameras/Camera";
export { CubeCamera } from "./cameras/CubeCamera";
export { OrbitControl } from "./cameras/OrbitControl";
export { FPSControl } from "./cameras/FPSControl";
export { Frustum } from "cameras/Frustum";

export { Geometry } from "./geometry/Geometry";
export { BufferedGeometry } from "./geometry/BufferedGeometry";
export { BoxGeometry } from "./geometry/BoxGeometry";
export { PlaneGeometry } from "./geometry/PlaneGeometry";
export { SphereGeometry } from "./geometry/SphereGeometry";
export { LineGeometry } from "./geometry/LineGeometry";

export { AttributeBuffer } from "./graphics/AttributeBuffer";
export { IndexBuffer } from "./graphics/IndexBuffer";
export { UniformBuffer } from "./graphics/UniformBuffer";
export { VertexBuffer } from "./graphics/VertexBuffer";

export { Texture2D } from "./graphics/Texture2D";
export { TextureCubeMap } from "./graphics/TextureCubeMap";
export { TextureHelper } from "./graphics/TextureHelper";
export { Uniform } from "./graphics/Uniform";

export { ShaderSource } from "graphics/shader/ShaderSources";

export { Material } from "./materials/Material";
export { BasicMaterial } from "./materials/BasicMaterial";
export { GridMaterial } from "./materials/GridMaterial";
export { NormalOnlyMaterial } from "./materials/NormalOnlyMaterial";
export { PBRMaterial } from "./materials/PBRMaterial";
export { LineMaterial } from "./materials/LineMaterial";

export { SubMesh } from "./meshes/SubMesh";
export { Mesh } from "./meshes/Mesh";
export { MeshInstance } from "./meshes/MeshInstance";

export { FileLoader } from "./loader/FileLoader";
export { HDRImageLoader, HDRBuffer } from "./loader/HDRImageLoader";
export { glTFLoader, glTFData } from "./loader/glTFLoader";
export { ObjLoader, ObjData, ObjOptions } from "./loader/ObjLoader";
export { MtlLoader, MtlData } from "./loader/MtlLoader";
export { ImageLoader } from "./loader/ImageLoader";
export { TextureLoader } from "./loader/TextureLoader";

export { RendererStats } from "./graphics/RendererStats";
export { Renderer } from "./graphics/Renderer";

export * from "./graphics/WebglConstants";

export function initGL(canvas: HTMLCanvasElement): WebGL2RenderingContext {
    try {
        const gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
        if (!gl) {
            alert("WebGL is not available on your browser.");
        }
        return gl;
    } catch (e) {
        throw new Error("GL init error:\n" + e);
    }
}
