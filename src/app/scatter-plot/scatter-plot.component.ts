import { Component, OnInit, ViewChild, Input, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { BrushBehavior, Selection } from 'd3';

type SelectionType = 'hand' | 'selection';

export interface Margin {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

@Component({
  selector: 'app-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.css']
})
export class ScatterPlotComponent implements OnInit {
  @ViewChild('chart') private chart: ElementRef;
  @ViewChild('minimap') private minimapRef: ElementRef;

  @Input() private data;

  zoomLevel = 1;

  minimapScale = 0.2;

  margin: Margin = { left: 75, bottom: 100, top: 25, right: 25 };
  size = { width: 1000, height: 500 };
  minimapSize = {
    width: this.size.width * this.minimapScale,
     height: this.size.height * this.minimapScale
  };
  minimapMargin: Margin = Object.keys(this.margin).reduce((res, key) => ({...res, [key]: this.margin[key] * this.minimapScale}), {}) as Margin;

  zoom = { min: 1, max: 3 };


  type: SelectionType = 'hand';
  dotsWrapper: any;
  brush: BrushBehavior<any>;
  minimap: any;

  mainAxes: { x: any; y: any };
  minimapAxes: { x: any; y: any };
  mainArea: any;
  mainZoom: any;
  minimapBrush: any;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  constructor() {}

  ngOnInit() {
    const svg = d3.select(this.chart.nativeElement).append('svg');
    this.svg = svg;
    const zoomWrapper = svg.append('g').classed('zoom-wrapper', true);

    svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.size.width + this.margin.left + this.margin.right)
      .attr('height', this.size.height + this.margin.bottom + this.margin.top);

    zoomWrapper
      .attr('class', 'main')
      .attr('clip-path', 'url(#clip)')
      // .attr('transform', `translate(0, 0)`);


    const mainArea = zoomWrapper.append('g');

    this.mainArea = mainArea;

    const fullWidth = this.getFullWidth();

    svg
      .attr('width', fullWidth)
      .attr('height', this.size.height + this.margin.bottom + this.margin.top)
      .call(this.makeZoom());

    mainArea
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);


    const { x, y } = this.initAxes(mainArea, this.size, this.margin);
    this.mainAxes = { x, y };
    this.dotsWrapper = this.updateData(
      mainArea,
      this.margin,
      x,
      y,
      r => r * 25
    );

  const minimapSvg = d3.select(this.minimapRef.nativeElement)
    .append('svg');

    this.createMiniMap(minimapSvg);
  }

  private getFullWidth(): number {
    return this.getMainAreaWidth() +
      this.minimapSize.width + this.minimapMargin.left + this.minimapMargin.right;
  }

  private getMainAreaWidth(): number {
    return this.size.width + this.margin.left + this.margin.right;
  }

  setMode(type: SelectionType) {
    console.log(type);
    if (type === 'selection') {
      const dots = this.dotsWrapper.selectAll('.dot');

      this.brush = this.createBrush(dots);
      this.dotsWrapper.call(this.brush);
    } else if (type === 'hand') {
      console.log(d3.select('.brush'));
      // this.brush.move()
      this.dotsWrapper.remove();
      this.dotsWrapper = this.updateData(
        this.mainArea, this.margin, this.mainAxes.x, this.mainAxes.y, r => r * 25
      )
    }
  }

  private makeZoom(): any {
    const zoom = d3
      .zoom()
      .scaleExtent([this.zoom.min, this.zoom.max])
      .on('zoom', (...args) => {
        console.log(d3.event.transform);

        const { x, y, k } = d3.event.transform;

        const xCoord = x * this.minimapScale;
        const yCoord = y * this.minimapScale;

        const minimapSize = this.getMinimapSize();

        this.mainArea.attr('transform', d3.event.transform);

        this.minimapBrush
          .attr('transform', `translate(${-xCoord / k}, ${-yCoord / k} )`)
          .attr('width', minimapSize.width / k)
          .attr('height', minimapSize.height / k);
      })

      .translateExtent([
        [0, 0],
        [
          this.getMainAreaWidth(),
          this.size.height + this.margin.top + this.margin.bottom
        ]
      ])
      .extent([
        [0,0],
        [
          this.getMainAreaWidth(),
          this.size.height + this.margin.top + this.margin.bottom
        ]
      ])



    this.mainZoom = zoom;

    return zoom;
  }

  public buttonZoom(scale: number) {
    this.mainZoom.scaleBy(this.svg, scale);
  }

  private initAxes(svg: any, size, margin) {
    const x = d3
      .scaleLinear()
      .domain([-100, 100])
      .range([0, size.width]);
    svg
      .append('g')
      .attr(
        'transform',
        'translate(' + margin.left + ',' + (size.height + margin.top) + ')'
      )
      .call(d3.axisBottom(x));
    const y = d3
      .scaleLinear()
      .domain([-100, 100])
      .range([size.height, 0]);
    svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .call(d3.axisLeft(y));

    // add gridlines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .call(
        d3
          .axisLeft(y)
          .ticks(10)
          .tickSize(-size.width)
          .tickFormat('' as any)
      );

    svg
      .append('g')
      .attr('class', 'grid')
      .attr(
        'transform',
        'translate(' + margin.left + ',' + (size.height + margin.top) + ')'
      )
      .call(
        d3
          .axisBottom(x)
          .ticks(10)
          .tickSize(-size.height)
          .tickFormat('' as any)
      );

    return { x, y };
  }

  private updateData(
    svg: any,
    margin: { left: number; bottom?: number; top: number },
    x: any,
    y: any,
    r: any
  ) {
    const g = svg.append('g');

    const dots = g
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .selectAll('.dot')
      .data(this.data);

    dots
      .enter()
      .append('circle')
      .classed('dot', true)
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', d => r(d.size))
      .style('fill', `rgba(255, 0, 0, 0.7)`)
      .classed('selected', false)
      .on('mouseover', d => {
        // console.log(d);
      });

    return g;
  }

  private createBrush(dots: any) {
    const brush = d3.brush();
    brush
      .on('start', () => {
        dots.style('fill', 'rgba(255, 0, 0, 0.7)').classed('selected', false);
      })
      .on('brush', () => {
        if (d3.event.selection === null) {
          return;
        }
        const [[x0, y0], [x1, y1]] = d3.event.selection;

        dots.style('fill', 'rgba(255, 0, 0, 0.7)').classed('selected', false);

        dots
          .filter(function() {
            const cx = d3.select(this).attr('cx');
            const cy = d3.select(this).attr('cy');
            // TODO: check is point inside circle
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
          })
          .style('fill', `rgba(0, 0, 255, 0.7)`)
          .classed('selected', true);
      })
      .on('end', () => {
        console.log('end');
      });

    return brush;
  }

private getMinimapSize() {
  return {
    width: this.minimapSize.width + this.minimapMargin.right + this.minimapMargin.left,
    height: this.minimapSize.height + this.minimapMargin.top + this.minimapMargin.bottom,
  };
}

  private createMiniMap(svg, margin = {left: 0, top: 0}) {
    const minimap = svg
      .append('g')
      .classed('minimap', true)
      .attr('width', this.minimapSize.width)
      .attr('height', this.minimapSize.height)
      .attr(
        'transform',
        // `translate(${this.margin.left + this.size.width + this.minimapMargin.left}, ${this.minimapMargin.top})`
        `translate(${margin.left}, ${margin.top})`
      );

    this.minimap = minimap;

    const { x, y } = this.initAxes(minimap, this.minimapSize, {
      left: this.minimapMargin.left,
      top: this.minimapMargin.top
    });
    this.minimapAxes = { x, y };

    const size = this.getMinimapSize();

    this.minimapBrush = this.minimap.append('rect')
      .style('fill', 'purple')
      .style('opacity', .3)
      .attr('width', size.width)
      .attr('height', size.height);


    this.updateData(
      minimap,
      { left: this.minimapMargin.left, top: this.minimapMargin.top },
      x,
      y,
      r => r * (25 * this.minimapScale) // x25 is original size and minimap is 3 times smaller
    );
  }
}
