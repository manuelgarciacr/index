import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { MatDialogContent, MatDialogTitle, MatDialogActions, MatDialogClose, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';

export interface TopicDlgData {
    topic: string;
    text: string[];
    inFilter: boolean
}

@Component({
    selector: "app-topic-dlg",
    standalone: true,
    imports: [
        // MatFormFieldModule,
        // MatInputModule,
        // FormsModule,
        MatButtonModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        NgIf,
    ],
    templateUrl: `./topic-dlg.component.html`,
    styleUrl: "./topic-dlg.component.css",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicDlgComponent {
    readonly dialogRef = inject(MatDialogRef<TopicDlgComponent>);
    readonly data = inject<TopicDlgData>(MAT_DIALOG_DATA);
    readonly inFilter = model(this.data.inFilter);

    onNoClick(): void {
        this.dialogRef.close();
    }
}
