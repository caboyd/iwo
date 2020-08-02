# iwo - A Typescript Webgl2 Physically Based Renderer

iwo is a physically based renderer written in Typescript. This project was created to learn how to create a forward rendering engine from scratch.

### Demo 
[https://caboyd.github.io/iwo-examples/index.html](https://caboyd.github.io/iwo-examples/index.html)

[<img src="https://i.imgur.com/5aFTrlk.png" alt="Typescript PBR Renderer Demoimage">](https://caboyd.github.io/iwo-examples/index.html)

## Installing
This library is a work in progress and not yet published. To use this library look at the examples repo.

## Examples
- https://github.com/caboyd/iwo-examples

## Features
This is a list of features to reference for ideas. Checkmarked features have been implemented.  

### File Loading / Importing
- [x] [Asynchronous File Loading](https://github.com/caboyd/iwo/blob/master/src/loader/FileLoader.ts)
- [x] [HDR Image Loader](https://github.com/caboyd/iwor/blob/master/src/loader/HDRImageLoader.ts)
- [ ] GLTF Importer
- [ ] OBJ Importer

### Geometry Generation
- [x] [Plane](https://github.com/caboyd/iwo/blob/master/src/geometry/PlaneGeometry.ts)
- [x] [Box](https://github.com/caboyd/iwo/blob/master/src/geometry/BoxGeometry.ts)
- [x] [Sphere](https://github.com/caboyd/iwo/blob/master/src/geometry/SphereGeometry.ts)
- [ ] Cylinder
- [ ] Toroid
- [ ] Pyramid
- [ ] Lines
- [ ] Splines

### Rendering
- [x] [Physically Based Shader](https://github.com/caboyd/iwo/blob/master/src/shaders/pbr.frag)
- [x] Image Based Diffuse Lighting
- [x] Image Based Specular Lighting
- [ ] Normal Mapping
- [ ] Parallax mapping - ([Tutorial](http://apoorvaj.io/exploring-bump-mapping-with-webgl.html))
- [ ] Render Targets
- [ ] Render to Cubemap
- [ ] Scene Rendering

### Rendering Performance
- [ ] Frustrum Culling
- [ ] Occlusion Culling
- [ ] Instanced Rendering

### Rendering Other
- [ ] Mouse Picking
- [ ] Line Rendering
- [ ] Font Rendering
- [ ] Fog
- [ ] Motion Blur
- [ ] Screenshots

### Shadows
- [ ] Shadow Mapping
- [ ] Cascaded Shadow Mapping

### Cameras
- [x] [First Person Camera](https://github.com/caboyd/iwo/blob/master/src/cameras/Camera.ts)
- [ ] Third Person (Arcball) Camera
- [ ] Cubemap Camera

### Animation
- [ ] Skeletal animation
- [ ] Transform Feedback Particle System


## Built With
* [gl-matrix](http://glmatrix.net/) - Vector math
* [typescript](https://www.typescriptlang.org/) - Typescript Language
* [rollup](https://rollupjs.org) - Rollup bundler


## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

