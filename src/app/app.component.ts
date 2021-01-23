import { Component, OnInit, ChangeDetectionStrategy, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { range, Observable } from 'rxjs';
import { map, filter, tap } from 'rxjs/operators';
import { TickerStoreService } from './services/ticker-store.service';

interface Trade {
  direction: string;
  profit: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;

  title = 'Stock Trading Simulation';
  svgMouseX = 0;
  svgMouseY = 0;
  svgWidth: number;
  svgHeight: number;
  draggingSvg = false;
  offsetX = 0;
  draggingSvgHappened = false;
  openTrade = 0;
  openPrice = 0;
  lastTick = 0;
  openPL = 0;
  trades: Trade[] = [];
  profitTotal = 0;

  constructor(public tickerStoreService: TickerStoreService) {
    this.svgHeight = tickerStoreService.svgHeight;
    this.svgWidth = tickerStoreService.svgWidth;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'P' || event.key === 'p') {
      this.onTogglePause();
    } else if (event.key === '+') {
      this.tickerStoreService.speedUp();
    } else if (event.key === '-') {
      this.tickerStoreService.slowDown();
    } else if (event.key === 'ArrowLeft') {
      this.tickerStoreService.shiftVisibleWindow(200);
    } else if (event.key === 'ArrowRight') {
      this.tickerStoreService.shiftVisibleWindow(-200);
    } else if (event.key === 'B' || event.key === 'b') {
      this.onBuyClick();
    } else if (event.key === 'S' || event.key === 's') {
      this.onSellClick();
    } else {
      // console.log(event.key);
    }
  }


  drawLineByDots(y: number[], color: string, width: number, dash: number[] = []) {
    const len = y.length;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.setLineDash(dash);
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.tickY(y[0]));
    for (let i = 1; i < len; i++) {
      this.ctx.lineTo(i, this.tickY(y[i]));
    }
    this.ctx.stroke();
  }

  drawStraightLine(x1: number, y1: number, x2: number, y2: number, color: string, width: number, dash: number[] = []) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.setLineDash(dash);
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  updateCanvas() {
    // this.svgWidth--;
    const ctx = this.ctx;
    if (!ctx) { return; }
    this.ctx.clearRect(0, 0, this.svgWidth, this.svgHeight);

    ctx.strokeStyle = 'GAINSBORO';
    ctx.setLineDash([4, 4]);
    for (let i = 0; i < this.svgWidth; i += 100) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, this.svgHeight);
      ctx.stroke();
    }
    this.drawLineByDots(this.tickerStoreService.visibleTicks.map(t => t.ma0), 'orange', 0.5);
    this.drawLineByDots(this.tickerStoreService.visibleTicks.map(t => t.ma1), 'orange', 0.5);
    this.drawLineByDots(this.tickerStoreService.visibleTicks.map(t => t.ma2), 'orange', 0.5);
    this.drawLineByDots(this.tickerStoreService.visibleTicks.map(t => t.ma3), 'orange', 0.5);
    this.drawLineByDots(this.tickerStoreService.visibleTicks.map(t => t.ma4), 'orange', 0.5);
    this.drawLineByDots(this.tickerStoreService.visibleTicks.map(t => t.ma5), 'orange', 0.5);
    this.drawLineByDots(this.tickerStoreService.visibleTicks.map(t => t.ma6), 'orange', 0.5);
    this.drawLineByDots(this.tickerStoreService.visibleTicks.map(t => t.ma7), 'orange', 0.5);
    this.drawLineByDots(this.tickerStoreService.visibleTicks.map(t => t.ma8), 'orange', 0.5);
    this.drawLineByDots(this.tickerStoreService.visibleTicks.map(t => t.c), 'blue', 0.8);

    if (this.openTrade) {
      const color = this.openTrade === 1 ? 'GREEN' : 'ORANGERED';
      this.drawStraightLine(0, this.tickY(this.openPrice), this.svgWidth, this.tickY(this.openPrice), color, 1, [6, 3, 3, 2]);
    }
    this.drawStraightLine(0, this.svgMouseY, this.svgWidth, this.svgMouseY, 'red', 1, [1, 4]);
    this.drawStraightLine(this.svgMouseX, 0, this.svgMouseX, this.svgHeight, 'red', 1, [1, 4]);

  }

  ngOnInit() {
    this.tickerStoreService.ticker$.pipe(
      tap(() => this.updateCanvas())
    ).subscribe(
      () => {
        this.lastTick = this.tickerStoreService.ticks[this.tickerStoreService.ticks.length - 1].c;
        if (this.openTrade === -1) {
          this.openPL = this.lastTick - this.openPrice;
        } else if (this.openTrade === 1) {
          this.openPL = - this.lastTick + this.openPrice;
        } else {
          this.openPL = 0;
        }
      }
    );
  }
  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d');
  }

  onTogglePause() {
    this.tickerStoreService.togglePause();
  }

  onRestart() {
    this.tickerStoreService.restart();
  }

  onMouseMove(event) {
    // console.log(event.offsetX, event.offsetY);
    this.svgMouseX = event.offsetX;
    this.svgMouseY = event.offsetY;

    if (this.draggingSvg) {
      this.tickerStoreService.shiftVisibleWindow(event.offsetX - this.offsetX);
      if (this.offsetX !== event.offsetX) {
        this.draggingSvgHappened = true;
      }
      this.offsetX = event.offsetX;

    }
  }

  onMouseDown(event) {
    // console.log(event);
    this.draggingSvg = true;
    this.offsetX = event.offsetX;
    this.draggingSvgHappened = false;
  }
  onMouseUp(event) {
    // console.log(event);
    this.draggingSvg = false;
    if (!this.draggingSvgHappened) {
      this.onTogglePause();
    }
    this.draggingSvgHappened = false;
  }

  buy() {
    this.openTrade = 1;
    this.openPrice = this.lastTick;
  }

  sell() {
    this.openTrade = -1;
    this.openPrice = this.lastTick;
  }

  close() {
    this.trades.push({
      direction: this.openTrade === 1 ? 'Buy' : 'Sell',
      profit: Math.round((this.openPrice - this.lastTick) * this.openTrade)
    });
    this.profitTotal = this.trades.map(trade => trade.profit).reduce((sum, i) => sum + i);
    this.openTrade = 0;
    this.openPrice = 0;
  }

  onBuyClick() {
    if (this.openTrade === 0) {
      this.buy();
    } else {
      this.close();
    }
  }

  onSellClick() {
    if (this.openTrade === 0) {
      this.sell();
    } else {
      this.close();
    }
  }

  tickY(y: number) {
    return (y - this.tickerStoreService.minTick) /
      (this.tickerStoreService.maxTick - this.tickerStoreService.minTick) *
      this.svgHeight;
  }

}
