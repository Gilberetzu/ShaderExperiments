varying vec2 fUV;
varying vec3 fPosition;
varying vec3 fNormal;

uniform vec3 seaColor;
uniform vec3 skyColor;
uniform vec3 sunColor;
uniform vec3 lightDirection;
//varying mat4 modelMatrixFrag;

float InvLerp(float a, float b, float v){
    return (v - a) / (b - a);
}

void main() {
	//vec4 worldSpacePosition = modelMatrixFrag * vec4(fPosition, 1.0);\
	
	vec3 norm = normalize(fNormal);

	float gradient = clamp(dot(norm, vec3(0,1,0)), 0.0, 1.0);
	vec3 bgColor = mix(seaColor, skyColor, gradient);

	float sun = clamp(InvLerp(-0.997, -0.995,dot(norm, lightDirection)), 0.0, 1.0);
	float sunOuter = clamp(InvLerp(-0.995, -0.985,dot(norm, lightDirection)), 0.0, 1.0);
	sunOuter = sin(sunOuter * 1.57);

	bgColor = mix(vec3(1,1,1), mix(sunColor, bgColor, sunOuter), sun);
	gl_FragColor = vec4(bgColor, 1.0);
}