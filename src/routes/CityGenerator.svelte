<script context="module">
    export const ssr = false;
</script>

<script>
    import { onMount } from 'svelte';

    let pixiSpaceCanvas;
    let threeSpaceCanvas;
    let pixiUICanvas;

	let htmlContainer;

    let input = {
        mouse: {
            init: false,
            buttons: [false, false, false],
            position: { x: 0, y: 0 },
            delta: { x: 0, y: 0 },
            scrollDelta: { x: 0, y: 0 }
        },
		keyboard: {}
    };

    let updateMousePosition = (e) => {
        if (input.mouse.init != false) {
            input.mouse.delta.x = input.mouse.position.x - e.clientX;
            input.mouse.delta.y = input.mouse.position.y - e.clientY;
        } else {
            input.mouse.init = true;
        }

        input.mouse.position.x = e.clientX;
        input.mouse.position.y = e.clientY;
    };

    let show3dscene = false;

    let pixiSpace;
	let threeSpace;
	let uiCanvas;
    onMount(async () => {
        let PolygonGenerator = (
            await import('../CityGenerator/PolygonGenerator/PolygonGenerator')
        ).default;

		let UICanvas = (
            await import('../CityGenerator/PolygonGenerator/UICanvas')
        ).default;

		let BuildingGenerator = (
            await import('../CityGenerator/PolygonGenerator/BuildingGenerator')
        ).default;

        window.CityGenerator = {
            input: input,
			getContainerSize: ()=>{
				let canvasRect = htmlContainer.getClientRects();
				return {
					width: canvasRect[0].width,
					height: canvasRect[0].height,
				}
			}	
        };

		uiCanvas = new UICanvas(pixiUICanvas);
        pixiSpace = new PolygonGenerator(pixiSpaceCanvas);
		threeSpace = new BuildingGenerator(threeSpaceCanvas);

		window.CityGenerator.addGenerationSpace = (vertices, triangles, edgeAverageLength)=>{
			show3dscene = true;
			threeSpace.addGenerationSpace(vertices, triangles, edgeAverageLength);
		}

		const systemUpdate = (time)=>{
			uiCanvas.systemUpdate(time);
			if(show3dscene){
				threeSpace.systemUpdate(time);
			}else{
				pixiSpace.systemUpdate(time);
			}
			input.mouse.scrollDelta.x = 0;
			input.mouse.scrollDelta.y = 0;
			requestAnimationFrame(systemUpdate);
		}
		systemUpdate(performance.now());
    });
</script>

<svelte:window
	on:contextmenu={(e)=>{e.preventDefault();}}
    on:mousedown={(e) => {
		e.preventDefault();
        input.mouse.buttons[e.button] = true;
        updateMousePosition(e);
    }}
    on:mousemove={(e) => {
        updateMousePosition(e);
    }}
    on:mouseup={(e) => {
		e.preventDefault();
        input.mouse.buttons[e.button] = false;
        updateMousePosition(e);
    }}
	on:keydown={(e) => {
		if(e.code.split("F")[0] != ""){
			e.preventDefault();
			input.keyboard[e.code] = true;
		}
	}}
	on:keyup={(e) => {
		if(e.code.split("F")[0] != ""){
			e.preventDefault();
			input.keyboard[e.code] = false;
		}
	}}
	on:wheel={(e) => {
		//e.preventDefault();
		input.mouse.scrollDelta.x = e.deltaX;
		input.mouse.scrollDelta.y = e.deltaY;
		//console.log(input.mouse.scrollDelta);
	}}
/>

<div class="container" bind:this={htmlContainer}>
	<canvas bind:this={pixiSpaceCanvas} style={`${show3dscene ? "display:none;": ""}`}/>
	<canvas bind:this={threeSpaceCanvas} style={`${!show3dscene ? "display:none;": ""}`}/>
	<canvas bind:this={pixiUICanvas}/>
</div>

<style>
    :global(body) {
        padding: 0px;
        margin: 0px;
    }
    canvas {
        cursor: none;
        position: absolute;
        width: 100%;
        height: 100%;
    }
    .container {
        cursor: none;
        width: 100vw;
        height: 100vh;
        position: fixed;
    }
</style>
