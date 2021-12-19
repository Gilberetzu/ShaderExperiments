varying vec2 fUV;
varying vec3 fPosition;
varying vec3 fNormal;

varying mat4 modelMatrixFrag;

void main() {
	vec3 direction = normalize(vec3(1,-2,1));

	vec3 posWS = (modelMatrixFrag * vec4(fPosition, 1.0)).xyz;
    vec3 viewVecNorm = normalize(posWS - cameraPosition);

	
	vec3 correctedNormal = -sign(dot(viewVecNorm, fNormal)) * fNormal;
	float light = dot(correctedNormal, direction);

	float heightGradient = mix(0.4, 1.0, clamp(fPosition.y / 7.0, 0.0, 1.0));
	float materialIndex = floor(fUV.x * 8.0);
	float intensity = floor(fUV.y * 8.0) / 7.0;
	vec3 color = vec3(0.0, 0.0, 0.0); //* heightGradient;
	if(materialIndex <= 0.01){
		color = vec3(0.3,0.3,0.35);
	}else if(materialIndex <= 1.01){
		color = vec3(0.4,0.75,0.3);
	}else if(materialIndex <= 2.01){
		color = vec3(0.4,0.4,0.45);
	}else if(materialIndex <= 3.01){
		color = vec3(0.2,0.2,1.0);
	}else if(materialIndex <= 4.01){
		color = vec3(0.6,1.0,1.0);//vec3(0.6,0.9,1.0);
	}else if(materialIndex <= 5.01){
		color = vec3(0.6,1.0,1.0) * 0.75;
	}else if(materialIndex <= 6.01){
		color = vec3(0.65,0.35,0.35);
	}else{
		color = vec3(0.85,0.8,0.9);
	}
	color *= heightGradient * intensity;
	gl_FragColor = vec4(color.xyz, 1.0);
}