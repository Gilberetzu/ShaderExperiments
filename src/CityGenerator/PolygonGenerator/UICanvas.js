import * as PIXI from 'pixi.js'
import Draw from '../Draw';
import Vec2 from '../Math/Vec2';

export default class UICanvas{
	/**
	 * @param {HTMLCanvasElement} canvasHTMLElement 
	 */
	constructor(canvasHTMLElement){
		
		{//Stop shared ticker
			let ticker = PIXI.Ticker.shared;
 			ticker.autoStart = false;
 			ticker.stop();
		}
		
		let size = window.CityGenerator.getContainerSize();
		
		this.pixiApp = new PIXI.Application({
			width: size.width,
			height: size.height,
			backgroundColor: 0x001020,
			backgroundAlpha: 0,
			view: canvasHTMLElement,
			antialias: true,
			autoStart: false
		});

		this.pixiApp.ticker.add(this.update.bind(this));

		this.cursorContainer = new PIXI.Container();
		this.cursorGraphic = new PIXI.Graphics();

		this.cursorContainer.addChild(this.cursorGraphic);
		this.pixiApp.stage.addChild(this.cursorContainer);

		this.cursorDetailContainer = new PIXI.Container();
		this.cursorDetailGraphic = new PIXI.Graphics();

		this.cursorDetailContainer.addChild(this.cursorDetailGraphic);
		this.pixiApp.stage.addChild(this.cursorDetailContainer);

		this.drawNormalDetail();

		this.drawCursor();

		this.externalDetailPosition = Vec2.Zero();
		this.useExternal = false;

		window.CityGenerator.UICanvas = {
			setDetailPosition: this.setDetailPosition.bind(this)
		};
	}

	drawNormalDetail(){
		this.cursorDetailGraphic.clear();
		this.cursorDetailGraphic.lineStyle({width: 3, color: Draw.HexColor(1,1,1)})
		this.cursorDetailGraphic.beginFill(Draw.HexColor(0.0,0.0,0.0));
		this.cursorDetailGraphic.drawCircle(0, 0, 6);
		this.cursorDetailGraphic.endFill();
	}

	drawInUseDetail(){
		this.cursorDetailGraphic.clear();
		this.cursorDetailGraphic.lineStyle({width: 3, color: Draw.HexColor(1,1,1)})
		this.cursorDetailGraphic.beginFill(Draw.HexColor(0.0,0.0,0.0));
		this.cursorDetailGraphic.drawCircle(0, 0, 12);
		this.cursorDetailGraphic.endFill();
		this.cursorDetailGraphic.lineStyle({width: 0})
		this.cursorDetailGraphic.beginFill(Draw.HexColor(1,1,1));
		this.cursorDetailGraphic.drawCircle(0, 0, 4);
		this.cursorDetailGraphic.endFill();
	}

	drawCursor(){
		this.cursorGraphic.clear();
		this.cursorGraphic.lineStyle({
			width:1,
			color:0x000000,
			alignment: 1
		});
		this.cursorGraphic.beginFill(Draw.HexColor(0.9,0.9,0.9));
		this.cursorGraphic.drawPolygon([
			new Vec2(0,0),
			new Vec2(8,20),
			new Vec2(0,16),
			new Vec2(-8,20),
		]);
		this.cursorGraphic.endFill();
	}

	setDetailPosition(position){
		//console.log("called");
		Vec2.Copy(position, this.externalDetailPosition);
		this.useExternal = true;
		//console.log("Use external : ", this.useExternal);
	}

	systemUpdate(time){
		this.pixiApp.ticker.update(time);
		this.pixiApp.render();
	}

	update(dt){
		let inputStore = /** @type {import("../types").Input} */ (window.CityGenerator.input);
		let pos = inputStore.mouse.position;
		this.cursorContainer.position.set(pos.x, pos.y);

		{//Update detail position
			//console.log("Use external : ", this.useExternal);
			if(this.useExternal){
				this.drawInUseDetail();
			}else{
				this.drawNormalDetail();
			}
			const newDetailPos = this.useExternal ? this.externalDetailPosition : Vec2.Add(this.cursorContainer.position, new Vec2(0, 28));
			Vec2.Lerp(this.cursorDetailContainer.position, newDetailPos, 0.2, this.cursorDetailContainer.position);
			this.useExternal = false;
		}
	}
}