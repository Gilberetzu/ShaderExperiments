<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import Arrow from "../../CommonComponents/Icons/Arrow.svelte";
	export let possibleOptions:Array<string> = [];
	export let value;
	let openSelector = false;

	const dispatch = createEventDispatcher();
</script>

<style>
	.container{
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1em;
		padding: 0em 1em;
		border-radius: 1em;
		gap: 1em;
		cursor: pointer;
		background-color: var(--cs2_1);
		color: var(--cs2_6);

		user-select: none;
	}
	.options{
		position: absolute;
		top: calc(100% + 2px);
		border-radius: 0.25em;
		left: 0.5em;
		right: 0.5em;
		background-color: var(--cs2_1);
		z-index: 100;
	}
	.option{
		padding: 4px 1em;
	}
	.option:hover{
		background-color: var(--cs2_4);
		
	}
	.arrowContainer{
		line-height: 0;
		place-self: center;
	}
	.arrowOpen{
		transform: rotate(180deg);
	}
</style>

<div class="container" on:mousedown|preventDefault on:click|preventDefault={()=>{
		openSelector = !openSelector && possibleOptions.length > 0;
	}}>
	<div>{value == -1 ? "None" : possibleOptions[value]}</div>
	<div class:arrowContainer={true} class:arrowOpen={openSelector}>
		<Arrow fillColor={"var(--cs2_6)"}/>
	</div>
	{#if openSelector}
	<div class="options">
		{#each possibleOptions as option, index}
			<div class="option" on:click={()=>{dispatch("click", index)}}>
				{option}
			</div>
		{/each}
	</div>
	{/if}
</div>