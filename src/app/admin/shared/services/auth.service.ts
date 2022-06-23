import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {FbAuthResponse, User} from "../../../shared/interfaces";
import {catchError, Observable, Subject, tap, throwError} from "rxjs";
import {environment} from "../../../../environments/environment";

@Injectable()
export class AuthService {
  public error$: Subject<string> = new Subject<string>();

  constructor(private http: HttpClient) {
  }

  get token():string | null{
    const expDate = new Date(<string>localStorage.getItem('fb-token-exp'));
    if (new Date() > expDate){
      this.logout();
      return null
    }
    return localStorage.getItem('fb-token')
  }

  login(user: User): Observable<any>{
    user.returnSecureToken = true
    return this.http.post<FbAuthResponse>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.apiKey}`,user)
      .pipe(tap(this.setToken), catchError(this.handleError.bind(this)))
  }

  private handleError(error: any, caught: Observable<FbAuthResponse>):Observable<any>{
    const {message} = error.error.error

    if (message == 'INVALID_PASSWORD'){
      this.error$.next('Invalid Password')
    }
    else if (message == 'INVALID_EMAIL'){
      this.error$.next('Invalid Email')
    }
    else this.error$.next('Email not found')
    console.log(message);
    return throwError(error);
  }

  logout(){
    this.setToken(null);
  }

  isAuth():boolean{
    return !!this.token
  }

  private setToken(response: FbAuthResponse | null){
    if (response){
      const expDate = new Date(new Date().getTime() + +response!.expiresIn * 1000)
      localStorage.setItem('fb-token', response!.idToken);
      localStorage.setItem('fb-token-exp', expDate.toString());
    }
    else localStorage.clear();
  }
}
