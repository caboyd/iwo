# Typescript Webgl2 Physically Based Renderer

Physically Based Renderer written in Typescript. This project was created to learn how to create a forward rendering engine from scratch.

### Demo 
[https://caboyd.github.io/ts-pbr-renderer/index.html](https://caboyd.github.io/ts-pbr-renderer/index.html)

[<img src="https://i.imgur.com/5aFTrlk.png" alt="Typescript PBR Renderer Demoimage">](https://caboyd.github.io/ts-pbr-renderer/index.html)

## Features
This is a list of features to reference for ideas. Checkmarked features have been implemented.  

### File Loading / Importing
- [x] [Asynchronous File Loading](https://github.com/caboyd/ts-pbr-renderer/blob/master/src/loader/FileLoader.ts)
- [x] [HDR Image Loader](https://github.com/caboyd/ts-pbr-renderer/blob/master/src/loader/HDRImageLoader.ts)
- [ ] GLTF Importer
- [ ] OBJ Importer

### Geometry Generation
- [x] [Plane](https://github.com/caboyd/ts-pbr-renderer/blob/master/src/geometry/PlaneGeometry.ts)
- [x] [Box](https://github.com/caboyd/ts-pbr-renderer/blob/master/src/geometry/BoxGeometry.ts)
- [x] [Sphere](https://github.com/caboyd/ts-pbr-renderer/blob/master/src/geometry/SphereGeometry.ts)
- [ ] Cylinder
- [ ] Toroid
- [ ] Pyramid
- [ ] Lines
- [ ] Splines

### Rendering
- [x] [Physically Based Shader](https://github.com/caboyd/ts-pbr-renderer/blob/master/src/shaders/pbr.frag)
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
- [x] [First Person Camera](https://github.com/caboyd/ts-pbr-renderer/blob/master/src/cameras/Camera.ts)
- [ ] Third Person (Arcball) Camera
- [ ] Cubemap Camera

### Animation
- [ ] Skeletal animation
- [ ] Transform Feedback Particle System

## Getting Started

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

installations of node and npm

### Installing

Download repository locally

install node modules

```
npm install
```

Run development environment

```
npm run dev
```

## Deployment

### Github pages
 
https://gist.github.com/cobyism/4730490#gistcomment-2375522

#### Pre-Setup
Make sure there is a gh-pages branch in the repository. If not then create an empty one.
Commit and push anything in master branch because it will be deleted locally

```
git checkout --orphan gh-pages
git rm --cached -r .
```
Delete all of the files then commit an empty branch
```
git commit -m "First commit" --allow-empty
git push -u origin gh-pages
```
Get the master branch back
```
git checkout master
git pull origin master
```

#### Setup

Set up a git worktree to deploy to gh-pages

```
rm -rf dist
echo "dist/" >> .gitignore
git worktree add dist gh-pages
```

#### Deploy

Run the gh-publish command

```
npm run gh-publish
```

Which just runs these commands

```
npm run build
cd dist
git add --all
git commit -m "Deploy to gh-pages"
git push origin gh-pages
cd ..
```

## Built With

* [file-loader](https://www.npmjs.com/package/file-loader) - File loader for webpack
* [gl-matrix](http://glmatrix.net/) - Vector math
* [html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin) - HTML templater
* [imagemin-webpack-plugin](https://www.npmjs.com/package/imagemin-webpack-plugin) - Compress images
* [raw-loader](https://www.npmjs.com/package/raw-loader) - require files as strings
* [ts-loader](https://www.npmjs.com/package/ts-loader) - require ts files
* [typescript](https://www.typescriptlang.org/) - Typescript Language
* [webpack](https://webpack.js.org/) - Build tool
* [webpack-cli](https://www.npmjs.com/package/webpack-cli)
* [webpack-dev-server](https://www.npmjs.com/package/webpack-dev-server) - Hotload development environment


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

