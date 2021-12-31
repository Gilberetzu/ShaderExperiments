<script context="module">
    export const ssr = false;
</script>

<script>
    import { onMount } from 'svelte';
    import ByMeIcon from '../CommonComponents/ByMeIcon.svelte';
    import SocialLinks from '../CommonComponents/SocialLinks.svelte';

    let pixiSpaceCanvas;
    let threeSpaceCanvas;
    let pixiUICanvas;

    let htmlContainer;

    let input = {
        mouse: {
            init: false,
            buttons: [false, false, false],
            position: { x: 0, y: 0 },
            delta: { x: 0, y: 0 },
            scrollDelta: { x: 0, y: 0 }
        },
        keyboard: {}
    };

    let updateMousePosition = (e) => {
        if (input.mouse.init != false) {
            input.mouse.delta.x = input.mouse.position.x - e.clientX;
            input.mouse.delta.y = input.mouse.position.y - e.clientY;
        } else {
            input.mouse.init = true;
        }

        input.mouse.position.x = e.clientX;
        input.mouse.position.y = e.clientY;
    };

    let show3dscene = false;

    let pixiSpace;
    let threeSpace;
    let uiCanvas;

    let downloadHTMLElement;

    let fontLoaded = false;
    let systemStarted = false;
    let socialHovered = false;

    const startSystem = () => {
        systemStarted = true;
    };

    let saveThreeRender = () => {
        threeSpaceCanvas.toBlob((blob) => {
            const url = window.URL.createObjectURL(blob);
            downloadHTMLElement.href = url;
            downloadHTMLElement.download = 'TowerBuilderRender';
            downloadHTMLElement.click();
        });
    };

    onMount(async () => {
        let PolygonGenerator = (
            await import('../TowerBuilder/2dSystems/PolygonGenerator')
        ).default;

        let UICanvas = (await import('../TowerBuilder/UISystems/UICanvas'))
            .default;

        let ThreeSpace = (await import('../TowerBuilder/3dSystems/ThreeSpace'))
            .default;

        window.TowerBuilder = {
            input: input,
            getContainerSize: () => {
                let canvasRect = htmlContainer.getClientRects();
                return {
                    width: canvasRect[0].width,
                    height: canvasRect[0].height
                };
            },
            saveThreeRender
        };

        const systemUpdate = (time) => {
            uiCanvas.systemUpdate(time);

            if (systemStarted) {
                if (show3dscene) {
                    threeSpace.systemUpdate(time);
                } else {
                    pixiSpace.systemUpdate(time);
                }
            }

            input.mouse.scrollDelta.x = 0;
            input.mouse.scrollDelta.y = 0;
            requestAnimationFrame(systemUpdate);
        };

        const waitFontLoad = () => {
            const val = document.fonts.check('bold 16px Bubblegum Sans');
            if (val) {
                console.log('Loaded');
                fontLoaded = true;
                uiCanvas = new UICanvas(pixiUICanvas, startSystem);
                window.TowerBuilder.addUIElement =
                    uiCanvas.addUIElement.bind(uiCanvas);

                pixiSpace = new PolygonGenerator(pixiSpaceCanvas);
                threeSpace = new ThreeSpace(threeSpaceCanvas);

                window.TowerBuilder.addGenerationSpace = (
                    vertices,
                    triangles,
                    edgeAverageLength
                ) => {
                    show3dscene = true;
                    threeSpace.enter3dScene();
                    threeSpace.buildingGenerator.addGenerationSpace(
                        vertices,
                        triangles,
                        edgeAverageLength
                    );
                };
                systemUpdate(performance.now());
            } else {
                console.log('Waiting Load', val);
                requestAnimationFrame(waitFontLoad);
            }
        };

        waitFontLoad();
    });
</script>

<svelte:window
    on:keydown={(e) => {
        if (e.code.split('F')[0] != '') {
            e.preventDefault();
            input.keyboard[e.code] = true;
        }
    }}
    on:keyup={(e) => {
        if (e.code.split('F')[0] != '') {
            e.preventDefault();
            input.keyboard[e.code] = false;
        }
    }}
	on:blur={(e)=>{
		const keys = Object.keys(input.keyboard);
		keys.forEach(key=>{
			input.keyboard[key] = false;
		})
	}}
/>

<div
    class="container"
    bind:this={htmlContainer}
    on:contextmenu={(e) => {
        e.preventDefault();
    }}
    on:mousedown={(e) => {
        e.preventDefault();
        input.mouse.buttons[e.button] = true;
        updateMousePosition(e);
    }}
    on:mousemove={(e) => {
		//console.log(e);
        updateMousePosition(e);
    }}
    on:mouseup={(e) => {
        e.preventDefault();
        input.mouse.buttons[e.button] = false;
        updateMousePosition(e);
    }}
    on:wheel={(e) => {
        //e.preventDefault();
        input.mouse.scrollDelta.x = e.deltaX;
        input.mouse.scrollDelta.y = e.deltaY;
        //console.log(input.mouse.scrollDelta);
    }}
>
    <canvas
        bind:this={pixiSpaceCanvas}
        style={`${show3dscene ? 'display:none;' : ''}`}
    />
    <canvas
        bind:this={threeSpaceCanvas}
        style={`${!show3dscene ? 'display:none;' : ''}`}
    />
    <canvas bind:this={pixiUICanvas} />
</div>
<a style="display: none;" href="./" bind:this={downloadHTMLElement}>download</a>

<div
    class="hoverableSocial"
    on:mouseenter={(e) => {
        socialHovered = true;
    }}
    on:mouseleave={(e) => {
        socialHovered = false;
    }}
>
    <a href="https://www.euriherasme.com/" name="Portfolio page">
        <div
            class:personalLogo={true}
            class:logoInactive={!socialHovered}
            class:logoHovered={socialHovered}
        >
            <ByMeIcon />
        </div>
    </a>
    {#if socialHovered}
        <div class="social">
            <SocialLinks initialDelay={0} />
        </div>
    {/if}
</div>

{#if !fontLoaded}
    <div style="font-family: Bubblegum Sans; color:white">
        Loading TOWER BUILDER
    </div>
{/if}

<style>
    :global(body) {
        padding: 0px;
        margin: 0px;
        background-color: rgb(0, 0, 0);
    }
    .social {
        position: fixed;
        bottom: 0px;
        left: 75px;
        padding: 10px 0px;
    }
    .personalLogo {
        position: fixed;
        bottom: 0px;
        left: 0px;
        -webkit-transition-duration: 0.5s;
        -moz-transition-duration: 0.5s;
        -o-transition-duration: 0.5s;
        transition-duration: 0.5s;

        -webkit-transition-property: all;
        -moz-transition-property: all;
        -o-transition-property: all;
        transition-property: all;

        -webkit-transition-timing-function: cubic-bezier(0.3, 1.3, 0.75, 1.06);
        -moz-transition-timing-function: cubic-bezier(0.3, 1.3, 0.75, 1.06);
        -o-transition-timing-function: cubic-bezier(0.3, 1.3, 0.75, 1.06);
        transition-timing-function: cubic-bezier(0.3, 1.3, 0.75, 1.06);
    }
    .logoInactive {
        width: 50px;
        height: 50px;
        opacity: 0.4;
    }
    .logoHovered {
        width: 75px;
        height: 75px;
        opacity: 1;
    }
    .hoverableSocial {
        width: 50px;
        height: 50px;
        position: fixed;
        bottom: 0px;
        left: 0px;
    }
    .hoverableSocial:hover {
        width: 370px;
        height: 75px;
    }
    canvas {
        cursor: none;
        position: absolute;
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
