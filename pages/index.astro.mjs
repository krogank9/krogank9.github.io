import { c as createComponent, a as createAstro, r as renderTemplate, b as addAttribute, d as renderComponent, e as renderHead } from '../chunks/astro/server_BhSMVS0Y.mjs';
import 'piccolore';
import 'html-escaper';
import { a as attr, b as attr_style, e as escape_html, s as stringify, c as attr_class } from '../chunks/_@astro-renderers_fG3lzjk2.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_fG3lzjk2.mjs';
import 'svg-text-animate';
/* empty css                                 */

function AnimatedText($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		// Props with defaults
		let {
			text = 'Hello World',
			fillColor = '#93c5fd',
			fontFamily = 'Sniglet',
			fontSize = 100} = $$props;
		let selectableViewBox = '0 0 900 120';
		let maskWidth = 900;
		let maskHeight = 120;

		let actualCanvasWidth = 225;
		let actualCanvasHeight = 30;

		// Unique IDs (in case multiple instances on the page)
		const instanceId = Math.random().toString(36).slice(2, 9);

		const containerId = `stroke-container-${instanceId}`;
		const maskId = `paint-mask-${instanceId}`;

		$$renderer.push(`<div class="animated-text-wrapper svelte-r6cmji"><div${attr('id', containerId)} class="stroke-container svelte-r6cmji"></div> <canvas class="mask-canvas svelte-r6cmji"${attr('width', actualCanvasWidth)}${attr('height', actualCanvasHeight)}></canvas> <svg class="selectable-text svelte-r6cmji"${attr('viewBox', selectableViewBox)}${attr('aria-label', text)}><defs><mask${attr('id', maskId)} maskUnits="userSpaceOnUse" x="0" y="0"${attr('width', maskWidth)}${attr('height', maskHeight)}><rect x="0" y="0"${attr('width', maskWidth)}${attr('height', maskHeight)} fill="black"></rect><image x="0" y="0"${attr('width', maskWidth)}${attr('height', maskHeight)} preserveAspectRatio="none"></image></mask></defs><text x="0"${attr('y', fontSize)}${attr('font-family', fontFamily)}${attr('font-size', fontSize)}${attr('mask', `url(#${stringify(maskId)})`)}${attr_style(`fill: ${stringify(fillColor)}`)} class="svelte-r6cmji">${escape_html(text)}</text></svg></div>`);
	});
}

function Hero($$renderer) {
	let taglineVisible = false;

	setTimeout(
		() => {
			taglineVisible = true;
		},
		2400
	);

	$$renderer.push(`<section class="hero svelte-juboms"><iframe src="/phys-stuff/self_balancing_ragdoll.html" class="ragdoll-iframe svelte-juboms" title="Self-balancing ragdoll physics simulation"></iframe> <div class="name-wrapper svelte-juboms">`);

	AnimatedText($$renderer, {
		text: 'Logan Krumbhaar',
		fillColor: '#93c5fd',
		fontFamily: 'Sniglet',
		fontSize: 100});

	$$renderer.push(`<!----></div> <p${attr_class('svelte-juboms', void 0, { 'visible': taglineVisible })}>Web developer &amp; game development educator</p></section>`);
}

function Nav($$renderer) {
	let menuOpen = false;

	$$renderer.push(`<nav class="nav svelte-1jnx671"><div class="nav-links desktop svelte-1jnx671"><a href="#portfolio" class="svelte-1jnx671">Portfolio</a> <a href="#about" class="svelte-1jnx671">About me</a> <a href="#contact" class="svelte-1jnx671">Contact</a></div> <button class="hamburger mobile svelte-1jnx671" aria-label="Toggle menu"${attr('aria-expanded', menuOpen)}><span${attr_class('bar svelte-1jnx671', void 0, { 'open': menuOpen })}></span> <span${attr_class('bar svelte-1jnx671', void 0, { 'open': menuOpen })}></span> <span${attr_class('bar svelte-1jnx671', void 0, { 'open': menuOpen })}></span></button> `);

	{
		$$renderer.push('<!--[!-->');
	}

	$$renderer.push(`<!--]--></nav>`);
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const projects = [
    {
      title: "Majikayo Games - YouTube Channel",
      description: "My YouTube channel dedicated to game development education. I create tutorials and devlogs covering the Godot game engine as well as general game dev concepts to help aspiring developers level up their skills. My in-depth educational content has attracted over 5,000 subscribers.",
      image: "/images/majikayogames-screenshot.png",
      tags: ["YouTube", "Education", "Godot Engine"],
      link: "https://youtube.com/@majikayogames"
    },
    {
      title: "simple_phys.js",
      description: "A lightweight JavaScript physics engine built from scratch. Has an accompanying blog post and YouTube series which explains the math and code in depth. It powers all the physics objects you see on this page.",
      iframe: "/phys-stuff/inequality_constraints.html?friction=true",
      tags: ["JavaScript", "Physics", "Open Source"],
      link: "https://majikayogames.github.io/physics-tutorial/"
    },
    {
      title: "CryptoDash",
      description: "A React/Next.js web app that allows you to import and manage cryptocurrency portfolios. Features wallet importing, price history viewing, and predictions using a neural network based on past data.",
      image: "/images/cryptodash-screenshot.png",
      tags: ["Next.js", "React", "Node.js"],
      link: "https://cryptodash.ltkdigital.com/"
    },
    {
      title: "WifiMouse",
      description: "An Android app that turns your phone into a full-featured wireless mouse and keyboard. Includes screen mirroring, CPU/process monitoring, wireless file transfer, and an application launcher.",
      image: "/images/wifimouse-screenshot.jpg",
      tags: ["Android", "Java", "C++", "Qt"],
      link: "https://wifimouse.github.io/"
    },
    {
      title: "Virtual Sticky Notes",
      description: "A Windows app that lets users create virtual sticky notes to post reminders on their desktop. Downloaded over 500,000 times on the Windows Store.",
      image: "/images/sticky-notes-screenshot.jpg",
      tags: ["Windows", "C#"],
      link: "https://apps.microsoft.com/detail/9n110gmw1xts"
    }
  ];
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-j7pv25f6> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description" content="Logan Krumbhaar - Web developer & game development educator"><title>Logan Krumbhaar</title><link rel="icon" type="image/svg+xml" href="/images/lk-icon-blue.svg">', "</head> <body data-astro-cid-j7pv25f6> ", " <main data-astro-cid-j7pv25f6> ", ' <!-- Portfolio Section --> <section id="portfolio" class="portfolio-section" data-astro-cid-j7pv25f6> <div class="portfolio-inner" data-astro-cid-j7pv25f6> <h2 class="section-title" data-astro-cid-j7pv25f6>Portfolio</h2> ', ` </div> </section> <!-- About Section --> <div class="paper-wrapper" data-astro-cid-j7pv25f6> <section id="about" class="about paper" data-astro-cid-j7pv25f6> <div class="tape tape-top-left" data-astro-cid-j7pv25f6></div> <div class="tape tape-top-right" data-astro-cid-j7pv25f6></div> <div class="tape tape-bottom-left" data-astro-cid-j7pv25f6></div> <div class="tape tape-bottom-right" data-astro-cid-j7pv25f6></div> <h2 class="section-title" data-astro-cid-j7pv25f6>About Me</h2> <div class="about-content" data-astro-cid-j7pv25f6> <div class="about-text" data-astro-cid-j7pv25f6> <p class="lead" data-astro-cid-j7pv25f6>
Hey! I'm Logan, a web developer and game development educator based in the digital realm.
</p> <p data-astro-cid-j7pv25f6>
I've been building things for the web for over a decade, from full-stack applications to physics engines to mobile apps. When I'm not coding, I'm teaching game development on YouTube through my channel Majikayo Games.
</p> <p data-astro-cid-j7pv25f6>
I believe in writing clean, maintainable code and creating experiences that feel genuinely delightful to use. Whether it's a complex web app or a simple utility, I approach every project with the same attention to craft.
</p> <p data-astro-cid-j7pv25f6>
Currently interested in creative coding, 3D rendering, and finding new ways to make learning game development more accessible.
</p> </div> </div> </section> </div> <!-- Contact Section --> <div class="paper-wrapper" data-astro-cid-j7pv25f6> <section id="contact" class="contact paper" data-astro-cid-j7pv25f6> <div class="tape tape-top-center" data-astro-cid-j7pv25f6></div> <h2 class="section-title" data-astro-cid-j7pv25f6>Get In Touch</h2> <p class="contact-lead" data-astro-cid-j7pv25f6>Have a project in mind or just want to say hi? I'd love to hear from you.</p> <div class="contact-links" data-astro-cid-j7pv25f6> <a href="mailto:logankrumbhaar@gmail.com" class="contact-item" data-astro-cid-j7pv25f6> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-j7pv25f6> <rect width="20" height="16" x="2" y="4" rx="2" data-astro-cid-j7pv25f6></rect> <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" data-astro-cid-j7pv25f6></path> </svg> <span data-astro-cid-j7pv25f6>logankrumbhaar@gmail.com</span> </a> <a href="https://github.com/krogank9" target="_blank" rel="noopener" class="contact-item" data-astro-cid-j7pv25f6> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-j7pv25f6> <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" data-astro-cid-j7pv25f6></path> <path d="M9 18c-4.51 2-5-2-7-2" data-astro-cid-j7pv25f6></path> </svg> <span data-astro-cid-j7pv25f6>GitHub</span> </a> <a href="https://youtube.com/@majikayogames" target="_blank" rel="noopener" class="contact-item" data-astro-cid-j7pv25f6> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-j7pv25f6> <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" data-astro-cid-j7pv25f6></path> <path d="m10 15 5-3-5-3z" data-astro-cid-j7pv25f6></path> </svg> <span data-astro-cid-j7pv25f6>YouTube</span> </a> <a href="https://www.linkedin.com/in/logan-krumbhaar/" target="_blank" rel="noopener" class="contact-item" data-astro-cid-j7pv25f6> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-j7pv25f6> <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" data-astro-cid-j7pv25f6></path> <rect width="4" height="12" x="2" y="9" data-astro-cid-j7pv25f6></rect> <circle cx="4" cy="4" r="2" data-astro-cid-j7pv25f6></circle> </svg> <span data-astro-cid-j7pv25f6>LinkedIn</span> </a> </div> </section> </div> <footer class="footer" data-astro-cid-j7pv25f6> <p data-astro-cid-j7pv25f6>\xA9 2026 Logan Krumbhaar</p> <span class="made-with" data-astro-cid-j7pv25f6>
Made with <a href="https://svelte.dev" target="_blank" rel="noopener" data-astro-cid-j7pv25f6>Svelte</a> and <a href="https://astro.build" target="_blank" rel="noopener" data-astro-cid-j7pv25f6>Astro</a>.
</span> <button class="back-to-top" aria-label="Back to top" onclick="window.scrollTo({ top: 0, behavior: 'smooth' })" data-astro-cid-j7pv25f6> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-j7pv25f6> <path d="M12 19V5" data-astro-cid-j7pv25f6></path> <path d="m5 12 7-7 7 7" data-astro-cid-j7pv25f6></path> </svg> </button> </footer> </main>  <!-- Slime physics effect --> <script src="/phys-stuff/slime-renderer.js"><\/script> <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Create slime controller - positioned at bottom of page
        var slimeController = new SlimeController({
          pageBottomMode: true,
          pageBottomOffset: 0 // floor is at the very bottom of page content
        });
        
        // Show the slime when the page loads
        slimeController.show();
        
        // Clear text selection when focus moves to an iframe
        window.addEventListener('blur', function() {
          if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
            window.getSelection().removeAllRanges();
          }
        });
      });
    <\/script> </body> </html>`])), renderHead(), renderComponent($$result, "Nav", Nav, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/home/logan/2026-portfolio/src/components/Nav.svelte", "client:component-export": "default", "data-astro-cid-j7pv25f6": true }), renderComponent($$result, "Hero", Hero, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/home/logan/2026-portfolio/src/components/Hero.svelte", "client:component-export": "default", "data-astro-cid-j7pv25f6": true }), projects.map((project, index) => renderTemplate`<article${addAttribute(`project ${index % 2 === 1 ? "reverse" : ""}`, "class")} data-astro-cid-j7pv25f6> <div class="project-media" data-astro-cid-j7pv25f6> ${project.iframe ? renderTemplate`<div class="iframe-frame" data-astro-cid-j7pv25f6> <iframe${addAttribute(project.iframe, "src")}${addAttribute(project.title, "title")} class="project-iframe" data-astro-cid-j7pv25f6></iframe> </div>` : project.image?.includes("screenshot") ? renderTemplate`<div class="image-frame" data-astro-cid-j7pv25f6> <img${addAttribute(project.image, "src")}${addAttribute(project.title, "alt")} class="project-image" data-astro-cid-j7pv25f6> </div>` : renderTemplate`<div class="placeholder-image" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>${project.title.charAt(0)}</span> </div>`} </div> <div class="project-content" data-astro-cid-j7pv25f6> <h3 data-astro-cid-j7pv25f6>${project.title}</h3> <p data-astro-cid-j7pv25f6>${project.description}</p> <div class="tags" data-astro-cid-j7pv25f6> ${project.tags.map((tag) => renderTemplate`<span class="tag" data-astro-cid-j7pv25f6>${tag}</span>`)} </div> <a${addAttribute(project.link, "href")} class="project-link" target="_blank" rel="noopener" data-astro-cid-j7pv25f6>
View Project →
</a> </div> </article>`));
}, "/home/logan/2026-portfolio/src/pages/index.astro", void 0);

const $$file = "/home/logan/2026-portfolio/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
