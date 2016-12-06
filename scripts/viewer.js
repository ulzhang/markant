;(function() {
	const fileLoader = require("./utils/file_loader");
	const hljs = require("highlight.js");
	const markdown = require("markdown-it")({
		html: true,
		highlight,
	});
	const lazyHeaders = require("markdown-it-lazy-headers");
	const sanitizer = require("markdown-it-sanitizer");
	const katex = require("markdown-it-katex");
	const mathjax = require("markdown-it-mathjax");

	// Wait for the user to stop typing before the Markdown is rendered.
	const useDelayedRendering = true;
	// The minimum delay between keystrokes before the user is deemed done typing.
	const renderDelay = 200;
	// Which math renderer to use, either "KaTex" or "MathJax".
	const mathRenderer = "KaTex";
	// The style to use with highlight.js for code snippets in the viewer.
	const hljsStyle = "monokai";
	// Url for the MathJax CDN.
	const mathjaxUrl = "https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-MML-AM_CHTML";

	let renderTimeout;
	let viewer;
	let mathjaxReady;

	// Set up markdown-it with the needed plugins.
	markdown.use(lazyHeaders);
	markdown.use(sanitizer, {
		removeUnknown: true,
		removeUnbalanced: true,
		img: "",
	});
	if (mathRenderer.toLowerCase() === "katex") {
		markdown.use(katex);
	} else if (mathRenderer.toLowerCase() === "mathjax") {
		markdown.use(mathjax);
		fileLoader.getScript(mathjaxUrl, function() {
			MathJax.Hub.Config({
				messageStyle: "none",
			});
			mathjaxReady = true;
		});
	}

	// Get the required highlight.js style.
	fileLoader.getStyle(`build/lib/highlight.js/styles/${hljsStyle}.css`);

	// Render the specified Markdown and insert the resulting HTML into the viewer.
	function render(markdownString, callback) {
		const result = markdown.render(markdownString || "");
		viewer.innerHTML = result;
		if (mathjaxReady) {
			MathJax.Hub.Queue(["Typeset", MathJax.Hub, viewer]);
		}
		if (callback) {
			callback();
		}
	}

	// Wait for the user to stop typing before rendering the Markdown.
	function delayedRender(markdownString, callback) {
		clearTimeout(renderTimeout);
		renderTimeout = setTimeout(function() {
			render(markdownString);
			if (callback) {
				callback();
			}
		}, renderDelay);
	}

	// Highlight code snippets with highlight.js
	function highlight(str, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				const tag = `<pre class='hljs'><code>${hljs.highlight(lang, str, true).value}</code></pre>`;
				return tag;
			} catch (exception) {
				console.warn(`Couldn't highlight code with language ${lang}`, exception);
			}
		}
		return `<pre class='hljs'><code>${markdown.utils.escapeHtml(str)}</code></pre>`;
	}

	module.exports = function(viewerElement) {
		viewer = viewerElement;

		if (useDelayedRendering) {
			module.render = delayedRender;
		} else {
			module.render = render;
		}

		return module;
	};
}());
