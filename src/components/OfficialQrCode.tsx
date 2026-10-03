import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface OfficialQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export const OfficialQrCode: React.FC<OfficialQrCodeProps> = ({
  value,
  size = 56,
  className = 'w-full h-full',
  darkColor = '#1b4f8c',
  lightColor = '#ffffff00',
}) => {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toString(
      value,
      {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
        color: {
          dark: darkColor,
          light: lightColor,
        },
      },
      (err, svg) => {
        if (!err && isMounted && svg) {
          setSvgContent(svg);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [value, darkColor, lightColor]);

  if (!svgContent) {
    // Fallback mientras se genera el código QR
    return (
      <div 
        className={`${className} flex items-center justify-center bg-blue-50/50 rounded`}
        style={{ width: size, height: size }}
      >
        <span className="text-[8px] font-mono text-[#1b4f8c] font-bold">QR</span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};
