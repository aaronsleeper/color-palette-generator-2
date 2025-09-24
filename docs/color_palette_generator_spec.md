# Color Palette Generator - Complete Implementation Specification

## Implementation Task List

### Phase 1: Foundation Setup ✓
1. Create HTML structure with three-column layout
2. Add CSS reset and basic layout (no custom styling)
3. Initialize CSS custom properties with default values
4. Test: Verify layout renders correctly in browser

### Phase 2: Single Family Core ✓
1. Implement single family with base color display
2. Create swatch generation using CSS calc() and custom properties
3. Add linear interpolation (no easing curves yet)
4. Test: Single family displays 7 swatches from base to min/max
5. Verify: All swatches render as valid LCH colors

### Phase 3: User Controls ✓
1. Add numeric inputs and sliders for base color (L, C, H)
2. Implement real-time updates via CSS custom property changes
3. Add input validation and clamping to CSS LCH limits
4. Test: Base color changes update all swatches immediately
5. Verify: Invalid inputs are rejected or clamped

### Phase 4: Global Controls ✓
1. Add family count and variation count controls
2. Implement transform min/max controls with sliders
3. Add curve selection dropdown
4. Test: Global changes affect all families
5. Verify: All controls work independently

### Phase 5: Multiple Families ✓
1. Implement dynamic family creation/removal
2. Add family selection system with right-column controls
3. Implement random color generation within constraints
4. Test: Multiple families display correctly
5. Verify: Family selection shows correct controls

### Phase 6: Advanced Features ✓
1. Add alignment functions (L, C, H distribution)
2. Implement color name generation with override system
3. Add visual feedback for name states (opacity)
4. Test: All alignment functions work correctly
5. Verify: Name system updates appropriately

### Phase 7: Export Functions ✓
1. Implement SVG generation and download
2. Add clipboard operations for SVG and CSS
3. Implement color space conversion for CSS export
4. Test: All export formats work correctly
5. Verify: Generated code is valid and usable

### Phase 8: Polish & Edge Cases ✓
1. Add comprehensive input validation
2. Handle edge cases (0 families, extreme values)
3. Test across different browsers
4. Performance testing with maximum families/variations
5. Final integration testing

## Critical Implementation Details

## Primary Goal
Generate tonal variations within hue families using mathematical easing curves, implemented entirely with CSS custom properties and functions.

## Terminology

### Core Concepts
- **Swatch**: A single, specific color in LCH color space
- **Tonal Variation**: Swatches within a hue family that are derived from the family's key swatches
- **Key Swatches**: Three anchor points for each hue family:
  - **Base**: The central/primary color of the hue family
  - **Variant A**: First boundary color (base + transform A deltas)
  - **Variant B**: Second boundary color (base + transform B deltas)
- **Hue Family**: A complete group of related swatches, including key swatches and all their intermediate tonal variations
- **Curve**: Mathematical function (bezier/easing curve) that determines the distribution of intermediate values between key swatches. The same curve shape applies to all three LCH channels independently.

## Technical Implementation Requirements

### Swatch-to-Base Relationship Logic
**CRITICAL:** Each family generates variations in TWO directions from the base:
- **Towards Variant A**: Base → Variant A (using Transform A deltas)
- **Towards Variant B**: Base → Variant B (using Transform B deltas)
- **Base position**: Base is always the reference point (step 0), variations calculated as deltas in both directions

**Example with 7 variations:**
```css
/* Base is always the reference point */
.swatch-0 { 
    background-color: lch(var(--base-l) var(--base-c) var(--base-h)); 
}

/* Steps toward variant A (could be any direction based on transform values) */
.swatch-1 { 
    --t: calc(1 / 3); /* progress toward variant A */
    --target-l: var(--variant-a-l);
    /* ... calculate interpolation using transform A deltas */
}

/* Steps toward variant B (could be any direction based on transform values) */  
.swatch-4 {
    --t: calc(1 / 3); /* progress toward variant B */
    --target-l: var(--variant-b-l);
    /* ... calculate interpolation using transform B deltas */
}
```

### CSS Property Update Patterns
```css
/* Pattern for updating CSS custom properties via JavaScript */
function updateFamilyBase(familyIndex, channel, value) {
    const family = document.querySelector(`.family-${familyIndex}`);
    family.style.setProperty(`--base-${channel}`, value);
    
    // Dependent properties auto-update via CSS calc()
    // --min-l: calc(var(--base-l) + var(--transform-min-l));
    // --max-l: calc(var(--base-l) + var(--transform-max-l));
}
```

### Target Value Clamping Logic
```javascript
// CRITICAL: Clamp target values, not individual variation calculations
function calculateClampedTargets(baseL, baseC, baseH, transformA, transformB) {
    const variantA = {
        l: Math.max(0, Math.min(100, baseL + transformA.l)),
        c: Math.max(0, Math.min(150, baseC + transformA.c)),
        h: ((baseH + transformA.h) % 360 + 360) % 360  // Handle negative wrap
    };
    
    const variantB = {
        l: Math.max(0, Math.min(100, baseL + transformB.l)),
        c: Math.max(0, Math.min(150, baseC + transformB.c)),
        h: ((baseH + transformB.h) % 360 + 360) % 360  // Handle negative wrap
    };
    
    return { variantA, variantB };
}

// Example: Base L=90, Transform B L=+20
// variantB.l = clamp(90 + 20) = clamp(110) = 100
// Variations: 90 → 92 → 94 → 96 → 98 → 100 (reaching clamped target on final step)
```

### Hue Wrapping and Shortest Path Logic
```javascript
function calculateShortestHuePath(startH, endH) {
    let delta = endH - startH;
    
    // Take shortest path around the color wheel
    if (delta > 180) {
        delta -= 360;
    } else if (delta < -180) {
        delta += 360;
    }
    
    return delta;
}

// Example: Base H=350°, Transform A H=+30°
// Raw result: 350 + 30 = 380° → normalized to 20°
// Shortest path: 350° → 20° goes through 360°/0° boundary
```
```javascript
const LCH_LIMITS = {
    l: { min: 0, max: 100 },
    c: { min: 0, max: 150 }, 
    h: { min: 0, max: 360 }
};

function validateAndClamp(value, channel) {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    return Math.max(LCH_LIMITS[channel].min, 
                   Math.min(LCH_LIMITS[channel].max, num));
}

// CRITICAL: Transform deltas can be negative, but final calculated values must stay in bounds
function validateFinalColor(baseL, baseC, baseH, transformL, transformC, transformH) {
    const finalL = baseL + transformL;
    const finalC = baseC + transformC;
    const finalH = (baseH + transformH) % 360;
    
    return {
        l: Math.max(0, Math.min(100, finalL)),
        c: Math.max(0, Math.min(150, finalC)),
        h: finalH < 0 ? finalH + 360 : finalH
    };
}
```
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Color Palette Generator</title>
    <link rel="stylesheet" href="reset.css">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="app-container">
        <div class="left-column">
            <!-- LCH ranges, controls, align, export -->
        </div>
        <div class="center-column">
            <!-- Color families display -->
        </div>
        <div class="right-column">
            <!-- Selected family controls -->
        </div>
    </div>
</body>
</html>
```

## Concrete Examples and Error Prevention

### Complete State Update Sequence
```
When transform-min-l changes:
1. Update state.transforms.min.l
2. Recalculate all family minColor values (with clamping)
3. Regenerate all family swatches using Poline
4. Update all family DOM elements with new colors
5. Update CSS export display
6. Update family names if not custom (optional)
```

### Example: Complete Flow for 1 Family
```javascript
// EXAMPLE: Family with 2 steps toward min, base, 3 steps toward max
const exampleState = {
  families: [{
    base: [240, 0.75, 0.50], // HSL format for Poline
    name: 'blue',
    nameIsCustom: false
  }],
  transforms: {
    min: {l: -20, c: 10, h: -5},
    max: {l: 30, c: -15, h: 8}
  },
  stepsToMin: 2,
  stepsToMax: 3,
  curveType: 'sinusoidalPosition'
};

// Expected swatch order: [Min2, Min1, Base, Max1, Max2, Max3]
// Min2 = furthest toward min variant
// Max3 = furthest toward max variant
// Base always separates min and max variations

// Actual generation:
const minColor = clampLCH(addTransform(base, transforms.min));
const maxColor = clampLCH(addTransform(base, transforms.max));
const swatches = generateFamilySwatches(base, minColor, maxColor, 2, 3, 'sinusoidalPosition');
// Result: 6 total swatches with base in position 2 (0-indexed)
```

### Error Handling Patterns
```javascript
// Handle Poline creation failures
function safeCreatePoline(options) {
    try {
        return new Poline(options);
    } catch (error) {
        console.error('Poline creation failed:', error.message);
        // Fallback to linear interpolation
        return new Poline({
            anchorColors: options.anchorColors,
            numPoints: options.numPoints,
            positionFunction: positionFunctions.linearPosition
        });
    }
}

// Handle color name generation failures
function safeGenerateColorName(hsl) {
    try {
        return generateColorName(hsl[0], hsl[1], hsl[2]);
    } catch (error) {
        console.error('Color name generation failed:', error);
        return `color-${Math.round(hsl[0])}-${Math.round(hsl[1]*100)}-${Math.round(hsl[2]*100)}`;
    }
}

// Handle clipboard operations
async function safeCopyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            showFeedback('Copied to clipboard!');
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showFeedback('Copied to clipboard!');
        }
    } catch (error) {
        console.error('Clipboard operation failed:', error);
        showFeedback('Copy failed - try selecting and copying manually');
    }
}
```

### Family Deletion Logic
```javascript
// When family is deleted, maintain other families unchanged
function deleteFamily(familyIndex) {
    // Remove from state
    state.families.splice(familyIndex, 1);
    
    // Remove from DOM
    document.querySelector(`.family-${familyIndex}`).remove();
    
    // Re-index remaining families in DOM (update classes)
    state.families.forEach((family, newIndex) => {
        const familyElement = document.querySelector(`.family[data-family-index="${family.id}"]`);
        familyElement.className = `family family-${newIndex}`;
        familyElement.setAttribute('data-family-index', newIndex);
    });
    
    // Handle selection state
    if (state.selectedFamily === familyIndex) {
        // Select first remaining family, or hide controls if none
        if (state.families.length > 0) {
            selectFamily(0);
        } else {
            document.getElementById('selected-family-controls').style.display = 'none';
        }
    } else if (state.selectedFamily > familyIndex) {
        // Adjust selected index if it's after deleted family
        state.selectedFamily--;
    }
}
```
```javascript
// REQUIRED: These exact conversion functions needed for export
function lchToRgb(l, c, h) {
    // Convert LCH to LAB first
    const a = c * Math.cos(h * Math.PI / 180);
    const b = c * Math.sin(h * Math.PI / 180);
    
    // LAB to XYZ conversion (D65 illuminant)
    let y = (l + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;
    
    // XYZ to RGB conversion matrix (sRGB)
    // ... implementation needed
    
    return {r, g, b}; // 0-255 values
}

function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function lchToHsl(l, c, h) {
    // Convert through RGB intermediate
    const rgb = lchToRgb(l, c, h);
    // RGB to HSL conversion
    // ... implementation needed
    return {h, s, l}; // HSL values
}
```

### Family Generation Template
```javascript
function createFamilyHTML(index, baseLCH, name, isCustomName = false) {
    const nameOpacity = isCustomName ? '1' : '0.6';
    
    return `
        <div class="family family-${index}" data-family-index="${index}" style="
            --base-l: ${baseLCH.l};
            --base-c: ${baseLCH.c}; 
            --base-h: ${baseLCH.h};
            --min-l: calc(var(--base-l) + var(--transform-min-l));
            --min-c: calc(var(--base-c) + var(--transform-min-c));
            --min-h: calc(var(--base-h) + var(--transform-min-h));
            --max-l: calc(var(--base-l) + var(--transform-max-l));
            --max-c: calc(var(--base-c) + var(--transform-max-c));
            --max-h: calc(var(--base-h) + var(--transform-max-h));
        ">
            <div class="family-name" style="opacity: ${nameOpacity}">${name}</div>
            <div class="swatches">
                ${generateSwatchesHTML(index)}
            </div>
        </div>
    `;
}

function generateSwatchesHTML(familyIndex) {
    const variationCount = parseInt(document.getElementById('variation-count').value);
    let swatchesHTML = '';
    
    for (let i = 0; i < variationCount; i++) {
        const isBase = i === Math.floor(variationCount / 2); // middle swatch is base
        swatchesHTML += `
            <div class="swatch swatch-${i}" style="
                --step: ${i};
                --total-steps: ${variationCount - 1};
                --t: calc(var(--step) / var(--total-steps));
                --t-eased: var(--t-ease-in-out);
                background-color: ${isBase ? 
                    'lch(calc(var(--base-l) * 1%) calc(var(--base-c) * 1%) calc(var(--base-h) * 1deg))' :
                    'lch(calc(var(--interpolated-l) * 1%) calc(var(--interpolated-c) * 1%) calc(var(--interpolated-h) * 1deg))'
                };
            " title="${name}-${i + 1}">
            </div>
        `;
    }
    return swatchesHTML;
}
```

### Critical Questions for Implementation LLM

**Q1: Swatch Calculation Logic**
- How exactly do we determine which swatches go toward min vs max?
- Is the base always in the center, or can it be positioned differently?
- Do we need separate interpolation calculations for min and max directions?

**Q2: CSS Custom Property Updates**  
- When transform values change, do all family calculations update automatically?
- How do we ensure CSS calc() expressions don't exceed browser limits?
- What happens if calculated LCH values go outside valid ranges?

**Q3: Color Name Library Integration**
- Which specific npm package should be used for color names?
- How do we handle colors that don't have close name matches?
- Should names update immediately on every small change?

**Q4: Export Format Requirements**
- What exact CSS format is expected (custom properties, classes, both)?
- How should families be grouped in the CSS output?
- What SVG structure is needed for the export?

**Q5: Performance Considerations**
- How many families/variations before performance degrades?
- Should we debounce input updates?
- Do we need to optimize CSS recalculations?
```css
:root {
    /* Global Configuration */
    --family-count: 1;
    --variation-count: 7;
    
    /* Transform Values */
    --transform-min-l: -42;
    --transform-max-l: 42;
    --transform-min-c: 8;
    --transform-max-c: -8;
    --transform-min-h: -4;
    --transform-max-h: 4;
    
    /* Curve Constants */
    --pi: 3.14159;
    --half-pi: 1.5708;
    
    /* Active curve type: linear, ease-in, ease-out, ease-in-out */
    --curve-type: ease-in-out;
}

/* Family-specific properties pattern */
.family-1 {
    --base-l: 50;
    --base-c: 75;
    --base-h: 240;
    
    --min-l: calc(var(--base-l) + var(--transform-min-l));
    --min-c: calc(var(--base-c) + var(--transform-min-c));
    --min-h: calc(var(--base-h) + var(--transform-min-h));
    
    --max-l: calc(var(--base-l) + var(--transform-max-l));
    --max-c: calc(var(--base-c) + var(--transform-max-c));
    --max-h: calc(var(--base-h) + var(--transform-max-h));
}

/* Swatch calculation pattern */
.family-1 .swatch-3 {
    --step: 3;
    --total-steps: var(--variation-count);
    
    /* Linear progress */
    --t: calc(var(--step) / var(--total-steps));
    
    /* Apply easing curve */
    --t-eased: calc(0.5 - 0.5 * cos(var(--t) * var(--pi)));
    
    /* Interpolate each channel */
    --current-l: calc(var(--base-l) + (var(--target-l) - var(--base-l)) * var(--t-eased));
    --current-c: calc(var(--base-c) + (var(--target-c) - var(--base-c)) * var(--t-eased));
    --current-h: calc(var(--base-h) + (var(--target-h) - var(--base-h)) * var(--t-eased));
    
    background-color: lch(calc(var(--current-l) * 1%) calc(var(--current-c) * 1%) calc(var(--current-h) * 1deg));
}
```

### Color Space Export with Poline
```javascript
// Poline provides multiple CSS output formats
function generateCSSExport(colorSpace = 'lch') {
    let css = ':root {\n';
    
    state.families.forEach((family, familyIndex) => {
        const swatches = generateFamilySwatches(/* ... */);
        
        swatches.forEach((colorHSL, swatchIndex) => {
            let colorValue;
            
            switch(colorSpace) {
                case 'lch':
                    // Convert HSL back to LCH for output
                    colorValue = hslToLch(colorHSL);
                    break;
                case 'hsl':
                    colorValue = `hsl(${colorHSL[0]}, ${colorHSL[1]*100}%, ${colorHSL[2]*100}%)`;
                    break;
                case 'hex':
                    // Use culori for conversion
                    colorValue = formatHex({mode: 'hsl', h: colorHSL[0], s: colorHSL[1], l: colorHSL[2]});
                    break;
            }
            
            css += `  --${family.name}-${swatchIndex + 1}: ${colorValue};\n`;
        });
    });
    
    css += '}';
    return css;
}
```

### Input Synchronization System
```javascript
// Sync numeric inputs with sliders
function syncInputs(changedElement) {
    const isSlider = changedElement.type === 'range';
    const isNumber = changedElement.type === 'number';
    
    if (isSlider) {
        // Find corresponding number input
        const numberId = changedElement.id.replace('-slider', '');
        const numberInput = document.getElementById(numberId);
        if (numberInput) {
            numberInput.value = changedElement.value;
        }
    }
    
    if (isNumber) {
        // Find corresponding slider
        const sliderId = changedElement.id + '-slider';
        const sliderInput = document.getElementById(sliderId);
        if (sliderInput) {
            // Clamp to slider's min/max
            const clampedValue = Math.max(
                parseFloat(sliderInput.min), 
                Math.min(parseFloat(sliderInput.max), parseFloat(changedElement.value))
            );
            changedElement.value = clampedValue;
            sliderInput.value = clampedValue;
        }
    }
}

// Attach to all inputs
document.addEventListener('input', (e) => {
    if (e.target.matches('input[type="number"], input[type="range"]')) {
        syncInputs(e.target);
    }
});
```

### JavaScript Functions Required
```javascript
// Curve selection handler
function updateCurve(curveType) {
    const curveMap = {
        'linear': '--t-linear',
        'ease-in': '--t-ease-in',
        'ease-out': '--t-ease-out',
        'ease-in-out': '--t-ease-in-out',
        'circular-in': '--t-circular-in',
        'circular-out': '--t-circular-out',
        'cubic-in': '--t-cubic-in'
    };
    
    // Update all swatches to use selected curve
    document.querySelectorAll('.swatch').forEach(swatch => {
        swatch.style.setProperty('--t-eased', `var(${curveMap[curveType]})`);
    });
}
function generateColorName(l, c, h) {
    // Use color-name-list or similar library
    // Return closest color name string
}

// Hue alignment calculation
function distributeHues(familyCount, startingHue = 0) {
    const step = 360 / familyCount;
    return Array.from({length: familyCount}, (_, i) => (startingHue + i * step) % 360);
}

// Color space conversion for export
function lchToHex(l, c, h) { /* implementation */ }
function lchToHsl(l, c, h) { /* implementation */ }
function lchToRgb(l, c, h) { /* implementation */ }

// Export functions
function generateSVG(families) { /* implementation */ }
function generateCSS(families, colorSpace = 'lch') { /* implementation */ }
function copyToClipboard(text) { /* implementation */ }

// DOM manipulation
function createFamily(index, baseL, baseC, baseH) { /* implementation */ }
function updateFamilyColors(familyIndex) { /* implementation */ }
function selectFamily(familyIndex) { /* implementation */ }
```

### Event Handlers Required
```javascript
// Input change handlers
document.addEventListener('input', (e) => {
    if (e.target.matches('.global-control')) {
        updateGlobalProperty(e.target);
    }
    if (e.target.matches('.family-control')) {
        updateFamilyProperty(e.target);
    }
    if (e.target.matches('.family-name')) {
        updateFamilyName(e.target);
    }
});

// Family selection
document.addEventListener('click', (e) => {
    if (e.target.matches('.family-container')) {
        selectFamily(e.target.dataset.familyIndex);
    }
});

// Alignment buttons
document.querySelector('.align-l').addEventListener('click', alignLightness);
document.querySelector('.align-c').addEventListener('click', alignChroma);
document.querySelector('.align-h').addEventListener('click', distributeHues);

// Export buttons
document.querySelector('.download-svg').addEventListener('click', downloadSVG);
document.querySelector('.copy-svg').addEventListener('click', copySVG);
document.querySelector('.copy-css').addEventListener('click', copyCSS);
```

### Data Structure
```javascript
// Global state object
const state = {
    familyCount: 1,
    variationCount: 7,
    transforms: {
        min: { l: -42, c: 8, h: -4 },
        max: { l: 42, c: -8, h: 4 }
    },
    families: [
        {
            id: 1,
            name: 'blue', // auto-generated or user-provided
            nameIsCustom: false,
            base: { l: 50, c: 75, h: 240 },
            swatches: [] // calculated dynamically via CSS
        }
    ],
    selectedFamily: 1,
    curveType: 'ease-in-out',
    exportColorSpace: 'lch'
};
```

## Technical Implementation Requirements

### 1. Key Swatch Definition System
**Purpose**: Establish the three anchor points that define each hue family's boundaries

**Functions**:
- Define **base swatch** in LCH color space (the central color of the hue family)
- Define **min swatch** in LCH color space (minimum boundary - typically darker/less saturated)
- Define **max swatch** in LCH color space (maximum boundary - typically lighter/more saturated)
- Store each key swatch as separate L, C, and H values in CSS custom properties
- Validate that all LCH values are within acceptable ranges (L: 0-100, C: 0+, H: 0-360)

**Implementation Requirements**:
- Must use CSS custom properties for storage
- Each color component (L, C, H) stored separately for individual manipulation
- Support dynamic updating of key swatches
- Enable creation of multiple hue families with independent key swatch definitions

### 2. Tonal Variation Configuration
**Purpose**: Control the granularity and distribution of generated tonal variations within each hue family

**Functions**:
- Specify the total number of tonal variation steps to generate between base and min swatches
- Specify the total number of tonal variation steps to generate between base and max swatches
- Each variation gets an index value (0, 1, 2, etc.) that determines its position in the sequence
- Handle edge cases (minimum 2 steps, maximum reasonable limit)
- Support asymmetric step counts (different numbers of variations toward min vs max)

**Implementation Requirements**:
- Configurable step counts via CSS custom properties (separate for min and max directions)
- Automatic index assignment for each tonal variation
- Support for both inclusive and exclusive endpoint handling
- Enable independent control of variation density in each direction from base

### 3. Progress Calculation Engine
**Purpose**: Convert discrete step indices into continuous progress values

**Functions**:
- Convert the step index into a linear progress value (0 to 1 range)
- This linear progress represents equal spacing between colors
- Handle normalization across different step counts

**Implementation Requirements**:
- Must use CSS calc() function for division operations
- Ensure precise decimal handling within CSS limitations
- Maintain accuracy across different step counts

### 4. Unified Curve Application System
**Purpose**: Apply consistent mathematical curves across all LCH channels while maintaining independent calculations

**Functions**:
- Apply a single mathematical easing curve shape to all three LCH channels independently
- Use trigonometric functions (sin, cos) available in CSS to create smooth curves
- Support multiple easing types:
  - **Linear**: No transformation (direct linear interpolation)
  - **Ease-in**: Slow start, fast end using sine functions
  - **Ease-out**: Fast start, slow end using cosine functions
  - **Ease-in-out**: Slow start and end, fast middle using combined trigonometric functions
  - **Circular**: Quarter-circle curve using sin/cos combinations
- **Critical Constraint**: The same curve function applies to all channels, but each channel calculates its own interpolated values independently
- **Synchronized Completion**: All three channels reach their respective target values (min or max) on the final step simultaneously

**Implementation Requirements**:
- Must work within CSS mathematical function limitations
- Use predefined constants (π, π/2) for trigonometric calculations
- Support switching between easing types via CSS custom properties
- Maintain smooth curves without mathematical discontinuities
- Ensure curve application is consistent across L, C, and H channels
- Prevent any channel from reaching its target before the final step

### 5. Channel-Independent Interpolation Calculator
**Purpose**: Generate intermediate tonal variations using unified curve application with independent channel calculations

**Functions**:
- For each LCH component (L, C, H), calculate the interpolated value independently using the formula:
  `Base value + (Target value - Base value) × Eased progress`
- Apply the same eased progress value (from the unified curve) to all three channels
- Handle both base-to-min and base-to-max interpolation directions
- Handle special cases for hue interpolation (shortest path around color wheel)
- Generate final LCH swatches using the independently calculated L, C, H values
- Ensure all generated swatches remain within valid LCH gamut
- **Guarantee synchronized completion**: All channels reach their respective targets on the final variation step

**Implementation Requirements**:
- Must use CSS calc() for all mathematical operations
- Handle hue wrapping for values exceeding 360 degrees
- Maintain precision throughout calculation chain
- Support both positive and negative deltas for each channel
- Ensure no channel completes interpolation before the final step
- Handle edge cases where channels have zero delta (base equals target)

### 6. Hue Family Output Generation
**Purpose**: Convert calculated tonal variations into usable CSS color declarations organized by hue family

**Functions**:
- Convert the calculated LCH values into valid CSS color declarations for each tonal variation
- Organize swatches into coherent hue families with predictable naming conventions
- Generate both key swatches (base, min, max) and all tonal variations as usable CSS properties
- Support multiple output formats (custom properties, utility classes, inline styles)
- Enable easy integration with existing CSS workflows and design systems
- Provide clear identification of each swatch's position within its hue family

**Implementation Requirements**:
- Generate valid `lch()` CSS color syntax
- Handle unit conversion (percentages, degrees) as required by CSS
- Create predictable naming conventions for hue families and tonal variations
- Support both static generation and dynamic updates
- Enable efficient access to specific variations within a hue family
- Maintain clear relationships between key swatches and their derived variations

## UI Layout and Interaction Design

### Three-Column Layout Structure

#### Left Column: Global Controls
**Purpose**: Configure system-wide parameters that affect all hue families

**Components**:
- **LCH Channel Ranges Display**
  - Small informational box showing CSS LCH limits:
    - L: 0-100
    - C: 0-150 (theoretically unbounded, but 150 = 100%)
    - H: 0-360
- **Family Count**
  - Numeric input for number of hue families to create
  - Default: 1
  - Range: 1-21
- **Variation Count Controls** 
  - **Toward Variant A**: Numeric input for tonal variation steps from base toward variant A
  - **Toward Variant B**: Numeric input for tonal variation steps from base toward variant B
  - Default: 3 steps each direction (total 7 swatches including base)
  - Range: 0-21 steps per direction
  - Total swatches per family = base + A steps + B steps
- **Transform Controls**
  - **Transform A**: Delta values from base to variant A for each LCH channel
    - L: Numeric input + slider (range: -100 to +100)
    - C: Numeric input + slider (range: -150 to +150) 
    - H: Numeric input + slider (range: -360 to +360)
  - **Transform B**: Delta values from base to variant B for each LCH channel
    - L: Numeric input + slider (range: -100 to +100)
    - C: Numeric input + slider (range: -150 to +150)
    - H: Numeric input + slider (range: -360 to +360)
- **Curve Selection**
  - Dropdown selector for easing curve type (global setting for all families)
  - Options: Linear, Ease-In, Ease-Out, Ease-In-Out, Circular-In, Circular-Out, Cubic (approximated)
  - Updates all family calculations in real-time
  - CSS implementation uses trigonometric and mathematical functions
- **Align Controls**
  - **L Button**: Align all families' base L values to match the first family's L value
  - **C Button**: Align all families' base C values to match the first family's C value
  - **H Button**: Distribute all families' base H values evenly across 0-360° range
    - Calculation: 360° ÷ number of families = degree separation
    - Example: 10 families = 36° separation (0°, 36°, 72°, 108°, etc.)
    - First family retains its current H value, others distributed from that starting point
- **Export Functions**
  - Download SVG: Icon-only button
  - Copy SVG to Clipboard: Icon-only button  
  - **CSS Export Block**: Code-block style div with embedded controls
    - Displays all swatches as CSS custom properties, grouped by family
    - **Copy CSS Button**: Icon button embedded within the code block
    - **Color Space Selector**: Small dropdown to select output color space
      - Options: LCH (default), Hex, HSL, RGB, etc.
      - Changes only the CSS output format, not internal calculations
      - Updates code block display in real-time

**Default Transform Values**:
- Transform A: L(-42), C(+8), H(-4)
- Transform B: L(+42), C(-8), H(+4)

#### Center Column: Color Family Display
**Purpose**: Visual display of all generated hue families and their tonal variations

**Layout**:
- Fills majority of viewport width
- Each hue family displays as a horizontal row filling container width
- Individual swatches within family use `1fr` width for uniform sizing
- Swatches never exceed parent container width
- Families are clickable containers for selection/focus

#### Right Column: Selected Family Controls
**Purpose**: Edit parameters for the currently selected/focused hue family

**Components**:
- **Base Color Controls** (appears when family is selected)
  - L: Numeric input + slider (range: 0-100, constrained by transform values)
  - C: Numeric input + slider (range: 0-150, constrained by transform values)
  - H: Numeric input + slider (range: 0-360, constrained by transform values)
  - Input ranges dynamically calculated: base ± transform min/max values, clamped to CSS limits
- **Family Name Controls**
  - Text input for family identification/labeling
  - **Auto-generated names**: JavaScript library generates names corresponding to base color
  - **Visual state indicators**:
    - Generated names: 60% opacity font color
    - User-overridden names: 100% opacity font color
  - **Reset functionality**: Icon button to clear custom name and return to auto-generation

### Interaction Behavior

#### Input Focus and Selection
- When any numeric input receives focus, entire value is automatically selected
- User can immediately begin typing to replace value
- No additional click required to select text

#### Real-time Updates
- Value changes apply immediately when input value changes
- No "Apply" button or blur-triggered updates required
- Live preview of color changes as user adjusts inputs

#### Family Selection
- Clicking any hue family container gives it focus
- Focused family's controls appear in right column
- Visual indication of which family is currently selected

#### Export Functions
- **Download SVG**: Generate and download SVG file containing all hue families
- **Copy SVG to Clipboard**: Copy generated SVG markup to system clipboard
- **Copy CSS to Clipboard**: Generate and copy CSS custom properties for all swatches, organized by hue family

#### Hue Family Creation Logic

#### Default Base Color Generation
When creating new hue families, generate random base colors within constraints:

**Lightness (L)**:
- Range: 40-60 (within 10% of middle of 0-100 range)
- Avoids extreme light/dark values for better tonal variation potential

**Chroma (C)**:
- Minimum: 30 (20% of CSS maximum of 150)
- Maximum: 150 (full CSS range available)
- Ensures sufficient saturation to avoid muddy default colors

**Hue (H)**:
- Range: 0-360 (full spectrum available)
- No constraints on hue selection for maximum color diversity

#### Transform Application
- Min swatch: Base + Transform Min values per channel
- Max swatch: Base + Transform Max values per channel
- All intermediate variations calculated using unified curve between base and min/max

#### Naming System
- **Family Names**: 
  - Auto-generation: JavaScript library automatically generates names corresponding to family base color
  - User override capability: Manual name editing disables auto-generation for that family
  - Visual state feedback:
    - Auto-generated names: 60% opacity font color
    - User-provided names: 100% opacity font color  
  - Reset functionality: Reset icon allows return to auto-generation from user override state
  - Dynamic updates: Auto-generated names update when base color or transform values change (unless user has overridden)
- **Swatch Names**: Simple incremental naming within families
  - Format: `{family-name}-{number}` (e.g., blue-1, blue-2, blue-3)
  - Numbers increment sequentially through all tonal variations
  - Updates automatically when family name changes

### Development/Styling Constraints
- **No custom styling**: Application should use only CSS resets and browser defaults
- **Native HTML elements**: Use unstyled browser-rendered inputs, sliders, buttons, etc.
- **Minimal UI complexity**: Focus purely on functionality without visual polish
- **Temporary approach**: Styling will be added later once core functionality is proven
- **Poline-Based Color Generation**: Use Poline library for all color interpolation and mathematical operations
  - Leverage Poline's easing curve support
  - Use Poline's LCH color space handling
  - Rely on Poline for color space conversions (LCH → Hex, HSL, RGB)
  - JavaScript handles all color calculations, CSS only displays results
  - CSS custom properties used only for final color values, not mathematical operations

## Core Components
- Must work entirely within CSS (no JavaScript calculations)
- Limited to available CSS functions: `calc()`, `sin()`, `cos()`, `tan()`, `color-mix()`, etc.
- Cannot use power functions (`pow()`) or complex mathematical operations not available in CSS
- Must handle precision limitations of CSS calculations

### Color Space Requirements
- Must handle LCH color space specifically for perceptual uniformity
- Support wide gamut colors while maintaining browser compatibility
- Handle edge cases where calculated colors exceed display capabilities

### Performance Considerations
- Minimize CSS calculation complexity to ensure fast rendering
- Avoid deeply nested calc() expressions that could impact performance
- Support reasonable limits on step count to prevent browser strain

## Practical Applications

### Design System Integration
- Generate cohesive hue families with systematic tonal variations for design systems
- Create predictable color progressions for UI component states within each hue family
- Enable systematic color palette expansion through additional hue families
- Support consistent relationships between related hue families

### Dynamic UI Elements
- Create smooth tonal transitions within hue families using CSS-only implementation
- Support real-time color scheme switching through key swatch updates
- Enable responsive color adjustments while maintaining hue family relationships
- Support theme variations through curve and step count modifications

### Workflow Integration
- Build consistent tonal variations across design systems without manual calculation
- Enable dynamic hue family generation through CSS custom property updates
- Support design token generation compatible with popular design systems
- Facilitate color accessibility testing across complete hue families

## Success Criteria
- Generate mathematically precise tonal variations entirely in CSS using unified curve application
- Support multiple easing curves for different aesthetic distributions within hue families
- Maintain perceptual uniformity using LCH color space throughout all variations
- Enable easy integration into existing CSS workflows and design systems
- Support dynamic updates to key swatches without requiring code regeneration
- Ensure synchronized completion where all LCH channels reach targets simultaneously
- Provide coherent hue family organization with predictable naming and structure
- Support asymmetric variation generation (different step counts toward min vs max)
- Maintain channel independence while applying consistent curve shapes across all channels