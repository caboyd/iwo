#version 300 es
precision highp float;

out vec4 frag_color;

in vec3 view_pos;
in vec3 world_pos;

uniform float distance;
uniform float frequency;

void main() {
	
    vec2 coord = world_pos.xz * frequency;
        
    // Compute anti-aliased world-space grid lines
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = min(grid.x, grid.y);
    
    // Just visualize the grid lines directly
    vec3 color = vec3(0.5 - min(line,1.0));
    float alpha = 1.0 - line;
    
    if(abs(world_pos.z) < 0.1 && grid.y <= 0.7) {
        color = vec3(0.9,0.1,0.1);
        alpha = 0.8;
    }
    
     if(abs(world_pos.x) <= 0.1  && grid.x <= 0.7) {
        color = vec3(0.1,0.3,1.0);
        alpha = 0.8;
     }
     
    float transition = 10.0;
    float dist = length(view_pos);
    dist = dist - (distance - transition);
    dist = dist / transition;
    alpha = clamp(alpha - dist, 0.0, alpha);
    
    frag_color = vec4(color, alpha);
    	
}
