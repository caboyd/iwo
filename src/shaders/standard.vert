#version 300 es
precision highp float;

layout (location = 0) in vec3 a_vertex;
layout (location = 1) in vec2 a_tex_coord;
layout (location = 2) in vec3 a_normal;
layout (location = 3) in vec3 a_tangent;
layout (location = 4) in vec3 a_bitangent;


uniform mat4 u_modelview_matrix;
uniform mat4 u_normalview_matrix;

uniform mat4 u_mvp_matrix;


out vec3 normal;
out vec2 tex_coord;


void main() {
	 gl_Position = u_mvp_matrix * vec4(a_vertex,1.0f);
	 normal = mat3(u_normalview_matrix) * a_normal;
	 
	 tex_coord = a_tex_coord;
}
