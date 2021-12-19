//The new triangulization system accepts an array of points that define a polygon.
//The current version does not support polygons with holes or that have edges that cross other edges

import * as PIXI from 'pixi.js'
import Draw from '../Draw';
import Polygon2D from "../Geometry/Polygon2D";
import Ray2D from '../Geometry/Ray';
import Triangle2D from '../Geometry/Triangle2D';
import Num from '../Math/Num';
import PerlinNoise from '../Math/PerlinNoise';
import Vec2 from "../Math/Vec2";
import Vec3 from '../Math/Vec3';

class Vertex {
	constructor(pos) {
		this.pos = pos;
		this.outer = false;
		this.connectedTriangles = [];
		this.relaxationForce = Vec2.Zero();
		this.state = 0;
	}

	updateOuter() {
		this.outer = false;
		for (let i = 0; i < this.connectedTriangles.length; i++) {
			const tri = this.connectedTriangles[i];
			const vid = tri.verts.findIndex(v => v == this);
			const vid_m1 = Num.ModGl(vid - 1, 3);

			if (tri.adjacent[vid] == null || tri.adjacent[vid_m1] == null) {
				this.outer = true;
				return;
			}
		}
	}
}

class Triangle {
	constructor(v0, v1, v2, color) {
		this.verts = [v0, v1, v2];
		this.color = color;
		this.adjacent = [null, null, null]
	}

	getAdjacentIndex(e0, e1) {
		for (let i = 0; i < 3; i++) {
			const i0 = i;
			const i1 = Num.ModGl(i + 1, 3);
			if ((this.verts[i0] === e0 && this.verts[i1] === e1) ||
				(this.verts[i1] === e0 && this.verts[i0] === e1)) {
				return i0;
			}
		}
		return -1;
	}

	hasEdge(e0, e1) {
		return this.getAdjacentIndex(e0, e1) != -1;
	}

	setAdjacent(e0, e1, tri) {
		const index = this.getAdjacentIndex(e0, e1);
		this.adjacent[index] = tri;
	}

	removeAdjacent(e0, e1) {
		const index = this.getAdjacentIndex(e0, e1);
		this.adjacent[index] = null;
	}

	adjacentCount() {
		let count = 0;
		this.adjacent.forEach(at => {
			if (at != null) count++;
		});
		return count;
	}

	isClockwise() {
		return Polygon2D.ClockwiseOrder([
			this.verts[0].pos,
			this.verts[1].pos,
			this.verts[2].pos
		]);
	}

	hasOuterVertex() {
		return this.verts.some(v => v.outer);
	}

	getCenter() {
		return Vec2.DivScalar(Vec2.Add(this.verts[0].pos, Vec2.Add(this.verts[1].pos, this.verts[2].pos)), 3);
	}

	angleSquashiness(target, extreme) {
		const iAngles = Triangle2D.InternalAngles(this.verts[0].pos, this.verts[1].pos, this.verts[2].pos);
		const minAngle = iAngles.sort((a, b) => a - b)[0];

		return Num.ClampedInverseLerp(Num.DegToRad(target), Num.DegToRad(extreme), minAngle);
	}

	area() {
		return Triangle2D.Area(this.verts[0].pos, this.verts[1].pos, this.verts[2].pos);
	}

	areaSquashiness(target, extreme) {
		const currentArea = this.area();
		return Num.Clamp(Math.abs(Num.InverseLerp(target, extreme, currentArea)), 0, 1);
	}
}

const pixiPosMultiplier = new Vec2(1, -1);

export default class PolygonTriangulation {
	constructor(polygonVerts, edgeLenght, pixiApp) {
		this.edgeLenght = edgeLenght;
		this.triangleHeight = Math.sqrt(Math.pow(this.edgeLenght, 2) - Math.pow(this.edgeLenght / 2, 2));

		this.polygonVerts = polygonVerts;

		this.polygonEdges = [];
		for (let i = 0; i < this.polygonVerts.length; i++) {
			let a = this.polygonVerts[i];
			let b = this.polygonVerts[Num.ModGl(i + 1, this.polygonVerts.length)];
			let normal = Vec3.Cross(Vec2.Normalize(Vec2.Subtract(b, a)), new Vec3(0, 0, 1));
			this.polygonEdges.push({
				a, b, normal
			});
		}

		this.vertices = [];
		this.triangles = [];

		this.problematicVertices = [];
		this.pixiApp = pixiApp;

		this.graphics = new PIXI.Graphics();
		this.pixiApp.stage.addChild(this.graphics);

		this.noiseGraphics = new PIXI.Graphics();
		this.pixiApp.stage.addChild(this.noiseGraphics);

		this.relaxCount = 0;

		this.triConnectionColor = Draw.HexColor(0.2, 0.2, 1);
		this.edgeConnectionColor = Draw.RandomColor(0.3, 0.5, 0.5);

		this.relaxMultiplier = 0.06;
		this.relaxOuterMultiplier = 0.1;// 0.5;

		this.squashedMultiplier = 1;
		this.unsquashedMultiplier = 0.1;

		this.perlinTexture = null;

		this.desiredArea = 0;
		this.distanceFromCenter = 0;
		this.averageEdgeLength = 0;
		this.triangleAreaContribution = 0;

		this.relaxingTriangles = false;
	}

	generateTriangleGrid() {
		const boundingBox = Polygon2D.GetBoundingBox(this.polygonVerts);

		let hSecCount = Math.ceil(boundingBox.width / this.edgeLenght);
		let vSecCount = Math.ceil(boundingBox.height / this.triangleHeight);

		let hSecLength = boundingBox.width / hSecCount;
		let vSecLength = boundingBox.height / vSecCount;

		hSecCount += 1;
		vSecCount += 1;

		this.vertices = new Array(hSecCount * vSecCount);
		this.triangles = [];

		console.log("h: ", hSecCount, "v: ", vSecCount);

		const getIndex = (i, j) => i + j * hSecCount;

		//Create point array
		const triangleColors = Draw.RandomColor(0.3, 0.3, 0.3);
		for (let i = 0; i < hSecCount; i++) {
			for (let j = 0; j < vSecCount; j++) {
				let gridVert = Vec2.Add(
					boundingBox.position,
					new Vec2((i + (j % 2 == 0 ? -0.5 : 0)) * hSecLength, j * vSecLength)
				);

				let index = getIndex(i, j);
				this.vertices[index] = new Vertex(gridVert);
			}
		}

		const addNewTriangle = (indices) => {
			const v1 = getIndex(indices[0][0], indices[0][1]);
			const v2 = getIndex(indices[1][0], indices[1][1]);
			const v3 = getIndex(indices[2][0], indices[2][1]);

			this.triangles.push(new Triangle(
				this.vertices[v3],
				this.vertices[v2],
				this.vertices[v1],
				triangleColors));
		}

		//Create triangles
		for (let i = 0; i < hSecCount; i++) {
			for (let j = 0; j < vSecCount; j++) {
				const i_m1 = i - 1;
				const i_p1 = i + 1;
				const j_p1 = j + 1;


				if (j % 2 == 0) {
					if (i_m1 >= 0 && j_p1 < vSecCount) {
						addNewTriangle([
							[i, j],
							[i_m1, j_p1],
							[i, j_p1]
						]);
					}
					if (i_p1 < hSecCount && j_p1 < vSecCount) {
						addNewTriangle([
							[i, j],
							[i, j_p1],
							[i_p1, j]
						]);
					}
				} else {
					if (i_p1 < hSecCount && j_p1 < vSecCount) {
						addNewTriangle([
							[i, j],
							[i, j_p1],
							[i_p1, j_p1]
						]);
					}
					if (i_p1 < hSecCount && j_p1 < vSecCount) {
						addNewTriangle([
							[i, j],
							[i_p1, j_p1],
							[i_p1, j]
						]);
					}
				}
			}

		}

		//Add triangle references to vertices
		this.triangles.forEach(triangle => {
			triangle.verts.forEach(vert => {
				vert.connectedTriangles.push(triangle);
			});
		});
	}

	CreateTriangleAdjacentList() {
		this.triangles.forEach((tri, index) => {
			let possibleTriangles = new Set();
			tri.verts[0].connectedTriangles.forEach(ct => possibleTriangles.add(ct));
			tri.verts[1].connectedTriangles.forEach(ct => possibleTriangles.add(ct));
			tri.verts[2].connectedTriangles.forEach(ct => possibleTriangles.add(ct));

			for (let i = 0; i < 3; i++) {
				const i0 = i;
				const i1 = Num.ModGl(i + 1, 3);

				const iter = possibleTriangles.values();
				while (true) {
					const val = iter.next();
					if (val.done) {
						break;
					} else {
						const pt = val.value;
						if (pt === tri) {
							continue;
						}
						else if (pt.hasEdge(tri.verts[i0], tri.verts[i1])) {
							tri.adjacent[i] = pt;
							break;
						}
					}
				}
			}
		});
	}

	drawTriangles(drawCenter = false) {
		this.triangles.forEach(tri => {
			const vert0 = Vec2.MultComp(tri.verts[0].pos, pixiPosMultiplier);
			const vert1 = Vec2.MultComp(tri.verts[1].pos, pixiPosMultiplier);
			const vert2 = Vec2.MultComp(tri.verts[2].pos, pixiPosMultiplier);

			const center = Vec2.DivScalar(Vec2.Add(vert0, Vec2.Add(vert1, vert2)), 3);

			Draw.Triangle(this.graphics, vert0, vert1, vert2, 0.25, tri.color);

			if (drawCenter) {
				this.graphics.lineStyle({
					width: 0
				});
				this.graphics.beginFill(tri.color * 0.5);
				this.graphics.drawCircle(center.x, center.y, 4);
				this.graphics.endFill();
			}

			let count0 = 0;
			tri.verts.forEach(vert => {
				if (vert.state == 0) count0++;
			});

			if (count0 != 0 && count0 != 3) {
				this.graphics.lineStyle({
					width: 8,
					color: this.triConnectionColor,
					cap: PIXI.LINE_CAP.ROUND
				});

				let pIndex = -1;
				if (count0 == 1) {
					pIndex = tri.verts.findIndex(v => v.state == 0);
				} else {
					pIndex = tri.verts.findIndex(v => v.state == 1);
				}

				const pIndex_m1 = Num.ModGl(pIndex - 1, 3);
				const pIndex_p1 = Num.ModGl(pIndex + 1, 3);

				const p0 = Vec2.DivScalar(Vec2.Add(tri.verts[pIndex_m1].pos, tri.verts[pIndex].pos), 2);
				const p1 = Vec2.DivScalar(Vec2.Add(tri.verts[pIndex_p1].pos, tri.verts[pIndex].pos), 2);

				this.graphics.moveTo(p0.x, -p0.y);
				this.graphics.lineTo(p1.x, -p1.y);

				this.graphics.lineStyle({
					width: 0
				});


			}
		});
	}

	drawOuterVertices() {
		this.vertices.forEach(vert => {
			if (vert.outer == true) {
				this.graphics.lineStyle({
					width: 2,
					color: Draw.HexColor(1, 1, 1)
				});
				this.graphics.beginFill(this.edgeConnectionColor);
				this.graphics.drawCircle(vert.pos.x, -vert.pos.y, 6);
				this.graphics.endFill();
			}
		})
	}

	drawVertices() {
		this.vertices.forEach(vert => {
			this.graphics.lineStyle({
				width: 0
			});
			this.graphics.beginFill(vert.state == 0 ? Draw.HexColor(0, 0, 0) : Draw.HexColor(1, 1, 1));
			this.graphics.drawCircle(vert.pos.x, -vert.pos.y, 4);
			this.graphics.endFill();
		})
	}

	drawVertex(vert) {
		this.graphics.lineStyle({
			width: 2,
			color: Draw.HexColor(1, 1, 1)
		});
		this.graphics.beginFill(Draw.RandomColor() * 0.5);
		this.graphics.drawCircle(vert.pos.x, -vert.pos.y, 12);
		this.graphics.endFill();
	}

	removeTriangle(triangle, index) {
		triangle.adjacent.forEach((at, index) => {
			if (at != null) {
				const i0 = index;
				const i1 = Num.ModGl(index + 1, 3);
				at.removeAdjacent(triangle.verts[i0], triangle.verts[i1]);
			}
		});

		triangle.verts.forEach(vert => {
			const triId = vert.connectedTriangles.findIndex(vtri => vtri == triangle);
			vert.connectedTriangles.splice(triId, 1);
			if (vert.connectedTriangles.length == 0) {
				const vertId = this.vertices.findIndex(v => v == vert);
				this.vertices.splice(vertId, 1);
			} else {
				vert.updateOuter();
			}
		});

		this.triangles.splice(index, 1);
	}

	removeTrianglesOutsidePolygon() {
		for (let i = this.triangles.length - 1; i >= 0; i--) {
			const tri = this.triangles[i];

			let vertInsidePolyCount = 0;
			for (let vi = 0; vi < 3; vi++) {
				if (Polygon2D.PointInsidePolygon(tri.verts[vi].pos, this.polygonVerts)) vertInsidePolyCount++;
			}

			if (vertInsidePolyCount < 3) {
				this.removeTriangle(tri, i);
			}
		}
	}

	removeSingleAdjacentTriangle() {
		let singleAdjacentTris = [];
		for (let i = 0; i < this.triangles.length; i++) {
			const tri = this.triangles[i];
			if (tri.adjacentCount() <= 1) {
				singleAdjacentTris.push(tri);
			}
		}

		while (singleAdjacentTris.length != 0) {
			let tri = singleAdjacentTris.pop();
			if (tri.adjacentCount() <= 1) {
				for (let i = 0; i < 3; i++) {
					if (tri.adjacent[i] != null) singleAdjacentTris.push(tri.adjacent[i]);
				}
				let index = this.triangles.findIndex((t) => t === tri);
				this.removeTriangle(tri, index);
			}
		}
	}

	updateOuterOnVertices() {
		this.vertices.forEach(vert => {
			vert.updateOuter();
		})
	}

	moveVerticesToEdges() {
		this.vertices.forEach(vert => {
			if (vert.outer) {
				let possiblePositions = [];
				for (let j = 0; j < this.polygonEdges.length; j++) {
					const pEdge = this.polygonEdges[j];
					const normal = Vec2.MultScalar(pEdge.normal, -1);
					const ray = new Ray2D(vert.pos, normal);
					let hitInfo = {};
					let hit = Ray2D.RayLineIntersect(ray, pEdge, hitInfo);

					if (hit) {
						possiblePositions.push({
							distance: hitInfo.t1,
							newPos: Vec2.Add(vert.pos, Vec2.MultScalar(normal, hitInfo.t1))
						});
					}
				}

				if (possiblePositions.length > 0) {
					possiblePositions.sort((a, b) => a.distance - b.distance);
					for (let ppi = 0; ppi < possiblePositions.length; ppi++) {
						const pPos = possiblePositions[ppi];
						let validOrder = true;
						for (let cti = 0; cti < vert.connectedTriangles.length; cti++) {
							const ct = vert.connectedTriangles[cti];
							const currentOrder = ct.isClockwise();

							const vIndex = ct.verts.findIndex(v => v == vert);
							const newOrder = Polygon2D.ClockwiseOrder([
								ct.verts[Num.ModGl(vIndex - 1, 3)].pos,
								pPos.newPos,
								ct.verts[Num.ModGl(vIndex + 1, 3)].pos
							]);

							if (currentOrder != newOrder) {
								validOrder = false;
								break;
							}
						}
						if (validOrder) {
							Vec2.Copy(pPos.newPos, vert.pos);
							break;
						}
					}
				}
			}
		});

		this.polygonVerts.forEach((pvert) => {
			let possibleVerts = [];
			this.vertices.forEach(vert => {
				if (vert.outer) {

					let validOrder = true;
					for (let cti = 0; cti < vert.connectedTriangles.length; cti++) {
						const ct = vert.connectedTriangles[cti];
						const currentOrder = ct.isClockwise();

						const vIndex = ct.verts.findIndex(v => v == vert);

						const newOrder = Polygon2D.ClockwiseOrder([
							ct.verts[Num.ModGl(vIndex - 1, 3)].pos,
							pvert,
							ct.verts[Num.ModGl(vIndex + 1, 3)].pos
						]);

						if (currentOrder != newOrder) {
							validOrder = false;
							break;
						}
					}
					if (validOrder) {
						const dist = Vec2.SqrLength(Vec2.Subtract(pvert, vert.pos));
						if (dist < Math.pow(this.edgeLenght * 1.5, 2)) {
							const vDist = {
								dist,
								vert
							}
							possibleVerts.push(vDist);
						}
					}
				}
			});

			if (possibleVerts.length > 0) {
				possibleVerts.sort((a, b) => a.dist - b.dist);
				Vec2.Copy(pvert, possibleVerts[0].vert.pos);
			}
		})
	}

	collapseEdge(e0, e1) {
		let possibleTriangles = new Set();
		e0.connectedTriangles.forEach(ct => possibleTriangles.add(ct));
		e1.connectedTriangles.forEach(ct => possibleTriangles.add(ct));

		let connTris = [];
		let eVert = [];
		possibleTriangles.forEach(pt => {
			const adIndex = pt.getAdjacentIndex(e0, e1);
			if (adIndex != -1) {
				connTris.push(pt);
				eVert.push(pt.verts[Num.ModGl(adIndex + 2, 3)]);
			}
		});

		if (connTris.length > 2) {
			throw new Error("More than 2 triangles are connected to a single edge");
		}

		connTris.forEach((ct, index) => {
			const ctId = eVert[index].connectedTriangles.findIndex(ctt => ctt == ct);
			eVert[index].connectedTriangles.splice(ctId, 1);
		})

		connTris.forEach(connTri => {
			const ctIndex0 = e0.connectedTriangles.findIndex(ct => ct == connTri);
			e0.connectedTriangles.splice(ctIndex0, 1);

			const ctIndex1 = e1.connectedTriangles.findIndex(ct => ct == connTri);
			e1.connectedTriangles.splice(ctIndex1, 1);
		});

		Vec2.DivScalar(Vec2.Add(e0.pos, e1.pos), 2, e0.pos);

		connTris.forEach(ct => {
			const adIndex = ct.getAdjacentIndex(e0, e1);

			const adNext = Num.ModGl(adIndex + 1, 3);
			const adPrev = Num.ModGl(adIndex + 2, 3);

			const triAdNext = ct.adjacent[adNext];
			const triAdPrev = ct.adjacent[adPrev];

			if (triAdNext != null) triAdNext.setAdjacent(ct.verts[adNext], ct.verts[Num.ModGl(adNext + 1, 3)], triAdPrev);
			if (triAdPrev != null) triAdPrev.setAdjacent(ct.verts[adPrev], ct.verts[Num.ModGl(adPrev + 1, 3)], triAdNext);
		});

		e1.connectedTriangles.forEach(ct => {
			const eid = ct.verts.findIndex(v => v == e1);
			ct.verts[eid] = e0;
			e0.connectedTriangles.push(ct);
		});

		const e1Id = this.vertices.findIndex(vert => vert === e1);
		this.vertices.splice(e1Id, 1);

		e0.updateOuter();

		const ctId0 = this.triangles.findIndex(tri => tri == connTris[0]);
		this.triangles.splice(ctId0, 1);

		if (connTris.length == 2) {
			const ctId1 = this.triangles.findIndex(tri => tri == connTris[1]);
			this.triangles.splice(ctId1, 1);
		}
	}

	collapseOuterCloseEdges() {
		let tIndex = 0;
		while (true) {
			const tri = this.triangles[tIndex];
			let edgeCollapsed = false;
			for (let i = 0; i < 3; i++) {
				const i0 = i;
				const i1 = Num.ModGl(i + 1, 3);
				if (tri.verts[i0].outer == true && tri.verts[i1].outer == true) {
					const dist = Vec2.SqrLength(Vec2.Subtract(tri.verts[i0].pos, tri.verts[i1].pos));
					if (dist < Math.pow(this.edgeLenght * 0.7, 2)) {
						this.collapseEdge(tri.verts[i0], tri.verts[i1]);
						const indexAfter = this.vertices.findIndex(vert => vert === tri.verts[i1]);
						edgeCollapsed = true;
						break;
					}
				}
			}
			if (!edgeCollapsed) {
				tIndex++;
				if (tIndex >= this.triangles.length) break;
			} else {
				tIndex = 0;
			}
		}
	}

	randomlyCollapseEdges() {
		const targetAngle = 50;
		const extremeAngle = 30;

		let triIndex = 0;
		let checkedTrianglesCount = 0;
		let loopCount = 0;
		let innerTriangleCount = 0;

		this.triangles.forEach(tri => {
			if (!tri.hasOuterVertex()) innerTriangleCount++;
		});
		let maxCollapses = Math.floor(innerTriangleCount * 0.1);

		console.log("Triangle count: ", this.triangles.length, " Inner triangle count: ", innerTriangleCount, " Max triangle collapse count: ", maxCollapses);

		while (true) {
			const tri = this.triangles[triIndex];
			let collapsedEdge = false;
			const triOuter = tri.hasOuterVertex();
			if (!triOuter) { //Only collapse inner triangles
				let angSquash = tri.angleSquashiness(targetAngle, extremeAngle);
				//console.log("Tri squash:", angSquash);
				if (angSquash < 0.5) { //Only collapse triangles that are not squashed
					const randOffset = Math.floor(Math.random() * 2.99);
					for (let adIndex = 0; adIndex < tri.adjacent.length; adIndex++) {
						const adRandIndex = Num.ModGl(adIndex + randOffset, 3);
						const triAd = tri.adjacent[adRandIndex]; // If the triangle does not hace any outer vertices then there are no null adjacents
						if (!triAd.hasOuterVertex()) { //Only collapse inner triangles
							let adAngSquash = triAd.angleSquashiness(targetAngle, extremeAngle);
							//console.log("Adjacent squash:", adAngSquash);
							if (adAngSquash < 0.5) { //Only collapse triangles that are not squashed
								//Check the number of triangles that are going to be connected to the resulting vertices
								const count0 = (tri.verts[adRandIndex].connectedTriangles.length - 2) + (tri.verts[Num.ModGl(adRandIndex + 1, 3)].connectedTriangles.length - 2);
								const count1 = tri.verts[Num.ModGl(adRandIndex + 2, 3)].connectedTriangles.length - 1;
								const adTriEdgeIndex = triAd.getAdjacentIndex(tri.verts[adRandIndex], tri.verts[Num.ModGl(adRandIndex + 1, 3)]);
								const count2 = triAd.verts[Num.ModGl(adTriEdgeIndex + 2, 3)].connectedTriangles.length - 1;

								if (count0 <= 8 && count0 > 4 &&
									count1 > 4 && count1 <= 7 &&
									count2 > 4 && count2 <= 7) {//Check if collapsing the edge is not going to cause any problems
									const rand = Math.random();
									if (rand < 0.75) { //Adding some randomness to the triangles that are collapse
										//console.log("Counts: ", count0, count1, count2)
										this.collapseEdge(
											tri.verts[adRandIndex],
											tri.verts[Num.ModGl(adRandIndex + 1, 3)]
										);
										collapsedEdge = true;
										break;
									}
								}
							}
						}
					}
				}
			}
			if (collapsedEdge) {
				triIndex = Math.floor(Math.random() * this.triangles.length - 0.01);
				checkedTrianglesCount = 0;
				let ilegalVert = false;
				for (let vi = 0; vi < this.vertices.length; vi++) {
					const vert = this.vertices[vi];
					if (!vert.outer) {
						if (vert.connectedTriangles.length == 3 || vert.connectedTriangles.length == 4) {
							console.log(vert);
							this.problematicVertices.push(vert);
							ilegalVert = true;
						}
					}
				}
				if (ilegalVert) break;
				loopCount++;
				if (loopCount > maxCollapses) break;
			} else {
				triIndex = Num.ModGl(triIndex + 1, this.triangles.length);
				checkedTrianglesCount++;
				if (checkedTrianglesCount >= this.triangles.length) {
					console.log("Collapse count: ", loopCount);
					break;
				}
			}
		}
	}

	setTriangleRelaxationForce(tri, mult, distFromCenter) {
		let v0 = tri.verts[0].pos;
		let v1 = tri.verts[1].pos;
		let v2 = tri.verts[2].pos;

		let center = tri.getCenter();

		let cV0 = Vec2.Subtract(v0, center);
		let cV1 = Vec2.Subtract(v1, center);
		let cV2 = Vec2.Subtract(v2, center);

		let rV0 = Vec2.Copy(cV0);
		let rV1 = Vec2.Rotate(Num.DegToRad(240), cV1);
		let rV2 = Vec2.Rotate(Num.DegToRad(120), cV2);

		let vAverage = Vec2.DivScalar(Vec2.Add(rV0, Vec2.Add(rV1, rV2)), 3);
		let lenAverage = Vec2.Length(vAverage);
		Vec2.DivScalar(vAverage, lenAverage, vAverage);//Normalize
		Vec2.MultScalar(vAverage, distFromCenter * 1, vAverage);

		let diffV0 = Vec2.Subtract(vAverage, cV0);
		let diffV1 = Vec2.Subtract(Vec2.Rotate(Num.DegToRad(120), vAverage), cV1);
		let diffV2 = Vec2.Subtract(Vec2.Rotate(Num.DegToRad(240), vAverage), cV2);

		Vec2.MultScalar(diffV0, mult, diffV0);
		Vec2.MultScalar(diffV1, mult, diffV1);
		Vec2.MultScalar(diffV2, mult, diffV2);

		if (!Vec2.IsValid(diffV0) || !Vec2.IsValid(diffV1) || !Vec2.IsValid(diffV2)) {
			this.debugEdgeGraphics.clear();
			drawAllTriangles(false);
			drawRemoveVertices(Draw.HexColor(1, 0, 0));
			console.log("triangle :", tri);
			relaxationCount.count = 15 * 70;
			throw new Error("Relaxation force not valid");
		}

		Vec2.Add(
			tri.verts[0].relaxationForce,
			diffV0,
			tri.verts[0].relaxationForce
		);

		Vec2.Add(
			tri.verts[1].relaxationForce,
			diffV1,
			tri.verts[1].relaxationForce
		);

		Vec2.Add(
			tri.verts[2].relaxationForce,
			diffV2,
			tri.verts[2].relaxationForce
		);
	}

	relaxTriangles(desiredArea, distFromCenter) {
		for (let stepIndex = 0; stepIndex < 8; stepIndex++) {
			//Generate relaxation force from triangles;
			this.triangles.forEach(tri => {
				const angleS = Math.pow(tri.angleSquashiness(55, 25), 2);
				const areaS = Math.pow(tri.areaSquashiness(desiredArea, desiredArea / 2), 2);

				const maxSquash = Math.max(angleS, areaS);
				const squishiness = Num.Lerp(this.unsquashedMultiplier, this.squashedMultiplier, maxSquash);// Math.pow(maxSquash, 4);

				tri.color = maxSquash > 0.2 ? 
					Draw.HexColor( 	areaS > angleS ? Num.Lerp(0, 1, areaS) : 0, 
									areaS < angleS ? Num.Lerp(0, 1, angleS) : 0,
									0) :
					Draw.HexColor(0.5,0.5,0.5);

				this.setTriangleRelaxationForce(tri, squishiness, distFromCenter);
			});

			this.vertices.forEach(vert => {
				const mult = this.relaxMultiplier * (vert.outer ? this.relaxOuterMultiplier : 1);
					//* Num.Lerp(0.5, 1, Num.ClampedInverseLerp(7, 5, vert.connectedTriangles.length));

				Vec2.Add(Vec2.MultScalar(vert.relaxationForce, mult), vert.pos, vert.pos);

				vert.relaxationForce.x = 0;
				vert.relaxationForce.y = 0;
			});
		}
	}

	removeSquashedOuterTriangles(desiredArea){
		let triIndex = 0;
		let collapseCount = 0;
		let maxCollapse = 1;
		while (true) {
			let collapsedEdge = false;
			const tri = this.triangles[triIndex];
			const angleS = tri.angleSquashiness(55, 25);
			const squashiness = angleS;
			if (squashiness > 0.5) { //should be removed
				let nullAdjacentTriangleId = tri.adjacent.findIndex(adTri => adTri == null);
				let edgeLengths = new Array(3);
				for (let i = 0; i < 3; i++) {
					const i0 = i;
					const i1 = Num.ModGl(i + 1, 3);
					const len = Vec2.SqrLength(Vec2.Subtract(tri.verts[i0].pos, tri.verts[i1].pos));
					edgeLengths[i] = {
						index: i0,
						len: len
					};
				}
				edgeLengths.sort((a, b) => a.len - b.len);

				if (nullAdjacentTriangleId != -1) {
					if (edgeLengths[0].index == nullAdjacentTriangleId) {
						this.collapseEdge(tri.verts[edgeLengths[0].index], tri.verts[Num.ModGl(edgeLengths[0].index + 1, 3)]);
					}
				}
			}
			if(collapsedEdge){
				triIndex = 0;
				collapseCount++;
				if(collapseCount >= maxCollapse) break;
			}else{
				triIndex++;
				if (triIndex >= this.triangles.length) {
					break;
				}
			}
		}
		return collapseCount;
	}

	removeSquashedTriangles(desiredArea) {
		let triIndex = 0;
		let collapseCount = 0;
		let maxCollapse = 1;

		let possibleCollapse = [];
		while (true) {
			const tri = this.triangles[triIndex];

			const angleS = Math.pow(tri.angleSquashiness(55, 25), 2);
			const areaS = Math.pow(tri.areaSquashiness(desiredArea, desiredArea / 2), 2);
			const maxSquash = Math.max(angleS, areaS);
			
			/*const areaS = tri.areaSquashiness(desiredArea, desiredArea / 2);
			const angleS = tri.angleSquashiness(55, 35);
			const squashiness = Math.max(angleS, areaS);*/

			if (maxSquash > 0.2) { //should be removed
				let nullAdjacentTriangleId = tri.adjacent.findIndex(adTri => adTri == null);
				let edgeLengths = new Array(3);
				for (let i = 0; i < 3; i++) {
					const i0 = i;
					const i1 = Num.ModGl(i + 1, 3);
					const len = Vec2.SqrLength(Vec2.Subtract(tri.verts[i0].pos, tri.verts[i1].pos));
					edgeLengths[i] = {
						index: i0,
						len: len
					};
				}
				edgeLengths.sort((a, b) => a.len - b.len);
				
				if (nullAdjacentTriangleId == -1) {
					for (let ei = 0; ei < 3; ei++) {
						const edgeIndex = edgeLengths[ei].index;
						const triAd = tri.adjacent[edgeIndex];

						const v0 = tri.verts[edgeIndex];
						const v2 = tri.verts[Num.ModGl(edgeIndex + 1, 3)];
						const v1 = tri.verts[Num.ModGl(edgeIndex + 2, 3)];
						

						const count0 = (v0.outer || v2.outer) ? -1 : (v0.connectedTriangles.length - 2) + (v2.connectedTriangles.length - 2);
						const count1 = v1.connectedTriangles.length - 1;
						let count2 = -1;
						if (triAd != null) {
							const adTriEdgeIndex = triAd.getAdjacentIndex(tri.verts[edgeIndex], tri.verts[Num.ModGl(edgeIndex + 1, 3)]);
							const v3 = triAd.verts[Num.ModGl(adTriEdgeIndex + 2, 3)];
							count2 = v3.connectedTriangles.length - 1;
						}

						if (((	count0 > 4 && count0 <= 8) || count0 == -1) 	&&
								count1 > 4 && count1 <= 8 						&&
							((	count2 > 4 && count2 <= 8) || count2 == -1))
						{//Check if collapsing the edge is not going to cause any problems
							possibleCollapse.push({
								e0: v0,
								e1: v2,
								sq: maxSquash,
								len: edgeLengths[ei].len
							});
							break;
						}
					}
				}
			}

			triIndex++;
			if (triIndex >= this.triangles.length) {
				if (possibleCollapse.length > 0) {
					possibleCollapse.sort((a, b) => a.len - b.len);
					this.collapseEdge(possibleCollapse[0].e0, possibleCollapse[0].e1);
					collapseCount++;
					triIndex = 0;
					possibleCollapse.splice(0);

					this.averageEdgeLength = this.averageEdgeLength * (1 + this.triangleAreaContribution * 1.25);

					this.desiredArea = Math.sqrt(3) * Math.pow(this.averageEdgeLength, 2) / 4;
					this.distFromCenter = (this.averageEdgeLength / 2) / Math.sin(Num.DegToRad(60));

					if (collapseCount >= maxCollapse) {
						break;
					}
				} else {
					break;
				}
			}
		}
		return collapseCount;
	}

	connectOuterVertices(v0, v1){}

	collapseOctagons() {
		let vertIndex = 0;
		while (true) {
			let collapsedEdge = false;
			const vert = this.vertices[vertIndex];
			if (!vert.outer && vert.connectedTriangles.length == 8) {
				let possibleEdgesCollapse = [];
				for (let i = 0; i < vert.connectedTriangles.length; i++) {
					const tri = vert.connectedTriangles[i];
					const vIndex = tri.verts.findIndex(v => v == vert);

					const edgeIndex = Num.ModGl(vIndex + 1, 3);
					const triAd = tri.adjacent[edgeIndex];

					/*
					curren tri
					   1
					   /\
					  /  \
					0/____\2
					 \    /
					  \  /
					   \/
					   3
					adjacent tri
					*/

					if (triAd == null) { //If it is null, then it is an outer edge so it is safe to remove it
						const v0 = tri.verts[edgeIndex];
						const v2 = tri.verts[Num.ModGl(edgeIndex + 1, 3)];

						possibleEdgesCollapse.push({
							e0: v0,
							e1: v2,
							len: Vec2.SqrLength(Vec2.Subtract(v0.pos, v2.pos))
						});
					} else {
						const v0 = tri.verts[edgeIndex];
						const v2 = tri.verts[Num.ModGl(edgeIndex + 1, 3)];
						const v1 = tri.verts[Num.ModGl(edgeIndex + 2, 3)];
						const adTriEdgeIndex = triAd.getAdjacentIndex(tri.verts[edgeIndex], tri.verts[Num.ModGl(edgeIndex + 1, 3)]);
						const v3 = triAd.verts[Num.ModGl(adTriEdgeIndex + 2, 3)];

						const count0 = /*v0.outer ? -1 : */(v0.connectedTriangles.length - 2) + (v2.connectedTriangles.length - 2);
						const count1 = v1.connectedTriangles.length - 1;
						const count2 = v3.oute ? -1 : v3.connectedTriangles.length - 1;

						if (((count0 < 8 && count0 > 4) || count0 == -1) && (count1 > 4 && count1 < 8) && ((count2 > 4 && count2 < 8) || count2 == -1)) {
							possibleEdgesCollapse.push({
								e0: v0,
								e1: v2,
								len: Vec2.SqrLength(Vec2.Subtract(v0.pos, v2.pos))
							});
						}
					}
				}

				if (possibleEdgesCollapse.length > 0) {
					possibleEdgesCollapse.sort((a, b) => a.len - b.len);
					let edgeToCollapse = possibleEdgesCollapse[0];
					this.collapseEdge(edgeToCollapse.e0, edgeToCollapse.e1);
					collapsedEdge = true;
				}
			}

			if (collapsedEdge) {
				vertIndex = 0;
			} else {
				vertIndex++;
				if (vertIndex >= this.vertices.length) break;
			}
		}
	}

	collapseProblematicConfigurations() {
		let triIndex = 0;
		while (true) {
			let restart = false;
			const tri = this.triangles[triIndex];
			let connectionCount = [
				{
					count: tri.verts[0].connectedTriangles.length,
					vert: tri.verts[0]
				},
				{
					count: tri.verts[1].connectedTriangles.length,
					vert: tri.verts[1]
				},
				{
					count: tri.verts[2].connectedTriangles.length,
					vert: tri.verts[2]
				}
			]

			const v0 = tri.verts[0];
			const v1 = tri.verts[1];
			const v2 = tri.verts[2];

			connectionCount.sort((a, b) => a.count - b.count);

			if (!v0.outer && !v1.outer && !v2.outer) {
				if ((connectionCount[0].count == 5 && connectionCount[1].count == 5 && connectionCount[2].count == 5) ||
					(connectionCount[0].count == 5 && connectionCount[1].count == 5 && connectionCount[2].count == 6))
				{
					this.collapseEdge(v0, v1);
					this.collapseEdge(v0, v2);
					
					v0.state = 1;
					v1.state = 1;
					v2.state = 1;
					
					restart = true;
				}
				else if (connectionCount[0].count == 5 && connectionCount[1].count == 5)
				{
					this.collapseEdge(connectionCount[0].vert, connectionCount[1].vert);
					
					connectionCount[0].vert.state = 1;
					connectionCount[1].vert.state = 1;
					
					restart = true;
				}
				else if (connectionCount[0].count == 4){
					this.collapseEdge(connectionCount[0].vert, connectionCount[1].vert);

					connectionCount[0].vert.state = 1;
					connectionCount[1].vert.state = 1;

					restart = true;
				}
			}

			if(restart){
				triIndex = 0;
			}else{
				triIndex++;
				if (triIndex >= this.triangles.length) break;
			}
		}
	}

	updateAverageEdgeLength(){
		this.averageEdgeLength = 0;
		let count = 0;

		this.triangles.forEach(tri => {
			for (let i = 0; i < 3; i++) {
				const e0i = i;
				const e1i = Num.ModGl(i + 1, 3);

				const vert0 = tri.verts[e0i];
				const vert1 = tri.verts[e1i];

				const len = Vec2.Length(Vec2.Subtract(vert0.pos, vert1.pos));
				this.averageEdgeLength += len;
				count++;
			}
		});
		this.averageEdgeLength = this.averageEdgeLength / count;
	}

	startTriangulation() {
		this.relaxingTriangles = true;
		this.graphics.clear();
		const noiset0 = performance.now();
		this.perlinTexture = new PerlinNoise(128, 8);
		const noiset1 = performance.now();
		console.log("Noise generation took: ", noiset1 - noiset0);

		{
			this.noiseGraphics.lineStyle({
				width: 0
			});
			for (let i = 0; i < 128; i++) {
				for (let j = 0; j < 128; j++) {
					const noise = this.perlinTexture.getNearest(new Vec2(i / 127, j / 127));
					this.noiseGraphics.beginFill(Draw.HexColor(Math.abs(noise), 0, 0));
					this.noiseGraphics.drawRect(i * 4, j * 4, 4, 4);
					this.noiseGraphics.endFill();
				}
			}
		}

		const t0 = performance.now();

		this.generateTriangleGrid();

		const triCountStart = this.triangles.length;

		this.removeTrianglesOutsidePolygon();
		this.CreateTriangleAdjacentList();
		this.removeSingleAdjacentTriangle();
		this.updateOuterOnVertices();

		this.moveVerticesToEdges();
		this.collapseOuterCloseEdges();
		this.randomlyCollapseEdges();

		//this.collapseOctagons();
		this.collapseProblematicConfigurations();

		const t1 = performance.now();

		console.log("Time to triangulation: ", t1 - t0);

		console.log("Test clampped", Num.ClampedInverseLerp(Num.DegToRad(50), Num.DegToRad(35), Num.DegToRad(1)));

		this.drawTriangles(false);
		this.drawVertices();
		this.problematicVertices.forEach(vert => {
			this.drawVertex(vert);
		});

		this.updateAverageEdgeLength();

		this.triangleAreaContribution = 1 / this.triangles.length;
		this.desiredArea = Math.sqrt(3) * Math.pow(this.averageEdgeLength, 2) / 4;
		this.distFromCenter = (this.averageEdgeLength / 2) / Math.sin(Num.DegToRad(60));

		console.log("avg edge lenght:", this.averageEdgeLength, "desired area: ", this.desiredArea, "distance from center:", this.distFromCenter);
		console.log("triangle area contribution : ", this.triangleAreaContribution);
		//Set vertex state
		{
			let vert = this.vertices[0].pos;
			let maxX = vert.x; let minX = vert.x; let maxY = vert.y; let minY = vert.y;

			for (let i = 1; i < this.vertices.length; i++) {
				const v = this.vertices[i].pos;
				if (v.x > maxX) maxX = v.x;
				if (v.x < minX) minX = v.x;
				if (v.y > maxY) maxY = v.y;
				if (v.y < minY) minY = v.y;
			}

			const position = new Vec2(minX, minY);
			const width = Math.abs(maxX - minX);
			const height = Math.abs(maxY - minY);

			//Compute state
			this.vertices.forEach(vert => {
				const offset = Vec2.MultComp(Vec2.Subtract(vert.pos, position), new Vec2(1 / width, 1 / height));
				const noiseVal = this.perlinTexture.getNearest(offset);
				vert.state = vert.outer ? 0 : noiseVal > 0 ? 1 : 0;
			});
		}

		this.relaxCount = 0;
		let measureRelaxation = false;
		let angleSquashAverage = {
			initial: 0,
			current: 0,
		}
		let zeroCount = 0;
		const relaxationTicker = () => {
			const rt0 = performance.now();
			this.relaxTriangles(this.desiredArea, this.distFromCenter);
			const rt1 = performance.now();

			//console.log("Relaxation time taken : ", rt1 - rt0);

			if (this.relaxCount > 60 * 1.5) {
				if (!measureRelaxation) {
					measureRelaxation = true;
					let squahsAverage = 0;
					this.triangles.forEach(tri => {
						squahsAverage += tri.angleSquashiness(55, 25);
					});
					squahsAverage /= this.triangles.length;
					angleSquashAverage.initial = squahsAverage;
					
					console.log("Current sqashiness average: ", squahsAverage);
				}
			}
			
			const cst0 = performance.now();
			if (this.relaxCount != 0 && this.relaxCount > 60 * 1 && Num.ModGl(this.relaxCount, 10) == 0) {
				let collapseCount = this.removeSquashedOuterTriangles(this.desiredArea) + this.removeSquashedTriangles(this.desiredArea);
				if(collapseCount == 0){
					console.log("Current count 0, zero count: ", zeroCount);
					zeroCount += 1;
				}else{
					zeroCount = 0;
				}
				{
					let squahsAverage = 0;
					this.triangles.forEach(tri => {
						squahsAverage += tri.angleSquashiness(55, 25);
					});
					squahsAverage /= this.triangles.length;
					angleSquashAverage.current = squahsAverage;

					if(this.relaxCount > 60 * 2){
						if(angleSquashAverage.current > angleSquashAverage.initial){					
							console.log("Exit - target angle squash");
							zeroCount = 2;
						}else if(angleSquashAverage.current < angleSquashAverage.initial * 0.8){
							zeroCount += 1;
						}
					}
				}
			}
			const cst1 = performance.now();
			//console.log("Relaxation time taken : ", cst1 - cst0);

			//console.log("Relaxation took: ", rt1 - rt0);
			this.relaxCount++;
			if ((zeroCount >= 2 && this.relaxCount > 60 * 2) || this.relaxCount > 60 * 10) {
				if(this.relaxCount > 60 * 20){
					console.log("Time limit hit");
				}
				let squahsAverage = 0;
				this.triangles.forEach(tri => {
					squahsAverage += tri.angleSquashiness(55, 25);
				});
				squahsAverage /= this.triangles.length;
				console.log("Current sqashiness average: ", squahsAverage);

				this.pixiApp.ticker.remove(relaxationTicker);
				console.log("Relaxation Finished!!");

				this.triangles.forEach(tri => {tri.color = Draw.HexColor(0.25,0.75,0.5)});

				console.log(`Triangle count start ${triCountStart} | end ${this.triangles.length}`);

				this.relaxingTriangles = false;

				this.updateAverageEdgeLength();
				window.CityGenerator.addGenerationSpace(this.vertices, this.triangles, this.averageEdgeLength);
			}

			const drawt0 = performance.now();
			this.graphics.clear();
			this.drawTriangles(false);
			this.drawVertices();
			const drawt1 = performance.now();
			//console.log("Drawing time taken : ", drawt1 - drawt0);
		}

		setTimeout(() => {
			console.log("Relaxation ticker added");
			this.pixiApp.ticker.add(relaxationTicker);
		}, 500);
	}
}