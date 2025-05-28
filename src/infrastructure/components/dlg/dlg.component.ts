import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogContent, MatDialogTitle, MatDialogActions, MatDialogClose, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

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
        MatDialogClose
    ],
    templateUrl: `./dlg.component.html`,
    styleUrl: "./dlg.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DlgComponent {
    readonly dialogRef = inject(MatDialogRef<DlgComponent>);
    readonly data = inject<DlgData>(MAT_DIALOG_DATA);
}
