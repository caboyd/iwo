#version 300 es
precision highp float;

out vec4 frag_color;

in vec3 view_normal;
in vec3 world_normal;

uniform bool u_flat_shading;

void main() {
    vec3 N = world_normal;
    
    if(u_flat_shading){
        vec3 xTangent = dFdx( world_normal );
        vec3 yTangent = dFdy( world_normal );
        N = normalize( cross( xTangent, yTangent ) );
    }

    frag_color = vec4(N, 1.0);
}

