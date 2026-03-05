
export interface Hole {
  id: string;
  type: 'circle' | 'rect';
  radius?: number; 
  width?: number;  
  height?: number; 
  distFromTop: number;  
  distFromLeft: number; 
}

export interface MatSpecs {
  A: number; // 总宽
  B: number; // 总高
  C: number; // 圆心理论交点至顶
  D: number; // 圆心理论交点至侧
  E: number; // 净臂长 (横向直边)
  F: number; // 净臂长 (纵向直边)
  G: number; // GH模式：从顶部边 (y=0) 到弧中点的垂直距离
  H: number; // GH模式：从侧边 (x=0) 到弧中点的水平距离
  Z: number; // ZS模式：弦长 (Chord)
  S: number; // ZS模式：矢高 (Sagitta)
  R: number; // 半径
  
  shapeType: 'l-shape' | 'rectangle';
  arcMode: 'radius' | 'gh' | 'zs'; 
  
  r1: number; r2: number; r3: number; r4: number; r5: number;
  outerRadius: number;
  holes: Hole[];
  orientation: 'left' | 'right';
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  specs: MatSpecs;
}

export interface Point {
  x: number;
  y: number;
}
