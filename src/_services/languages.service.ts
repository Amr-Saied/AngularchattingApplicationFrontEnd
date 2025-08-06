import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'en' | 'ar';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<Language>('en');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor() {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage) {
      this.setLanguage(savedLanguage);
    }
  }

  setLanguage(language: Language) {
    this.currentLanguageSubject.next(language);
    localStorage.setItem('preferredLanguage', language);

    // Update document direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;

    // Reload the page to apply the new language
    window.location.reload();
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  isRTL(): boolean {
    return this.getCurrentLanguage() === 'ar';
  }
}
