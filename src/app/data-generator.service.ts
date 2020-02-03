import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { DataModel } from "./models";

import * as faker from 'faker';

@Injectable({
  providedIn: "root"
})
export class DataGeneratorService {
  constructor() {}

  getData(
    count,
    { start: xStart, end: xEnd },
    { start: yStart, end: yEnd },
    maxSize
  ): DataModel[] {
    return _.range(count).map(() => {
      return {
        x: _.random(xStart, xEnd),
        y: _.random(yStart, yEnd),
        size: _.random(0.1, maxSize, true),
        extra: {
          name: faker.commerce.productName(),
        }
      } as DataModel;
    });
  }
}
