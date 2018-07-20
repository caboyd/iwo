#version 300 es
precision highp float;

in vec3 normal;
in vec2 tex_coord;
in vec3 pos;


out vec4 frag_color;

uniform vec3 u_eye_pos;
uniform sampler2D albedo;


uniform bool active_textures[1];

void main() {
    vec3 color = vec3(1.0);

    if(active_textures[0])
        color = texture(albedo,tex_coord).rgb;
    else 
        color = normal;

   	frag_color =vec4( color, 1.0);


}
