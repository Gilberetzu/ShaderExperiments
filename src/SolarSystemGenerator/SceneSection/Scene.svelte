<script lang="ts">
	import {onMount} from "svelte";
	import ThreeScene from "./ThreeScene";
	import Button from "../../CommonComponents/Button.svelte";

	let canvasElement;
	let scene;

	let canvasCrisp = true;
	let setPixelPerfect = (val)=>{
		canvasCrisp = val;
	}

	let showSplash = true;
	let showLoading = false;

	onMount(()=>{
		//scene = new ThreeScene(canvasElement, setPixelPerfect);
	})
	
	let startSystem = ()=>{
		showSplash = false;
		showLoading = true;

		requestAnimationFrame(()=>{
			requestAnimationFrame(()=>{
				scene = new ThreeScene(canvasElement, setPixelPerfect);

				requestAnimationFrame(()=>{
					showLoading = false;
				})
			})
		})
	}
</script>

{#if showSplash}
	<div class="splashContainer">
		<div class="splash">
			<h1>
				Planetary System Generator
			</h1>
			<Button label="Start" on:click={startSystem} />
		</div>
	</div>
{/if}

{#if showLoading}
	<div class="splashContainer">
		<div class="splash">
			<h1>Compiling Shaders</h1>
		</div>
	</div>
{/if}

<style>
	.splashContainer{
		position: fixed;
		top: 0px;
		left: 0px;
		right: 0px;
		bottom: 0px;
		z-index: 2000;

		background-color: rgba(0, 0, 0, 0.3);

		display: grid;
		place-content: center;
	}
	.splash{
		width: 50vw;
		height: 50vh;

		background-color: var(--cs2_2);
		border-radius: 0.5em;

		display: grid;
    	place-content: center;
	}
	h1{
		color: var(--cs2_6);
	}
	.canvasRender {
        position: relative;
        width: 100%;
        height: 100%;
    }
	.crispCanvas {
        image-rendering: optimizeSpeed; /* Older versions of FF          */
        image-rendering: -moz-crisp-edges; /* FF 6.0+                       */
        image-rendering: -webkit-optimize-contrast; /* Safari                        */
        image-rendering: -o-crisp-edges; /* OS X & Windows Opera (12.02+) */
        image-rendering: pixelated; /* Awesome future-browsers       */
        -ms-interpolation-mode: nearest-neighbor; /* IE                            */
    }
</style>
<canvas bind:this={canvasElement} class:canvasRender = {true} class:crispCanvas={canvasCrisp}></canvas>