import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { interval } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import * as seedrandom from 'seedrandom';

@Injectable({
  providedIn: 'root'
})
export class TickerStoreService {

  ticks: number[] = [0];
  visibleTicks: number[] = [0];
  paused = false;
  maxTick = 10;
  minTick = -10;
  timeInterval = 13;
  private counter = 0;
  visibleShift = 0;
  visibleLength = 1200;
  customRNG: () => number;
  rngChoice = 0;
  ticker$ = new BehaviorSubject([0]);
  timeTicker$ = interval(1).pipe(
    filter(() => !this.paused),
    filter(() => (++this.counter % Math.round(this.timeInterval) === 0)),
    map(() => this.generateRandomValue()),
    map(n => {
      this.ticks[this.ticks.length] = this.ticks[this.ticks.length - 1] + n;
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
  initTicksArray() {
    this.ticks = [0];
    for (let i = 1; i < this.visibleLength * 2; i++) {
      this.ticks[i] = this.ticks[i - 1] + this.generateRandomValue();
    }
  }

  generateRandomValue() {
    let sum = 0;
    for (let i = 0; i < 100; i++) {
      sum += (this.customRNG() - 0.5);
    }
    return sum;
  }

  recalculateVisibleTicks() {
    this.visibleTicks = this.ticks.slice(Math.max(0, this.ticks.length - this.visibleShift - this.visibleLength));
    this.maxTick = Math.max(...this.visibleTicks);
    this.minTick = Math.min(...this.visibleTicks);
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
