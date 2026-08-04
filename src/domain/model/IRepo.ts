import { ITopic } from "./ITopic";

export interface IRepo {
    name: string;
    description: string;
    repository: string;
    fork: boolean;
    webpage: string;
    created: string;
    pushed: string;
    languages: { [key: string]: number };
    topics: string[];
    topics2: (ITopic | string)[];
    subtopics: string[];
    breakdown: string[];
    private: boolean;
    show: boolean
}
