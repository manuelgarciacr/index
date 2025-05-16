import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { ToggleThemeComponent } from './toggle-theme.component';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('ToggleThemeComponent', () => {
  let component: ToggleThemeComponent;
  let fixture: ComponentFixture<ToggleThemeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
        imports: [ToggleThemeComponent, RouterTestingModule],
        providers: [provideAnimations()],
    });
    fixture = TestBed.createComponent(ToggleThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
