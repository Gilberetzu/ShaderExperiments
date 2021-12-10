import * as PIXI from 'pixi.js'
import Draw from '../Draw';
import Polygon2D from '../Geometry/Polygon2D';
import Vec2 from "../Math/Vec2";

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

		this.pixiApp.stage.position.set(64, canvasRect[0].height - 64);

		//State variables - needs to be changed to state machine or something
		this.panning = false;
		this.mousePosStartPanning = Vec2.Zero();
		this.stagePosStartPanning = Vec2.Zero();
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
		})
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
		vertexGraphics.arc(0, 0, 100, 0, 3.14*2, false);
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

	/**
	 * 
	 * @param {number} from 
	 * @param {number} to 
	 */
	addEdge(from, to) {
		let edgeContainer = new PIXI.Container();
		let edgeGraphic = new PIXI.Graphics();

		edgeGraphic.lineStyle({
			width: 8,
			color: 0xAAAAAA
		});

		let fromVerPos = this.polygonVertices[from].position;
		let toVerPos = this.polygonVertices[to].position

		edgeGraphic.moveTo(fromVerPos.x, fromVerPos.y);
		edgeGraphic.lineTo(toVerPos.x, toVerPos.y);

		edgeContainer.addChild(edgeGraphic);
		edgeContainer.zIndex = 5;
		this.pixiApp.stage.addChild(edgeContainer);

		this.polygonEdges.push({
			vertices: [from, to],
			container: edgeContainer,
			graphics: edgeGraphic
		});
	}

	/**
	 * 
	 * @param {import("../types").Input} inputStore 
	 */
	doPanning(inputStore) {
		if(!this.panning && inputStore.mouse.buttons[1]){
			this.mousePosStartPanning = Vec2.Copy(inputStore.mouse.position);
			this.stagePosStartPanning = Vec2.Copy(this.pixiApp.stage.position);
			this.panning = true;
		}
		
		if(!inputStore.mouse.buttons[1]){
			this.panning = false;
		}
		
		if (this.panning) {
			let mouseDelta = Vec2.Subtract(inputStore.mouse.position, this.mousePosStartPanning);
			let newStagePosition = Vec2.Add(mouseDelta, this.stagePosStartPanning);
			this.pixiApp.stage.position.set(newStagePosition.x, newStagePosition.y);
		}
	}

	drawTriangles(triangles){
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

		let pos = Vec2.Subtract(inputStore.mouse.position, this.pixiApp.stage.position);
		this.cursorContainer.position.set(pos.x, pos.y);
		for (let i = 1; i < this.polygonVertices.length; i++) {
			const v = this.polygonVertices[i];
			let toVert = Vec2.Subtract(pos, v.position);
			if(Vec2.Length(toVert) < 100){
				Vec2.Add(v.position, Vec2.MultScalar(Vec2.Normalize(toVert), 100), pos);
			}
		}

		//Add vertex
		if (inputStore.mouse.buttons[0]) {
			if (this.polygonVertices.length > 0 && this.polygonVertices[0].hover) {
				this.addEdge(this.polygonVertices.length - 1, 0);
				this.polygonIsClosed = true;

				let verticesInvertY = this.polygonVertices.map(v => {
					return Vec2.MultComp(v.position, new Vec2(1,-1));
				});
				let clockwise = Polygon2D.ClockwiseOrder(verticesInvertY);
				let pVertices;
				if(!clockwise){//Revert vertices order to make the polygon clockwise
					pVertices = [];
					for (let i = verticesInvertY.length - 1; i >= 0 ; i--) {
						const vert = verticesInvertY[i];
						pVertices.push(vert);
					}
				}else{
					pVertices = verticesInvertY;
				}
				
				let concaveVertices = Polygon2D.GetConcaveVertices(pVertices);
				this.drawTriangles(Polygon2D.Triangulate(pVertices,concaveVertices));
			} else {
				this.addVertex(pos);
				if (this.polygonVertices.length > 1) {
					this.addEdge(this.polygonVertices.length - 2, this.polygonVertices.length - 1);
				}

				
			}
			inputStore.mouse.buttons[0] = false;
		}

		//Animate start vertex
		if (this.polygonVertices.length > 0) {
			let currentTime = (new Date()).getTime() - this.systemStartTime;
			currentTime /= 1000;
			let interpolator = (Math.sin(currentTime * 4) / 2 + 0.5) * 0.5 + 0.5;
			this.polygonVertices[0].container.scale.set(interpolator, interpolator);
		}

		//Check if mouse hovering any vertex
		if(!this.polygonIsClosed)
		{
			for (let i = 0; i < this.polygonVertices.length; i++) {
				const vertex = this.polygonVertices[i];
				let mouseToVer = {
					x: vertex.position.x - pos.x,
					y: vertex.position.y - pos.y
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
			Draw.DashLine(this.newEdgeGraphics, Vec2.Zero(), Vec2.Subtract(pos, lastVertexPos), new Vec2(48,24), 8, 0xffffff); 
		}else{
			this.newEdgeGraphics.clear();
		}
	}
}