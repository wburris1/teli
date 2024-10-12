const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';
const themeColor = '#0D47A1';  
// Theme color options:
// Deep Blue: 0D47A1
// Amber: FFB300
// Light blue: 0DE0F1
// Marroon : #800020
// Purple: #9D00FF
// Deep Purple: 4A148C
// Pink: D81B60
// red: F70951
// Lime green: 09F79C
// better lime green: 00FFAA
// gold: FFCC00
const backgroundColor= '#000';

export default {
  theme: themeColor,
  loading: themeColor,
  toastNotiColor: themeColor,
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
