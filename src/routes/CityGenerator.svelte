<script context="module">
    export const ssr = false;
</script>

<script>
    import { onMount } from 'svelte';

    let canvasHTMLElement;
	
    let input = {
        mouse: {
			init: false,
            buttons: [false, false, false],
            position: { x: 0, y: 0 },
            delta: { x: 0, y: 0 },
            scrollDelta: { x: 0, y: 0 }
        }
    };

	let updateMousePosition = (e)=>{
		if(input.mouse.init != false){
			input.mouse.delta.x = input.mouse.position.x - e.clientX;
			input.mouse.delta.y = input.mouse.position.y - e.clientY;
		}else{
			input.mouse.init = true;
		}

		input.mouse.position.x = e.clientX;
		input.mouse.position.y = e.clientY;
	}

    let app;
    onMount(async () => {
        let PolygonGenerator = (
            await import('../CityGenerator/PolygonGenerator/PolygonGenerator')
        ).default;
		
		window.CityGenerator = {
			input: input
		};
        app = new PolygonGenerator(canvasHTMLElement);
    });
</script>

<svelte:window
    on:mousedown={(e) => {
        input.mouse.buttons[e.button] = true;
		updateMousePosition(e);
    }}
	on:mousemove={(e)=>{
		updateMousePosition(e);
	}}
    on:mouseup={(e) => {
        input.mouse.buttons[e.button] = false;
		updateMousePosition(e);
    }}
/>

<div class="container">
    <canvas bind:this={canvasHTMLElement} />
</div>

<style>
    :global(body) {
        padding: 0px;
        margin: 0px;
    }
    canvas {
		cursor: none;
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
