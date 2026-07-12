import React from 'react';
import { Box, Typography } from '@mui/material';

interface BarcodeGeneratorProps {
  value: string;
  width?: number;
  height?: number;
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ 
  value, 
  width = 2, 
  height = 50 
}) => {
  // Simple deterministic pattern generator for Code 128-like simulated lines
  // Generates different bar widths based on character charCodes
  const generateBarcodePattern = (str: string): number[] => {
    const cleanStr = str.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    const bars: number[] = [1, 0, 1]; // Start code pattern
    
    for (let i = 0; i < cleanStr.length; i++) {
      const code = cleanStr.charCodeAt(i);
      // Derive binary bar pattern (1 is bar, 0 is space) from char code
      const patternNum = (code * 12345) % 127;
      const binStr = patternNum.toString(2).padStart(7, '0');
      
      for (let j = 0; j < binStr.length; j++) {
        bars.push(binStr[j] === '1' ? 1 : 0);
      }
      bars.push(0); // Gap spacer
    }
    
    bars.push(1, 1, 0, 0, 1, 1, 1, 0, 1); // Stop code pattern
    return bars;
  };

  const pattern = generateBarcodePattern(value);
  const barWidth = width;
  const svgWidth = pattern.length * barWidth;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e2e8f0', width: 'fit-content' }}>
      <svg width={svgWidth} height={height} style={{ display: 'block' }}>
        <g fill="#000000">
          {pattern.map((isBar, idx) => {
            if (isBar === 1) {
              return (
                <rect 
                  key={idx} 
                  x={idx * barWidth} 
                  y={0} 
                  width={barWidth} 
                  height={height} 
                />
              );
            }
            return null;
          })}
        </g>
      </svg>
      <Typography 
        variant="caption" 
        sx={{ 
          fontFamily: 'monospace', 
          color: '#000', 
          fontSize: '0.65rem', 
          mt: 0.5, 
          letterSpacing: 2,
          fontWeight: 'bold'
        }}
      >
        {value.toUpperCase()}
      </Typography>
    </Box>
  );
};
