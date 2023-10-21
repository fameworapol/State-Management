import { Component } from '@angular/core';
import { StoreService } from 'src/store/store.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'state-management-project';
  ngOnInit(): void {
    console.log(this.store.limit$);
    console.log(this.store.offset$);
    this.store.logState()
  }
  constructor(public store: StoreService) {
  }

  public increaseLimit(value: number) {
    this.store.inCreateLimit(value);
    this.store.logState()
  }
  public decreaseLimit(value: number) {
    this.store.decreaseLimit(value);
    this.store.logState()
  }
  public increaseOffset(value: number) {
    this.store.increaseOffset(value);
    this.store.logState()
  }
  public decreaseOffset(value: number) {
    this.store.decreaseOffset(value);
    this.store.logState()
  }
}
