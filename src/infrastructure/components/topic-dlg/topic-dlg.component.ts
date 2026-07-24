import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { MatDialogContent, MatDialogTitle, MatDialogActions, MatDialogClose, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';


export interface TopicDlgData {
    name: string;
    text: string[];
    inFilter: boolean
}

@Component({
    selector: "app-topic-dlg",
    imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose
],
    templateUrl: `./topic-dlg.component.html`,
    styleUrl: "./topic-dlg.component.css",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopicDlgComponent {
    readonly dialogRef = inject(MatDialogRef<TopicDlgComponent>);
    readonly data = inject<TopicDlgData>(MAT_DIALOG_DATA);
    readonly inFilter = model(this.data.inFilter);

    onNoClick(): void {
        this.dialogRef.close();
    }
}
