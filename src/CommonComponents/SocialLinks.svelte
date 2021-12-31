<script>
    import ArtstationIcon from "./SocialNetworks/Artstation.svelte";
    import GithubIcon from "./SocialNetworks/Github.svelte";
    import YoutubeIcon from "./SocialNetworks/Youtube.svelte";
    import TwitterIcon from "./SocialNetworks/Twitter.svelte";
    import LinkedIn from "./SocialNetworks/Linkedin.svelte";
    import Artstation from "./SocialNetworks/Artstation.svelte";
    import Gmail from "./SocialNetworks/Gmail.svelte";

    import { fade } from 'svelte/transition';
    import { sineOut } from "svelte/easing";

	export let initialDelay = 500;

    let linkList = [
        {
            icon: Artstation,
            link: "https://www.artstation.com/gilberetsu/albums/3433100",
            name: "Artstation"
        },
        {
            icon: GithubIcon,
            link: "https://github.com/Gilberetzu",
            name: "Github"
        },
        {
            icon: Gmail,
            link: "mailto:euri.herasme@gmail.com",
            name: "Gmail"
        },
        {
            icon: TwitterIcon,
            link: "https://twitter.com/i/events/1412006300591050752",
            name: "Twitter"
        },
        {
            icon: YoutubeIcon,
            link: "https://www.youtube.com/channel/UCpDmbRyQpfEsgR89K8DEXdg",
            name: "Youtube"
        },
        {
            icon: LinkedIn,
            link: "https://www.linkedin.com/in/euri-herasme-cuevas/",
            name: "LinkedIn"
        }
    ]
</script>

<div class="container">
    {#each linkList as {icon, link, name}, index}
        <div class="iconContainer" in:fade={{delay: initialDelay + index * 100, duration: 300, easing: sineOut}}>
            <a name={name} href={link}>
                <svelte:component this={icon} />
            </a>
        </div>
    {/each}
</div>

<style>
    .container{
        display: flex;
		flex-wrap: wrap;
        place-content: center;
    }
    .iconContainer{
        line-height: 0;
        max-width: 2.3em;
		min-width: 2.2em;
        padding: 0.5em;

    }
</style>