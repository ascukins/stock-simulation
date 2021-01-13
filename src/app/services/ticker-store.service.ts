import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { interval } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import * as seedrandom from 'seedrandom';

export interface Tick {
  o?: number;
  h?: number;
  l?: number;
  c: number;
  ma1?: number;
  ma2?: number;
  ma3?: number;
  ma4?: number;
  ma5?: number;
  ma6?: number;
  ma7?: number;
  ma8?: number;
}

const calcMAs = (ticks: Tick[]) => { };

@Injectable({
  providedIn: 'root'
})
export class TickerStoreService {

  mas = [1, 32, 64, 128, 256, 512];

  ticks: Tick[] = [{ c: 0 }];
  visibleTicks: Tick[] = [{ c: 0 }];
  paused = false;
  maxTick = 10;
  minTick = -10;
  timeInterval = 5;
  private counter = 0;
  visibleShift = 0;
  visibleLength = 1200;
  customRNG: () => number;
  rngChoice = 0;
  ticker$ = new BehaviorSubject<Tick[]>([{ c: 0 }]);
  timeTicker$ = interval(1).pipe(
    filter(() => !this.paused),
    filter(() => (++this.counter % Math.round(this.timeInterval) === 0)),
    map(() => {
      this.addRandomTick();
      if (this.visibleShift > 0) {
        this.visibleShift++;
      }
      return this.recalculateVisibleTicks();
    })
  );
  subscription: Subscription;

  constructor() {
    this.initRNG();
    this.initTicksArray();
    this.subscription = this.timeTicker$.subscribe(a => this.ticker$.next(a));
  }

  calcTickMA(index: number, maIndex: number) {
    const period: number = this.mas[maIndex];
    const maPropName = 'ma' + maIndex;
    const prevMa = this.ticks[index - 1][maPropName];
    let currentMa: number;
    if (prevMa) {
      currentMa = prevMa + (this.ticks[index].c - this.ticks[index - period].c) / period;
    } else {
      currentMa = 0;
      for (let i = 0; i < period; i++) {
        currentMa += this.ticks[index - i].c / period;
      }
    }
    this.ticks[index][maPropName] = currentMa;
  }

  addRandomTick() {
    const length = this.ticks.length;
    this.ticks.push({ c: this.ticks[length - 1].c + this.generateRandomValue() });
    if (length > 600) {
      this.calcTickMA(length, 1);
      this.calcTickMA(length, 2);
      this.calcTickMA(length, 3);
      this.calcTickMA(length, 4);
      this.calcTickMA(length, 5);
    }
  }

  initTicksArray() {
    this.ticks = [{ c: 0 }];
    for (let i = 1; i < this.visibleLength * 2; i++) {
      this.addRandomTick();
    }
  }

  generateRandomValue() {
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += (this.customRNG() - 0.5);
    }
    return sum;
  }

  recalculateVisibleTicks() {
    const start = Math.max(0, this.ticks.length - this.visibleShift - this.visibleLength);
    this.visibleTicks = this.ticks.slice(start, start + 1200);
    const visibleCloses = this.visibleTicks.map(t => t.c);
    this.maxTick = Math.max(...visibleCloses);
    this.minTick = Math.min(...visibleCloses);
    return this.visibleTicks;
  }

  speedUp() {
    if (this.timeInterval > 1.5) {
      this.timeInterval /= 1.5;
    }
  }
  slowDown() {
    this.timeInterval *= 1.5;
  }

  togglePause() {
    this.paused = !this.paused;
  }
  restart() {
    this.initTicksArray();
    this.paused = false;
    this.shiftVisibleWindow(-this.ticks.length);
  }

  shiftVisibleWindow(n: number) {
    this.visibleShift += n;
    if (n > 0) {
      this.visibleShift = Math.min(this.visibleShift, this.ticks.length - this.visibleLength);
    } else {
      this.visibleShift = Math.max(this.visibleShift, 0);
    }
    this.paused = !!this.visibleShift;
    this.ticker$.next(this.recalculateVisibleTicks());
  }

  private initRNG() {
    this.rngChoice = Math.floor(Math.random() * 7);
    const seed = Math.random().toString();
    console.log('RNG type: ' + this.rngChoice);
    switch (this.rngChoice) {
      case 0:
        this.customRNG = seedrandom.alea(seed);
        break;
      case 1:
        this.customRNG = seedrandom.xor128(seed);
        break;
      case 2:
        this.customRNG = seedrandom.tychei(seed);
        break;
      case 3:
        this.customRNG = seedrandom.xorwow(seed);
        break;
      case 4:
        this.customRNG = seedrandom.xor4096(seed);
        break;
      case 5:
        this.customRNG = seedrandom.xorshift7(seed);
        break;
      default:
        this.customRNG = Math.random;
        break;
    }
  }

}
