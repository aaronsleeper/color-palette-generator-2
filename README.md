# Color Palette Generator

A sophisticated color palette generator that creates tonal variations within hue families using mathematical easing curves. Built with pure JavaScript and CSS, focusing on the LCH color space for perceptually uniform color interpolation.

## ✨ Features

- **Mathematical Color Interpolation**: Uses easing curves to generate smooth color transitions
- **LCH Color Space**: Ensures perceptually uniform color variations
- **Multiple Easing Curves**: Linear, quadratic, cubic, sinusoidal, exponential, and smooth step
- **Visual Curve Selection**: SVG icons show the shape of each easing curve
- **Real-time Updates**: All changes apply immediately without refresh
- **Multiple Export Formats**: LCH, HSL, Hex, RGB, and SVG
- **Responsive Design**: Three-column layout that works across devices
- **No Dependencies**: Pure JavaScript implementation, no external libraries

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/color-palette-generator.git
   cd color-palette-generator
   ```

2. **Open in browser**
   ```bash
   # Simple local server (Python)
   python -m http.server 8000
   # Or use Live Server in VS Code
   ```

3. **Start creating palettes!**
   - Adjust transform values to control color variations
   - Select different easing curves to change distribution
   - Export as CSS custom properties or SVG files

## 🎨 How It Works

### Core Concepts

**Hue Families**: Groups of related colors that share a base color and generate variations toward "min" and "max" target colors.

**Key Swatches**: Each family has three anchor points:
- **Base**: The central color of the family
- **Min**: Target color in one direction (typically darker/less saturated)
- **Max**: Target color in the other direction (typically lighter/more saturated)

**Tonal Variations**: Intermediate colors calculated using easing curves between base and min/max targets.

### Color Math

1. **Transform Application**: Min/Max targets are calculated by applying delta transformations to the base color's LCH channels
2. **Clamping**: Target values are clamped to valid LCH ranges (L: 0-100, C: 0-150, H: 0-360)
3. **Easing**: Tonal variations are distributed using mathematical easing functions
4. **Interpolation**: Colors are interpolated using shortest-path hue calculations

## 🛠️ Architecture

### File Structure
```
color-palette-generator/
├── index.html          # Main application file
├── README.md           # This documentation
├── package.json        # Project metadata
├── .gitignore         # Git ignore rules
└── docs/              # Additional documentation
    └── API.md         # Detailed API documentation
```

### Key Components

**State Management**: Single global state object tracks all families, transforms, and UI settings

**Color Engine**: Pure JavaScript implementation of:
- LCH ↔ HSL color space conversions
- Mathematical easing functions
- Color interpolation with hue wrapping

**UI Components**:
- Custom dropdown with SVG curve icons
- Synchronized number inputs and sliders
- Real-time color family display
- Export functionality

## 🎛️ Controls Reference

### Left Column: Global Controls

**Transform Min/Max**: Delta values applied to base colors to calculate target colors
- **L (Lightness)**: -100 to +100
- **C (Chroma)**: -150 to +150  
- **H (Hue)**: -360 to +360

**Steps**: Number of tonal variations to generate
- **Toward Min**: 0-21 steps from base toward min target
- **Toward Max**: 0-21 steps from base toward max target

**Curve Selection**: Mathematical easing function for color distribution
- **Linear**: Even spacing
- **Ease In**: Slow start, fast end
- **Ease Out**: Fast start, slow end
- **Ease In Out**: Slow start and end, fast middle
- **Exponential**: Sharp exponential curve
- **Cubic**: Smooth cubic curve
- **Smooth Step**: Smooth step function

**Alignment**: Synchronize families across specific channels
- **L**: Align all families to same lightness as first family
- **C**: Align all families to same chroma as first family  
- **H**: Distribute families evenly across hue spectrum

### Right Column: Family Controls

**Base Color**: LCH values for the selected family's base color
**Family Name**: Auto-generated or custom name (opacity indicates source)

## 📤 Export Options

### CSS Export
Generates CSS custom properties for all swatches:
```css
:root {
  --blue-1: lch(25% 83 247);
  --blue-2: lch(35% 79 245);
  --blue-3: lch(45% 75 243);
  /* ... */
}
```

**Format Options**: LCH, HSL, Hex, RGB

### SVG Export
Creates scalable vector graphics showing all families and swatches with labels.

## 🎯 Use Cases

- **Design Systems**: Generate consistent color scales for UI components
- **Data Visualization**: Create perceptually uniform color sequences
- **Brand Palettes**: Develop systematic color relationships
- **Accessibility**: Ensure consistent contrast relationships
- **Print Design**: Generate color variations for different media

## 🧮 Color Science

### LCH Color Space
- **L (Lightness)**: Perceptual lightness (0-100)
- **C (Chroma)**: Colorfulness/saturation (0-150+)
- **H (Hue)**: Color angle (0-360°)

### Easing Functions
Mathematical functions that control the distribution of intermediate values:

```javascript
// Available easing functions
const easingFunctions = {
    linearPosition: (t) => t,
    quadraticPosition: (t) => t * t,
    cubicPosition: (t) => t * t * t,
    sinusoidalPosition: (t) => 0.5 - 0.5 * Math.cos(t * Math.PI),
    exponentialPosition: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    smoothStepPosition: (t) => t * t * (3 - 2 * t)
};
```

## 🔧 Development

### Browser Support
- Modern browsers with CSS custom properties support
- ES6+ JavaScript features required
- No polyfills included (graceful degradation)

### Performance Considerations
- All calculations run in real-time
- Optimized for up to 21 families with 21 variations each
- Memory efficient state management

### Extensibility
The codebase is designed for easy extension:
- Add new easing functions to `easingFunctions` object
- Extend color space conversions in conversion functions
- Add new export formats in `generateCSSExport()`

## 📝 License

MIT License - feel free to use in personal and commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📚 Further Reading

- [LCH Color Space Explained](https://lea.verou.me/2020/04/lch-colors-in-css-what-why-and-how/)
- [Easing Functions Reference](https://easings.net/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Color Theory for Designers](https://www.interaction-design.org/literature/topics/color-theory)

---

**Made with ❤️ for designers and developers who care about color.**