// Core app from color_palette_generator.html (deduplicated)
console.log('Script loaded successfully');
const state = {
	families: [],
	selectedFamily: null,
	stepsMin: 3,
	stepsMax: 3,
	transforms: { min: { l: -42, c: 8, h: -4 }, max: { l: 42, c: -8, h: 4 } },
	curveType: 'sinusoidalPosition',
	exportColorSpace: 'lch',
};

const easingFunctions = {
	linearPosition: (t) => t,
	quadraticPosition: (t) => t * t,
	cubicPosition: (t) => t * t * t,
	sinusoidalPosition: (t) => 0.5 - 0.5 * Math.cos(t * Math.PI),
	exponentialPosition: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
	smoothStepPosition: (t) => t * t * (3 - 2 * t),
};

function randomInRange(min, max) {
	return Math.random() * (max - min) + min;
}
function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function generateRandomBaseColor() {
	return [randomInRange(0, 360), randomInRange(0.2, 1), randomInRange(0.4, 0.6)];
}

function generateColorName(hsl) {
	// Convert HSL to RGB for the color naming library
	const rgb = hslToRgb(hsl);
	const hex = `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

	// Use ntc.js to get the closest color name
	const n_match = ntc.name(hex);
	return n_match[1]; // Return just the color name
}

function lchToHsl(l, c, h) {
	return [h, Math.min(c / 75, 1), l / 100];
}
function hslToLch(hsl) {
	return [hsl[2] * 100, hsl[1] * 75, hsl[0]];
}

function hslToRgb(hsl) {
	const h = hsl[0] / 360;
	const s = hsl[1];
	const l = hsl[2];
	const hue2rgb = (p, q, t) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};
	let r, g, b;
	if (s === 0) {
		r = g = b = l;
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	return [r * 255, g * 255, b * 255];
}

function calculateClampedTargets(baseHsl, transformMin, transformMax) {
	const baseLch = hslToLch(baseHsl);
	const minLch = [
		clamp(baseLch[0] + transformMin.l, 0, 100),
		clamp(baseLch[1] + transformMin.c, 0, 150),
		(((baseLch[2] + transformMin.h) % 360) + 360) % 360,
	];
	const maxLch = [
		clamp(baseLch[0] + transformMax.l, 0, 100),
		clamp(baseLch[1] + transformMax.c, 0, 150),
		(((baseLch[2] + transformMax.h) % 360) + 360) % 360,
	];
	return { min: lchToHsl(minLch[0], minLch[1], minLch[2]), max: lchToHsl(maxLch[0], maxLch[1], maxLch[2]) };
}

function interpolateHSL(c1, c2, t) {
	let h1 = c1[0],
		h2 = c2[0],
		d = h2 - h1;
	if (d > 180) d -= 360;
	if (d < -180) d += 360;
	return [(h1 + d * t + 360) % 360, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];
}

function generateFamilySwatches(baseHsl, minHsl, maxHsl, stepsMin, stepsMax, curveType) {
	const swatches = [];
	const easingFn = easingFunctions[curveType] || easingFunctions.sinusoidalPosition;
	for (let i = stepsMin; i > 0; i--) {
		swatches.push(interpolateHSL(baseHsl, minHsl, easingFn(i / stepsMin)));
	}
	swatches.push(baseHsl);
	for (let i = 1; i <= stepsMax; i++) {
		swatches.push(interpolateHSL(baseHsl, maxHsl, easingFn(i / stepsMax)));
	}
	return swatches;
}

// Custom curve dropdown functions removed - now using fig-dropdown

function createFamilyHTML(index, baseHsl, name, nameIsCustom) {
	const nameOpacity = nameIsCustom ? '1' : '0.6';
	const family = document.createElement('div');
	family.className = `family family-${index}`;
	family.setAttribute('data-family-index', index);
	family.innerHTML = `<div class="family-name" style="opacity: ${nameOpacity}">${name}</div><div class="swatches"></div>`;
	family.addEventListener('click', () => selectFamily(index));
	return family;
}

function updateFamilyDisplay(familyIndex) {
	const family = state.families[familyIndex];
	const { min: minHsl, max: maxHsl } = calculateClampedTargets(family.base, state.transforms.min, state.transforms.max);
	const swatches = generateFamilySwatches(family.base, minHsl, maxHsl, state.stepsMin, state.stepsMax, state.curveType);
	const familyElement = document.querySelector(`.family-${familyIndex}`);
	const swatchesContainer = familyElement.querySelector('.swatches');
	swatchesContainer.innerHTML = '';
	swatches.forEach((hsl, swatchIndex) => {
		const swatch = document.createElement('div');
		swatch.className = 'swatch';
		swatch.style.backgroundColor = `hsl(${hsl[0]}, ${hsl[1] * 100}%, ${hsl[2] * 100}%)`;
		swatch.title = `${family.name}-${swatchIndex + 1}`;
		swatchesContainer.appendChild(swatch);
	});
}

function selectFamily(familyIndex) {
	document.querySelectorAll('.family').forEach((f) => f.classList.remove('selected'));
	const familyElement = document.querySelector(`.family-${familyIndex}`);
	familyElement.classList.add('selected');
	state.selectedFamily = familyIndex;
	const controls = document.getElementById('selected-family-controls');
	controls.style.display = 'block';
	const family = state.families[familyIndex];
	const baseLch = hslToLch(family.base);
	document.getElementById('family-name').value = family.name;
	document.getElementById('family-name').style.opacity = family.nameIsCustom ? '1' : '0.6';
	document.getElementById('base-l-slider').value = Math.round(baseLch[0]);
	document.getElementById('base-c-slider').value = Math.round(baseLch[1]);
	document.getElementById('base-h-slider').value = Math.round(baseLch[2]);
}

function addFamily() {
	console.log('addFamily called');
	const familyIndex = state.families.length;
	const baseHsl = generateRandomBaseColor();
	const name = generateColorName(baseHsl);
	const family = { base: baseHsl, name, nameIsCustom: false };
	state.families.push(family);
	const familyElement = createFamilyHTML(familyIndex, baseHsl, name, false);
	document.getElementById('families-container').appendChild(familyElement);
	updateFamilyDisplay(familyIndex);
	updateCSSExport();
}

function updateAllFamilies() {
	state.families.forEach((_, i) => updateFamilyDisplay(i));
	updateCSSExport();
}

function syncInputs(changedElement) {
	// For Figma UI3 components, the slider handles its own text input
	// No need for manual syncing as it's built into the component
}

function generateCSSExport() {
	let css = ':root\n{\n';
	state.families.forEach((family) => {
		const { min: minHsl, max: maxHsl } = calculateClampedTargets(
			family.base,
			state.transforms.min,
			state.transforms.max
		);
		const swatches = generateFamilySwatches(
			family.base,
			minHsl,
			maxHsl,
			state.stepsMin,
			state.stepsMax,
			state.curveType
		);
		swatches.forEach((hsl, idx) => {
			let value;
			switch (state.exportColorSpace) {
				case 'hsl':
					value = `hsl(${Math.round(hsl[0])}, ${Math.round(hsl[1] * 100)}%, ${Math.round(hsl[2] * 100)}%)`;
					break;
				case 'hex': {
					const rgb = hslToRgb(hsl);
					value = `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
					break;
				}
				case 'lch':
				default: {
					const lch = hslToLch(hsl);
					value = `lch(${Math.round(lch[0])}% ${Math.round(lch[1])} ${Math.round(lch[2])})`;
				}
			}
			css += `  --${family.name}-${idx + 1}: ${value};\n`;
		});
	});
	css += '}';
	return css;
}

function updateCSSExport() {
	document.getElementById('css-output').textContent = generateCSSExport();
}

async function copyToClipboard(text) {
	try {
		await navigator.clipboard.writeText(text);
	} catch (err) {
		const textarea = document.createElement('textarea');
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
	}
}

document.addEventListener('input', (e) => {
	// Handle Figma UI3 components
	if (e.target.tagName === 'FIG-SLIDER' || e.target.tagName === 'FIG-INPUT-TEXT') {
		if (e.target.id.startsWith('transform-')) {
			const [, dir, ch] = e.target.id.split('-');
			state.transforms[dir][ch] = parseFloat(e.target.value);
			updateAllFamilies();
		} else if (e.target.id === 'family-count') {
			const newCount = parseInt(e.target.value, 10);
			while (state.families.length < newCount) addFamily();
			while (state.families.length > newCount) {
				const last = state.families.length - 1;
				document.querySelector(`.family-${last}`)?.remove();
				state.families.pop();
			}
			updateCSSExport();
		} else if (e.target.id === 'steps-min') {
			state.stepsMin = parseInt(e.target.value, 10);
			updateAllFamilies();
		} else if (e.target.id === 'steps-max') {
			state.stepsMax = parseInt(e.target.value, 10);
			updateAllFamilies();
		} else if (e.target.id.startsWith('base-')) {
			if (state.selectedFamily !== null) {
				const ch = e.target.id.split('-')[1];
				const fam = state.families[state.selectedFamily];
				const lch = hslToLch(fam.base);
				if (ch === 'l') lch[0] = parseFloat(e.target.value);
				if (ch === 'c') lch[1] = parseFloat(e.target.value);
				if (ch === 'h') lch[2] = parseFloat(e.target.value);
				fam.base = lchToHsl(lch[0], lch[1], lch[2]);
				if (!fam.nameIsCustom) {
					fam.name = generateColorName(fam.base);
					document.getElementById('family-name').value = fam.name;
					document.querySelector(`.family-${state.selectedFamily} .family-name`).textContent = fam.name;
				}
				updateFamilyDisplay(state.selectedFamily);
				updateCSSExport();
			}
		} else if (e.target.id === 'family-name') {
			if (state.selectedFamily !== null) {
				const fam = state.families[state.selectedFamily];
				fam.name = e.target.value;
				fam.nameIsCustom = true;
				e.target.style.opacity = '1';
				document.querySelector(`.family-${state.selectedFamily} .family-name`).textContent = fam.name;
				document.querySelector(`.family-${state.selectedFamily} .family-name`).style.opacity = '1';
				updateCSSExport();
			}
		}
	}
});

document.addEventListener('change', (e) => {
	if (e.target.tagName === 'FIG-DROPDOWN') {
		if (e.target.id === 'color-space') {
			state.exportColorSpace = e.target.value;
			updateCSSExport();
		} else if (e.target.id === 'curve-select') {
			state.curveType = e.target.value;
			updateAllFamilies();
		}
	}
});

// Select all text when inputs receive focus
document.addEventListener(
	'focus',
	(e) => {
		if (e.target.tagName === 'FIG-INPUT-TEXT') {
			e.target.select();
		}
	},
	true
);

document.getElementById('align-l').addEventListener('click', () => {
	if (state.families.length === 0) return;
	const ref = hslToLch(state.families[0].base);
	state.families.forEach((fam, i) => {
		if (i > 0) {
			const lch = hslToLch(fam.base);
			lch[0] = ref[0];
			fam.base = lchToHsl(lch[0], lch[1], lch[2]);
			if (!fam.nameIsCustom) {
				fam.name = generateColorName(fam.base);
				document.querySelector(`.family-${i} .family-name`).textContent = fam.name;
			}
		}
	});
	updateAllFamilies();
	if (state.selectedFamily !== null) selectFamily(state.selectedFamily);
});

document.getElementById('align-c').addEventListener('click', () => {
	if (state.families.length === 0) return;
	const ref = hslToLch(state.families[0].base);
	state.families.forEach((fam, i) => {
		if (i > 0) {
			const lch = hslToLch(fam.base);
			lch[1] = ref[1];
			fam.base = lchToHsl(lch[0], lch[1], lch[2]);
			if (!fam.nameIsCustom) {
				fam.name = generateColorName(fam.base);
				document.querySelector(`.family-${i} .family-name`).textContent = fam.name;
			}
		}
	});
	updateAllFamilies();
	if (state.selectedFamily !== null) selectFamily(state.selectedFamily);
});

document.getElementById('align-h').addEventListener('click', () => {
	if (state.families.length <= 1) return;
	const step = 360 / state.families.length;
	state.families.forEach((fam, i) => {
		const lch = hslToLch(fam.base);
		lch[2] = (i * step) % 360;
		fam.base = lchToHsl(lch[0], lch[1], lch[2]);
		if (!fam.nameIsCustom) {
			fam.name = generateColorName(fam.base);
			document.querySelector(`.family-${i} .family-name`).textContent = fam.name;
		}
	});
	updateAllFamilies();
	if (state.selectedFamily !== null) selectFamily(state.selectedFamily);
});

document.getElementById('reset-name').addEventListener('click', () => {
	if (state.selectedFamily !== null) {
		const fam = state.families[state.selectedFamily];
		fam.nameIsCustom = false;
		fam.name = generateColorName(fam.base);
		document.getElementById('family-name').value = fam.name;
		document.getElementById('family-name').style.opacity = '0.6';
		document.querySelector(`.family-${state.selectedFamily} .family-name`).textContent = fam.name;
		document.querySelector(`.family-${state.selectedFamily} .family-name`).style.opacity = '0.6';
		updateCSSExport();
	}
});

document.getElementById('copy-css').addEventListener('click', () => copyToClipboard(generateCSSExport()));
document.getElementById('copy-svg').addEventListener('click', () => copyToClipboard(generateSVGExport()));
document.getElementById('download-svg').addEventListener('click', () => {
	const svg = generateSVGExport();
	const blob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'color-palette.svg';
	a.click();
	URL.revokeObjectURL(url);
});

function generateSVGExport() {
	const swatchSize = 60;
	const familySpacing = 80;
	const totalWidth = Math.max(
		...state.families.map((fam) => {
			const { min, max } = calculateClampedTargets(fam.base, state.transforms.min, state.transforms.max);
			const swatches = generateFamilySwatches(fam.base, min, max, state.stepsMin, state.stepsMax, state.curveType);
			return swatches.length * swatchSize;
		}),
		0
	);
	const totalHeight = state.families.length * familySpacing;
	let svg = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;
	state.families.forEach((fam, i) => {
		const { min, max } = calculateClampedTargets(fam.base, state.transforms.min, state.transforms.max);
		const swatches = generateFamilySwatches(fam.base, min, max, state.stepsMin, state.stepsMax, state.curveType);
		const y = i * familySpacing;
		svg += `<text x="0" y="${y + 15}" font-family="Arial, sans-serif" font-size="12" fill="#333">${fam.name}</text>`;
		swatches.forEach((hsl, idx) => {
			const x = idx * swatchSize;
			const color = `hsl(${hsl[0]}, ${hsl[1] * 100}%, ${hsl[2] * 100}%)`;
			svg += `<rect x="${x}" y="${
				y + 20
			}" width="${swatchSize}" height="${swatchSize}" fill="${color}" stroke="#fff" stroke-width="1"/>`;
			svg += `<text x="${x + swatchSize / 2}" y="${
				y + 90
			}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#666">${fam.name}-${idx + 1}</text>`;
		});
	});
	svg += '</svg>';
	return svg;
}

function init() {
	console.log('Init function called');
	addFamily();
	setTimeout(() => {
		if (state.families.length > 0) selectFamily(0);
		updateCSSExport();
	}, 100);
}
// Ensure DOM is ready before initializing
document.addEventListener('DOMContentLoaded', init);
