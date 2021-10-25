<script lang="ts">
    import { onMount } from 'svelte';
    import ControlSelector from './ControlSelector.svelte';
    import SelectionState from '../SelectionState';

    import About from './About.svelte';
    import SinglePlanetControls from './SinglePlanetControls.svelte';
    import PlanetSatelliteControls from './PlanetSatelliteControls.svelte';
    import BackgroundControls from './BackgroundControls.svelte';
    import StarControls from './StarControls.svelte';

    let editableUISections = [];
    let systemUISections = [];
    let setSystemUISections = (sections) => {
        systemUISections = sections;
    };
    let setEditabelUISections = (sections) => {
        editableUISections = sections;
    };

    let selectedSection = {
        typeIndex: -1,
        index: 0
    };

    let editableObjectUIStores = [];
    let loadedEditableObject = { id: -1, key: '' };

    let editableSelectionChange = (state: any) => {
        loadedEditableObject = {
            id: -1,
            key: ''
        }; //This ensures that the svelte object is destroyed and recreated the next frame
        requestAnimationFrame(() => {
            loadedEditableObject = state;
        });
    };

    onMount(() => {
        SelectionState.editable.subscribe(editableSelectionChange);
    });
</script>

<div class="innerWindowTop">Controls</div>
<div class="controlSelect">
    <div class="controlSelectSeparator" />
    <ControlSelector
        label="About"
        selected={selectedSection.typeIndex == 2 &&
            selectedSection.index == 0}
        on:click={() => {
            selectedSection = {
                typeIndex: 2,
                index: 0
            };
        }}
    />
    <div class="controlSelectSeparator" />
    {#each systemUISections as { label, typeIndex }, index}
        <ControlSelector
            {label}
            selected={selectedSection.typeIndex == typeIndex &&
                selectedSection.index == index}
            on:click={() => {
                selectedSection = {
                    typeIndex: typeIndex,
                    index
                };
            }}
        />
    {/each}
    <div class="controlSelectSeparator" />
    {#each editableUISections as { label, typeIndex }, index}
        <ControlSelector
            {label}
            selected={selectedSection.typeIndex == typeIndex &&
                selectedSection.index == index}
            on:click={() => {
                selectedSection = {
                    typeIndex: typeIndex,
                    index
                };
            }}
        />
    {/each}
</div>
<div class="controls">
	{#if selectedSection.typeIndex == 2 && selectedSection.index == 0}
		<About/>
	{/if}
    {#if loadedEditableObject.id >= 0}
        {#if loadedEditableObject.key == 'planets'}
            <SinglePlanetControls
                selectedObject={loadedEditableObject}
                {selectedSection}
                {setEditabelUISections}
                {setSystemUISections}
            />
        {:else if loadedEditableObject.key == 'backgrounds'}
            <BackgroundControls
                selectedObject={loadedEditableObject}
                {selectedSection}
                {setEditabelUISections}
                {setSystemUISections}
            />
        {:else if loadedEditableObject.key == 'combinedPlanets'}
            <PlanetSatelliteControls
                selectedObject={loadedEditableObject}
                {selectedSection}
                {setEditabelUISections}
                {setSystemUISections}
            />
        {:else if loadedEditableObject.key == 'stars'}
            <StarControls
                selectedObject={loadedEditableObject}
                {selectedSection}
                {setEditabelUISections}
                {setSystemUISections}
            />
        {/if}
    {/if}
</div>

<style>
    .controlSelect {
        grid-area: select;
        background-color: var(--cs2_1);
    }

    .controlSelectSeparator {
        width: 2em;
        height: 1em;
    }
    .controls {
        grid-area: controls;
        overflow-y: auto;
        overflow-x: hidden;
    }
    .innerWindowTop {
        font-weight: bold;
        padding: 0.1em 1em;
        background-color: var(--cs2_2);
        color: var(--cs2_6);
        grid-area: top;
    }
</style>
