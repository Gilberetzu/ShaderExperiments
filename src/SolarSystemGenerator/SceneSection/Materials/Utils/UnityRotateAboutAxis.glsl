void Unity_RotateAboutAxis_Radians_float(vec3 In, vec3 Axis, float Rotation, out vec3 Out)
{
    float s = sin(Rotation);
    float c = cos(Rotation);
    float one_minus_c = 1.0 - c;

    Axis = normalize(Axis);
    vec3 r0 = vec3(one_minus_c * Axis.x * Axis.x + c, one_minus_c * Axis.x * Axis.y - Axis.z * s, one_minus_c * Axis.z * Axis.x + Axis.y * s);
    vec3 r1 = vec3(one_minus_c * Axis.x * Axis.y + Axis.z * s, one_minus_c * Axis.y * Axis.y + c, one_minus_c * Axis.y * Axis.z - Axis.x * s);
    vec3 r2 = vec3(one_minus_c * Axis.z * Axis.x - Axis.y * s, one_minus_c * Axis.y * Axis.z + Axis.x * s, one_minus_c * Axis.z * Axis.z + c);

    mat3 rot_mat;
    rot_mat[0] = r0;
    rot_mat[1] = r1;
    rot_mat[2] = r2;

    Out = (rot_mat * In).xyz;
}