export default class Vec2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	static IsValid(v){
		return Number.isFinite(v.x) && Number.isFinite(v.y);
	}

	static Zero() {
		return new Vec2(0, 0);
	}

	static Clear(v) {
		v.x = 0;
		v.y = 0;
	}

	/**
	 * 
	 * @param {Vec2} v 
	 * @returns {Vec2}
	 */
	static Copy(v, vRes=null) {
		if (vRes == null) {
			vRes = Vec2.Zero();
		}
		vRes.x = v.x;
		vRes.y = v.y;
		return vRes;
	}

	/**
	 * 
	 * @param {Vec2} v1 
	 * @param {Vec2} v2 
	 * @param {Vec2} vRes 
	 * @returns {Vec2}
	 */
	static Add(v1, v2, vRes = null) {
		if (vRes == null) {
			vRes = Vec2.Zero();
		}
		vRes.x = v1.x + v2.x;
		vRes.y = v1.y + v2.y;
		return vRes;
	}

	/**
	 * 
	 * @param {Vec2} v1 
	 * @param {Vec2} v2 
	 * @param {Vec2} vRes 
	 * @returns {Vec2}
	 */
	static Subtract(v1, v2, vRes = null) {
		if (vRes == null) {
			vRes = Vec2.Zero();

		}
		vRes.x = v1.x - v2.x;
		vRes.y = v1.y - v2.y;
		return vRes;
	}

	/**
	 * 
	 * @param {Vec2} v1 
	 * @param {Vec2} v2  
	 * @returns {number}
	 */
	static Dot(v1, v2) {
		return v1.x * v2.x + v1.y * v2.y;
	}

	/**
	 * 
	 * @param {Vec2} v1 
	 * @param {Vec2} v2 
	 * @param {Vec2} vRes 
	 * @returns {Vec2}
	 */
	static MultComp(v1, v2, vRes = null){
		if (vRes == null) {
			vRes = Vec2.Zero();
		}
		vRes.x = v1.x * v2.x;
		vRes.y = v1.y * v2.y;

		return vRes;
	}

	static MultScalar(v, s, vRes = null) {
		if (vRes == null) {
			vRes = Vec2.Zero();
		}
		vRes.x = v.x * s;
		vRes.y = v.y * s;

		return vRes;
	}

	static DivScalar(v, s, vRes = null) {
		if (vRes == null) {
			vRes = Vec2.Zero();
		}
		vRes.x = v.x / s;
		vRes.y = v.y / s;

		return vRes;
	}

	static SqrLength(v) {
		return Math.pow(v.x, 2) + Math.pow(v.y, 2);
	}

	static Length(v) {
		return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
	}

	static Normalize(v, vRes = null) {
		return Vec2.DivScalar(v, Vec2.Length(v), vRes);
	}

	static Cross(v1, v2) {
		return v1.x * v2.y - v2.x * v1.y;
	}

	/**
	 * 
	 * @param {Vec2} v1 
	 * @param {Vec2} v2 
	 * @returns smallest angle (radians) between the 2 vectors
	 */
	static AngleBetween(v1, v2){
		let dot = Vec2.Dot(v1, v2);
		let denom = Vec2.Length(v1) * Vec2.Length(v2);
		if(denom <= 0.000001){
			return 0;
		}else{
			return Math.acos(dot / denom);
		} 
	}

	static Rotate(angle, v, vRes = null){
		if(vRes == null){
			vRes = Vec2.Zero();
		}

		vRes.x = v.x * Math.cos(angle) - v.y * Math.sin(angle);
		vRes.y = v.x * Math.sin(angle) + v.y * Math.cos(angle);

		return vRes;
	}

	static RandomCircle(radius){
		const rad = Math.sqrt(Math.random()) * radius;
		const angle = Math.random() * Math.PI * 2;

		return new Vec2(
			rad * Math.cos(angle),
			rad * Math.sin(angle)
		);
	}
}