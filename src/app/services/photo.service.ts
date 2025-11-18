import { inject, Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private PHOTO_STORAGE: string = 'photos';
  private platform = inject(Platform);

  public photos: UserPhoto[] = [];

  public async loadSaved() {
    const { value: photoList } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = (photoList ? JSON.parse(photoList) : []) as UserPhoto[];

    if (!this.platform.is('hybrid')) {
      for (let photo of this.photos) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });

        // Web platform only: Load the photo as base64 data
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }

  public async addNewToGallery() {
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
    });
    const savedImageFile = await this.savePicture(capturedPhoto);

    this.photos.unshift(savedImageFile);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }

  private async savePicture(photo: Photo) {
    let base64Data: string | Blob;


    if (this.platform.is('hybrid')) {
      // Read the file into base64 format
      const file = await Filesystem.readFile({
        path: photo.path!
      });
      base64Data = file.data;
    } else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      base64Data = await this.convertBlobToBase64(blob) as string;
    }

    // Write the file to the data directory
    const fileName = Date.now() + `.${photo.format}`;
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });
    console.log(savedFile);

    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    }
    return {
      filepath: fileName,
      webviewPath: photo.webPath,
    };
  }

  private convertBlobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}