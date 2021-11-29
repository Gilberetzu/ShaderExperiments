<script lang="ts">
	import Controls from "../SolarSystemGenerator/ControlSection/Controls.svelte";
	import Outliner from "../SolarSystemGenerator/OutlinerSection/Outliner.svelte";
	import Scene from "../SolarSystemGenerator/SceneSection/Scene.svelte";
	import * as THREE from "three";

	import {onMount} from 'svelte';

	onMount(()=>{
		//What is going to be the Three space?

		//console.log(testEnum[testEnum.start]);
		//console.log(testEnum);
	})
</script>

<style>
	:global(body) {
        padding: 0px;
        margin: 0px;
    }
	:root{
		--controlName: "ups";
	}
    .container {
        width: 100vw;
        height: 100vh;
        position: fixed;
        display: grid;
		font-weight: 300;
        grid-template-columns: 1fr 300px;
		grid-template-rows: 3fr 4fr;
        grid-template-areas: 'render outliner'
							 'render controls';
		background-color: var(--cs2_1);
    }
	.canvasRenderHolder {
        grid-area: render;
		display: grid;
		grid-template-areas: 'top'
							 'canvas';
		grid-template-rows: auto 1fr;
        position: relative;
        overflow: hidden;
    }
	.innerWindow{
		margin: 0.2em;
	}
	.innerWindowTop{
		font-weight: bold;
		padding: 0.1em 1em;
		background-color: var(--cs2_2);
		color: var(--cs2_6);
	}
    
	.outlinerContainer{
		grid-area: outliner;
		grid-template-rows: auto 1fr;
		display: grid;
		min-height: 300px;
		background-color: var(--cs2_3);
	}
	.controlsContainer{
		grid-area: controls;
		overflow: hidden;
    	height: 100%;
		background-color: var(--cs2_3);
		display: grid;
		grid-template-columns: 2em 1fr;
		grid-template-rows: auto 1fr;
		grid-template-areas: 'top top'
							 'select controls';
	}
</style>

<div class="container">
	<div class="canvasRenderHolder innerWindow">
		<div class="innerWindowTop">Scene</div>
		<Scene />
	</div>
	<div class="outlinerContainer innerWindow">
		<div class="innerWindowTop">Outliner</div>
		<Outliner/>
	</div>
	<div class="controlsContainer innerWindow">
		<Controls />
	</div>
</div>