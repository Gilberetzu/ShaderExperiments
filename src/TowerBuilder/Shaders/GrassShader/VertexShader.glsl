varying vec2 fUV;
varying vec3 fPosition;
varying vec3 fNormal;
varying float movementMag;
varying mat4 modelMatrixFrag;

uniform float _time;
uniform float _movSpeed;
uniform float _noiseScale;
uniform float _distortionMult;
uniform sampler2D _movementNoiseTex;

void main() {
	fUV = uv;
	
	fNormal = normal;
	modelMatrixFrag = modelMatrix;

	vec3 transformedPosition = (instanceMatrix * vec4(position, 1.0)).xyz;

	if(uv.y > 0.2){
		vec2 base = vec2(transformedPosition.x * _noiseScale, transformedPosition.z * _noiseScale);
		base += vec2(0.2, 0.2) * _movSpeed * (1.0 - uv.y);
		base += vec2(_movSpeed * _time, _movSpeed * _time);
		vec2 xDelta = vec2(0.01, 0);
		vec2 yDelta = vec2(0, 0.01);

		float x0 = texture2D( _movementNoiseTex, base - xDelta ).r;
		float x1 = texture2D( _movementNoiseTex, base + xDelta ).r;

		float y0 = texture2D( _movementNoiseTex, base - yDelta ).r;
		float y1 = texture2D( _movementNoiseTex, base + yDelta ).r;

		vec2 movement = vec2(x1 - x0, y1 - y0) * _distortionMult * uv.y;
		transformedPosition = vec3(transformedPosition.x + movement.x, transformedPosition.y, transformedPosition.z + movement.y);
		movementMag = length(movement);
	}else{
		movementMag = 0.0;
	}

	fPosition = transformedPosition;
	

    gl_Position = projectionMatrix * modelViewMatrix * vec4( transformedPosition, 1.0 );
}