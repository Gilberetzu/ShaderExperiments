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
		let size = window.CityGenerator.getContainerSize();

		this.pixiApp = new PIXI.Application({
			width: size.width,
			height: size.height,
			backgroundColor: 0x001020,
			view: canvasHTMLElement,
			antialias: true,
			autoStart: false
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

		this.pixiApp.stage.position.set(64, size.height - 64);

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
		if (!this.panning && inputStore.mouse.buttons[2]) {
			this.mousePosStartPanning = Vec2.Copy(inputStore.mouse.position);
			this.stagePosStartPanning = Vec2.Copy(this.pixiApp.stage.position);
			this.panning = true;
		}

		if (!inputStore.mouse.buttons[2]) {
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

	systemUpdate(time){
		this.pixiApp.ticker.update(time);
		this.pixiApp.render();
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
					//this.drawEdge(edge, randEdgeColor);
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
				if(this.polygonTriangulator.relaxingTriangles == false){
					this.polygonTriangulator.startTriangulation();
				}

				this.polygonVertices.forEach(pv => pv.graphics.clear());
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