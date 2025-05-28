import { inject, Injectable } from '@angular/core';
import { GetBasesService } from './micro/get-bases.service';
import { ITopic } from '@domain';

@Injectable({
  providedIn: 'root'
})
export class GetTopicBasesService {
    private readonly getBases = inject(GetBasesService);

    readonly call = (topic: ITopic) => {
        const bases = this.getBases.call(topic.name);
        const text = bases.flatMap(t => t.text);
        const topics = bases.flatMap(t => t.name);

        text.unshift(...topic.text);
        topics.push(topic.name);

        return { topics, text }
    }
}
