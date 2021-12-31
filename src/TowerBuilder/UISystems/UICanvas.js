import * as PIXI from 'pixi.js'
import Draw from '../Draw';
import Vec2 from '../Math/Vec2';
import VerticalGroup from './VerticalGroup';
import PixiButton,{ButtonStyle} from './Button';

import { commonStyles } from './Styles';

export default class UICanvas{
	/**
	 * @param {HTMLCanvasElement} canvasHTMLElement 
	 */
	constructor(canvasHTMLElement, startSystem){
		
		{//Stop shared ticker
			let ticker = PIXI.Ticker.shared;
 			ticker.autoStart = false;
 			ticker.stop();
		}
		
		this.size = window.TowerBuilder.getContainerSize();
		
		this.pixiApp = new PIXI.Application({
			width: this.size.width,
			height: this.size.height,
			backgroundColor: 0x000000,
			backgroundAlpha: 0,
			view: canvasHTMLElement,
			antialias: true,
			autoStart: false
		});

		this.pixiApp.stage.sortableChildren = true;

		this.pixiApp.ticker.add(this.update.bind(this));

		this.cursorContainer = new PIXI.Container();
		this.cursorGraphic = new PIXI.Graphics();

		this.cursorContainer.zIndex = 1000;
		this.cursorContainer.addChild(this.cursorGraphic);
		this.pixiApp.stage.addChild(this.cursorContainer);

		this.cursorDetailContainer = new PIXI.Container();
		this.cursorDetailGraphic = new PIXI.Graphics();
		this.cursorDetailContainer.zIndex = 999;
		this.cursorDetailContainer.addChild(this.cursorDetailGraphic);
		this.pixiApp.stage.addChild(this.cursorDetailContainer);

		this.drawNormalDetail();

		this.drawCursor();

		this.externalDetailPosition = Vec2.Zero();
		this.useExternal = false;

		window.TowerBuilder.UICanvas = {
			setDetailPosition: this.setDetailPosition.bind(this)
		};

		this.logoContainer = null;
		this.createLogo(startSystem);
		this.UIElements = [this.logoContainer];
	}
	
	addUIElement(createElement){
		this.UIElements.push(createElement(this.pixiApp.stage));
	}

	createLogo(startSystem){
		this.logoContainer = new VerticalGroup(this.pixiApp.stage, commonStyles.verticalGroupBG, new Vec2(60,60), 0, Draw.HexColor(0.1,0.3,0.5), 30);
		const primaryText = new PIXI.Text('Tower Builder', new PIXI.TextStyle({ fontFamily: 'Bubblegum Sans', fontSize: 100, fill:0xffffff }));
		const secondaryText = new PIXI.Text('A tower building toy game inspired by Townscaper', 
			new PIXI.TextStyle({ fontFamily: 'Bubblegum Sans', fontSize: 35, align: 'center', fill:0xffffff }));
		const byMe = new PIXI.Text('By Euri Herasme', 
			new PIXI.TextStyle({ fontFamily: 'Bubblegum Sans', fontSize: 25, align: 'center', fill:0xffffff }));

		this.logoContainer.addElement(null,primaryText, 0);
		this.logoContainer.addElement(null,byMe, 0);
		this.logoContainer.addElement(null,secondaryText, 25);
		

		const logoButton = new PixiButton("START", 
		commonStyles.baseButton,
			()=>{
				startSystem(),
				this.pixiApp.stage.removeChild(this.logoContainer.container);
				const index = this.UIElements.findIndex((uiElem)=> uiElem === this.logoContainer);
				this.UIElements.splice(index, 1);
			});

		this.logoContainer.addElement(logoButton, logoButton.container, 20);

		this.logoContainer.container.position.set(this.size.width / 2, this.size.height / 2 - this.logoContainer.container.height / 2)
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
		let inputStore = /** @type {import("../types").Input} */ (window.TowerBuilder.input);
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

		this.UIElements.forEach(uiElem =>{
			uiElem.update(dt);
		});
	}
}