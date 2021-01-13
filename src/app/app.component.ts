import { Component, OnInit, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { range, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
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

export class AppComponent implements OnInit {
  title = 'Stock Trading Simulation';
  svgMouseX = 0;
  svgMouseY = 0;
  svgWidth = 1300;
  svgHeight = 600;
  draggingSvg = false;
  offsetX = 0;
  draggingSvgHappened = false;
  verticalLines = Array(this.svgWidth / 100).fill(0).map((x, i) => i * 100);
  openTrade = 0;
  openPrice = 0;
  lastTick = 0;
  openPL = 0;
  trades: Trade[] = [];
  profitTotal = 0;

  constructor(public tickerStoreService: TickerStoreService) { }

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

  ngOnInit() {
    this.tickerStoreService.ticker$.subscribe(
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
