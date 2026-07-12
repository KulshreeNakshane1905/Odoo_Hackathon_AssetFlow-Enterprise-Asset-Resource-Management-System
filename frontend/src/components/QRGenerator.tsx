import React, { useEffect, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import QRCode from 'qrcode';

interface QRGeneratorProps {
  value: string;
  size?: number;
  showDownload?: boolean;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ 
  value, 
  size = 120, 
  showDownload = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current, 
        value, 
        {
          width: size,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        }, 
        (error) => {
          if (error) console.error('QR Code render error:', error);
        }
      );
    }
  }, [value, size]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${value}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e2e8f0', width: 'fit-content' }}>
      <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
      {showDownload && (
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={<DownloadIcon />} 
          onClick={handleDownload}
          sx={{ py: 0.5, px: 1, fontSize: '0.7rem', color: 'primary.main', borderColor: 'primary.main' }}
        >
          Download QR
        </Button>
      )}
    </Box>
  );
};
export default QRGenerator;
