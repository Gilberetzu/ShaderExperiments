varying vec3 vPosition;
varying vec3 viewVector;
varying mat4 modelMatrixFrag;

uniform float _iTime;
uniform vec2 _heightMaskInvLerp;
uniform vec2 _heightMask;
uniform float _expansionSpeed;
uniform float _expansionScale;
uniform float _expansionScaleHeightOffset;
uniform float _expansionDistance;

uniform float _screwHeightMaskMultiplier;
uniform float _screwInterpMultiplier;
uniform float _screwMultiplier;

uniform float _voronoiScale;
uniform float _noiseSample2Scale;

uniform float _fresnelPower;
uniform vec2 _fresnelRemap;

uniform vec3 _color1;
uniform vec3 _color2;

uniform float _radius;

uniform float _densityMultiplier;

uniform float _fireRemapMax;
uniform vec3 _fireColor;

uniform float _outerLightPower;
uniform vec3 _outerColor;