export default class Vec3{
	constructor(x, y, z){
		this.x = x;
		this.y = y;
		this.z = z;
	}

	static Zero(){
		return new Vec3(0,0,0);
	}

	static Cross(v1, v2, vRes = null){
		const z1 = v1.z == undefined ? 0 : v1.z;
		const z2 = v2.z == undefined ? 0 : v2.z;
		
		if(vRes == null){
			vRes = Vec3.Zero();
		}
		vRes.x = v1.y 	* z2   - z1		* v2.y;
		vRes.y = z1 	* v2.x - v1.x 	* z2;
		vRes.z = v1.x 	* v2.y - v1.y 	* v2.x;
		
		return vRes;
	}

	static Add(v1, v2, vRes = null){
		const z1 = v1.z == undefined ? 0 : v1.z;
		const z2 = v2.z == undefined ? 0 : v2.z;

		if(vRes == null){
			vRes = Vec3.Zero();
		}
		vRes.x = v1.x	+	v2.x;
		vRes.y = v1.y 	+ 	v2.y;
		vRes.z = z1 	+ 	z2; 

		return vRes;
	}

	static Subtract(v1, v2, vRes = null){
		const z1 = v1.z == undefined ? 0 : v1.z;
		const z2 = v2.z == undefined ? 0 : v2.z;

		if(vRes == null){
			vRes = Vec3.Zero();
		}
		vRes.x = v1.x	-	v2.x;
		vRes.y = v1.y 	- 	v2.y;
		vRes.z = z1 	- 	z2; 

		return vRes;
	}

	static MultComp(v1, v2, vRes = null){
		const z1 = v1.z == undefined ? 0 : v1.z;
		const z2 = v2.z == undefined ? 0 : v2.z;

		if(vRes == null){
			vRes = Vec3.Zero();
		}
		vRes.x = v1.x	*	v2.x;
		vRes.y = v1.y 	* 	v2.y;
		vRes.z = z1 	* 	z2; 

		return vRes;
	}

	static MultScalar(v1, s, vRes = null){
		const z1 = v1.z == undefined ? 0 : v1.z;

		if(vRes == null){
			vRes = Vec3.Zero();
		}
		vRes.x = v1.x	*	s;
		vRes.y = v1.y 	* 	s;
		vRes.z = z1 	* 	s; 

		return vRes;
	}

	static DivScalar(v1, s, vRes = null){
		const z1 = v1.z == undefined ? 0 : v1.z;

		if(vRes == null){
			vRes = Vec3.Zero();
		}
		vRes.x = v1.x	/	s;
		vRes.y = v1.y 	/ 	s;
		vRes.z = z1 	/ 	s; 

		return vRes;
	}

	static Copy(v, vRes = null){
		const z = v.z == undefined ? 0 : v.z;

		if(vRes == null){
			vRes = Vec3.Zero();
		}
		vRes.x = v.x;
		vRes.y = v.y;
		vRes.z = z ; 

		return vRes;
	}

	static Length(v){
		const z = v.z == undefined ? 0 : v.z;
		return Math.sqrt(
			v.x * v.x + 
			v.y * v.y +
			z * z);
	}

	static SqrLength(v){
		const z = v.z == undefined ? 0 : v.z;
		return v.x * v.x + v.y * v.y + z * z;
	}

	static Normalize(v, vRes = null){
		const z = v.z == undefined ? 0 : v.z;

		if(vRes == null){
			vRes = Vec3.Zero();
		}

		const len = Vec3.Length(v);
		
		vRes.x = v.x / len;
		vRes.y = v.y / len;
		vRes.z = z / len;

		return vRes;
	}
}