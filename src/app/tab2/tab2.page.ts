import { Component, inject, OnInit, Sanitizer } from '@angular/core';
import { PhotoService } from '../services/photo.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {

  public photoService = inject(PhotoService);
  sanitizer = inject(DomSanitizer);

  constructor() { }

 async ngOnInit() {
   await this.photoService.loadSaved() ;
  }



}
