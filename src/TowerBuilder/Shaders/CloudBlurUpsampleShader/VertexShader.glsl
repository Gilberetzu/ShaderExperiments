varying vec2 fragUV;

void main() {
	fragUV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position.xyz, 1.0 );
}