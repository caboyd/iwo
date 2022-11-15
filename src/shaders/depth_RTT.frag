#version 300 es
precision highp  float;
// Ouput data
layout(location = 1) out float fragment_depth;
layout(location = 0) out vec4 color;

void main(){
    // Not really needed, OpenGL does it anyway
    fragment_depth = gl_FragCoord.z;
    color = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);
}