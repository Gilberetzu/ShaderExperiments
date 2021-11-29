import Vec2 from "../Math/Vec2";

export default class OrientedBoundingBox{
	constructor(center, hAxis, vAxis, width, height){
		let H = Vec2.MultScalar(hAxis, width / 2);
		let V = Vec2.MultScalar(vAxis, height / 2);

		this.corner = [
			Vec2.Subtract(Vec2.Subtract(center, H), V), // center - H - V
			Vec2.Subtract(Vec2.Add(center, H), V), // center + H - V
			Vec2.Add(Vec2.Add(center, H), V), // center + H + V
			Vec2.Add(Vec2.Subtract(center, H), V) // center - H + V
		];
		
		/*
		3 ----- 2
		|		|
		|		|
		0 ----- 1
		*/

		this.axis = [
			Vec2.Subtract(this.corner[1], this.corner[0]), //corner[1] - corner[0]
			Vec2.Subtract(this.corner[3], this.corner[0]) //corner[3] - corner[0]
		];

		this.origin = [0,0];
		for (let i = 0; i < 2; i++) {
			this.axis[i] = Vec2.DivScalar(this.axis[i], Vec2.SqrLength(this.axis[i])); //axis[i] / (axis[i].lenght ^ 2)
			this.origin[i] = Vec2.Dot(this.corner[0], this.axis[i]); //corner[0] dot axis[i]
		}
	}

	/**
	 * Projects oriented bounding box 2 over the 2 axis of the oriented bounding box 1
	 * @param {OrientedBoundingBox} OBB1 
	 * @param {OrientedBoundingBox} OBB2 
	 * @returns True if the boxes are overlapping
	 */
	static Overlaps1Way(OBB1, OBB2){
		for (let a = 0; a < 2; a++) {
			let t = Vec2.Dot(OBB2.corner[0], OBB1.axis[a]); //Project OBB2's corner[0] on axis[a] of OBB1

			//Get the box extent on axis [a]
			let tMin = t;
			let tMax = t;
			for (let c = 1; c < 4; c++) {
				t = Vec2.Dot(OBB2.corner[c], OBB1.axis[a]);

				if(t < tMin){
					tMin = t;
				}else if (t > tMax){
					tMax = t;
				}
			}

			if((tMin > 1 + OBB1.origin[a]) || (tMax < OBB1.origin[a])){
				return false; //The boxes did not overlap on this axis, so the boxes do not overlap
			}
		}
		return true;// if there was no axis in which the boxes did not overlap then the boxes are overlapping
	}

	static Overlaps(OBB1, OBB2){
		return OrientedBoundingBox.Overlaps1Way(OBB1, OBB2) && OrientedBoundingBox.Overlaps1Way(OBB2, OBB1);
	}
}