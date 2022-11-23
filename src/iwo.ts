export * from "./cameras/Camera";
export * from "./cameras/CubeCamera";
export * from "./cameras/OrbitControl";
export * from "./cameras/FPSControl";
export * from "./cameras/Frustum";

export * from "./geometry/attribute/StandardAttribute";
export * from "./geometry/attribute/Attribute";

export * from "./geometry/Geometry";
export * from "./geometry/BufferedGeometry";
export * from "./geometry/BoxGeometry";
export * from "./geometry/PlaneGeometry";
export * from "./geometry/SphereGeometry";
export * from "./geometry/LineGeometry";

export * from "./graphics/RendererStats";
export * from "./graphics/Renderer";
export * from "./graphics/WebglConstants";
export * from "./graphics/WebglHelper";
export * from "./graphics/Uniform";
export * from "./graphics/AttributeBuffer";
export * from "./graphics/IndexBuffer";
export * from "./graphics/UniformBuffer";
export * from "./graphics/VertexBuffer";

export * from "./graphics/Texture2D";
export * from "./graphics/TextureCubeMap";
export * from "./graphics/TextureHelper";

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
