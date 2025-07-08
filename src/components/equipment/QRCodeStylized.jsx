import React from 'react';
import QRCode from 'qrcode.react';

const QRCodeStylized = ({ value, size = 128, fgColor = "#1a202c", bgColor = "#ffffff", level = "M", includeMargin = true, imageSettings, ...props }) => {
  
  const defaultImageSettings = {
    src: null, 
    height: size * 0.2,
    width: size * 0.2,
    excavate: true,
    x: undefined, 
    y: undefined, 
  };

  const finalImageSettings = imageSettings ? { ...defaultImageSettings, ...imageSettings } : undefined;

  return (
    <div className="p-2 bg-white rounded-lg shadow-md inline-block" {...props}>
      <QRCode
        value={value}
        size={size}
        fgColor={fgColor} 
        bgColor={bgColor}
        level={level} 
        renderAs="canvas" 
        includeMargin={includeMargin}
        imageSettings={finalImageSettings}
      />
    </div>
  );
};

export default QRCodeStylized;