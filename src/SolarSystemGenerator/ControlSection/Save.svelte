<script lang="ts">
    import { onMount } from 'svelte';
    import ControlSelector from './ControlSelector.svelte';
    import ObjectsStore from '../ObjectsStore';
    import SelectionState from '../SelectionState';

    import Button from '../../CommonComponents/Button.svelte';
    import ControlGroup from './ControlGroup.svelte';
    import { get } from 'svelte/store';

    import ProceduralPlanet from '../ProceduralPlanet';
    import Background from '../Background';
    import ProceduralStar from '../ProceduralStar';
    import PlanetSatellite from '../PlanetSatellite';
    import PlanetarySystem from '../PlanetarySystem';

    let downloadHTMLElement;
    let uploadHTMLElement;
    let fileInput;

    let exampleList = [
        {
            name: 'Test Example',
            url: '/PlanetarySystemExamples/TestExample.json'
        },
        {
            name: 'Solar System',
            url: '/PlanetarySystemExamples/SolarSystem.json'
        }
    ];

    let convertObjectCollectionToJSON = () => {
        let objectsCollection = get(ObjectsStore);
        let currentSelection = get(SelectionState.editable);

        SelectionState.editable.reset();

        requestAnimationFrame(() => {
            let collection = {
                backgrounds: objectsCollection.backgrounds.map((bg) => {
                    return {
                        id: bg.id,
                        object: bg.object.createSerializableObject()
                    };
                }),
                planets: objectsCollection.planets.map((pl) => {
                    return {
                        id: pl.id,
                        object: pl.object.createSerializableObject()
                    };
                }),
                stars: objectsCollection.stars.map((st) => {
                    return {
                        id: st.id,
                        object: st.object.createSerializableObject()
                    };
                }),
                planetsWithSatellites: objectsCollection.combinedPlanets.map(
                    (psat) => {
                        return {
                            id: psat.id,
                            object: psat.object.createSerializableObject()
                        };
                    }
                ),
                planetarySystems: objectsCollection.planetarySystems.map(
                    (ps) => {
                        return {
                            id: ps.id,
                            object: ps.object.createSerializableObject()
                        };
                    }
                )
            };

            SelectionState.editable.setSelected(
                currentSelection.id,
                currentSelection.key
            );

            downloadHTMLElement.href = URL.createObjectURL(
                new Blob([JSON.stringify(collection, null, 2)], {
                    type: 'text/plain'
                })
            );
            downloadHTMLElement.download = 'PlanetarySystemData.json';
            downloadHTMLElement.click();
            console.log('done');
        });
    };

    let openFileUpload = () => {
        uploadHTMLElement.click();
    };

    let convertJSONToObjectCollection = (jsondata) => {
        SelectionState.editable.reset();
        window.threeScene.sceneManager.renderer.clear();

        requestAnimationFrame(() => {
            let newObjectStore = {
                planets: jsondata.planets.map((jsonPlanet) => {
                    return {
                        id: jsonPlanet.id,
                        object: ProceduralPlanet.createFromSerializableObject(
                            jsonPlanet.object
                        )
                    };
                }),
                backgrounds: jsondata.backgrounds.map((jsonPlanet) => {
                    return {
                        id: jsonPlanet.id,
                        object: Background.createFromSerializableObject(
                            jsonPlanet.object
                        )
                    };
                }),
                stars: jsondata.stars.map((jsonPlanet) => {
                    return {
                        id: jsonPlanet.id,
                        object: ProceduralStar.createFromSerializableObject(
                            jsonPlanet.object
                        )
                    };
                }),
                combinedPlanets: jsondata.planetsWithSatellites.map(
                    (jsonPlanet) => {
                        return {
                            id: jsonPlanet.id,
                            object: PlanetSatellite.createFromSerializableObject(
                                jsonPlanet.object
                            )
                        };
                    }
                ),
                planetarySystems: jsondata.planetarySystems.map(
                    (jsonPlanet) => {
                        return {
                            id: jsonPlanet.id,
                            object: PlanetarySystem.createFromSerializableObject(
                                jsonPlanet.object
                            )
                        };
                    }
                ),
                galaxies: []
            };

            ObjectsStore.set(newObjectStore);
			requestAnimationFrame(()=>{
				window.threeScene.sceneManager.renderer.clear();
			})
        });
    };

    let fileChanged = (event) => {
        if (event.target.files.length == 0) return;
        let eTarget = event.target;
        let reader = new FileReader();
        reader.onload = (event) => {
            let jsonData = JSON.parse(event.target.result as string);
            convertJSONToObjectCollection(jsonData);
            eTarget.value = '';
        };
        reader.readAsText(event.target.files[0]);
    };

    let fetchExample = (exampleURL) => {
        fetch(exampleURL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('HTTP error ' + response.status);
                }
                return response.json();
            })
            .then((json) => {
                //console.log(json);
                try {
                    convertJSONToObjectCollection(json);
                } catch (e) {
                    console.log(e);
                }
            })
            .catch(function () {
                this.dataError = true;
            });
    };
</script>

<a style="display: none;" href="." bind:this={downloadHTMLElement}>download</a>
<input
    style="display: none;"
    bind:this={uploadHTMLElement}
    type="file"
    on:change={fileChanged}
    bind:value={fileInput}
/>
<div>
    <ControlGroup label="Save / Load">
        <div>
            <Button
                label={'Save to JSON'}
                on:click={convertObjectCollectionToJSON}
            />
        </div>
        <div>
            <Button label={'Load from JSON'} on:click={openFileUpload} />
        </div>
    </ControlGroup>

    <ControlGroup label="Examples">
        {#each exampleList as example}
            <div class="exampleElement">
                <div>{example.name}</div>
                <Button
                    label={'Load'}
                    on:click={() => {
                        fetchExample(example.url);
                    }}
                />
            </div>
        {/each}
    </ControlGroup>
</div>

<style>
    .exampleElement {
        color: var(--cs2_6);
        font-weight: 300;
        font-size: 1.1em;
        display: grid;
        grid-template-columns: 1fr 1fr;
        place-content: center;
        padding: 0.5em 1em;
        background-color: var(--cs2_2);
        border-radius: 0.5em;
    }
    .exampleElement:hover {
        background-color: var(--cs2_3);
        font-weight: 700;
    }
</style>
