# API Documentation

## Core Functions Reference

### State Management

#### `state` (Object)
Global application state containing all configuration and color data.

**Properties:**
- `families` (Array): Color family objects
- `selectedFamily` (Number|null): Index of currently selected family
- `stepsMin` (Number): Steps from base toward min target (0-21)
- `stepsMax` (Number): Steps from base toward max target (0-21)
- `transforms` (Object): Delta transformation values
  - `min` (Object): `{l, c, h}` deltas for min target calculation
  - `max` (Object): `{l, c, h}` deltas for max target calculation
- `curveType` (String): Active easing function name
- `exportColorSpace` (String): CSS export format ('lch', 'hsl', 'hex', 'rgb')

#### Family Object Structure
```javascript
{
  base: [h, s, l],          // HSL array for base color
  name: "blue",             // Display name (auto-generated or custom)
  nameIsCustom: false       // Whether name was manually set by user
}
```

### Color Calculation Functions

#### `generateRandomBaseColor()` → Array
Generates random HSL color within design constraints.
- **Returns**: `[h, s, l]` where h=0-360, s=0.2-1, l=0.4-0.6

#### `calculateClampedTargets(baseHsl, transformMin, transformMax)` → Object
Calculates min/max target colors by applying transforms and clamping to valid ranges.
- **Parameters**:
  - `baseHsl`: `[h, s, l]` base color
  - `transformMin`: `{l, c, h}` delta values for min target
  - `transformMax`: `{l, c, h}` delta values for max target
- **Returns**: `{min: [h, s, l], max: [h, s, l]}`

#### `generateFamilySwatches(baseHsl, minHsl, maxHsl, stepsMin, stepsMax, curveType)` → Array
Generates complete swatch array for a color family using easing curves.
- **Parameters**:
  - `baseHsl`: Base color `[h, s, l]`
  - `minHsl`: Min target color `[h, s, l]`
  - `maxHsl`: Max target color `[h, s, l]`
  - `stepsMin`: Number of steps toward min (0-21)
  - `stepsMax`: Number of steps toward max (0-21)
  - `curveType`: Easing function name (String)
- **Returns**: Array of `[h, s, l]` colors in order `[Min-N, ..., Min-1, Base, Max-1, ..., Max-N]`

#### `interpolateHSL(color1, color2, t)` → Array
Interpolates between two HSL colors with proper hue wrapping.
- **Parameters**:
  - `color1`: Start color `[h, s, l]`
  - `color2`: End color `[h, s, l]`
  - `t`: Interpolation factor (0-1)
- **Returns**: Interpolated color `[h, s, l]`

### Color Space Conversions

#### `lchToHsl(l, c, h)` → Array
Converts LCH color to HSL (simplified approximation).
- **Parameters**: L (0-100), C (0-150+), H (0-360)
- **Returns**: `[h, s, l]` where h=0-360, s=0-1, l=0-1

#### `hslToLch(hsl)` → Array
Converts HSL color to LCH (simplified approximation).
- **Parameters**: `[h, s, l]` where h=0-360, s=0-1, l=0-1
- **Returns**: `[l, c, h]` where L=0-100, C=0-150+, H=0-360

#### `hslToRgb(hsl)` → Array
Converts HSL to RGB for hex export.
- **Parameters**: `[h, s, l]`
- **Returns**: `[r, g, b]` where values are 0-255

### Easing Functions

#### `easingFunctions` (Object)
Collection of mathematical easing functions for color interpolation.

**Available Functions:**
- `linearPosition(t)`: Linear interpolation
- `quadraticPosition(t)`: Quadratic curve (ease-in)
- `cubicPosition(t)`: Cubic curve
- `sinusoidalPosition(t)`: Sinusoidal curve (ease-in-out)
- `exponentialPosition(t)`: Exponential curve
- `smoothStepPosition(t)`: Smooth step function

**Function Signature:** `(t: Number) → Number`
- **Parameter**: `t` - Progress value (0-1)
- **Returns**: Eased value (0-1)

### Family Management

#### `addFamily()` → void
Creates new color family with random base color and adds to DOM.

#### `selectFamily(familyIndex)` → void
Selects family and populates right-column controls.
- **Parameters**: `familyIndex` - Zero-based family index

#### `updateFamilyDisplay(familyIndex)` → void
Recalculates and updates visual display of family swatches.
- **Parameters**: `familyIndex` - Zero-based family index

#### `updateAllFamilies()` → void
Updates all families (used when global settings change).

### Export Functions

#### `generateCSSExport()` → String
Generates CSS custom properties for all families and swatches.
- **Returns**: CSS string with `:root` variables

**Example Output:**
```css
:root {
  --blue-1: lch(25% 83 247);
  --blue-2: lch(35% 79 245);
  --blue-3: lch(45% 75 243);
  /* ... */
}
```

#### `generateSVGExport()` → String
Generates SVG with all families and labeled swatches.
- **Returns**: Complete SVG markup string

#### `copyToClipboard(text)` → Promise
Copies text to clipboard with fallback for older browsers.
- **Parameters**: `text` - String to copy
- **Returns**: Promise (resolves when copy complete)

### UI Component Functions

#### `createCurveIcon(curveType, width, height)` → SVGElement
Creates SVG icon representing an easing curve.
- **Parameters**:
  - `curveType`: Easing function name
  - `width`: SVG width (default 24)
  - `height`: SVG height (default 16)
- **Returns**: SVG DOM element

#### `createCustomCurveDropdown()` → void
Initializes custom curve selection dropdown with visual icons.

#### `syncInputs(changedElement)` → void
Synchronizes number inputs with corresponding range sliders.
- **Parameters**: `changedElement` - The input element that changed

### Utility Functions

#### `randomInRange(min, max)` → Number
Generates random number within specified range.

#### `clamp(value, min, max)` → Number
Clamps value between min and max bounds.

#### `generateColorName(hsl)` → String
Generates color name based on hue value.
- **Parameters**: `hsl` - Color array `[h, s, l]`
- **Returns**: Color name string (e.g., "blue", "red", "teal")

## Event Handling

### Input Events
All number and range inputs trigger real-time updates via the main input event listener:

```javascript
document.addEventListener('input', (e) => {
  // Handles: transform controls, family count, steps, base colors, names
});
```

### Family Selection
Family containers use click handlers to trigger selection:

```javascript
family.addEventListener('click', () => selectFamily(index));
```

### Alignment Functions
Alignment buttons provide one-click family synchronization:
- **L Align**: Match all families to first family's lightness
- **C Align**: Match all families to first family's chroma  
- **H Align**: Distribute families evenly across hue spectrum

## Data Flow

1. **User Input** → Update state object
2. **State Change** → Trigger calculation functions
3. **Calculations** → Generate new swatch arrays
4. **DOM Update** → Refresh visual display
5. **CSS Export** → Update export display

## Browser Compatibility

**Required Features:**
- ES6+ JavaScript (const/let, arrow functions, destructuring)
- CSS Custom Properties
- CSS Flexbox
- DOM APIs (createElement, addEventListener, etc.)

**Optional Features:**
- Clipboard API (with fallback to execCommand)
- CSS calc() for advanced calculations

## Performance Notes

- All calculations run synchronously in main thread
- DOM updates are batched per family
- Memory usage scales linearly with family/swatch count
- Optimized for up to 21 families × 42 swatches each

## Extension Points

**Adding New Easing Curves:**
```javascript
easingFunctions.myCustomCurve = (t) => {
  // Your easing math here
  return easedValue;
};
```

**Adding New Export Formats:**
Extend the switch statement in `generateCSSExport()`:
```javascript
case 'oklch':
  colorValue = convertToOklch(hsl);
  break;
```

**Custom Color Space Conversions:**
Replace the simplified conversion functions with proper color science libraries like Culori for production use.