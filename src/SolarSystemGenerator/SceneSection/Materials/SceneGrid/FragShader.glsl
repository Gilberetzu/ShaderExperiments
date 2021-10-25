varying vec3 vPosition;
varying vec3 viewVector;
varying mat4 modelMatrixFrag;

void main() {
	vec3 posWS = (modelMatrixFrag * vec4(vPosition, 1.0)).xyz;
	float horizontalMod = mod(posWS.x - 0.25, 0.5);
	float verticalMod = mod(posWS.z - 0.25, 0.5);

	float hLines = step(horizontalMod, 0.03);
	float vLines = step(verticalMod, 0.03);

	float line = hLines + vLines;
	if(line < 0.5){
		discard;
	}else{
		gl_FragColor = vec4(0.5,0.5,0.5,0.2);
	}
}