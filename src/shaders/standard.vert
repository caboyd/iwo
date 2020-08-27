#version 300 es
precision highp float;

layout (location = 0) in vec3 a_vertex;
layout (location = 1) in vec2 a_tex_coord;
layout (location = 2) in vec3 a_normal;
layout (location = 3) in vec3 a_tangent;
layout (location = 4) in vec3 a_bitangent;


layout (std140) uniform ubo_per_frame{
                          // base alignment   // aligned offset
    mat4 view;            // 64               // 0
    mat4 view_inverse;    // 64               // 64
    mat4 projection;      // 64               // 128
    mat4 view_projection; // 64               // 192

};

layout (std140) uniform ubo_per_model{
                          // base alignment   // aligned offset
    mat4 model_view;      // 64               // 0
    mat3 normal_view;     // 48               // 64
    mat4 mvp;             // 64               // 112
};

out vec3 local_pos;
out vec3 view_pos;
out vec3 world_pos;
out vec2 tex_coord;
out vec3 view_normal;
out vec3 world_normal;
out vec3 camera_pos;
//out mat3 TBN;

vec3 inverseTransformDirection(in vec3 normal, in mat4 matrix) {
    return normalize( (vec4(normal,0.0) * matrix).xyz );
}

vec3 calculate_tangent(vec3 n) {
    vec3 v = vec3(1.0, 0.0, 0.0);
    float d = dot(v, n);
    if (abs(d) < 1.0e-3) {
        v = vec3(0.0, 1.0, 0.0);
        d = dot(v, n);
    }
    return normalize(v - d * n);
}

void main() {
    gl_Position = mvp * vec4(a_vertex,1.0f);

//
//    vec3 n = normalize(gl_NormalMatrix * gl_Normal);
//    vec3 t = calculate_tangent(n);
//    vec3 b = cross(n, t);
//    TBN = mat3(t,b,n);

    camera_pos = inverse(view)[3].xyz;
    local_pos = a_vertex;
    view_pos = (model_view * vec4(a_vertex,1.0f)).xyz ;
    view_normal =  normal_view * a_normal ;
    world_pos = (view_inverse * vec4(view_pos, 1.0)).xyz;
    world_normal = normalize(inverseTransformDirection( view_normal, view ));
        
    tex_coord =  a_tex_coord;
}
