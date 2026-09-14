import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Stats {
  physique: number;
  intelligence: number;
  spirituality: number;
  sociality: number;
  success: number;
  ego: number;
}

@Component({
  selector: 'app-stats-hexagon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hexagon-wrapper">
      <svg 
        [attr.viewBox]="viewBox" 
        class="hexagon-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Background gradient -->
        <defs>
          <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#1a2f4a;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#0a0e27;stop-opacity:0.1" />
          </radialGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Background circle -->
        <circle [attr.cx]="centerX" [attr.cy]="centerY" [attr.r]="maxRadius" fill="url(#bgGradient)" />

        <!-- Grid hexagons -->
        <g class="grid" opacity="0.3">
          <polygon *ngFor="let hex of gridHexagons" [attr.points]="hex" fill="none" stroke="#00d4ff" stroke-width="1" />
        </g>

        <!-- Axis lines -->
        <g class="axes" opacity="0.5">
          <line 
            *ngFor="let line of axisLines"
            [attr.x1]="line.x1"
            [attr.y1]="line.y1"
            [attr.x2]="line.x2"
            [attr.y2]="line.y2"
            stroke="#00d4ff"
            stroke-width="0.5"
          />
        </g>

        <!-- Value polygon (filled hexagon based on stats) -->
        <polygon 
          [attr.points]="valuePolygon"
          fill="rgba(0, 212, 255, 0.2)"
          stroke="#00ffff"
          stroke-width="2"
          filter="url(#glow)"
        />

        <!-- Labels and values at each axis -->
        <g class="labels" font-family="'Rajdhani', sans-serif" font-size="14" fill="#00d4ff" text-anchor="middle">
          <text *ngFor="let label of labels; let i = index"
            [attr.x]="label.x"
            [attr.y]="label.y"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            <tspan font-weight="bold">{{ label.name }}</tspan>
            <tspan [attr.x]="label.x" dy="16" font-size="12">{{ label.value }}</tspan>
          </text>
        </g>
      </svg>
    </div>
  `,
  styles: [`
    .hexagon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-height: 400px;
    }

    .hexagon-svg {
      width: 100%;
      height: 100%;
      max-width: 500px;
      max-height: 500px;
    }
  `]
})
export class StatsHexagonComponent implements OnInit {
  @Input() stats: Stats = {
    physique: 0,
    intelligence: 0,
    spirituality: 0,
    sociality: 0,
    success: 0,
    ego: 0
  };

  centerX = 250;
  centerY = 250;
  maxRadius = 150;
  viewBox = '0 0 500 500';

  gridHexagons: string[] = [];
  axisLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  labels: Array<{ name: string; value: number; x: number; y: number }> = [];
  valuePolygon = '';

  private statLabels = [
    { name: 'Physique', key: 'physique' },
    { name: 'Intelligence', key: 'intelligence' },
    { name: 'Spirituality', key: 'spirituality' },
    { name: 'Sociality', key: 'sociality' },
    { name: 'Success', key: 'success' },
    { name: 'Ego', key: 'ego' }
  ];

  ngOnInit() {
    this.generateHexagon();
  }

  ngOnChanges() {
    this.generateHexagon();
  }

  private generateHexagon() {
    this.generateGridHexagons();
    this.generateAxes();
    this.generateLabels();
    this.generateValuePolygon();
  }

  private generateGridHexagons() {
    this.gridHexagons = [];
    const gridLevels = 5;
    for (let level = 1; level <= gridLevels; level++) {
      const r = (this.maxRadius / gridLevels) * level;
      const points = this.getHexagonPoints(this.centerX, this.centerY, r);
      this.gridHexagons.push(points.join(' '));
    }
  }

  private generateAxes() {
    this.axisLines = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = this.centerX + this.maxRadius * Math.cos(angle);
      const y = this.centerY + this.maxRadius * Math.sin(angle);
      this.axisLines.push({
        x1: this.centerX,
        y1: this.centerY,
        x2: x,
        y2: y
      });
    }
  }

  private generateLabels() {
    this.labels = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const labelDistance = this.maxRadius + 35;
      const x = this.centerX + labelDistance * Math.cos(angle);
      const y = this.centerY + labelDistance * Math.sin(angle);
      const statKey = this.statLabels[i].key as keyof Stats;
      const value = this.stats[statKey];
      
      this.labels.push({
        name: this.statLabels[i].name,
        value: value,
        x: x,
        y: y
      });
    }
  }

  private generateValuePolygon() {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const statKey = this.statLabels[i].key as keyof Stats;
      const value = this.stats[statKey];
      const r = (value / 100) * this.maxRadius;
      const x = this.centerX + r * Math.cos(angle);
      const y = this.centerY + r * Math.sin(angle);
      points.push([x, y]);
    }
    this.valuePolygon = points.map(p => p.join(',')).join(' ');
  }

  private getHexagonPoints(cx: number, cy: number, r: number): Array<[number, number]> {
    const points: Array<[number, number]> = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push([x, y]);
    }
    return points;
  }
}
