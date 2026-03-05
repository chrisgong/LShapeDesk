
import React, { forwardRef } from 'react';
import { MatSpecs, Hole } from '../types';

interface BlueprintCanvasProps {
  specs: MatSpecs;
  showDimensions: boolean;
  theme: 'blueprint' | 'modern' | 'minimal';
}

const BlueprintCanvas = forwardRef<SVGSVGElement, BlueprintCanvasProps>(({ specs, showDimensions, theme }, ref) => {
  const { A, B, C, D, E, F, G, H, Z, S, R, orientation, r1, r2, r3, r4, r5, holes, arcMode } = specs;

  const themeConfig = {
    blueprint: { 
      bg: '#0f172a', 
      grid: '#1e293b', 
      stroke: '#38bdf8', 
      hole: '#facc15', 
      holeCoord: '#64748b', 
      dim: '#94a3b8', 
      text: '#ffffff', 
      sitting: '#10b981', 
      blue: '#60a5fa', 
      highlight: '#f59e0b', 
      holeFill: 'rgba(250, 204, 21, 0.2)' 
    },
    modern: { 
      bg: '#f8fafc', 
      grid: '#e2e8f0', 
      stroke: '#334155', 
      hole: '#ef4444', 
      holeCoord: '#94a3b8', 
      dim: '#ef4444', 
      text: '#1e293b', 
      sitting: '#10b981', 
      blue: '#3b82f6', 
      highlight: '#f59e0b', 
      holeFill: 'rgba(239, 68, 68, 0.15)' 
    },
    minimal: { 
      bg: '#ffffff', 
      grid: 'transparent', 
      stroke: '#000000', 
      hole: '#000000', 
      holeCoord: '#9ca3af',
      dim: '#6b7280', 
      text: '#000000', 
      sitting: '#000000', 
      blue: '#000000', 
      highlight: '#000000', 
      holeFill: 'transparent' 
    }
  }[theme];

  const isLeft = orientation === 'left';
  const centerX = isLeft ? -D : D;
  const centerY = C;

  const k = 1 - Math.SQRT1_2;
  const arcMidX = isLeft ? -(D + R * k) : (D + R * k);
  const arcMidY = C + R * k;

  const generatePath = () => {
    const safeR = (val: number, limit1: number, limit2: number) => Math.min(val, limit1, limit2);
    
    if (specs.shapeType === 'rectangle') {
      const sr1 = safeR(r1, A/2, B/2);
      const sr2 = safeR(r2, A/2, B/2);
      const sr3 = safeR(r3, A/2, B/2);
      const sr4 = safeR(r4, A/2, B/2);
      
      const left = isLeft ? -A : 0;
      const right = isLeft ? 0 : A;
      
      let p = `M ${left + sr1} 0 `;
      p += `L ${right - sr2} 0 A ${sr2} ${sr2} 0 0 1 ${right} ${sr2} `;
      p += `L ${right} ${B - sr3} A ${sr3} ${sr3} 0 0 1 ${right - sr3} ${B} `;
      p += `L ${left + sr4} ${B} A ${sr4} ${sr4} 0 0 1 ${left} ${B - sr4} `;
      p += `L ${left} ${sr1} A ${sr1} ${sr1} 0 0 1 ${left + sr1} 0 Z`;
      return p;
    }

    if (isLeft) {
      const sr1 = safeR(r1, A/2, C/2); const sr2 = safeR(r2, A/2, B/2);
      const sr3 = safeR(r3, B/2, D/2); const sr4 = safeR(r4, D/2, (B-C)/2);
      const sr5 = safeR(r5, (A-D)/2, C/2);
      let p = `M ${-A + sr1} 0 L ${-sr2} 0 A ${sr2} ${sr2} 0 0 1 0 ${sr2} `;
      p += `L 0 ${B - sr3} A ${sr3} ${sr3} 0 0 1 ${-sr3} ${B} L ${centerX + sr4} ${B} `;
      p += `A ${sr4} ${sr4} 0 0 1 ${centerX} ${B - sr4} L ${centerX} ${centerY + R} `;
      p += `A ${R} ${R} 0 0 0 ${centerX - R} ${centerY} L ${-A + sr5} ${centerY} `;
      p += `A ${sr5} ${sr5} 0 0 1 ${-A} ${centerY - sr5} L ${-A} ${sr1} A ${sr1} ${sr1} 0 0 1 ${-A + sr1} 0 Z`;
      return p;
    } else {
      const sr1 = safeR(r1, A/2, B/2); const sr2 = safeR(r2, A/2, C/2);
      const sr3 = safeR(r3, D/2, (B-C)/2); const sr4 = safeR(r4, D/2, B/2);
      const sr5 = safeR(r5, (A-D)/2, C/2);
      let p = `M ${sr1} 0 L ${A - sr2} 0 A ${sr2} ${sr2} 0 0 1 ${A} ${sr2} `;
      p += `L ${A} ${centerY - sr5} A ${sr5} ${sr5} 0 0 1 ${A - sr5} ${centerY} L ${centerX + R} ${centerY} `;
      p += `A ${R} ${R} 0 0 0 ${centerX} ${centerY + R} L ${centerX} ${B - sr3} `;
      p += `A ${sr3} ${sr3} 0 0 1 ${centerX - sr3} ${B} L ${sr4} ${B} A ${sr4} ${sr4} 0 0 1 0 ${B - sr4} L 0 ${sr1} A ${sr1} ${sr1} 0 0 1 ${sr1} 0 Z`;
      return p;
    }
  };

  const DimensionLine = ({ x1, y1, x2, y2, label, color, highlight = false, dashed = false, large = false, compact = false, thin = false, mini = false }: any) => {
    if (!showDimensions) return null;
    const midX = (x1 + x2) / 2; const midY = (y1 + y2) / 2;
    const strokeColor = color || themeConfig.dim;
    const fontSize = large ? 36 : mini ? 14 : thin ? 16 : compact ? 18 : 22;
    const boxW = (label.length * (fontSize * 0.65)) + (compact ? 12 : 24); 
    const boxH = large ? 54 : mini ? 24 : thin ? 28 : compact ? 34 : 40;
    const sWidth = highlight || large ? 3.5 : (thin || mini) ? 1.5 : 2.5;

    return (
      <g style={{ userSelect: 'none' }}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={sWidth} strokeDasharray={dashed ? "10,5" : "none"} />
        <rect x={midX - boxW/2} y={midY - boxH/2} width={boxW} height={boxH} fill={themeConfig.bg} rx="4" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
        <text x={midX} y={midY + fontSize/3.2} fill={strokeColor} fontSize={fontSize} textAnchor="middle" fontWeight={thin ? "600" : "900"} style={{ fontFamily: 'monospace' }}>{label}</text>
      </g>
    );
  };

  const renderHoles = () => {
    const xCoordCount: Record<number, number> = {};
    const yCoordCount: Record<number, number> = {};
    const OFFSET_STEP = 30; // 增加间距以提高辨识度

    return holes.map((hole) => {
      const leftBoundary = isLeft ? -A : 0;
      const xStart = leftBoundary + hole.distFromLeft;
      const yStart = hole.distFromTop;
      
      const xUsage = xCoordCount[hole.distFromLeft] || 0;
      const yUsage = yCoordCount[hole.distFromTop] || 0;
      xCoordCount[hole.distFromLeft] = xUsage + 1;
      yCoordCount[hole.distFromTop] = yUsage + 1;

      // 初始偏移位置
      let yWithOffset = yStart + (yUsage * OFFSET_STEP);
      let xWithOffset = xStart + (xUsage * OFFSET_STEP);

      // --- 智能避让逻辑 ---
      // 1. 避让内拐角横向蓝色主线 (y = C)
      // 如果 X 标注线 (水平线) 的 Y 坐标靠近 C，则向下挪动
      const SAFE_MARGIN = 45; 
      if (Math.abs(yWithOffset - C) < SAFE_MARGIN) {
        yWithOffset += (SAFE_MARGIN * 1.5);
      }
      // 2. 避让内拐角纵向蓝色主线 (x = centerX)
      // 如果 Y 标注线 (垂直线) 的 X 坐标靠近 centerX，则向外侧挪动
      if (Math.abs(xWithOffset - centerX) < SAFE_MARGIN) {
        xWithOffset += (isLeft ? -SAFE_MARGIN * 1.5 : SAFE_MARGIN * 1.5);
      }

      const hWidth = hole.type === 'circle' ? (hole.radius || 0) * 2 : (hole.width || 0);
      const hHeight = hole.type === 'circle' ? (hole.radius || 0) * 2 : (hole.height || 0);
      const labelText = hole.type === 'circle' ? `R${hole.radius}` : `${hole.width}*${hole.height}`;

      return (
        <g key={hole.id}>
          {/* Hole Geometry - 细线风格 */}
          {hole.type === 'circle' ? (
            <circle cx={xStart + (hole.radius || 0)} cy={yStart + (hole.radius || 0)} r={hole.radius || 0} fill="url(#diagonal-hatch)" stroke={themeConfig.hole} strokeWidth="1" strokeDasharray="8,4" />
          ) : (
            <rect x={xStart} y={yStart} width={hole.width || 0} height={hole.height || 0} fill="url(#diagonal-hatch)" stroke={themeConfig.hole} strokeWidth="1" strokeDasharray="8,4" />
          )}

          {showDimensions && (
            <g>
              {/* X 坐标标注 - 带避让检测 */}
              {hole.distFromLeft > 0 && (
                <DimensionLine x1={leftBoundary} y1={yWithOffset} x2={xStart} y2={yWithOffset} label={`X:${hole.distFromLeft}`} color={themeConfig.holeCoord} thin dashed compact />
              )}
              {/* Y 坐标标注 - 带避让检测 */}
              {hole.distFromTop > 0 && (
                <DimensionLine x1={xWithOffset} y1={0} x2={xWithOffset} y2={yStart} label={`Y:${hole.distFromTop}`} color={themeConfig.holeCoord} thin dashed compact />
              )}
              
              {/* 尺寸标注 - 细体 */}
              <g transform={`translate(${xStart + hWidth + 10}, ${yStart + hHeight / 2})`}>
                <rect x="0" y="-11" width={labelText.length * 8 + 12} height="22" fill={themeConfig.bg} rx="4" stroke={themeConfig.hole} strokeWidth="1" strokeOpacity="0.6" />
                <text x={6} y="5" fill={themeConfig.hole} fontSize="13" fontWeight="600" style={{ fontFamily: 'monospace' }}>
                  {labelText}
                </text>
              </g>
            </g>
          )}
        </g>
      );
    });
  };

  const renderOuterRadiiLabels = () => {
    if (!showDimensions) return null;
    const labels = [];
    
    const addLabel = (x: number, y: number, r: number, label: string, offsetX: number, offsetY: number) => {
      if (r > 0) {
        labels.push(
          <g key={label} transform={`translate(${x + offsetX}, ${y + offsetY})`}>
            <text fill={themeConfig.dim} fontSize="16" fontWeight="600" style={{ fontFamily: 'monospace' }}>
              {label}: R{r}
            </text>
          </g>
        );
      }
    };

    if (specs.shapeType === 'rectangle') {
      const left = isLeft ? -A : 0;
      const right = isLeft ? 0 : A;
      addLabel(left, 0, r1, 'C1', 10, 20);
      addLabel(right, 0, r2, 'C2', -70, 20);
      addLabel(right, B, r3, 'C3', -70, -10);
      addLabel(left, B, r4, 'C4', 10, -10);
    } else {
      if (isLeft) {
        addLabel(-A, 0, r1, 'C1', 10, 20);
        addLabel(0, 0, r2, 'C2', -70, 20);
        addLabel(0, B, r3, 'C3', -70, -10);
        addLabel(centerX, B, r4, 'C4', 10, -10);
        addLabel(-A, centerY, r5, 'C5', 10, -10);
      } else {
        addLabel(0, 0, r1, 'C1', 10, 20);
        addLabel(A, 0, r2, 'C2', -70, 20);
        addLabel(A, centerY, r5, 'C5', -70, -10);
        addLabel(centerX, B, r3, 'C3', -70, -10);
        addLabel(0, B, r4, 'C4', 10, -10);
      }
    }
    return labels;
  };

  return (
    <div className="flex items-center justify-center p-10 md:p-20">
      <svg ref={ref} width={A + 800} height={B + 800} viewBox={`${isLeft ? -A - 400 : -400} -400 ${A + 800} ${B + 800}`} style={{ backgroundColor: themeConfig.bg, overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-pattern" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke={themeConfig.grid} strokeWidth="1" /></pattern>
          <pattern id="diagonal-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke={themeConfig.hole} strokeWidth="1" strokeOpacity="0.8" strokeDasharray="2,2" />
          </pattern>
        </defs>
        <rect x={isLeft ? -A - 400 : -400} y="-400" width={A + 800} height={B + 800} fill="url(#grid-pattern)" />
        <path d={generatePath()} fill="rgba(56,189,248,0.03)" stroke={themeConfig.stroke} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {renderHoles()}
        {showDimensions && (
          <g>
            {specs.shapeType !== 'rectangle' && (
              <>
                {arcMode === 'zs' ? (
                  <>
                    <DimensionLine x1={centerX} y1={centerY + R} x2={centerX + (isLeft ? -R : R)} y2={centerY} label={`Z: ${Math.round(Z)}`} color={themeConfig.highlight} thin dashed />
                    <DimensionLine x1={centerX + (isLeft ? -R/2 : R/2)} y1={centerY + R/2} x2={arcMidX} y2={arcMidY} label={`S: ${Math.round(S)}`} color={themeConfig.highlight} thin />
                    <DimensionLine x1={isLeft ? -A : A} y1={centerY + 60} x2={isLeft ? centerX - R : centerX + R} y2={centerY + 60} label={`E: ${Math.round(E)}`} color={themeConfig.dim} thin />
                    <DimensionLine x1={centerX - 60} y1={B} x2={centerX - 60} y2={centerY + R} label={`F: ${Math.round(F)}`} color={themeConfig.dim} thin />
                  </>
                ) : (
                  <>
                    <DimensionLine x1={isLeft ? -A : A} y1={centerY + 60} x2={isLeft ? centerX - R : centerX + R} y2={centerY + 60} label={`E: ${Math.round(E)}`} color={themeConfig.highlight} thin />
                    <DimensionLine x1={centerX - 60} y1={B} x2={centerX - 60} y2={centerY + R} label={`F: ${Math.round(F)}`} color={themeConfig.highlight} thin />
                    <DimensionLine x1={arcMidX} y1={arcMidY} x2={0} y2={arcMidY} label={`H: ${Math.round(Math.abs(arcMidX))}`} color={themeConfig.sitting} dashed thin />
                    <DimensionLine x1={arcMidX} y1={arcMidY} x2={arcMidX} y2={0} label={`G: ${Math.round(arcMidY)}`} color={themeConfig.sitting} dashed thin />
                  </>
                )}

                <DimensionLine x1={isLeft ? -A - 120 : A + 120} y1={0} x2={isLeft ? -A - 120 : A + 120} y2={centerY} label={`C: ${Math.round(C)}`} color={themeConfig.blue} dashed />
                <DimensionLine x1={0} y1={B + 120} x2={centerX} y2={B + 120} label={`D: ${Math.round(D)}`} color={themeConfig.blue} dashed />

                <circle cx={centerX} cy={centerY} r="4" fill="#ef4444" opacity="0.8" />
                <g transform={`translate(${centerX}, ${centerY})`}>
                   <text x={isLeft ? 25 : -25} y={-15} fill="#ef4444" fontSize="22" fontWeight="900" textAnchor={isLeft ? 'start' : 'end'} style={{ fontFamily: 'monospace' }}>
                     R{Math.round(R)}
                   </text>
                </g>
                <circle cx={arcMidX} cy={arcMidY} r="6" fill={themeConfig.sitting} />
              </>
            )}

            <DimensionLine x1={0} y1={-180} x2={isLeft ? -A : A} y2={-180} label={`A: ${A}`} color="#ffffff" highlight />
            <DimensionLine x1={isLeft ? 180 : -180} y1={0} x2={isLeft ? 180 : -180} y2={B} label={`B: ${B}`} color="#ffffff" highlight />
            
            {renderOuterRadiiLabels()}
          </g>
        )}
      </svg>
    </div>
  );
});

BlueprintCanvas.displayName = 'BlueprintCanvas';
export default BlueprintCanvas;
