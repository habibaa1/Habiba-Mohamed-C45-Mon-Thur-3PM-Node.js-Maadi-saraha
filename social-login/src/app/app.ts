import { Component, AfterViewInit } from '@angular/core';
import { Auth } from './services/auth';

declare const google: any;

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<div id="google-btn"></div>`
})
export class AppComponent implements AfterViewInit {
constructor(private  readonly authService:Auth){}
  ngAfterViewInit() {
    google.accounts.id.initialize({
      client_id: '274006089540-up03ov50h5ogtb6eem6e40n9istrst06.apps.googleusercontent.com',
      callback: async(response: any) => {
        console.log('ID TOKEN:', response.credential);
        await this.authService.googleLogin(response.credential)
        // send token to backend
      }
    });

    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large' }
    );
  }
}
