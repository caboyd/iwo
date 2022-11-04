export { Camera } from "./cameras/Camera";
export { OrbitControl } from "./cameras/OrbitControl";
export { FPSControl } from "./cameras/FPSControl";
export { CubeCamera } from "./cameras/CubeCamera";
export { BoxGeometry } from "./geometry/BoxGeometry";
export { Geometry } from "./geometry/Geometry";
export { BufferedGeometry } from "./geometry/BufferedGeometry";
export { PlaneGeometry } from "./geometry/PlaneGeometry";
export { SphereGeometry } from "./geometry/SphereGeometry";
export { AttributeBuffer } from "./graphics/AttributeBuffer";
export { IndexBuffer } from "./graphics/IndexBuffer";
export { Renderer } from "./graphics/Renderer";
export { RendererStats } from "./graphics/RendererStats";
export { Texture2D } from "./graphics/Texture2D";
export { TextureCubeMap } from "./graphics/TextureCubeMap";
export { TextureHelper } from "./graphics/TextureHelper";
export { Uniform } from "./graphics/Uniform";
export { UniformBuffer } from "./graphics/UniformBuffer";
export { VertexBuffer } from "./graphics/VertexBuffer";
export * from "./graphics/WebglConstants";
export { WebGL } from "./graphics/WebglHelper";
export { ReferenceCounter } from "./helpers/ReferenceCounter";
export { FileLoader } from "./loader/FileLoader";
export { HDRImageLoader, HDRBuffer } from "./loader/HDRImageLoader";
export { glTFLoader, glTFData } from "./loader/glTFLoader";
export { ObjLoader, ObjData, ObjOptions } from "./loader/ObjLoader";
export { MtlLoader, MtlData } from "./loader/MtlLoader";
export { ImageLoader } from "./loader/ImageLoader";
export { TextureLoader } from "./loader/TextureLoader";
export { BasicMaterial } from "./materials/BasicMaterial";
export { GridMaterial } from "./materials/GridMaterial";
export { Material } from "./materials/Material";
export { NormalOnlyMaterial } from "./materials/NormalOnlyMaterial";
export { PBRMaterial } from "./materials/PBRMaterial";
export { Mesh } from "./meshes/Mesh";
export { MeshInstance } from "./meshes/MeshInstance";
export { SubMesh } from "./meshes/SubMesh";

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
