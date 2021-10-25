<script>
    import Arrow from '../../CommonComponents/Icons/Arrow.svelte';
    import ProceduralPlanet from '../ProceduralPlanet';
    import PlanetSatellite from '../PlanetSatellite';
    import Background from '../Background';
    import ProceduralStar from '../ProceduralStar';
    import ObjectStore from '../ObjectsStore';
    import SelectionState from '../SelectionState';
    import { get } from 'svelte/store';
    import { onMount, onDestroy } from 'svelte';
    import Button from '../../CommonComponents/Button.svelte';
import ObjectsStore from '../ObjectsStore';

    let objectList = [
        { label: 'Planets', key: 'planets' },
        { label: 'Background', key: 'backgrounds' },
        { label: 'Stars', key: 'stars' },
        { label: 'Planets - Satellite', key: 'combinedPlanets' },
        { label: 'Planetary System', key: 'planetarySystems' }
    ];
    let openSelector = false;
    let selectedList = 0;

    let openContextId = -1;
    let selectedEditable = -1;
    let selectedEditableKey = '';

    let storeObjectsLists = {
        backgrounds: [],
        planets: [],
        stars: [],
        combinedPlanets: [],
        planetarySystems: [],
        galaxies: [],
        cameras: []
    };

    let fillSelectableObjectList = (store) => {
        //console.log("Something got deleted?", store);
        let newList = {
            backgrounds: store.backgrounds.map((obj) => {
                return { id: obj.id, name: obj.object.name };
            }),
            planets: store.planets.map((obj) => {
                return { id: obj.id, name: obj.object.name };
            }),
            stars: store.stars.map((obj) => {
                return { id: obj.id, name: obj.object.name };
            }),
            combinedPlanets: store.combinedPlanets.map((obj) => {
                return { id: obj.id, name: obj.object.name };
            }),
            planetarySystems: store.planetarySystems.map((obj) => {
                return { id: obj.id, name: obj.object.name };
            }),
            galaxies: store.galaxies.map((obj) => {
                return { id: obj.id, name: obj.object.name };
            }),
        };
        storeObjectsLists = newList;
        //console.log("Store List", store);
    };

    let unsubscribeObjectStore;
    let unsubscribeSelectionStore;
    onMount(() => {
        unsubscribeSelectionStore = SelectionState.editable.subscribe(
            (state) => {
                selectedEditable = state.id;
                selectedEditableKey = state.key;
            }
        );
        unsubscribeObjectStore = ObjectStore.subscribe(
            fillSelectableObjectList
        );
    });

    let addObject = () => {
        let selectedListKey = objectList[selectedList].key;
        if (selectedListKey == 'planets') {
            let p = new ProceduralPlanet('Planet');
            ObjectStore.addPlanet(p);
        } else if (selectedListKey == 'backgrounds') {
            let bg = new Background('Background');
            ObjectStore.addBackground(bg);
        } else if (selectedListKey == 'combinedPlanets') {
            let ps = new PlanetSatellite('PlanetWSatellite');
            ObjectStore.addCombinedPlanet(ps);
        } else if (selectedListKey == 'stars') {
            let s = new ProceduralStar('Star');
            ObjectStore.addStar(s);
        }
    };

    onDestroy(() => {
        if (
            unsubscribeSelectionStore != null &&
            unsubscribeSelectionStore != undefined
        ) {
            unsubscribeSelectionStore();
        }
        if (
            unsubscribeObjectStore != null &&
            unsubscribeObjectStore != undefined
        ) {
            unsubscribeObjectStore();
        }
    });

    let deleteObject = (key, id) => {
        ObjectStore.removeObject(key, id);
        if (selectedEditable == id && selectedEditableKey == key) {
            SelectionState.editable.reset();
        }
    };

	let duplicateObject = (key,id) => {
		console.log(ObjectsStore);
		ObjectsStore.duplicateObject(key, id);
	}
</script>

<svelte:window
    on:mousedown={() => {
        openContextId = -1;
    }}
/>

<div class="innerContainer">
    <div class="topSelectorAdd">
        <div>
            <div
                class="container"
                on:mousedown|preventDefault
                on:click|preventDefault={() => {
                    openSelector = !openSelector;
                }}
            >
                <div>{objectList[selectedList].label}</div>
                <div class:arrowContainer={true} class:arrowOpen={openSelector}>
                    <Arrow fillColor={'var(--cs2_6)'} />
                </div>
                {#if openSelector}
                    <div class="options">
                        {#each objectList as option, index}
                            <div
                                class="option"
                                on:click={() => {
                                    selectedList = index;
                                }}
                            >
                                {option.label}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
        <Button label={'Add'} on:click={addObject} />
    </div>
    <div class="listContainer">
        {#each storeObjectsLists[objectList[selectedList].key] as obj, index (obj.id)}
            <div
                class:listElement={true}
                class:listElementSelected={obj.id == selectedEditable}
                class:listElementOdd={index % 2 == 1}
                class:listElementEven={index % 2 == 0}
                on:click={() => {
                    if (openContextId == obj.id) {
                        openContextId = -1;
                    } else {
                        openContextId = obj.id;
                    }
                }}
            >
                {obj.name}

                {#if obj.id == openContextId}
                    <div class="contextMenu">
                        <div
                            class="listElementOdd contextMenuItem"
                            on:mousedown|preventDefault|stopPropagation
                            on:click={() => {
                                SelectionState.editable.setSelected(
                                    obj.id,
                                    objectList[selectedList].key
                                );
                            }}
                        >
                            Edit
                        </div>
                        <div
                            class="listElementEven contextMenuItem"
                            on:mousedown|preventDefault|stopPropagation
                            on:click={() => {
                                openContextId = -1;
                                deleteObject(
                                    objectList[selectedList].key,
                                    obj.id
                                );
                            }}
                        >
                            Delete
                        </div>
                        <div
                            class="listElementOdd contextMenuItem"
                            on:mousedown|preventDefault|stopPropagation
                            on:click={() => {
                                duplicateObject(
                                    objectList[selectedList].key,
                                    obj.id
                                );
                            }}
                        >
                            Duplicate
                        </div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .container {
        position: relative;
        margin: 0.5em auto 0.5em auto;
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
    .options {
        position: absolute;
        top: calc(100% + 2px);
        border-radius: 0.25em;
        left: 0.5em;
        right: 0.5em;
        background-color: var(--cs2_1);
        z-index: 100;
    }
    .option {
        padding: 4px 1em;
    }
    .option:hover {
        background-color: var(--cs2_4);
    }
    .arrowContainer {
        line-height: 0;
        place-self: center;
    }
    .arrowOpen {
        transform: rotate(180deg);
    }

    .listElement {
        padding: 0.25em 1em;
        cursor: pointer;
        color: var(--cs2_6);
        position: relative;
    }
    .listElement:hover {
        background-color: var(--cs2_4);
    }
    .listElementOdd {
        background-color: var(--cs2_7);
    }
    .listElementEven {
        background-color: var(--cs2_8);
    }
    .listElementSelected {
        background-color: var(--cs2_1);
        font-weight: 700;
    }

    .contextMenu {
        position: absolute;
        z-index: 1000;
        top: 100%;
        /*right: calc(100% + 0.25em);*/
        background-color: var(--cs2_3);
        box-shadow: 0px 0px 10px black;
    }
    .contextMenuItem {
        padding: 0.2em 1em;
    }
    .contextMenuItem:hover {
        background-color: var(--cs2_4);
    }
    .topSelectorAdd {
        padding: 0em 1em;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1em;
    }
    .innerContainer {
        overflow-y: hidden;
        position: relative;
        display: grid;
        grid-template-rows: auto 1fr;
    }
    .listContainer {
        overflow-y: auto;
        height: 100%;
    }
</style>
