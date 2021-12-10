import * as PIXI from 'pixi.js'
import Draw from '../Draw';
import OrientedBoundingBox from '../Geometry/OrientedBoundingBox';
import Polygon2D from '../Geometry/Polygon2D';
import Ray2D from '../Geometry/Ray';
import Triangle2D from '../Geometry/Triangle2D';
import Num from '../Math/Num';
import Vec2 from "../Math/Vec2";
import Vec3 from '../Math/Vec3';
import PolygonTriangulation from './PolygonTriangulation';

const TRIANGLE_EDGE = 35;
const TRIANGLE_HEIGHT = Math.sqrt(Math.pow(TRIANGLE_EDGE, 2) - Math.pow(TRIANGLE_EDGE / 2, 2));
const TRIANGLE_DIST_TO_CENTER = (TRIANGLE_EDGE / 2) / Math.sin(Num.DegToRad(60));

export default class PolygonGenerator {
	/**
	 * @param {HTMLCanvasElement} canvasHTMLElement 
	 */
	constructor(canvasHTMLElement) {
		this.systemStartTime = (new Date()).getTime();
		let canvasRect = canvasHTMLElement.getClientRects();

		this.pixiApp = new PIXI.Application({
			width: canvasRect[0].width,
			height: canvasRect[0].height,
			backgroundColor: 0x001020,
			view: canvasHTMLElement,
			antialias: true
		});

		/** @type {Array.<{position: Vec2, container:PIXI.Container, graphics: PIXI.Graphics, hover: boolean}>} */
		this.polygonVertices = [];
		this.polygonEdges = [];
		this.polygonIsClosed = false;

		this.pixiApp.stage.sortableChildren = true;

		this.pixiApp.ticker.add(this.update.bind(this));

		window.convexPolygon = Polygon2D.IsConvexPolygon;

		{
			this.gridContainer = new PIXI.Container();
			this.gridGraphics = new PIXI.Graphics();

			this.gridGraphics.lineStyle({
				color: 0x882211,
				width: 8
			});

			this.gridGraphics.moveTo(-2048, 0);
			this.gridGraphics.lineTo(2048, 0);

			this.gridGraphics.lineStyle({
				color: 0x114466,
				width: 8
			});

			this.gridGraphics.moveTo(0, -2048);
			this.gridGraphics.lineTo(0, 2048);

			this.gridContainer.addChild(this.gridGraphics);
			this.pixiApp.stage.addChild(this.gridContainer);
		}

		{
			this.cursorContainer = new PIXI.Container();
			this.cursorGraphic = new PIXI.Graphics();
			this.cursorContainer.addChild(this.cursorGraphic);
			this.cursorContainer.zIndex = 21;
			this.pixiApp.stage.addChild(this.cursorContainer);

			//drawGraphic
			this.cursorGraphic.lineStyle({
				width: 0
			});
			this.cursorGraphic.beginFill(0x444499);
			this.cursorGraphic.drawCircle(0, 0, 12);
			this.cursorGraphic.endFill();
			//add graphic to stage

			this.newVertexContainer = new PIXI.Container();
			this.newVertexGraphic = new PIXI.Graphics();
			this.newVertexContainer.addChild(this.newVertexGraphic);
			this.newVertexContainer.zIndex = 20;
			this.pixiApp.stage.addChild(this.newVertexContainer);

			//drawGraphic
			this.newVertexGraphic.lineStyle({
				width: 0
			});
			this.newVertexGraphic.beginFill(0xDD5555);
			this.newVertexGraphic.drawCircle(0, 0, 16);
			this.newVertexGraphic.endFill();
			//add graphic to stage

			//new edge
			this.newEdgeContainer = new PIXI.Container();
			this.newEdgeGraphics = new PIXI.Graphics();

			this.newEdgeContainer.addChild(this.newEdgeGraphics);
			this.pixiApp.stage.addChild(this.newEdgeContainer);
		}

		{
			//Closest hit graphic
			this.closestHitContainer = new PIXI.Container();
			this.closestHitGraphic = new PIXI.Graphics();

			this.closestHitContainer.addChild(this.closestHitGraphic);
			this.closestHitGraphic.zIndex = 30;
			this.pixiApp.stage.addChild(this.closestHitContainer);
		}

		this.debugEdgeGraphics = new PIXI.Graphics();
		this.pixiApp.stage.addChild(this.debugEdgeGraphics);

		this.pixiApp.stage.position.set(64, canvasRect[0].height - 64);

		//State variables - needs to be changed to state machine or something
		this.panning = false;
		this.mousePosStartPanning = Vec2.Zero();
		this.stagePosStartPanning = Vec2.Zero();

		this.polygonTriangulator = null;
	}

	/**
	 * 
	 * @param {Vec2} position
	 */
	addVertex(position) {
		//this needs to be on its own object
		let pointContainer = new PIXI.Container();
		let pointGraphic = new PIXI.Graphics();

		this.drawVertexNormal(pointGraphic);

		pointContainer.addChild(pointGraphic);
		pointContainer.zIndex = 10;
		this.pixiApp.stage.addChild(pointContainer);
		//on its own object

		pointContainer.position.set(position.x, position.y);

		this.polygonVertices.push({
			position: position,
			container: pointContainer,
			graphics: pointGraphic,
			hover: false,
		});
	}

	/**
	 * 
	 * @param {PIXI.Graphics} vertexGraphics 
	 */
	drawVertexNormal(vertexGraphics) {
		vertexGraphics.clear();
		vertexGraphics.lineStyle({
			width: 0
		});

		vertexGraphics.beginFill(0xAAAAAA);
		vertexGraphics.drawCircle(0, 0, 16);
		vertexGraphics.endFill();

		vertexGraphics.lineStyle({
			width: 4,
			color: 0xAAAAAA
		});
		vertexGraphics.arc(0, 0, TRIANGLE_HEIGHT, 0, 3.14 * 2, false);
	}

	/**
	 * 
	 * @param {PIXI.Graphics} vertexGraphics 
	 */
	drawVertexHover(vertexGraphics) {
		vertexGraphics.clear();
		vertexGraphics.lineStyle({
			width: 0
		});

		vertexGraphics.beginFill(0xEEEEEE);
		vertexGraphics.drawCircle(0, 0, 24);
		vertexGraphics.endFill();
	}

	/**
	 * 
	 * @param {PIXI.Graphics} vertexGraphics 
	 */
	drawVertexConvex(vertexGraphics) {
		vertexGraphics.clear();
		vertexGraphics.lineStyle({
			width: 0
		});

		vertexGraphics.beginFill(0x444444);
		vertexGraphics.drawCircle(0, 0, 24);
		vertexGraphics.endFill();
		vertexGraphics.beginFill(0xAAAAFF);
		vertexGraphics.drawCircle(0, 0, 12);
		vertexGraphics.endFill();
	}

	/**
	 * 
	 * @param {PIXI.Graphics} vertexGraphics 
	 */
	drawVertexConcave(vertexGraphics) {
		vertexGraphics.clear();
		vertexGraphics.lineStyle({
			width: 0
		});

		vertexGraphics.beginFill(0x444444);
		vertexGraphics.drawCircle(0, 0, 24);
		vertexGraphics.endFill();
		vertexGraphics.beginFill(0xAAFFAA);
		vertexGraphics.drawCircle(0, 0, 12);
		vertexGraphics.endFill();
	}

	drawEdge(edge, color) {
		const fromVertPos = this.polygonVertices[edge.vertices[0]].position;
		const toVertPos = this.polygonVertices[edge.vertices[1]].position;

		edge.graphics.lineStyle({
			width: 4,
			color: color
		});

		const fromToVec = Vec2.Subtract(toVertPos, fromVertPos);
		edge.graphics.moveTo(0, 0);
		edge.graphics.lineTo(fromToVec.x, fromToVec.y);
	}

	/**
	 * 
	 * @param {number} from 
	 * @param {number} to 
	 */
	addEdge(from, to) {
		let edgeContainer = new PIXI.Container();
		let edgeGraphic = new PIXI.Graphics();

		let fromVertPos = this.polygonVertices[from].position;
		let toVertPos = this.polygonVertices[to].position;

		edgeContainer.position.set(fromVertPos.x, fromVertPos.y);
		edgeContainer.addChild(edgeGraphic);
		this.pixiApp.stage.addChild(edgeContainer);
		edgeContainer.zIndex = 5;

		edgeGraphic.lineStyle({
			width: 8,
			color: 0xAAAAAA
		});

		//create inner edge partitions
		let fromToVec = Vec2.Subtract(toVertPos, fromVertPos);
		let fromToDir = Vec2.Normalize(fromToVec);

		let edgeLength = Vec2.Length(fromToVec);
		let sectionCount = Math.floor(edgeLength / TRIANGLE_EDGE);
		let sectionLenght = edgeLength / sectionCount;

		//#region Draw edge
		edgeGraphic.moveTo(0, 0);
		edgeGraphic.lineTo(fromToVec.x, fromToVec.y);

		//Draw debug edge data
		//Draws 2 triangles on each side, the one that is going ot be selected depends on the final polygon shape
		let randColor = Draw.RandomColor();
		edgeGraphic.lineStyle({
			width: 4,
			color: randColor
		});

		let normal = Vec3.Cross(fromToDir, new Vec3(0, 0, 1));

		let side1 = Vec2.MultScalar(normal, TRIANGLE_HEIGHT);
		let side2 = Vec2.MultScalar(normal, -TRIANGLE_HEIGHT);

		let toSide1 = Vec2.Add(fromToVec, side1);
		let toSide2 = Vec2.Add(fromToVec, side2);

		edgeGraphic.moveTo(side1.x, side1.y);
		edgeGraphic.lineTo(toSide1.x, toSide1.y);

		edgeGraphic.moveTo(side2.x, side2.y);
		edgeGraphic.lineTo(toSide2.x, toSide2.y);

		edgeGraphic.lineStyle({
			width: 0
		});
		for (let i = 0; i < sectionCount; i++) {
			let triP0 = Vec2.MultScalar(fromToDir, sectionLenght * i);
			let triP2 = Vec2.Add(triP0, Vec2.MultScalar(fromToDir, sectionLenght));

			let triP1 = Vec2.Add(triP0, Vec2.MultScalar(fromToDir, sectionLenght * 0.5));
			let triP1Side1 = Vec2.Add(triP1, Vec2.MultScalar(normal, TRIANGLE_HEIGHT));
			let triP1Side2 = Vec2.Add(triP1, Vec2.MultScalar(normal, -TRIANGLE_HEIGHT));

			Draw.Triangle(edgeGraphic, triP0, triP1Side1, triP2, 4, randColor);
			Draw.Triangle(edgeGraphic, triP0, triP1Side2, triP2, 4, randColor);
		}
		//#endregion

		let obb = new OrientedBoundingBox(
			Vec2.Add(Vec2.DivScalar(fromToVec, 2), fromVertPos),
			fromToDir,
			normal,
			edgeLength,
			TRIANGLE_HEIGHT * 4
		);

		this.polygonEdges.push({
			vertices: [from, to],
			container: edgeContainer,
			graphics: edgeGraphic,
			obb
		});
	}

	/**
	 * 
	 * @param {import("../types").Input} inputStore 
	 */
	doPanning(inputStore) {
		if (!this.panning && inputStore.mouse.buttons[1]) {
			this.mousePosStartPanning = Vec2.Copy(inputStore.mouse.position);
			this.stagePosStartPanning = Vec2.Copy(this.pixiApp.stage.position);
			this.panning = true;
		}

		if (!inputStore.mouse.buttons[1]) {
			this.panning = false;
		}

		if (this.panning) {
			let mouseDelta = Vec2.Subtract(inputStore.mouse.position, this.mousePosStartPanning);
			let newStagePosition = Vec2.Add(mouseDelta, this.stagePosStartPanning);
			this.pixiApp.stage.position.set(newStagePosition.x, newStagePosition.y);
		}
	}

	drawTriangles(triangles) {
		let triContainer = new PIXI.Container();
		let triGraphic = new PIXI.Graphics();

		triContainer.addChild(triGraphic);
		this.pixiApp.stage.addChild(triContainer);

		for (let i = 0; i < triangles.length; i++) {
			let tri = triangles[i];
			Draw.Triangle(triGraphic, tri.p0, tri.p1, tri.p2, 2, Draw.RandomColor());
		}
	}

	update(dt) {
		let inputStore = /** @type {import("../types").Input} */ (window.CityGenerator.input);
		//Panning state

		this.doPanning(inputStore);

		let cursorPos = Vec2.Subtract(inputStore.mouse.position, this.pixiApp.stage.position);
		this.cursorContainer.position.set(cursorPos.x, cursorPos.y);

		let pos = Vec2.Copy(cursorPos);
		//Move outside of vertex boundary
		if (!this.polygonIsClosed) {
			for (let i = 1; i < this.polygonVertices.length; i++) {
				const v = this.polygonVertices[i];
				let toVert = Vec2.Subtract(pos, v.position);
				if (Vec2.Length(toVert) < TRIANGLE_HEIGHT * 2) {
					Vec2.Add(v.position, Vec2.MultScalar(Vec2.Normalize(toVert), TRIANGLE_HEIGHT * 2), pos);
				}
			}
		}

		let edgeColor = 0xFFFFFF;
		let side = 0;
		//check if new edge is valid
		if (this.polygonEdges.length > 0 && !this.polygonIsClosed) {
			let lastEdge = this.polygonEdges[this.polygonEdges.length - 1];
			const vertPos = (index) => {
				return this.polygonVertices[index].position;
			}
			let prevEdgeDir =
				Vec2.Normalize(
					Vec2.Subtract(
						vertPos(lastEdge.vertices[0]),
						vertPos(lastEdge.vertices[1])
					)
				);

			let lastVertPos = vertPos(this.polygonVertices.length - 1);
			let newEdgeVec =
				Vec2.Subtract(
					pos,
					lastVertPos
				);

			let newEdgeDir = Vec2.Normalize(newEdgeVec);

			let angleBetween = Vec2.AngleBetween(prevEdgeDir, newEdgeDir);
			let valid = angleBetween >= Num.DegToRad(60);
			if (!valid) {
				let s = -Math.sign(Vec2.Cross(newEdgeDir, prevEdgeDir));
				Vec2.Add(
					Vec2.Rotate(s * (Num.DegToRad(60) - angleBetween), newEdgeVec),
					lastVertPos,
					pos
				);
			}

			{//Edge collision with node circles and edge boxes | This is going to result in a change in the cursor position if a collision was found
				Vec2.Subtract(pos, lastVertPos, newEdgeVec);
				let newEdgeDir = Vec2.Normalize(newEdgeVec);
				let newEdgeLenght = Vec2.Length(newEdgeVec);
				let normal = Vec3.Cross(newEdgeDir, new Vec3(0, 0, 1));

				let newEdgeOBB = new OrientedBoundingBox(
					Vec2.Add(lastVertPos, Vec2.DivScalar(newEdgeVec, 2)),
					newEdgeDir,
					normal,
					newEdgeLenght,
					TRIANGLE_HEIGHT * 2
				);

				//Minus 1 because we don't need to test against the last one (the one this new edge is going to be connected to) 
				//because that is already covered by the previous angle check
				let overlappedEdges = [];
				for (let i = 0; i < this.polygonEdges.length - 1; i++) {
					const edge = this.polygonEdges[i];
					let overlaps = OrientedBoundingBox.Overlaps(edge.obb, newEdgeOBB);
					if (overlaps) {
						//console.log("edge obb", edge.obb, "| new edge obb: ", newEdgeOBB);
						//console.log("Overlap found with edge index : ", i);
						overlappedEdges.push(i);
						valid = false;
						//break;
					}
				}
				//Check which was the closest overlap
				//Using the closest overlap compute a new extent for the vector
				let possiblePosition = Vec2.Copy(pos);
				let minDistance = newEdgeLenght;
				let selectedHitInfo = {
					hit: false,
					hitInfo: {},
					colliderIndex: -1,
					hitPosition: Vec2.Zero(),
					line: { a: Vec2.Zero(), b: Vec2.Zero() }
				}
				for (let index = 0; index < overlappedEdges.length; index++) {
					//console.log("Overlapped edges side test");
					const overlappedIndex = overlappedEdges[index];
					let edge = this.polygonEdges[overlappedIndex];
					let vertPos1 = this.polygonVertices[edge.vertices[0]].position;
					let vertPos2 = this.polygonVertices[edge.vertices[1]].position;

					let edgeDir = Vec2.Normalize(Vec2.Subtract(vertPos1, vertPos2));
					let edgeNormal = Vec3.Cross(edgeDir, new Vec3(0, 0, 1));

					let ndCrossSign = Math.sign(Vec2.Cross(normal, edgeDir));
					let ennCrossSight = Math.sign(Vec2.Cross(edgeNormal, normal));
					side = ndCrossSign * ennCrossSight;

					let vertP1Off = Vec2.Add(vertPos1, Vec2.MultScalar(edgeNormal, ennCrossSight * TRIANGLE_HEIGHT));
					let vertP2Off = Vec2.Add(vertPos2, Vec2.MultScalar(edgeNormal, ennCrossSight * TRIANGLE_HEIGHT));

					let collidedEdgeDir = Vec2.MultScalar(normal, -side * TRIANGLE_HEIGHT);
					let origin = Vec2.Add(lastVertPos, collidedEdgeDir);
					let limit = Vec2.Add(pos, collidedEdgeDir);
					let dir = Vec2.Normalize(Vec2.Subtract(limit, origin));
					let ray = new Ray2D(origin, dir);
					let hitInfo = {};

					let hit = Ray2D.RayLineIntersect(ray, {
						a: vertP1Off,
						b: vertP2Off
					}, hitInfo);
					if (!hit) continue;

					let newDistance = hitInfo.t1;
					let onEdgePosition = Vec2.Add(origin, Vec2.MultScalar(dir, newDistance));
					let newPos = Vec2.Subtract(onEdgePosition, collidedEdgeDir);
					let newPosDist = Vec2.Length(Vec2.Subtract(newPos, lastVertPos));
					if (minDistance > newPosDist) {
						possiblePosition = newPos;
						minDistance = newPosDist;

						selectedHitInfo.hitPosition = onEdgePosition;
						selectedHitInfo.line = {
							a: vertP1Off,
							b: vertP2Off
						};
						selectedHitInfo.hit = hit;
						selectedHitInfo.hitInfo = hitInfo;
						selectedHitInfo.colliderIndex = index;
					}
				}
				pos = possiblePosition;
				this.closestHitContainer.position.set(selectedHitInfo.hitPosition.x, selectedHitInfo.hitPosition.y);

				{
					this.closestHitGraphic.clear();
					this.closestHitGraphic.lineStyle({
						width: 0
					});
					this.closestHitGraphic.beginFill(0x55FFAA);
					this.closestHitGraphic.drawCircle(0, 0, 18);
					this.closestHitGraphic.endFill();

					this.closestHitGraphic.beginFill(0x55AADD);
					let nA = Vec2.Subtract(selectedHitInfo.line.a, selectedHitInfo.hitPosition);
					let nB = Vec2.Subtract(selectedHitInfo.line.b, selectedHitInfo.hitPosition);
					this.closestHitGraphic.drawCircle(nA.x, nA.y, 32);
					this.closestHitGraphic.drawCircle(nB.x, nB.y, 32);
					this.closestHitGraphic.endFill();

					//console.log(selectedHitInfo);
					//console.log("Was hit: ", selectedHitInfo.hit);
				}
			}
			edgeColor = valid ? 0xffffff : 0xff9999;
		}

		//Add vertex
		if (inputStore.mouse.buttons[0]) {
			if (this.polygonVertices.length > 0 && this.polygonVertices[0].hover) {
				this.addEdge(this.polygonVertices.length - 1, 0);

				const randEdgeColor = Draw.RandomColor(0.5,0.5,0.5);
				this.polygonEdges.forEach((edge) => {
					edge.graphics.clear();
					this.drawEdge(edge, randEdgeColor);
				});

				this.closestHitGraphic.clear();

				this.polygonIsClosed = true;
				let verticesInvertY = this.polygonVertices.map(v => {
					return Vec2.MultComp(v.position, new Vec2(1, -1));
				});
				let clockwise = Polygon2D.ClockwiseOrder(verticesInvertY);
				let pVertices;
				if (!clockwise) {//Revert vertices order to make the polygon clockwise
					pVertices = [];
					for (let i = verticesInvertY.length - 1; i >= 0; i--) {
						const vert = verticesInvertY[i];
						pVertices.push(vert);
					}
				} else {
					pVertices = verticesInvertY;
				}

				if(this.polygonTriangulator == null){
					this.polygonTriangulator = new PolygonTriangulation(pVertices, TRIANGLE_EDGE, this.pixiApp);
				}
				this.polygonTriangulator.startTriangulation();

				this.polygonVertices.forEach(pv => pv.graphics.clear());

				/*{
					const t1 = performance.now();
					const multiplier = new Vec2(1, -1);

					let vert = pVertices[0];
					let maxX = vert.x; let minX = vert.x; let maxY = vert.y; let minY = vert.y;

					for (let i = 1; i < pVertices.length; i++) {
						const v = pVertices[i];
						if (v.x > maxX) maxX = v.x;
						if (v.x < minX) minX = v.x;
						if (v.y > maxY) maxY = v.y;
						if (v.y < minY) minY = v.y;
					}

					let startPos = new Vec2(minX, minY);
					let width = Math.abs(maxX - minX);
					let height = Math.abs(maxY - minY);

					let hSecCount = Math.ceil(width / TRIANGLE_EDGE);
					let vSecCount = Math.ceil(height / TRIANGLE_HEIGHT);

					let hSecLength = width / hSecCount;
					let vSecLength = height / vSecCount;

					hSecCount += 1;
					vSecCount += 1;

					let spaceVertices = new Array(hSecCount * vSecCount);
					let triangles = [];

					console.log("h: ", hSecCount, "v: ", vSecCount);

					const newTriangle = (v1, v2, v3, color) => {
						return {
							verts: [v3, v2, v1],
							color, //Only used for debugging purposes
							remove: false, //Used to specify it needs to be removed later
							//Not a good design, but it works for now
							uvIds: [-1, -1, -1]
						}
					}

					//Generate triangle space
					const triangleColors = Draw.RandomColor(0.3, 0.3, 0.3);
					const edgeVertColor = Draw.RandomColor(0.3, 0.3, 0.3);
					for (let i = 0; i < hSecCount; i++) {
						for (let j = 0; j < vSecCount; j++) {
							let gridVert = Vec2.Add(
								startPos,
								new Vec2((i + (j % 2 == 0 ? -0.5 : 0)) * hSecLength, j * vSecLength)
							);

							const getIndex = (i, j) => i + j * hSecCount;

							let index = getIndex(i, j);
							spaceVertices[index] = gridVert;

							const i_m1 = i - 1;
							const i_p1 = i + 1;
							const j_p1 = j + 1;


							if (j % 2 == 0) {
								//Triangle 1 (i,j) (i_m1, j_p1) (i, j_p1)
								if (i_m1 >= 0 && j_p1 < vSecCount) {
									const v1 = getIndex(i, j);
									const v2 = getIndex(i_m1, j_p1);
									const v3 = getIndex(i, j_p1);

									triangles.push(newTriangle(v1, v2, v3, triangleColors));
								}
								//Triangle 2 (i,j) (i, j_p1) (i_p1, j)
								if (i_p1 < hSecCount && j_p1 < vSecCount) {
									const v1 = getIndex(i, j);
									const v2 = getIndex(i, j_p1);
									const v3 = getIndex(i_p1, j);

									triangles.push(newTriangle(v1, v2, v3, triangleColors));
								}
							} else {
								if (i_p1 < hSecCount && j_p1 < vSecCount) {
									const v1 = getIndex(i, j);
									const v2 = getIndex(i, j_p1);
									const v3 = getIndex(i_p1, j_p1);

									triangles.push(newTriangle(v1, v2, v3, triangleColors));
								}
								//Triangle 2 (i,j) (i, j_p1) (i_p1, j)
								if (i_p1 < hSecCount && j_p1 < vSecCount) {
									const v1 = getIndex(i, j);
									const v2 = getIndex(i_p1, j_p1);
									const v3 = getIndex(i_p1, j);

									triangles.push(newTriangle(v1, v2, v3, triangleColors));
								}
							}
						}
					}

					console.log("triangle count: ", triangles.length)

					//Only keep triangles that have all their vertices inside the polygon
					for (let i = triangles.length - 1; i >= 0; i--) {
						const tri = triangles[i];
						const vert0 = spaceVertices[tri.verts[0]];
						const vert1 = spaceVertices[tri.verts[1]];
						const vert2 = spaceVertices[tri.verts[2]];
						const center = Vec2.DivScalar(Vec2.Add(vert0, Vec2.Add(vert1, vert2)), 3);

						const v0in = Polygon2D.PointInsidePolygon(vert0, pVertices);
						const v1in = Polygon2D.PointInsidePolygon(vert1, pVertices);
						const v2in = Polygon2D.PointInsidePolygon(vert2, pVertices);
						const cin = Polygon2D.PointInsidePolygon(center, pVertices);

						let vCount = 0;
						vCount += v0in ? 1 : 0;
						vCount += v1in ? 1 : 0;
						vCount += v2in ? 1 : 0;

						if (vCount < 3) {
							triangles.splice(i, 1);
						}
					}

					const drawAllTriangles = (drawCenter = false) => {
						for (let i = 0; i < triangles.length; i++) {
							const tri = triangles[i];
							if (tri.remove) continue;
							const vert0 = Vec2.MultComp(spaceVertices[tri.verts[0]], multiplier);
							const vert1 = Vec2.MultComp(spaceVertices[tri.verts[1]], multiplier);
							const vert2 = Vec2.MultComp(spaceVertices[tri.verts[2]], multiplier);
							const center = Vec2.DivScalar(Vec2.Add(vert0, Vec2.Add(vert1, vert2)), 3);

							Draw.Triangle(this.debugEdgeGraphics, vert0, vert1, vert2, 1, tri.color);

							if (drawCenter) {
								this.debugEdgeGraphics.lineStyle({
									width: 0
								});
								this.debugEdgeGraphics.beginFill(tri.color * 0.5);
								this.debugEdgeGraphics.drawCircle(center.x, center.y, 4);
								this.debugEdgeGraphics.endFill();
							}
						}
					}

					//drawAllTriangles();
					const edgeColor = Draw.RandomColor();

					const drawPolygonEdges = () => {
						for (let i = 0; i < pVertices.length; i++) {
							const next = Num.ModGl(i + 1, pVertices.length);
							const from = pVertices[i];
							const to = pVertices[next];

							this.debugEdgeGraphics.lineStyle({
								width: 8,
								color: edgeColor
							});
							this.debugEdgeGraphics.moveTo(from.x, -from.y);
							this.debugEdgeGraphics.lineTo(to.x, -to.y);
						}
					}

					//drawPolygonEdges();

					//Get the vertices that are being used
					//Check if the vertex is inner or outer
					//Add a boolean that specifies if the vertex has been moved or not

					let usedVertices = [];
					//Create an array of used vertices


					const updateUsedVerticesArray = () => {
						let edgeSet = [];

						const findEdge = (e0, e1) => {
							return edgeSet.findIndex(edge => (edge.e0 == e0 || edge.e0 == e1) && (edge.e1 == e0 || edge.e1 == e1));
						}

						const pushEdge = (e0, e1) => {
							let index = findEdge(e0, e1);
							if (index == -1) {
								edgeSet.push({
									e0,
									e1,
									count: 1
								});
							} else {
								edgeSet[index].count += 1;
							}
						}

						const getEdgesContainingVert = (vert) => {
							let edges = [];
							edgeSet.forEach(edge => {
								if (edge.e0 == vert || edge.e1 == vert) {
									edges.push(edge);
								}
							});
							return edges;
						}

						const checkOuterEdge = (vert) => {
							let edges = getEdgesContainingVert(vert);
							for (let i = 0; i < edges.length; i++) {
								const e = edges[i];
								if (e.count < 2) {
									return true;
								}
							}
							return false;
						}

						triangles.forEach(tri => {
							pushEdge(tri.verts[0], tri.verts[1]);
							pushEdge(tri.verts[1], tri.verts[2]);
							pushEdge(tri.verts[2], tri.verts[0]);
						});

						usedVertices.splice(0);
						for (let i = 0; i < spaceVertices.length; i++) {
							let inTriangles = []; //Indices of the triangles this vertex appears in

							for (let j = 0; j < triangles.length; j++) {
								const tri = triangles[j];
								const vertIndex = tri.verts.findIndex(v => v == i);
								if (vertIndex != -1) {
									triangles[j].uvIds[vertIndex] = usedVertices.length;
									inTriangles.push(j);
								}
							}

							if (inTriangles.length > 0) {//if the array has something, then it means the vertex is being used
								usedVertices.push({
									vertId: i,
									outer: checkOuterEdge(i),
									relocated: false,
									connectedTriangles: inTriangles,
									relaxationForce: Vec2.Zero(),
									prevRelaxationForce: Vec2.Zero(),
									remove: false
								});
							}
						}
					}
					updateUsedVerticesArray();

					const drawOuterVertices = (color) => {
						for (let i = 0; i < usedVertices.length; i++) {
							const uv = usedVertices[i];
							if (!uv.outer || uv.remove) continue;
							const vert = spaceVertices[uv.vertId];
							const pVert = Vec2.MultComp(vert, multiplier);

							this.debugEdgeGraphics.lineStyle({
								width: 4,
								color: 0xFFFFFF
							});
							this.debugEdgeGraphics.beginFill(color);
							this.debugEdgeGraphics.drawCircle(pVert.x, pVert.y, 8);
							this.debugEdgeGraphics.endFill();
						}
					}

					const drawRemoveVertices = (color) => {
						for (let i = 0; i < usedVertices.length; i++) {
							const uv = usedVertices[i];
							if (!uv.remove) continue;
							const vert = spaceVertices[uv.vertId];
							const pVert = Vec2.MultComp(vert, multiplier);

							this.debugEdgeGraphics.lineStyle({
								width: 4,
								color: 0xFFFFFF
							});
							this.debugEdgeGraphics.beginFill(color);
							this.debugEdgeGraphics.drawCircle(pVert.x, pVert.y, 8);
							this.debugEdgeGraphics.endFill();
						}
					}

					//drawOuterVertices();

					//Move closest triangle space vertex to the polygon vertex
					for (let i = 0; i < pVertices.length; i++) {
						const vert = pVertices[i];
						let closestVert = {
							uvId: 0,
							vId: usedVertices[0].vertId,
							distance: Vec2.SqrLength(Vec2.Subtract(spaceVertices[usedVertices[0].vertId], vert))
						};
						for (let j = 1; j < usedVertices.length; j++) {
							const uv = usedVertices[j];
							if (uv.outer) {
								const dist = Vec2.SqrLength(Vec2.Subtract(spaceVertices[uv.vertId], vert));
								if (closestVert.distance > dist) {
									closestVert.uvId = j;
									closestVert.vId = uv.vertId,
										closestVert.distance = dist;
								}
							}
						}
						spaceVertices[closestVert.vId].x = vert.x;
						spaceVertices[closestVert.vId].y = vert.y;
						usedVertices[closestVert.uvId].relocated = true;
					}

					this.debugEdgeGraphics.clear();

					let edgeNormals = [];
					for (let i = 0; i < pVertices.length; i++) {
						let a = pVertices[i];
						let b = pVertices[Num.ModGl(i + 1, pVertices.length)];
						let normal = Vec3.Cross(Vec2.Normalize(Vec2.Subtract(b, a)), new Vec3(0, 0, 1));

						edgeNormals.push({
							a, b, normal
						});
					}

					//Relocating outer vertices
					//console.group("Relocating outer vertices to edges");
					for (let i = 0; i < usedVertices.length; i++) {
						const uv = usedVertices[i];
						const vert = spaceVertices[uv.vertId];
						if (uv.outer && !uv.relocated) {
							let possibleMovements = [];
							for (let j = 0; j < edgeNormals.length; j++) {
								const en = edgeNormals[j];
								const ray = new Ray2D(vert, Vec2.MultScalar(en.normal, -1));
								let hitInfo = {};
								let hit = Ray2D.RayLineIntersect(ray, en, hitInfo);

								if (hit) {
									possibleMovements.push({
										distance: hitInfo.t1,
										newPos: Vec2.Add(vert, Vec2.MultScalar(Vec2.MultScalar(en.normal, -1), hitInfo.t1))
									});
								}
							}
							if (possibleMovements.length > 0) {
								possibleMovements.sort((a, b) => a.distance - b.distance);
								let clockwise = new Array(uv.connectedTriangles.length);
								for (let i = 0; i < uv.connectedTriangles.length; i++) {
									const ctId = uv.connectedTriangles[i];
									const v0 = spaceVertices[triangles[ctId].verts[0]];
									const v1 = spaceVertices[triangles[ctId].verts[1]];
									const v2 = spaceVertices[triangles[ctId].verts[2]];
									clockwise[i] = Polygon2D.ClockwiseOrder([v0, v1, v2]);
								}
								for (let i = 0; i < possibleMovements.length; i++) {
									const pm = possibleMovements[i];

									let changesClockwiseOrder = false;
									for (let i = 0; i < uv.connectedTriangles.length; i++) {
										const ctId = uv.connectedTriangles[i];
										const v0 = uv.vertId == triangles[ctId].verts[0] ? pm.newPos : spaceVertices[triangles[ctId].verts[0]];
										const v1 = uv.vertId == triangles[ctId].verts[1] ? pm.newPos : spaceVertices[triangles[ctId].verts[1]];
										const v2 = uv.vertId == triangles[ctId].verts[2] ? pm.newPos : spaceVertices[triangles[ctId].verts[2]];
										if (clockwise[i] != Polygon2D.ClockwiseOrder([v0, v1, v2])) {
											changesClockwiseOrder = true;
											break;
										}
									}

									if (!changesClockwiseOrder) {
										vert.x = pm.newPos.x;
										vert.y = pm.newPos.y;
										uv.relocated = true;
										break;
									}
								}
							}
							if (uv.relocated == false) {
								//console.log("No suitable relocation position was found!!");
							}
						}
					}
					//console.groupEnd();

					this.debugEdgeGraphics.clear();

					///////////////////////////////////////////////////
					//Checking the inner angles of all the triangles to see if there is one with a possible error
					///////////////////////////////////////////////////
					//console.group("Checking internal angles");
					for (let i = triangles.length - 1; i >= 0; i--) {
						const tri = triangles[i];
						const v0 = spaceVertices[tri.verts[0]];
						const v1 = spaceVertices[tri.verts[1]];
						const v2 = spaceVertices[tri.verts[2]];
						const inAngles = Triangle2D.InternalAngles(v0, v1, v2);

						const nanIndex = inAngles.findIndex(a => isNaN(a));
						console.assert(nanIndex == -1, "Has undefined angle");

						const angleIndex = inAngles.findIndex(a => a < Num.DegToRad(20));

						if (angleIndex != -1) {
							//console.log("Degenerate triangle spotted");
							//console.log("Collapsing edge");

							const i_m1 = Num.ModGl(angleIndex - 1, 3);
							const i_p1 = Num.ModGl(angleIndex + 1, 3);

							const v1Id = tri.verts[i_m1];
							const v2Id = tri.verts[i_p1];

							const v1 = spaceVertices[v1Id];
							const v2 = spaceVertices[v2Id];

							const vAverage = Vec2.DivScalar(Vec2.Add(v1, v2), 2);

							spaceVertices[v1Id].x = vAverage.x;
							spaceVertices[v1Id].y = vAverage.y;

							triangles.splice(i, 1);

							triangles.forEach(t => {
								const tvIndex = t.verts.findIndex(vi => vi == v2Id);
								if (tvIndex != -1) {
									t.verts[tvIndex] = v1Id;
									//console.log(`chaging ${v2Id} to ${v1Id}`);
								}
							});
						}
					}
					//console.groupEnd();

					this.debugEdgeGraphics.clear();
					//drawAllTriangles();

					//console.log(triangles);

					//////////////////////////////////////////////
					//Randomly collapse triangles
					//////////////////////////////////////////////
					const maxDiff = Num.DegToRad(30);
					for (let i = 0; i < triangles.length; i++) {
						const tri = triangles[i];

						if (tri.remove == false) {
							const v0 = spaceVertices[tri.verts[0]];
							const v1 = spaceVertices[tri.verts[1]];
							const v2 = spaceVertices[tri.verts[2]];

							

							const iAngles = Triangle2D.InternalAngles(v0, v1, v2);

							//FOR EQUILATERAL TRIANGLES
							
							const diff0 = Math.abs(iAngles[0] - iAngles[1]);
							const diff1 = Math.abs(iAngles[1] - iAngles[2]);
							const diff2 = Math.abs(iAngles[2] - iAngles[0]);
							
							//FOR RECT TRIANGLES
							const diff0 = Math.abs(iAngles[0] - iAngles[1]);
							const diff1 = Math.abs(iAngles[1] - iAngles[2]);
							const diff2 = Math.abs(iAngles[2] - iAngles[0]);
							const avgAngle = (diff0 + diff1 + diff2)/3;
							

							//if(avgAngle < 20){
							if (diff0 < maxDiff && diff1 < maxDiff && diff2 < maxDiff) {
								const rand = Math.random();
								if (rand < 0.2) {
									let minVert = 0;
									minVert = iAngles[1] < iAngles[minVert] ? 1 : minVert;
									minVert = iAngles[2] < iAngles[minVert] ? 2 : minVert;

									let minVert_m1 = Num.ModGl(minVert - 1, 3);
									let minVert_p1 = Num.ModGl(minVert + 1, 3);

									const vId0 = tri.verts[minVert_m1];
									const vId1 = tri.verts[minVert_p1];

									const outerIndex = usedVertices.findIndex(uv => {
										return uv.outer == true && (uv.vertId == vId0 || uv.vertId == vId1);
									});

									if (outerIndex != -1) {
										//console.log("Trying to collapse outer");
									} else {
										const connectedTriangleIndex = triangles.findIndex((t, tid) => {
											if (t.remove == false && tid != i) {
												const id0 = t.verts.findIndex(v => v == vId0);
												const id1 = t.verts.findIndex(v => v == vId1);
												if (id0 != -1 && id1 != -1) {
													return true;
												}
											}
											return false;
										});

										//if (connectedTriangleIndex != -1) {
										if (connectedTriangleIndex != -1) triangles[connectedTriangleIndex].remove = true;
										triangles[i].remove = true;

										const sv1 = spaceVertices[vId0];
										const sv2 = spaceVertices[vId1];

										const vAverage = Vec2.DivScalar(Vec2.Add(sv1, sv2), 2);

										spaceVertices[vId0].x = vAverage.x;
										spaceVertices[vId0].y = vAverage.y;

										triangles.splice(i, 1);
										triangles.forEach(t => {
											const tvIndex = t.verts.findIndex(vi => vi == vId1);
											if (tvIndex != -1) {
												t.color = edgeColor;
												t.verts[tvIndex] = vId0;
											}
										});
										//}
									}
								}
							}
						}
					}

					triangles = triangles.filter(tri => tri.remove == false);
					updateUsedVerticesArray();

					console.log(`Triangle count before removing sqares and pentagons : ${triangles.length}`)
					//////////////////////////////////////////////
					//Collapse problematic triangles
					//////////////////////////////////////////////
					let c1 = Draw.HexColor(0.25, 0, 0.5);
					let c2 = Draw.HexColor(0.5, 0.75, 0.1);

					const pt0 = performance.now();
					triangles.forEach(tri => {
						tri.color = c2;
					})
					while (true) {
						let edgeSet = [];

						const getEdgeIndex = (e0, e1) => {
							return edgeSet.findIndex(edge => (edge.e0 == e0 || edge.e0 == e1) && (edge.e1 == e0 || edge.e1 == e1));
						}

						const pushEdge = (e0, e1, triIndex, euv0, euv1) => {
							const edgeIndex = getEdgeIndex(e0, e1);
							if (edgeIndex == -1) {
								edgeSet.push({
									e0,
									e1,
									tris: [triIndex],
									euv0,
									euv1
								});
							} else {
								edgeSet[edgeIndex].tris.push(triIndex);
							}
						}

						const getAllEdgesWithVertex = (vertId) => {
							let edges = [];
							edgeSet.forEach((edge) => {
								if (edge.e0 == vertId || edge.e1 == vertId) {
									edges.push(edge);
								}
							});
							return edges;
						}

						triangles.forEach((tri, index) => {
							pushEdge(tri.verts[0], tri.verts[1], index, tri.uvIds[0], tri.uvIds[1]);
							pushEdge(tri.verts[1], tri.verts[2], index, tri.uvIds[1], tri.uvIds[2]);
							pushEdge(tri.verts[2], tri.verts[0], index, tri.uvIds[2], tri.uvIds[0]);
						});

						const removeEdge = (e0, e1) => {
							const index = getEdgeIndex(e0, e1);
							edgeSet[index].tris.forEach(ti => {
								triangles[ti].remove = true;
							});
						}

						const getConnectionData = (vertId) => {
							let edges = getAllEdgesWithVertex(vertId);
							let connectionData = edges.map(edge => {
								if (edge.e0 == vertId) {
									return {
										edge: edge,
										vertId: edge.e1,
										count: usedVertices[edge.euv1].connectedTriangles.length
									}
								} else {
									return {
										edge: edge,
										vertId: edge.e0,
										count: usedVertices[edge.euv0].connectedTriangles.length
									}
								}
							});
							return connectionData;
						}

						const collapseEdge = (vertId, connId, connectionData) => {
							const v0 = spaceVertices[vertId];
							const v1 = spaceVertices[connectionData[connId].vertId];

							const avg = Vec2.DivScalar(Vec2.Add(v1, v0), 2);

							spaceVertices[vertId].x = avg.x;
							spaceVertices[vertId].y = avg.y;

							triangles.forEach(tri => {
								const vid = tri.verts.findIndex(v => v == connectionData[connId].vertId);
								if (vid != -1) {
									tri.verts[vid] = vertId;
									tri.color = c1;
								}
							})

							removeEdge(connectionData[connId].edge.e0, connectionData[connId].edge.e1);
						}

						let foundEdge = false;

						for (let i = 0; i < usedVertices.length; i++) {
							const uv = usedVertices[i];

							if (!uv.outer && uv.connectedTriangles.length <= 4) {
								let connectionCount = getConnectionData(uv.vertId);
								connectionCount.sort((a, b) => a.count - b.count);
								//console.log(`Collapse ${uv.connectedTriangles.length} tri`);
								collapseEdge(uv.vertId, 0, connectionCount);

								foundEdge = true;
								break;
							}
							else if (!uv.outer && uv.connectedTriangles.length == 5) {
								let connectionData = getConnectionData(uv.vertId);
								let pentIndex = connectionData.findIndex(cdata => {
									if (cdata.count == 5) {
										let pentagonTri = false;
										cdata.edge.tris.forEach(triId => {
											let pentCount = 0;
											triangles[triId].uvIds.forEach(uvid => {
												if (usedVertices[uvid].connectedTriangles.length == 5 && !usedVertices[uvid].outer) {
													pentCount++;
												}
											});
											if (pentCount == 3) {
												pentagonTri = true;
											}
										});
										return !pentagonTri;
									}
								});
								//if(pentIndex != -1) console.log("Rand", rand);
								if (pentIndex != -1) {
									//console.log("Collapse 5 tri", rand);
									connectionData[pentIndex]
									collapseEdge(uv.vertId, pentIndex, connectionData);
									foundEdge = true;
									break;
								}
							}
							else if (uv.outer && uv.connectedTriangles.length == 1) {
								triangles[uv.connectedTriangles[0]].remove = true;
								foundEdge = true;
							}
						}
						if (!foundEdge) {
							break;
						} else {
							triangles = triangles.filter(tri => tri.remove == false);
							updateUsedVerticesArray();
						}
					}
					//////////////////////////////////////////////
					const pt1 = performance.now();
					console.log(`Triangle count after removing sqares and pentagons : ${triangles.length} || took ${pt1 - pt0} miliseconds`)

					const t2 = performance.now();
					console.log(`The triangulation took ${t2 - t1} miliseconds`);

					let relaxationCount = {
						count: 0
					}

					this.polygonVertices.forEach(pv => {
						pv.graphics.clear();
					});

					const computeEdgeLengthAverage = () => {
						let edgeSet = [];

						const hasEdge = (e0, e1) => {
							const index = edgeSet.findIndex(edge => (edge.e0 == e0 || edge.e0 == e1) && (edge.e1 == e0 || edge.e1 == e1));
							return index != -1;
						}

						const pushEdge = (e0, e1, len) => {
							if (!hasEdge(e0, e1)) {
								edgeSet.push({
									e0,
									e1,
									len
								});
							}
						}

						let edgeLengthAvg = 0;
						let edgeCount = 0;
						triangles.forEach(tri => {
							let v0 = spaceVertices[tri.verts[0]];
							let v1 = spaceVertices[tri.verts[1]];
							let v2 = spaceVertices[tri.verts[2]];

							let e0Len = Vec2.Length(Vec2.Subtract(v0, v1));
							let e1Len = Vec2.Length(Vec2.Subtract(v1, v2));
							let e2Len = Vec2.Length(Vec2.Subtract(v2, v0));

							pushEdge(tri.verts[0], tri.verts[1], e0Len);
							pushEdge(tri.verts[1], tri.verts[2], e1Len);
							pushEdge(tri.verts[2], tri.verts[0], e2Len);
						});
						//console.log(edgeSet);
						edgeSet.forEach(edge => {
							edgeLengthAvg += edge.len;
							edgeCount++;
						})
						edgeLengthAvg /= edgeCount;
						return edgeLengthAvg;
					}

					const avgLength = computeEdgeLengthAverage();
					console.log(`Starting edge average: ${avgLength} || desired : ${TRIANGLE_EDGE}`);

					const distFromCenter = (avgLength / 2) / Math.sin(Num.DegToRad(60));

					const expectedArea = Triangle2D.Area(new Vec2(0, 0), new Vec2(TRIANGLE_EDGE, 0), new Vec2(TRIANGLE_EDGE / 2, TRIANGLE_HEIGHT));

					const GetTriangleAreaAverage = () => {
						let areaSum = 0;
						let areaCount = 0
						triangles.forEach(tri => {
							let v0 = spaceVertices[tri.verts[0]];
							let v1 = spaceVertices[tri.verts[1]];
							let v2 = spaceVertices[tri.verts[2]];

							areaSum += Triangle2D.Area(v0, v1, v2);
							areaCount += 1;
						})
						return areaSum / areaCount;
					}

					const avgArea = GetTriangleAreaAverage();
					console.log(`Avergae area before relaxation: ${avgArea}`);
					console.log(`Clamp inverse : 
					${Num.ClampedInverseLerp(expectedArea, expectedArea / 2, expectedArea * 3.9 / 4)} | 
					${Num.ClampedInverseLerp(expectedArea, expectedArea / 2, expectedArea * 3 / 4)} | 
					${Num.ClampedInverseLerp(expectedArea, expectedArea / 2, expectedArea * 2 / 4)}`)

					const TriangleRectSquashiness = (v0, v1, v2) => {
						const area = Triangle2D.Area(v0, v1, v2);
						const iAngles = Triangle2D.InternalAngles(v0, v1, v2);
						const minAngle = iAngles.sort((a, b) => a - b)[0];

						const angleSqashiness = Num.ClampedInverseLerp(Num.DegToRad(50), Num.DegToRad(35), minAngle);
						const areaSquashiness = Num.Clamp(Math.abs(Num.InverseLerp(avgArea, avgArea * 0.3, area)), 0, 1);
						return {
							areaSquashiness,
							angleSqashiness
						};
					}

					console.log("Testing the inverlerp", Num.InverseLerp(10, 5, 7.5), Num.InverseLerp(10, 5, 12.5))

					const TriangleSquashiness = (v0, v1, v2) => {
						const area = Triangle2D.Area(v0, v1, v2);
						const iAngles = Triangle2D.InternalAngles(v0, v1, v2);
						const minAngle = iAngles.sort((a, b) => a - b)[0];

						const angleSqashiness = Num.ClampedInverseLerp(Num.DegToRad(50), Num.DegToRad(40), minAngle);
						const areaSquashiness = Num.Clamp(Math.abs(Num.InverseLerp(avgArea, avgArea * 0.3, area)), 0, 1);
						return {
							areaSquashiness,
							angleSqashiness
						};
					}

					const SQASHED_MULTIPLIER = 4;
					const UNSQUASHED_MULTIPLIER = -1;
					const DIFF_MULTIPLIER = 0.05;
					const OUTER_MULTIPLIER = 0.02;

					let trianglesSquashMult = new Array(triangles.length);
					let trianglesVertOrder = new Array(triangles.length);

					const relaxationForce = (v0, v1, mult) => {
						const edgeCenter = Vec2.DivScalar(Vec2.Add(v0, v1), 2);
						const normV0 = Vec2.Normalize(Vec2.Subtract(v0, edgeCenter));
						const normV1 = Vec2.Normalize(Vec2.Subtract(v1, edgeCenter));
						const edgeLenght = Vec2.Length(Vec2.Subtract(v1, v0));
						const movement = (avgLength - edgeLenght) / 2;

						return {
							v0Diff: Vec2.MultScalar(normV0, movement * mult),
							v1Diff: Vec2.MultScalar(normV1, movement * mult)
						}
					}

					const addMovementDiff = (v0, v1, tri, i0, i1, mult) => {
						const movDiff = relaxationForce(v0, v1, mult);
						Vec2.Add(
							usedVertices[tri.uvIds[i0]].relaxationForce,
							movDiff.v0Diff,
							usedVertices[tri.uvIds[i0]].relaxationForce
						);
						Vec2.Add(
							usedVertices[tri.uvIds[i1]].relaxationForce,
							movDiff.v1Diff,
							usedVertices[tri.uvIds[i1]].relaxationForce
						);
					}

					//Get clock orders
					triangles.forEach((tri, index) => {
						let v0 = spaceVertices[tri.verts[0]];
						let v1 = spaceVertices[tri.verts[1]];
						let v2 = spaceVertices[tri.verts[2]];

						trianglesVertOrder[index] = Polygon2D.ClockwiseOrder([v0, v1, v2]);
						console.assert(!trianglesVertOrder[index], "Some triangles are out of order");
					});

					console.log("Triangle count : ", triangles.length);

					const equilateralTriangleEdgeRelax = (tri, mult) =>{
						let v0 = spaceVertices[tri.verts[0]];
						let v1 = spaceVertices[tri.verts[1]];
						let v2 = spaceVertices[tri.verts[2]];
						addMovementDiff(v0, v1, tri, 0, 1, mult);
						addMovementDiff(v1, v2, tri, 1, 2, mult);
						addMovementDiff(v2, v0, tri, 2, 0, mult);
					}

					const equilateralTriangleRelax = (tri, mult) => {
						let v0 = spaceVertices[tri.verts[0]];
						let v1 = spaceVertices[tri.verts[1]];
						let v2 = spaceVertices[tri.verts[2]];

						let center = Vec2.DivScalar(Vec2.Add(v0, Vec2.Add(v1, v2)), 3);

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
							usedVertices[tri.uvIds[0]].relaxationForce,
							diffV0,
							usedVertices[tri.uvIds[0]].relaxationForce
						);

						Vec2.Add(
							usedVertices[tri.uvIds[1]].relaxationForce,
							diffV1,
							usedVertices[tri.uvIds[1]].relaxationForce
						);

						Vec2.Add(
							usedVertices[tri.uvIds[2]].relaxationForce,
							diffV2,
							usedVertices[tri.uvIds[2]].relaxationForce
						);
					}

					const rectTriangleRelax = (tri) => {
						const A = avgLength;
						const As2d2 = Math.SQRT2 * A / 2;

						const getVert = (index) => {
							return spaceVertices[tri.verts[index]];
						}

						//console.assert(verts.length != 3, "VERT ARRAY DOES NOT HAVE THE CORRECT SIZE");
						//1. Get prev center
						let prevCenter = Vec2.DivScalar(Vec2.Add(getVert(0), Vec2.Add(getVert(1), getVert(2))), 2);

						//2. Get largest edge
						const edgeLenght = (edgeId) => {
							return Vec2.Length(
								Vec2.Subtract(
									getVert(edgeId),
									getVert(Num.ModGl(edgeId - 1, 3)))
							);
						}
						let lEdge = 0;
						let lEdgeLen = edgeLenght(lEdge);
						for (let i = 1; i < 3; i++) {
							let eLen = edgeLenght(i);
							if (lEdgeLen < eLen) {
								lEdgeLen = eLen;
								lEdge = i;
							}
						}

						let largeVec = Vec2.Subtract(getVert(Num.ModGl(lEdge - 1, 3)), getVert(lEdge));
						//3. Get normal from large edge
						let norm = Vec2.Normalize(largeVec);
						let edgeNorm = Vec2.Copy(Vec3.Cross(norm, new Vec3(0, 0, 1)));
						let edgeCenter = Vec2.DivScalar(Vec2.Add(getVert(Num.ModGl(lEdge - 1, 3)), getVert(lEdge)), 2);

						let iP0 = Num.ModGl(lEdge + 1, 3);
						let iP1 = lEdge;
						let iP2 = Num.ModGl(lEdge - 1, 3);

						let sP0 = Vec2.Subtract(getVert(iP0), edgeCenter);
						let sP1 = Vec2.Subtract(getVert(iP1), edgeCenter);
						let sP2 = Vec2.Subtract(getVert(iP2), edgeCenter);

						let eP0 = Vec2.MultScalar(edgeNorm, As2d2);
						let eP1 = Vec2.MultScalar(Vec2.Normalize(sP1), As2d2);
						let eP2 = Vec2.MultScalar(Vec2.Normalize(sP2), As2d2);

						let newCenter = Vec2.Add(edgeCenter, Vec2.DivScalar(Vec2.Add(eP0, Vec2.Add(eP1, eP2)), 3));
						let centerAlignOffset = Vec2.MultScalar(Vec2.Subtract(prevCenter, newCenter), 0.001);

						//let diffP0 = Vec2.Add(centerAlignOffset,Vec2.Subtract(eP0, sP0));
						//let diffP1 = Vec2.Add(centerAlignOffset,Vec2.Subtract(eP1, sP1));
						//let diffP2 = Vec2.Add(centerAlignOffset,Vec2.Subtract(eP2, sP2));

						let diffP0 = Vec2.Subtract(eP0, sP0);
						let diffP1 = Vec2.Subtract(eP1, sP1);
						let diffP2 = Vec2.Subtract(eP2, sP2);

						Vec2.Add(
							usedVertices[tri.uvIds[iP0]].relaxationForce,
							diffP0,
							usedVertices[tri.uvIds[iP0]].relaxationForce
						);

						Vec2.Add(
							usedVertices[tri.uvIds[iP1]].relaxationForce,
							diffP1,
							usedVertices[tri.uvIds[iP1]].relaxationForce
						);

						Vec2.Add(
							usedVertices[tri.uvIds[iP2]].relaxationForce,
							diffP2,
							usedVertices[tri.uvIds[iP2]].relaxationForce
						);
					}

					triangles.forEach(tri => {
						let v0 = spaceVertices[tri.verts[0]];
						let v1 = spaceVertices[tri.verts[1]];
						let v2 = spaceVertices[tri.verts[2]];

						const tSquashiness = TriangleSquashiness(v0, v1, v2);
						const maxSquash = Math.max(tSquashiness.angleSqashiness, tSquashiness.areaSquashiness);
						//const squishiness = Math.pow(maxSquash, 1);
						tri.color = Draw.HexColor(
							0,
							Num.Lerp(0, 1, maxSquash),
							Num.Lerp(1, 0, maxSquash));

						//let octaVert = tri.uvIds.findIndex(uvid => usedVertices[uvid].connectedTriangles.length > 8);
						if(octaVert != -1){
							tri.remove = true;
						}

						let connectionCount = [
							usedVertices[tri.uvIds[0]].connectedTriangles.length,
							usedVertices[tri.uvIds[1]].connectedTriangles.length,
							usedVertices[tri.uvIds[2]].connectedTriangles.length
						]
					
						if(connectionCount[0] == 5 && connectionCount[1] == 5 && connectionCount[2] == 5){
								tri.remove = true;
							}
						
						let countIndex = connectionCount.findIndex(count => count == 5);
						if(countIndex != -1) connectionCount.splice(countIndex, 1);
						
						countIndex = connectionCount.findIndex(count => count == 5);
						if(countIndex != -1) connectionCount.splice(countIndex, 1);
						
						countIndex = connectionCount.findIndex(count => count == 6);
						if(countIndex != -1) connectionCount.splice(countIndex, 1);
						
						//if(connectionCount.length == 0) tri.remove = true;
					});

					triangles = triangles.filter(tri => tri.remove == false);
					updateUsedVerticesArray();

					const relaxTriangle = () => {

						const stepsStart = performance.now();
						for (let stepIndex = 0; stepIndex < 32; stepIndex++) {
							let squashedCount = 0;
							triangles.forEach((tri, triIndex) => {
								if (tri.remove) return;

								//if(Num.ModGl(stepIndex, 8) == 0)
								{
									let v0 = spaceVertices[tri.verts[0]];
									let v1 = spaceVertices[tri.verts[1]];
									let v2 = spaceVertices[tri.verts[2]];

									const tSquashiness = TriangleSquashiness(v0, v1, v2);
									const maxSquash = Math.max(tSquashiness.angleSqashiness, tSquashiness.areaSquashiness);
									const squishiness = maxSquash;// Math.pow(maxSquash, 4);

									if(relaxationCount.count != 0 && Num.ModGl(relaxationCount.count, 15*5) == 0 && stepIndex == 0){
										if(maxSquash > 0.7){
											let outerCount = 0;
											tri.uvIds.forEach(uvi => {
												if(usedVertices[uvi].outer){
													outerCount ++;
												}
											});
											if(outerCount >= 2){
												tri.uvIds.forEach(uvi => {
													usedVertices[uvi].outer = true;
												});
												tri.remove = true;
												return;
											}
										}
									}

									trianglesSquashMult[triIndex] = Num.Lerp(UNSQUASHED_MULTIPLIER, SQASHED_MULTIPLIER, squishiness);
									tri.color = Draw.HexColor(
										0,
										Num.Lerp(0, 1, squishiness),
										Num.Lerp(1, 0, squishiness));
								}


								//if (rand > 0.25) {
								//equilateralTriangleEdgeRelax(tri, trianglesSquashMult[triIndex])
								//rectTriangleRelax(tri);
								equilateralTriangleRelax(tri, trianglesSquashMult[triIndex]);
								//}
							});

							if (stepIndex == 0) {
								//console.log("Squash count: ", squashedCount);
							}

							usedVertices.forEach(uv => {
								if (uv.remove) return;
								const mult = DIFF_MULTIPLIER * (uv.outer ? OUTER_MULTIPLIER : 1) * Num.Lerp(0.5, 1, Num.ClampedInverseLerp(8, 4, uv.connectedTriangles.length));
								//const applyForce = uv.relaxationForce;//Vec2.Add(Vec2.MultScalar(uv.prevRelaxationForce, 0.25), );
								Vec2.Add(Vec2.MultScalar(uv.relaxationForce, mult), spaceVertices[uv.vertId], spaceVertices[uv.vertId]);

								//uv.prevRelaxationForce.x = applyForce.x;
								//uv.prevRelaxationForce.y = applyForce.y;
								uv.relaxationForce.x = 0;
								uv.relaxationForce.y = 0;
							});
						}
						const stepsEnd = performance.now();
						//console.log(`Step computation took: ${stepsEnd - stepsStart} ms`);

						if (relaxationCount.count != 0 && Num.ModGl(relaxationCount.count, 15) == 0) {
							console.log("Attempt to collapse vertices", "Max Closest Distance : ", Math.pow(avgLength, 2) * 0.15);
							for (let i = 0; i < usedVertices.length; i++) {
								const uv0 = usedVertices[i];
								if (uv0.remove == false && uv0.outer) {
									let closestVertId = -1;
									let closestDistance = Math.pow(avgLength, 2) * 0.3;
									for (let j = 0; j < usedVertices.length; j++) {
										const uv1 = usedVertices[j];

										if (j != i && uv1.outer && !uv1.remove) {//Only outer vertices need to be collapsed
											const sqrLen = Vec2.SqrLength(Vec2.Subtract(spaceVertices[uv0.vertId], spaceVertices[uv1.vertId]));

											if (closestDistance > sqrLen) {
												closestDistance = sqrLen;
												closestVertId = j;
											}
										}
									}
									if (closestVertId != -1) {
										console.log(`Collapse Vertices ${i} - ${closestVertId} | distance ${closestDistance}`);
										const uv1 = usedVertices[closestVertId];

										const v0 = spaceVertices[uv0.vertId];
										const v1 = spaceVertices[uv1.vertId];

										const avg = Vec2.DivScalar(Vec2.Add(v0, v1), 2);

										spaceVertices[uv0.vertId].x = avg.x;
										spaceVertices[uv0.vertId].y = avg.y;

										uv1.remove = true;
										triangles.forEach((tri, triId) => {
											const triVid0 = triangles[triId].verts.findIndex(v => v == uv0.vertId);
											const triVid = triangles[triId].verts.findIndex(v => v == uv1.vertId);
											if (triVid != -1) {
												if (triVid0 != -1) {
													triangles[triId].remove = true;
												} else {
													triangles[triId].verts[triVid] = uv0.vertId;
													triangles[triId].uvIds[triVid] = i;
												}
											}
										});
									}
								}
							}
						}

						this.debugEdgeGraphics.clear();
						drawAllTriangles(false);
						drawPolygonEdges();
						drawOuterVertices(edgeVertColor);
						drawRemoveVertices(Draw.HexColor(1, 0, 0));

						relaxationCount.count += 1;
						if (relaxationCount.count > 15 * 15) {
							this.pixiApp.ticker.remove(relaxTriangle);
							console.log("Finished relaxation");
							console.log(`Avergae area after relaxation: ${GetTriangleAreaAverage()}`);

							this.debugEdgeGraphics.clear();
							drawAllTriangles(false);
						}
					}

					this.debugEdgeGraphics.clear();
					drawAllTriangles(false);
					drawOuterVertices(edgeVertColor);

					setTimeout(() => {
						this.pixiApp.ticker.add(relaxTriangle);
					}, 1000);
				}*/
			} else {
				this.addVertex(pos);
				if (this.polygonVertices.length > 1) {
					this.addEdge(this.polygonVertices.length - 2, this.polygonVertices.length - 1);
				}
			}
			inputStore.mouse.buttons[0] = false;
		}

		//Animate start vertex
		/*if (this.polygonVertices.length > 0) {
			let currentTime = (new Date()).getTime() - this.systemStartTime;
			currentTime /= 1000;
			let interpolator = (Math.sin(currentTime * 4) / 2 + 0.5) * 0.5 + 0.5;
			this.polygonVertices[0].container.scale.set(interpolator, interpolator);
		}*/

		//Check if mouse hovering any vertex
		if (!this.polygonIsClosed) {
			for (let i = 0; i < this.polygonVertices.length; i++) {
				const vertex = this.polygonVertices[i];
				let mouseToVer = {
					x: vertex.position.x - cursorPos.x,
					y: vertex.position.y - cursorPos.y
				}
				let lenghtSquared = Math.pow(mouseToVer.x, 2) + Math.pow(mouseToVer.y, 2);
				if (lenghtSquared < 16 * 16) {
					if (vertex.hover == false) {
						this.drawVertexHover(vertex.graphics);
						vertex.hover = true;
					}
					break;
				} else {
					if (vertex.hover == true) {
						this.drawVertexNormal(vertex.graphics);
						vertex.hover = false;
					}
				}
			}
		}

		this.newVertexContainer.position.set(pos.x, pos.y);

		//Draw new edge graphic
		if (this.polygonVertices.length > 0) {
			let lastVertexPos = this.polygonVertices[this.polygonVertices.length - 1].position;
			this.newEdgeContainer.position.set(lastVertexPos.x, lastVertexPos.y);

			this.newEdgeGraphics.clear();

			if (!this.polygonIsClosed) {
				let fromTo = Vec2.Subtract(pos, lastVertexPos);
				let fromToDir = Vec2.Normalize(fromTo);
				let normal = Vec3.Cross(fromToDir, new Vec3(0, 0, 1));

				let side1Offset = Vec2.MultScalar(normal, TRIANGLE_HEIGHT);
				let side2Offset = Vec2.MultScalar(normal, -TRIANGLE_HEIGHT);
				Draw.DashLine(this.newEdgeGraphics, Vec2.Zero(), fromTo, new Vec2(48, 24), 8, edgeColor);
				Draw.DashLine(this.newEdgeGraphics, side1Offset, Vec2.Add(side1Offset, fromTo), new Vec2(48, 24), 8, side == -1 ? 0xff00ff : 0xffffff);
				Draw.DashLine(this.newEdgeGraphics, side2Offset, Vec2.Add(side2Offset, fromTo), new Vec2(48, 24), 8, side == 1 ? 0xff00ff : 0xffffff);

				this.newEdgeGraphics.lineStyle({
					width: 8,
					color: 0xff0000
				});
				this.newEdgeGraphics.moveTo(fromTo.x, fromTo.y);
				let normalLine = Vec2.Add(Vec2.MultScalar(normal, 50), fromTo);
				this.newEdgeGraphics.lineTo(normalLine.x, normalLine.y);
			}
		} else {
			//this.newEdgeGraphics.clear();
		}
	}
}