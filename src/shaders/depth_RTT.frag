#version 300 es
precision highp  float;
// Ouput data
layout(location = 0) out float fragment_depth;

void main(){
    // Not really needed, OpenGL does it anyway
    fragment_depth = gl_FragCoord.z;
}