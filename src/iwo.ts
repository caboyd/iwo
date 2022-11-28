export * from "./cameras/Camera";
export * from "./cameras/CubeCamera";
export * from "./cameras/OrbitControl";
export * from "./cameras/FPSControl";
export * from "./cameras/Frustum";

export * from "./graphics/attribute/Attribute";
export * from "./graphics/attribute/StandardAttribute";
export * from "./graphics/attribute/LineAttribute";

export * from "./geometry/Geometry";
export * from "./geometry/QuadGeometry";
export * from "./geometry/BoxGeometry";
export * from "./geometry/PlaneGeometry";
export * from "./geometry/SphereGeometry";
export * from "./geometry/LineGeometry";

export * from "./graphics/renderer/RendererStats";
export * from "./graphics/renderer/Renderer";
export * from "./graphics/WebglConstants";
export * from "./graphics/WebglHelper";
export * from "./graphics/Uniform";
export * from "./graphics/IndexBuffer";
export * from "./graphics/UniformBuffer";
export * from "./graphics/VertexBuffer";

export * from "./graphics/textures/Texture2D";
export * from "./graphics/textures/TextureCubeMap";
export * from "./graphics/textures/TextureHelper";

export * from "./graphics/shader/ShaderSources";
export * from "./graphics/shader/Shader";
export * from "./graphics/shader/PBRShader";
export * from "./graphics/shader/BasicShader";
export * from "./graphics/shader/CubemapSpecularPrefilterShader";
export * from "./graphics/shader/EquiToCubemapShader";
export * from "./graphics/shader/LineShader";

export * from "./materials/Material";
export * from "./materials/BasicMaterial";
export * from "./materials/GridMaterial";
export * from "./materials/NormalOnlyMaterial";
export * from "./materials/PBRMaterial";
export * from "./materials/LineMaterial";
export * from "./materials/EmptyMaterial";

export * from "./meshes/SubMesh";
export * from "./meshes/Mesh";
export * from "./meshes/MeshInstance";

export * from "./loader/FileLoader";
export * from "./loader/HDRImageLoader";
export * from "./loader/glTFLoader";
export * from "./loader/ObjLoader";
export * from "./loader/MtlLoader";
export * from "./loader/ImageLoader";
export * from "./loader/TextureLoader";

export * from "./helpers/ReferenceCounter";

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
