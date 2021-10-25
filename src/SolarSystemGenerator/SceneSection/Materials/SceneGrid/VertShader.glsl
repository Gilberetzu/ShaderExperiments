varying vec3 vPosition;
varying mat4 modelMatrixFrag;
varying vec3 viewVector;

void main() {
    vPosition = position;

    vec4 posInView = modelViewMatrix * vec4(position, 1.0);
    posInView /= posInView[3];
    vec3 VinView = normalize(posInView.xyz); 
    viewVector = VinView;

    modelMatrixFrag = modelMatrix;
    //vec3 vPositionWS = (modelMatrix * vec4(position, 1.0)).xyz;
    //viewVector = normalize(vPositionWS - cameraPosition);

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}