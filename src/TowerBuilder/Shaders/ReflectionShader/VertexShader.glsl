varying vec2 fUV;
varying vec3 fPosition;
varying vec3 fNormal;
varying mat4 modelMatrixFrag;

uniform float _time;
uniform float _movSpeed;
uniform float _noiseScale;
uniform float _distortionMult;
uniform sampler2D _movementNoiseTex;

float InvLerp(float a, float b, float v){
    return (v - a) / (b - a);
}

void main() {
	fUV = uv;
	fPosition = position;
	fNormal = normal;
	modelMatrixFrag = modelMatrix;

	float depthGradient = clamp(InvLerp(0.0, 3.5, position.y), 0.0, 1.0);
	vec3 transformedPosition = position.xyz;

	vec2 base = vec2(position.x * _noiseScale, position.z * _noiseScale);
	base += vec2(0.2, 0.2) * _movSpeed * depthGradient;
	base += vec2(_movSpeed * _time, _movSpeed * _time);
	vec2 xDelta = vec2(0.01, 0);
	vec2 yDelta = vec2(0, 0.01);

	float x0 = texture2D( _movementNoiseTex, base - xDelta ).r;
	float x1 = texture2D( _movementNoiseTex, base + xDelta ).r;

	float y0 = texture2D( _movementNoiseTex, base - yDelta ).r;
	float y1 = texture2D( _movementNoiseTex, base + yDelta ).r;

	vec2 movement = vec2(x1 - x0, y1 - y0) * _distortionMult * depthGradient;
	transformedPosition = vec3(position.x + movement.x, position.y, position.z + movement.y);

    gl_Position = projectionMatrix * modelViewMatrix * vec4( transformedPosition, 1.0 );
}