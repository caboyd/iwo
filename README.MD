# iwo - A Typescript Webgl2 Physically Based Renderer

iwo is a physically based renderer written in Typescript. This project was created to learn how to create a forward rendering engine from scratch.

### Demo 
[https://caboyd.github.io/iwo-examples/index.html](https://caboyd.github.io/iwo-examples/index.html)

[<img src="https://i.imgur.com/5aFTrlk.png" alt="Typescript PBR Renderer Demoimage">](https://caboyd.github.io/iwo-examples/index.html)

## Installing
```
npm i iwo-renderer gl-matrix
```

This library requires a bundler like rollup and depends on gl-matrix.
To use this library look at my example game [Underwater Game](https://github.com/caboyd/underwater_game)

## Examples
- https://github.com/caboyd/iwo-examples
- https://github.com/caboyd/underwater_game

## Features
This is a list of features to reference for ideas. Checkmarked features have been implemented.  

### File Loading / Importing
- [x] [Asynchronous File Loading](https://github.com/caboyd/iwo/blob/master/src/loader/FileLoader.ts)
- [x] [HDR Image Loader](https://github.com/caboyd/iwor/blob/master/src/loader/HDRImageLoader.ts)  
- :construction: GLTF Importer
- :construction: OBJ Importer


### Geometry Generation
- [x] [Plane](https://github.com/caboyd/iwo/blob/master/src/geometry/PlaneGeometry.ts)
- [x] [Box](https://github.com/caboyd/iwo/blob/master/src/geometry/BoxGeometry.ts)
- [x] [Sphere](https://github.com/caboyd/iwo/blob/master/src/geometry/SphereGeometry.ts)
- [x] [Lines](https://github.com/caboyd/iwo/blob/master/src/geometry/LineGeometry.ts)
- [ ] Cylinder
- [ ] Toroid
- [ ] Pyramid
- [ ] Splines

### Rendering
- [x] [Physically Based Shader](https://github.com/caboyd/iwo/blob/master/src/shaders/pbr.frag)
- [x] Image Based Diffuse Lighting
- [x] Image Based Specular Lighting
- [ ] Normal Mapping
- [ ] Parallax mapping - ([Tutorial](http://apoorvaj.io/exploring-bump-mapping-with-webgl.html))
- [ ] Volumetric Rendering
- [ ] 
- [ ] Render Targets
- [x] Render to Cubemap
- [ ] Scene Rendering

### Rendering Performance
- [ ] Frustum Culling
- [ ] Occlusion Culling
- [ ] Instanced Rendering

### Rendering Other
- [ ] Mouse Picking
- [x] Line Rendering
- [ ] Font Rendering
- [ ] Fog
- [ ] Motion Blur


### Shadows
- [ ] Shadow Mapping
- [ ] Cascaded Shadow Mapping

### Cameras
- [x] [First Person Camera](https://github.com/caboyd/iwo/blob/master/src/cameras/Camera.ts)
- [x] Third Person (Arcball/Orbit) Camera
- [x] Cubemap Camera

### Animation
- [ ] Skeletal animation
- [ ] Transform Feedback Particle System


## Built With
* [gl-matrix](http://glmatrix.net/) - Vector math
* [typescript](https://www.typescriptlang.org/) - Typescript Language
* [rollup](https://rollupjs.org) - Rollup bundler


## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

