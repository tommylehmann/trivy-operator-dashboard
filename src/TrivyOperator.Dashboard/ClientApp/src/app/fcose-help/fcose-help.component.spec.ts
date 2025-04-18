import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FcoseHelpComponent } from './fcose-help.component';

describe('FcoseHelpComponent', () => {
  let component: FcoseHelpComponent;
  let fixture: ComponentFixture<FcoseHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FcoseHelpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FcoseHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
