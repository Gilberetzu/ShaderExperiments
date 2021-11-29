import Triangle2D from "./Geometry/Triangle2D";
import Vec2 from "./Math/Vec2";

export default class Draw {
	static DrawDashLine(graphic, from, to, size, width, color) {
		let relativeToPos = Vec2.Subtract(to, from);
		let length = Vec2.Length(relativeToPos);

		if (length > 0.0001) {
			//redraw new edge
			let direction = Vec2.Normalize(relativeToPos);
			graphic.lineStyle({
				width: width,
				color: color
			})
			graphic.moveTo(from.x, from.y);

			let dashFill = size.x / (size.x + size.y);
			let dashEmpty = size.y / (size.x + size.y);

			let sectionCount = Math.floor(length / (size.x + size.y));
			let sectionLength = (length / sectionCount);
			for (let i = 0; i < sectionCount; i++) {
				let s1 = Vec2.Add(from, Vec2.MultScalar(direction, sectionLength * i));
				let s2 = Vec2.Add(s1, Vec2.MultScalar(direction, sectionLength * dashFill / 2));
				let s3 = Vec2.Add(s2, Vec2.MultScalar(direction, sectionLength * dashEmpty));
				let s4 = Vec2.Add(s3, Vec2.MultScalar(direction, sectionLength * dashFill / 2));

				graphic.moveTo(s1.x, s1.y);
				graphic.lineTo(s2.x, s2.y);
				graphic.moveTo(s3.x, s3.y);
				graphic.lineTo(s4.x, s4.y);
				/* 
				fill = /
				empty = -
				////----////
				*/
			} 

			/*
			let distanceLeft = length;
			let dash = true;
			let prevPos = Vec2.Copy(from);
			let newPos = Vec2.Copy(from);
			while (true) {
				let dashLength = dash ? distanceLeft > size.x ? size.x : distanceLeft : distanceLeft > size.y ? size.y : distanceLeft;

				Vec2.Add(Vec2.MultScalar(direction, dashLength, newPos), prevPos, newPos);
				if (dash) {
					graphic.lineTo(newPos.x, newPos.y);
					graphic.moveTo(newPos.x, newPos.y);
				} else {
					graphic.moveTo(newPos.x, newPos.y);
				}
				Vec2.Copy(newPos, prevPos);
				dash = !dash;
				distanceLeft -= dashLength;
				if (distanceLeft < 0.01) {
					break;
				}
			}*/
		}
	}

	static RandomColor(minR = 0, minG = 0, minB = 0){
		const randR = Math.random();
		let R = Math.floor((minR < randR ? randR : minR) * 255);
		const randG = Math.random();
		let G = Math.floor((minG < randG ? randG : minG) * 255);
		const randB = Math.random();
		let B = Math.floor((minB < randB ? randB : minB) * 255);

		let color = R | G << 8 | B << 16;
		return color;
	}

	static DrawTriangleOutline(graphic, p0, p1, p2, pushDistance, color, lineWidth){
		let pushedTris = pushDistance > 1e-7 ? Triangle2D.PushVertices(p0, p1, p2, pushDistance) : [p0, p1, p2];
		graphic.lineStyle(lineWidth, color);

		graphic.moveTo(pushedTris[0].x, pushedTris[0].y);
		graphic.lineTo(pushedTris[1].x, pushedTris[1].y);
		graphic.lineTo(pushedTris[2].x, pushedTris[2].y);
		graphic.lineTo(pushedTris[0].x, pushedTris[0].y);
	}

	static DrawTriangle(graphic, p0, p1, p2, pushDistance, color){
		let pushedTris = pushDistance > 1e-7 ? Triangle2D.PushVertices(p0, p1, p2, pushDistance) : [p0, p1, p2];

		graphic.beginFill(color);
		graphic.drawPolygon(pushedTris);
		graphic.endFill();
	}
}