import Vec2 from "../Math/Vec2";

export default class Ray2D{
	constructor(origin, direction){
		this.origin = origin;
		this.dir = direction;
	}
	/**
	 * 
	 * @param {{origin: Vec2, dir: Vec2}} ray 
	 * @param {{a: Vec2, b: Vec2}} line
	 * @param {{t1: Number, t2: Number}} hitInfo where t1 is the distance from the origin, and t2 is the interpolator for the line segment
	 */
	static RayLineIntersect(ray, line, hitInfo = null){
		let v1 = Vec2.Subtract(ray.origin, line.a);
		let v2 = Vec2.Subtract(line.b, line.a);
		let v3 = new Vec2(-ray.dir.y, ray.dir.x);

		let t1 = Vec2.Cross(v2, v1) / Vec2.Dot(v2, v3);
		let t2 = Vec2.Dot(v1, v3) / Vec2.Dot(v2, v3);
	
		if(hitInfo != null){
			hitInfo.t1 = t1;
			hitInfo.t2 = t2;
		}

		if(t2 >= 0 && t2 <= 1){
			return true;
		}else{
			return false;
		}
	}
}