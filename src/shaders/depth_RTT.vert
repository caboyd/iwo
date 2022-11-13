#version 300 es


layout(location = 0) in vec3 a_vertex;

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


void main()
{
	gl_Position =  mvp * vec4(a_vertex, 1.0);
}