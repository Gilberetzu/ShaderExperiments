varying vec2 fUV;
varying vec3 fPosition;
varying vec3 fNormal;
varying mat4 modelMatrixFrag;

void main() {
	fUV = uv;
	fPosition = position;
	fNormal = normal;
	modelMatrixFrag = modelMatrix;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}