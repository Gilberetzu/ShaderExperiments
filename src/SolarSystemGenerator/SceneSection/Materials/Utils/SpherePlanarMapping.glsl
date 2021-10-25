float InvLerp(float a, float b, float v){
    return (v - a) / (b - a);
}

vec3 SpherePlanarMapping(vec3 positionOS, float cyRad, float cyHeight, float sRad){
    float halfHeight = cyHeight/2.0;
    float maxAngle = atan(halfHeight/ cyRad);

    float planeMag = length(vec2(positionOS.x, positionOS.z));
    float currentVerticalAngle = atan(positionOS.y/ planeMag);
    float currentHeight = cyRad * (positionOS.y / planeMag);
    float verticalMask = smoothstep(maxAngle, maxAngle - 0.3, abs(currentVerticalAngle));
    
    vec2 nUV = vec2(0.0,0.0);

    vec3 planeVector = normalize(vec3(positionOS.x, 0.0, positionOS.z));
    float dotAxis = dot(vec3(1.0,0.0,0.0), planeVector);
    float horizAngle = acos(dotAxis)/3.1415;
    float dotAxisSign = sign(cross(vec3(1.0, 0.0, 0.0), planeVector).y);
    float dotAxisRemap = horizAngle;
    nUV.x = ((dotAxisSign * dotAxisRemap) + 1.0)/2.0;//horizAngle;//((dotAxisSign * dotAxisRemap) + 1)/2; //dotAxisRemap;//((dotAxisSign * dotAxisRemap) + 1)/2;
    nUV.y = InvLerp(-halfHeight, halfHeight, currentHeight);//* verticalMask;

    return vec3(nUV, verticalMask);
}