import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, NEVER, Observable, Subject, Subscription, catchError, distinctUntilChanged, map, shareReplay, switchMap, tap } from 'rxjs';

export interface AppState {
  limit:number
  offset:number
  pokemons:any[]
}

@Injectable({
  providedIn: 'root'
})

export class StoreService {
  //​ Reducer
  private state= new BehaviorSubject<AppState>( 
    {
      limit:10,
      offset:1,
      pokemons:[]
    }
  );
  
  // ดึงค่าจาก state มาใช้
  limit$ = this.createSelector(state=>state.limit) // ดึงค่า limit จาก state
  offset$ = this.createSelector(state => state.offset); // ดึงค่า offset จาก state
  pokemons$ = this.createSelector(state=>state.pokemons) // ดึงค่า pokemons จาก state
  test = 20
  logState(){
    console.log(this.state);
    console.log(this.state.value.limit);
    console.log(this.state.value.offset);
    
    console.log(this.limit$);
    console.log(this.offset$);
  }
  
  // สร้าง Action ด้วย Subject
  private increaseLimitAction = new Subject<number>() //กำหนด data ที่ได้จาก Action
  private decreaseLimitAction = new Subject<number>()
  private decreaseOffsetAction = new Subject<number>()
  private increaseOffsetAction = new Subject<number>()
  private loadPokemonAction = new Subject<void>();
  private loadPokemonSuccessAction = new Subject<any[]>();
  private loadPokemonErrorAction = new Subject<any[]>();
  

  constructor(private http:HttpClient) {
    //เมื่อเกิด Action increaseLimit
    this.createReducer(this.increaseLimitAction,(state,limit)=>{
      state.limit += limit //เพิ่มค่า limit เข้าไปที่ state
      return state;
    })
    //เมื่อเกิด Action decreaseLimit
    this.createReducer(this.decreaseLimitAction,(state,limit)=>{
      state.limit -= limit //ลดค่า limit เข้าไปที่ state
      return state
    })
    //เมื่อเกิด Action increaseOffset
    this.createReducer(this.increaseOffsetAction,(state,offset)=>{
      state.offset += offset //เพิ่มค่า offset เข้าไปที่ state
      return state
    })
    //เมื่อเกิด Action decraseOffset
    this.createReducer(this.decreaseOffsetAction,(state,offset)=>{
      state.offset -= offset //เพิ่มค่า offset เข้าไปที่ state
      return state
    })

    // เมื่อเกิด Action loadPokemonSuccessAction ให้เก็บค่า response ที่ได้ลงไปใน state pokemon
    this.createReducer(this.loadPokemonSuccessAction,(state,pokemons)=>{
      state.pokemons = pokemons
      return state
    })
    // เมื่อเกิด Action loadPokemonErrorAction
    this.createReducer(this.loadPokemonErrorAction.pipe(tap(err=>{
      console.error(err)
    })),(state, action)=>{
      state.pokemons = [];
      return state;
    })

    //🔴 สร้าง Effect
    //เมื่อมีการเรียกใช้ loadPokemonAction ให้ยิง pokemonAPI
    this.createEffect(this.loadPokemonAction.pipe(switchMap(()=>{
        return this.http.get("https://pokeapi.co/api/v2/pokemon?offset=300&limit=100")
        .pipe(catchError(err=>{
          this.loadPokemonErrorAction.next(err) //ถ้า load ไม่สำเร็จให้เรียกใช้ loadPokemonErrorAction
          return NEVER;
        }))
    }),tap(response=>{
      this.loadPokemonSuccessAction.next([]) //ถ้า load สำเร็จให้ให้เรียกใช้ loadPokemonSuccessAction
    })))
  }

  //🔴 Method สำหรับสร้าง Selector
  // รับ functon state > มี parameter เป็น state ทีมี type เป็น AppState
  private createSelector<T>(selector:(state:AppState)=>T):Observable<T>{ //กำหนดให้ Selector return เป็น Observable
    return this.state.pipe(  
      map(selector), //map ค่าที่ต้องการ
      distinctUntilChanged(), //ถ้า state ไม่เปลี่ยนไม่ต้องทำงานซ้ำ
      shareReplay(1) //ให้ component ที่ทำการ subscribe ได้ค่า state ล่าสุดออกไป
    );
  }

  inCreateLimit(limit:number){
    this.increaseLimitAction.next(limit)
  }
  decreaseLimit(limit:number){
    this.decreaseLimitAction.next(limit)
  }
  increaseOffset(offset:number){
    this.increaseOffsetAction.next(offset)
  }
  decreaseOffset(offset:number){
    this.decreaseOffsetAction.next(offset)
  }
  loadPokemon(){
    this.loadPokemonAction.next()
  }
  

  //🔴 Method สำหรับสร้าง Reducer
  private createReducer<T>(
    action$:Observable<T>, // รับ Action เข้ามา
    accumulator:(
      state:AppState, // รับ state ก่อนหน้า
      action:T)  // รับ Action เข้ามา
      => AppState // และ method นี้จะ return state ใหม่ออกมา
  ){
    // รอเกิด Action >> เมื่อเกิด Action ให้ทำงานในส่วนของ subscribe
    action$.subscribe((action)=>{
      const state = {...this.state.value} // ดึง state เก่าออกมา
      const newState = accumulator(state,action) // ส่ง state เก่าเข้าไปทำงานใน accumulator เพื่อให้ได้ state ใหม่ออกมา
      this.state.next(newState) // ปล่อย state ใหม่
    })
  }

  //🔴 Method สำหรับสร้าง Effect
  private createEffect<T>(effect$:Observable<T>) :Subscription{ //รับ effect ที่เป็น Observable เข้ามา
    return effect$.subscribe();
  }
  
}
