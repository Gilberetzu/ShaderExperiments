varying vec3 vPosition;
varying vec3 viewVector;
varying mat4 modelMatrixFrag;

uniform float _iTime;
uniform vec3 _color0;
uniform vec3 _color1;
uniform vec3 _color2;
uniform vec3 _colorStars;

uniform float _densityMult;

uniform float _mainNoiseScale;
uniform float _mainNoiseScrew;

uniform float _noise1Mult;
uniform float _noise1Scale;
uniform float _noise1Screw;
uniform float _noise1Speed;

uniform float _noise2Mult;
uniform float _noise2Scale;
uniform float _noise2Screw;
uniform float _noise2Speed;

uniform vec2 _noiseMaskSmoothStep;
uniform vec3 _noiseMaskOffset;
uniform float _noiseMaskScale;

uniform vec2 _noiseStarSmoothStep;
uniform float _noiseStarScale;
uniform float _noiseStarMaskSpeed;

uniform float _stepSize;
