#version 300 es
precision highp float;

//##DEFINES

//##END

out vec4 frag_color;

in vec3 view_normal;
in vec3 world_normal;

void main() {
    #ifdef FLATSHADING
        vec3 xTangent = dFdx( world_normal );
        vec3 yTangent = dFdy( world_normal );
        vec3 N = normalize( cross( xTangent, yTangent ) );
    #else
        vec3 N = world_normal;
    #endif

    frag_color = vec4(N, 1.0);
}

