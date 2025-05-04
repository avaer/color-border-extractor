'use client'

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [borderColors, setBorderColors] = useState<{
    top: string;
    right: string;
    bottom: string;
    left: string;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };
  
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;
    
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size to match image
      canvas.width = image.width;
      canvas.height = image.height;
      
      // Draw image on canvas
      ctx.drawImage(image, 0, 0);
      
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Extract border colors
      const borderColors = extractBorderColors(data, canvas.width, canvas.height);
      setBorderColors(borderColors);
    };
    
    image.src = imageUrl;
  }, [imageUrl]);
  
  // Function to extract the most common color from image borders
  const extractBorderColors = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number
  ) => {
    // Helper function to convert RGB to hex
    const rgbToHex = (r: number, g: number, b: number) => {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    };
    
    // Function to find most common color in an array of pixels
    const findMostCommonColor = (pixels: string[]) => {
      const colorCount: Record<string, number> = {};
      let maxCount = 0;
      let mostCommonColor = '#000000';
      
      pixels.forEach(color => {
        colorCount[color] = (colorCount[color] || 0) + 1;
        if (colorCount[color] > maxCount) {
          maxCount = colorCount[color];
          mostCommonColor = color;
        }
      });
      
      return mostCommonColor;
    };
    
    // Arrays to store border pixels
    const topBorder: string[] = [];
    const rightBorder: string[] = [];
    const bottomBorder: string[] = [];
    const leftBorder: string[] = [];
    
    // Extract pixel colors from each border
    for (let x = 0; x < width; x++) {
      // Top border
      const topIdx = (0 * width + x) * 4;
      topBorder.push(rgbToHex(data[topIdx], data[topIdx + 1], data[topIdx + 2]));
      
      // Bottom border
      const bottomIdx = ((height - 1) * width + x) * 4;
      bottomBorder.push(rgbToHex(data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]));
    }
    
    for (let y = 0; y < height; y++) {
      // Left border
      const leftIdx = (y * width + 0) * 4;
      leftBorder.push(rgbToHex(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]));
      
      // Right border
      const rightIdx = (y * width + (width - 1)) * 4;
      rightBorder.push(rgbToHex(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]));
    }
    
    // Find most common color in each border
    return {
      top: findMostCommonColor(topBorder),
      right: findMostCommonColor(rightBorder),
      bottom: findMostCommonColor(bottomBorder),
      left: findMostCommonColor(leftBorder)
    };
  };
  
  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8">Image Border Color Extractor</h1>
      
      <div className="mb-8">
        <label htmlFor="image-upload" className="block text-center mb-2">
          Upload an image:
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block border border-gray-300 rounded p-2"
        />
      </div>
      
      {imageUrl && (
        <div className="flex flex-col items-center">
          <div className="relative mb-8">
            <img 
              src={imageUrl}
              alt="Uploaded image"
              className="max-w-full max-h-[500px] border border-gray-300"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          {borderColors && (
            <div className="w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Border Colors</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-300 rounded p-4">
                  <h3 className="font-bold mb-2">Top</h3>
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 mr-2 border border-gray-300"
                      style={{ backgroundColor: borderColors.top }}
                    />
                    <span>{borderColors.top}</span>
                  </div>
                </div>
                
                <div className="border border-gray-300 rounded p-4">
                  <h3 className="font-bold mb-2">Right</h3>
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 mr-2 border border-gray-300"
                      style={{ backgroundColor: borderColors.right }}
                    />
                    <span>{borderColors.right}</span>
                  </div>
                </div>
                
                <div className="border border-gray-300 rounded p-4">
                  <h3 className="font-bold mb-2">Bottom</h3>
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 mr-2 border border-gray-300"
                      style={{ backgroundColor: borderColors.bottom }}
                    />
                    <span>{borderColors.bottom}</span>
                  </div>
                </div>
                
                <div className="border border-gray-300 rounded p-4">
                  <h3 className="font-bold mb-2">Left</h3>
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 mr-2 border border-gray-300"
                      style={{ backgroundColor: borderColors.left }}
                    />
                    <span>{borderColors.left}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}