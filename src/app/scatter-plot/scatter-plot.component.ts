import { Component, OnInit, ViewChild, Input, ElementRef } from '@angular/core';
import * as d3 from 'd3';

type SelectionType = 'hand' | 'selection';

@Component({
  selector: 'app-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.styl']
})
export class ScatterPlotComponent implements OnInit {
  @ViewChild('chart') private chart: ElementRef;

  @Input() private data;

  zoomLevel = 1;

  margin = { left: 100, bottom: 100, top: 25, right: 25 };
  size = { width: 1000, height: 500 };

  type: SelectionType = 'hand';

  constructor() {}

  ngOnInit() {
    const svg = d3.select(this.chart.nativeElement).append('svg');

    svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.size.width + this.margin.left + this.margin.right)
      .attr('height', this.size.height + this.margin.bottom + this.margin.top);

    const mainArea = svg
      .append('g')
      .attr('class', 'main')
      .attr('clip-path', 'url(#clip)');

    svg
      .attr('width', this.size.width + this.margin.left + this.margin.right)
      .attr('height', this.size.height + this.margin.bottom + this.margin.top)
      .call(this.makeZoom(mainArea));

    mainArea
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    const { x, y } = this.initAxes(mainArea);

    this.updateData(mainArea, this.margin, x, y);
  }

  setMode(type: SelectionType) {
    console.log(type)
  }

  private makeZoom(svg: any): any {
    const zoom = d3
      .zoom()
      .scaleExtent([1, 2])
      .on('zoom', () => {
        svg.attr('transform', d3.event.transform);
      });

    Array.from(
      this.chart.nativeElement.querySelectorAll('.buttons button')
    ).forEach((el: HTMLElement) => {
      console.log(el);
      el.addEventListener('click', () => {
        const lvl = +el.getAttribute('data-zoom') * 0.1;
        this.zoomLevel += lvl;
        zoom.scaleTo(svg, this.zoomLevel);
      });
    });

    return zoom;
  }

  private initAxes(svg: any) {
    const x = d3
      .scaleLinear()
      .domain([
        -100,
        100
        // Math.min(...this.data.map(({ x }) => x)),
        // Math.max(...this.data.map(({ x }) => x))
      ])
      .range([0, this.size.width]);
    svg
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + (this.size.height + this.margin.top) + ')'
      )
      .call(d3.axisBottom(x));
    const y = d3
      .scaleLinear()
      .domain([
        -100,
        100
      ])
      .range([this.size.height, 0]);
    svg
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
      .call(d3.axisLeft(y));

    // add gridlines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
      .call(
        d3
          .axisLeft(y)
          .ticks(10)
          .tickSize(-this.size.width)
          .tickFormat('')
      );

    svg
      .append('g')
      .attr('class', 'grid')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + (this.size.height + this.margin.top) + ')'
      )
      .call(
        d3
          .axisBottom(x)
          .ticks(10)
          .tickSize(-this.size.height)
          .tickFormat('')
      );

    return { x, y };
  }

  private updateData(
    svg: any,
    margin: { left: number; bottom: number; top: number },
    x: any,
    y: any
  ) {
    const g = svg.append('g');

    const dots = g
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .selectAll('.dot')
      .data(this.data);

    const dotEl = dots
      .enter()
      .append('circle')
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', d => d.size * 25)
      .style('fill', `rgba(255, 0, 0, 0.7)`)
      .classed('selected', false)
      .on('mouseover', d => {
        console.log(d);
      });

    const brush = this.createBrush(dotEl, dots);

    g.call(brush);
  }

  private createBrush(dotEl: any, dots: any) {
    return d3
      .brush()
      .on('start', () => {
        dotEl.style('fill', 'rgba(255, 0, 0, 0.7)').classed('selected', false);
      })
      .on('brush', function() {
        if (d3.event.selection === null) {
          return;
        }
        const [[x0, y0], [x1, y1]] = d3.event.selection;

        dotEl.style('fill', 'rgba(255, 0, 0, 0.7)').classed('selected', false);

        dotEl
          .filter(function() {
            const cx = d3.select(this).attr('cx');
            const cy = d3.select(this).attr('cy');
            // TODO: check is point inside circle
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
          })
          .style('fill', `rgba(0, 0, 255, 0.7)`)
          .classed('selected', true);
        // dots.classed('selected', true);
      })
      .on('end', () => {
        console.log('end');
      });
  }
}
