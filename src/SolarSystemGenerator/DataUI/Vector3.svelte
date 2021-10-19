<script lang="ts">
	import {onMount, onDestroy} from "svelte";
	import { Writable } from "svelte/store";
	import * as THREE from "three";
	import NumberInput from "./NumberInput.svelte";

	export let tooltip = "";
	export let vector3Store: Writable<THREE.Vector3>;
	export let label;
	
	let unsubscribeStore;
	onMount(()=>{
		unsubscribeStore = vector3Store.subscribe((val)=>{
			xVal = val.x;
			yVal = val.y;
			zVal = val.z;
		});
	})

	onDestroy(()=>{
		unsubscribeStore();
	})

	let xVal:number;
	let yVal:number;
	let zVal:number;

	let inputChange = ()=>{
		vector3Store.set(new THREE.Vector3(xVal, yVal, zVal));
	}
</script>

<style>
	.valContainer{
		display: grid;
		grid-template-columns: 2em 1fr;
	}
	.label{
		color: var(--cs2_6);
		font-weight: 300;
		font-size: 1.2em;
	}
</style>

<div>
	{label}
	<div class="valContainer">
		<div class="label">x :</div>
		<NumberInput bind:value={xVal} on:change={inputChange}/>
	</div>
	<div class="valContainer">
		<div class="label">y :</div>
		<NumberInput bind:value={yVal} on:change={inputChange}/>
	</div>
	<div class="valContainer">
		<div class="label">z :</div>
		<NumberInput bind:value={zVal} on:change={inputChange}/>
	</div>
</div>
