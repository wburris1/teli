const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';
const themeColor = '#800020';
// Theme color options:
// Light blue: 
// Purple: #9D00FF
// Burgundy: #800020
// Lime green:

export default {
  theme: themeColor,
  loading: themeColor,
  light: {
    text: '#000',
    background: '#fff',
    gray: '#d3d3d3',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    gray: '#636363',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
