// The page is fully prerendered; this entry exists only so Vite bundles the
// stylesheets (and their font files). scripts/prerender.mjs strips the
// resulting <script> tag from dist/index.html, so production ships no JS.
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/global.css";
