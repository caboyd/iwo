#version 300 es

// Input vertex data, different for all executions of this shader.
layout(location = 0) in vec3 a_vertex;

// Output data ; will be interpolated for each fragment.
out vec2 tex_coord;

void main()
{
	gl_Position =  vec4(a_vertex, 1.0);
	tex_coord = (a_vertex.xy + vec2(1.0, 1.0)) / 2.0;
}