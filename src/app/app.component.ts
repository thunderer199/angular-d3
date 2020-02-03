import { Component } from '@angular/core';
import { DataGeneratorService } from "./data-generator.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  // styleUrls: ['./app.component.styl']
})
export class AppComponent {
  title = 'scteerplot-d3';
  selection = [];

  data = [];

  constructor(private dataService: DataGeneratorService) {
      this.data = dataService.getData(100, {start: -100, end: 100}, {start: -100, end: 100}, 1);
  }

  getList() {
    return this.selection.map(s => s.extra.name).join(', ');
  }
}
