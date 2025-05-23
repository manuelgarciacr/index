import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialogContent, MatDialogTitle, MatDialogActions, MatDialogClose, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';

export interface DlgData {
    title: string;
    text: string
    type: "info" | "alert"
}

@Component({
    selector: "dlg-component",
    standalone: true,
    imports: [
        MatButtonModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        NgIf
    ],
    templateUrl: `./dlg.component.html`,
    styleUrl: "./dlg.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DlgComponent {
    readonly dialogRef = inject(MatDialogRef<DlgComponent>);
    readonly data = inject<DlgData>(MAT_DIALOG_DATA);
    readonly inFilter = signal(false);
}
