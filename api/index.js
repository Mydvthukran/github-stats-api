// Updated to fix XML entity encoding in SVG output
function generateSVG(data) {
    // Escape ampersands and special characters
    const sanitizedData = data.replace(/&/g, '&amp;')
                               .replace(/</g, '&lt;')
                               .replace(/>/g, '&gt;')
                               .replace(/'/g, '&apos;')
                               .replace(/"/g, '&quot;');
    
    // SVG generation logic
    const svgOutput = `<svg>${sanitizedData}</svg>`;
    return svgOutput;
}

module.exports = generateSVG;