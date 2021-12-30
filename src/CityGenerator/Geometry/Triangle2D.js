import Vec2 from "../Math/Vec2";

export default class Triangle2D{
	static Area(p0, p1, p2){
		let v1 = Vec2.Subtract(p1, p0);
		let v2 = Vec2.Subtract(p2, p0);
		return Math.abs(Vec2.Cross(v1, v2) / 2);
	}

	/**
	 * 
	 * @param {Vec2} p0 
	 * @param {Vec2} p1 
	 * @param {Vec2} p2 
	 * @returns Internal angles (radians) of the triangle
	 */
	static InternalAngles(p0, p1, p2, debug = false){
		if(debug){
			console.log(p0,p1,p2);
			p0 = Vec2.MultScalar(p0, 100);
			p1 = Vec2.MultScalar(p1, 100);
			p2 = Vec2.MultScalar(p2, 100);
		}
		let angles = [
			Vec2.AngleBetween(Vec2.Subtract(p1, p0), Vec2.Subtract(p2, p0)), 
			Vec2.AngleBetween(Vec2.Subtract(p0, p1), Vec2.Subtract(p2, p1)),
			Vec2.AngleBetween(Vec2.Subtract(p0, p2), Vec2.Subtract(p1, p2))
		];
		return angles;
	}

	static IsPointInTriangle = (p, p0, p1, p2)=>{
		let s = (p0.x - p2.x) * (p.y - p2.y) - (p0.y - p2.y) * (p.x - p2.x);
		let t = (p1.x - p0.x) * (p.y - p0.y) - (p1.y - p0.y) * (p.x - p0.x);

		if ((s < 0) != (t < 0) && s != 0 && t != 0){
			return false;
		}

		let d = (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x);
		return d == 0 || (d < 0) == (s + t <= 0);
	}

	static PushVertices(p0, p1, p2, distance){
		let pushedVertices = [];

		let pushVertexIn = (v, nv, pv)=>{
			let n1 = Vec2.Normalize(Vec2.Subtract(pv, v));
			let n2 = Vec2.Normalize(Vec2.Subtract(nv, v));
			let pn = Vec2.Normalize(Vec2.Add(n1, n2));
			let n = Vec2.MultScalar(pn, distance);
			return Vec2.Add(n, v);
		}

		pushedVertices.push(pushVertexIn(p0, p1, p2));
		pushedVertices.push(pushVertexIn(p1, p0, p2));
		pushedVertices.push(pushVertexIn(p2, p0, p1));

		return pushedVertices;
	}
}