#include <packing>

varying vec2 fragUV;

uniform sampler2D colorTexture;
uniform sampler2D cloudTexture;

void main() {
	vec3 colorTex = texture2D(colorTexture, fragUV).xyz;
	vec4 cloudTex = texture2D(cloudTexture, fragUV);
	gl_FragColor = vec4(mix(colorTex, cloudTex.xyz, cloudTex.w), 1.0);
	//gl_FragColor = vec4(visualizePosition(worldPos), 1.0);
}