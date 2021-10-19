<script lang="ts">
	import {onMount, onDestroy} from "svelte";
	import { Writable } from "svelte/store";

	export let label;
	export let tooltip = "";
	export let stringStore: Writable<string>;

	let unsubscribeStore;
	onMount(()=>{
		unsubscribeStore = stringStore.subscribe((val)=>{
			value = val;
		});
	});

	onDestroy(()=>{
		unsubscribeStore();
	})

	let value;
	let inputChange = ()=>{
		stringStore.set(value);
	}
</script>

<style>
	input{
		border: none;
		border-radius: 0px;
		width: calc(100% - 3em);
		padding: 0.2em 1.5em;
		background-color: var(--cs2_1);
		color: var(--cs2_6);
		font-family: Lato;
	}
	.inputButtonContainer{
		display: grid;
		place-items: center;
		width: 100%;
		grid-template-columns: 1fr;
		border-radius: 1em;
		overflow: hidden;
		gap: 1em;
		background-color: var(--cs2_1);
	}
</style>

<div>
	<div>
		{label}
	</div>
	<div class="inputButtonContainer">
		<input type="text" bind:value on:change={inputChange}>
	</div>	
</div>