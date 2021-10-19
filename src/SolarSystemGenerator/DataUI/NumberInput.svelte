<script>
	import DoubleArrow from "../../CommonComponents/Icons/DoubleArrow.svelte";
	import { createEventDispatcher } from 'svelte';

	export let value;
	export let addSlider = false;
	export let sliderMinMax = {
		min: 0,
		max: 1
	}

	let sliderElement;
	let sliderPos = 0;
	let movingSlider = false;
	let buttonChange = false;

	const dispatch = createEventDispatcher();

	let getSliderPos = (clientX)=>{
		let rect = sliderElement.getClientRects()[0];
		let deltaPos = clientX - rect.x;
		deltaPos = deltaPos < 0 ? 0 : deltaPos;
		deltaPos = deltaPos > rect.width ? rect.width : deltaPos;

		sliderPos = deltaPos / rect.width;
		value = sliderMinMax.min + sliderPos * (sliderMinMax.max - sliderMinMax.min);
		value = Math.floor(value * 1000)/1000;
	}

	let mouseDownSlider = (event)=>{
		event.preventDefault();
		getSliderPos(event.clientX);
		dispatch('change', "");
		movingSlider = true;
	}

	let mouseDownButton = (event)=>{
		buttonChange = true;
	}

	let mouseMove = (event)=>{
		if(movingSlider){
			event.preventDefault();
			getSliderPos(event.clientX);
			dispatch('change', "");
		}
		if(buttonChange){
			value += event.movementX/30;
			dispatch('change', "");
		}
	}

	let mouseUp = ()=>{
		if(movingSlider){
			movingSlider = false;
		}
		if(buttonChange){
			buttonChange = false;
		}
	}

	$:{
		value = Math.floor(value * 1000)/1000;
		let unscaledSlider = value < sliderMinMax.min ? sliderMinMax.min : value > sliderMinMax.max ? sliderMinMax.max : value;
		sliderPos = (unscaledSlider - sliderMinMax.min) / (sliderMinMax.max - sliderMinMax.min);
	}
</script>

<svelte:window on:mousemove={mouseMove} on:mouseup ={mouseUp}/>

<style>
	input{
		border: none;
		border-radius: 0px;
		width: calc(100% - 1em);
		padding: 0.2em 0.5em;
		background-color: var(--cs2_1);
		color: var(--cs2_6);
		font-family: Lato;
	}
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.container{
		position: relative;
		display: grid;
		place-items: center;
		grid-template-columns: 1fr;
	}
	.containerWSlider{
		gap: 1em;
		grid-template-columns: 1fr 1fr !important;
	}
	.arrowContainer{
		line-height: 0px;
		padding: 0em 0.25em;
		background-color: var(--cs2_3);
		cursor:ew-resize
	}
	.inputButtonContainer{
		display: grid;
		place-items: center;
		width: 100%;
		grid-template-columns: 2em 1fr;
		border-radius: 1em;
		overflow: hidden;
		gap: 1em;
		background-color: var(--cs2_1);
	}
	.inputContainer{
		width: 100%;
	}

	.slider{
		width: 100%;
		height: 100%;
		position: relative;
	}
	.sliderTrack{
		position: absolute;
		top: 40%;
		background-color: var(--cs2_1);
		width: 100%;
		height: 20%;
	}
	.sliderThumb{
		position: absolute;
		height: 100%;
		width: 1em;
		border-radius: 1em;
		cursor: pointer;
		background-color: var(--cs2_6);
		transform: translateX(-0.5em);
	}
	.sliderThumb:hover{
		background-color: var(--cs2_4);
	}
</style>

<div class:container={true} class:containerWSlider = {addSlider}>
	{#if addSlider}
		<div class="slider" on:mousedown={mouseDownSlider} bind:this={sliderElement}>
			<div class="sliderTrack" ></div>
			<div class="sliderThumb" style={`left: ${sliderPos * 100}%`} on:mousedown={mouseDownSlider}></div>
		</div>
	{/if}
	<div class="inputButtonContainer">
		<div class="arrowContainer" on:mousedown|preventDefault={mouseDownButton}>
			<DoubleArrow fillColor={"var(--cs2_6)"}/>
		</div>
		<div class="inputContainer">
			<input type="number" bind:value on:change={()=>{dispatch('change', "")}}>
		</div>
	</div>
</div>