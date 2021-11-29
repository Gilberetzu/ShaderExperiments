export default class Vec3{
	constructor(x, y, z){
		this.x = x;
		this.y = y;
		this.z = z;
	}

	static Zero(){
		return new Vec3(0,0,0);
	}

	static Cross(v1, v2){
		let z1 = v1.z == undefined ? 0 : v1.z;
		let z2 = v2.z == undefined ? 0 : v2.z;
		return new Vec3(
			v1.y * z2   - z1	* v2.y	,
			z1 	 * v2.x - v1.x 	* z2	,
			v1.x * v2.y - v1.y 	* v2.x
		);
	}
}