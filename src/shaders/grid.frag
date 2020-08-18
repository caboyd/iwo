#version 300 es
precision highp float;

out vec4 frag_color;

in vec3 view_pos;
in vec3 world_pos;

uniform float distance;
uniform float frequency;
uniform float highlight_frequency;

void main() {
	
    vec2 coord = world_pos.xz * 1.0f/frequency;
        
    // Compute anti-aliased world-space grid lines
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = min(grid.x, grid.y);

    //Thick Grid
    vec2 thick_grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord * 5.0);
    float thick_line = min(thick_grid.x, thick_grid.y);

    // Just visualize the grid lines directly
    vec3 color = vec3(0.5 - min(line,1.0));
    float alpha = 1.0 - line;

    //blue lines every x units
    if((mod(world_pos.x + 0.5, highlight_frequency)) < 1. && grid.x < 0.5 ) {
        color += vec3(-0.4,-0.2,0.5);
    }

    //Main blue line where x = 0
    if(abs(world_pos.x) < 0.5 && thick_grid.x < 0.5) {
        color = vec3(0.1,0.3,1.) - thick_grid.x;
        alpha = 1.0 - thick_grid.x;
    }

    //red lines every x units
    if(abs(mod(world_pos.z + 0.5, highlight_frequency)) < 1. && grid.y < 0.5) {
        color += vec3(0.4,-0.4,-0.4);
    }

    //Main red line where z = 0
    if(abs(world_pos.z) < 0.5 && thick_grid.y < 0.5) {
        color = vec3(0.9,0.1,0.1) - thick_grid.y;
        alpha = 1.0 - thick_grid.y;
    }

    float transition = 8.0;
    float dist = length(view_pos);
    dist = dist - (distance - transition);
    dist = dist / transition;

    alpha = clamp(alpha - dist, 0.0, alpha);
    frag_color = vec4(color*alpha, alpha);
}
