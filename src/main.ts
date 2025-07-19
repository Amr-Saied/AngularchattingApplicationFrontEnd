// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { App } from './app/app';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import 'zone.js';

bootstrapApplication(App, {
  providers: [provideHttpClient(), importProvidersFrom(FormsModule)],
});
