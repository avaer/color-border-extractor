'use client'

import { useState, useRef, useEffect } from "react";

interface PositionalColors {
  p0: string;
  p25: string;
  p50: string;
  p75: string;
}

interface BorderColors {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

interface PositionalBorderColors {
  top: PositionalColors;
  right: PositionalColors;
  bottom: PositionalColors;
  left: PositionalColors;
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [borderColors, setBorderColors] = useState<BorderColors | null>(null);
  const [positionalColors, setPositionalColors] = useState<PositionalBorderColors | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };
  
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;
    
    // Set processing state to true
    setIsProcessing(true);
    // Reset previous color data when loading a new image
    setBorderColors(null);
    setPositionalColors(null);
    
    const image = new Image();
    
    // Handle successful image load
    image.onload = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          setIsProcessing(false);
          return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessing(false);
          return;
        }
        
        // Set canvas size to match image
        canvas.width = image.width;
        canvas.height = image.height;
        
        // Draw image on canvas
        ctx.drawImage(image, 0, 0);
        
        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Extract border colors
        const mostCommonBorderColors = extractMostCommonBorderColors(data, canvas.width, canvas.height);
        setBorderColors(mostCommonBorderColors);
        
        // Extract positional border colors
        const positionalBorderColors = extractPositionalBorderColors(data, canvas.width, canvas.height);
        setPositionalColors(positionalBorderColors);
      } catch (error) {
        console.error("Error processing image:", error);
      } finally {
        // Set processing state to false when done
        setIsProcessing(false);
      }
    };
    
    // Handle image loading error
    image.onerror = (e) => {
      console.error("Error loading image:", e);
      setIsProcessing(false);
    };
    
    // Clean up previous object URL when component unmounts or when imageUrl changes
    const currentImageUrl = imageUrl;
    image.src = currentImageUrl;
    
    return () => {
      // Clean up object URL when component unmounts or imageUrl changes
      if (currentImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentImageUrl);
      }
    };
  }, [imageUrl]);
  
  // Helper function to convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };
  
  // Function to extract the most common color from image borders
  const extractMostCommonBorderColors = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number
  ): BorderColors => {
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
  
  // Function to get colors at specific positions (0%, 25%, 50%, 75%) on each border
  const extractPositionalBorderColors = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number
  ): PositionalBorderColors => {
    // Get color at specific position
    const getColorAt = (x: number, y: number) => {
      const idx = (y * width + x) * 4;
      return rgbToHex(data[idx], data[idx + 1], data[idx + 2]);
    };
    
    return {
      top: {
        p0: getColorAt(0, 0), // Top-left corner
        p25: getColorAt(Math.floor(width * 0.25), 0),
        p50: getColorAt(Math.floor(width * 0.5), 0),
        p75: getColorAt(Math.floor(width * 0.75), 0)
      },
      right: {
        p0: getColorAt(width - 1, 0), // Top-right corner
        p25: getColorAt(width - 1, Math.floor(height * 0.25)),
        p50: getColorAt(width - 1, Math.floor(height * 0.5)),
        p75: getColorAt(width - 1, Math.floor(height * 0.75))
      },
      bottom: {
        p0: getColorAt(0, height - 1), // Bottom-left corner
        p25: getColorAt(Math.floor(width * 0.25), height - 1),
        p50: getColorAt(Math.floor(width * 0.5), height - 1),
        p75: getColorAt(Math.floor(width * 0.75), height - 1)
      },
      left: {
        p0: getColorAt(0, 0), // Top-left corner
        p25: getColorAt(0, Math.floor(height * 0.25)),
        p50: getColorAt(0, Math.floor(height * 0.5)),
        p75: getColorAt(0, Math.floor(height * 0.75))
      }
    };
  };
  
  // Component to display a color swatch with its hex value
  const ColorSwatch = ({ color }: { color: string }) => (
    <div className="flex flex-col items-center mb-2">
      <div 
        className="w-6 h-6 border border-gray-300"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs mt-1">{color}</span>
    </div>
  );
  
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
          {/* Image container - always show when imageUrl is available */}
          <div className="relative mb-8">
            <img 
              src={imageUrl}
              alt="Uploaded image"
              className="max-w-full max-h-[400px] border border-gray-300"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                <div className="text-center p-4 rounded">
                  <div className="mb-2">Processing image...</div>
                  <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin mx-auto"></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Color information - only show when positionalColors is available */}
          {positionalColors && (
            <>
              <div className="flex flex-col items-center w-full mb-10">
                {/* Top color positions */}
                <div className="flex justify-evenly w-full max-w-2xl mb-4">
                  <ColorSwatch color={positionalColors.top.p0} />
                  <ColorSwatch color={positionalColors.top.p25} />
                  <ColorSwatch color={positionalColors.top.p50} />
                  <ColorSwatch color={positionalColors.top.p75} />
                </div>
                
                <div className="flex justify-center w-full">
                  {/* Left color positions */}
                  <div className="flex flex-col justify-evenly mr-4">
                    <ColorSwatch color={positionalColors.left.p0} />
                    <ColorSwatch color={positionalColors.left.p25} />
                    <ColorSwatch color={positionalColors.left.p50} />
                    <ColorSwatch color={positionalColors.left.p75} />
                  </div>
                  
                  {/* Placeholder for image spacing */}
                  <div className="w-[400px]"></div>
                  
                  {/* Right color positions */}
                  <div className="flex flex-col justify-evenly ml-4">
                    <ColorSwatch color={positionalColors.right.p0} />
                    <ColorSwatch color={positionalColors.right.p25} />
                    <ColorSwatch color={positionalColors.right.p50} />
                    <ColorSwatch color={positionalColors.right.p75} />
                  </div>
                </div>
                
                {/* Bottom color positions */}
                <div className="flex justify-evenly w-full max-w-2xl mt-4">
                  <ColorSwatch color={positionalColors.bottom.p0} />
                  <ColorSwatch color={positionalColors.bottom.p25} />
                  <ColorSwatch color={positionalColors.bottom.p50} />
                  <ColorSwatch color={positionalColors.bottom.p75} />
                </div>
              </div>
              
              {/* Most common border colors */}
              {borderColors && (
                <div className="w-full max-w-2xl mt-4">
                  <h2 className="text-xl font-bold mb-4">Most Common Border Colors</h2>
                  
                  <div className="grid grid-cols-4 gap-4">
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
            </>
          )}
        </div>
      )}
    </div>
  );
}